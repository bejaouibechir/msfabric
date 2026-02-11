# Atelier : Gestion d'un barrage hydroélectrique — Mirroring, Azure Functions, Medallion & Power BI

Vous allez construire une plateforme analytique complète pour superviser un barrage hydroélectrique, en utilisant **deux sources d'ingestion** (Mirroring Azure SQL Database + Azure Functions), une architecture **Medallion** (Bronze → Silver → Gold) dans un **Lakehouse**, et une restitution en **Power BI**.

Résultat attendu : une chaîne de données end-to-end, de la base opérationnelle du barrage jusqu'aux tableaux de bord décisionnels, avec des interprétations métier à chaque étape.

---

## Contexte métier : le barrage de Sidi Salem

Le **barrage de Sidi Salem** (nord-ouest tunisien, sur la Medjerda) est le plus grand barrage de Tunisie. Il alimente en eau potable et en irrigation une grande partie du nord du pays, et produit de l'électricité via des turbines hydroélectriques.

**Deux systèmes coexistent sur le terrain :**

| Système                         | Données                                                     | Fréquence                     | Source                                          |
| ------------------------------- | ----------------------------------------------------------- | ----------------------------- | ----------------------------------------------- |
| **SCADA** (système de contrôle) | Niveaux d'eau, débits, positions vannes, puissance turbines | Temps réel (toutes les 5 sec) | Base opérationnelle **Azure SQL Database**      |
| **Capteurs environnementaux**   | Pluviométrie, température air/eau, humidité, vent           | Toutes les 15 min             | **Azure Functions** qui interroge une API météo |

**Problèmes réels des exploitants de barrages :**

- Risque de crue : le niveau monte trop vite et les vannes doivent s'ouvrir à temps → décision en minutes
- Gestion du stock d'eau : arbitrer entre production électrique (turbiner) et réserve pour l'irrigation
- Sédimentation : le volume utile du barrage diminue chaque année — il faut suivre la cote vs le volume réel
- Pas de vue consolidée : les données SCADA et météo sont dans des systèmes séparés
- Les rapports mensuels sont faits manuellement dans Excel par un ingénieur

---

## Architecture globale

```
┌─────────────────────┐     ┌─────────────────────┐
│  Azure SQL Database  │     │   Azure Functions    │
│  (données SCADA)     │     │   (données météo)    │
│  tables: DamLevels,  │     │   Python timer 15min │
│  TurbineOps, Gates   │     │                      │
└────────┬────────────┘     └──────────┬───────────┘
         │ Mirroring                    │ HTTP → Lakehouse
         │ (near real-time)             │ (fichiers JSON)
         ▼                              ▼
┌──────────────────────────────────────────────────┐
│                LAKEHOUSE — BRONZE                  │
│  Tables mirrorées (read-only) + fichiers météo     │
│  Données brutes, non transformées                  │
└──────────────────────┬───────────────────────────┘
                       │ Notebook / Dataflow
                       ▼
┌──────────────────────────────────────────────────┐
│                LAKEHOUSE — SILVER                   │
│  Tables nettoyées, typées, jointures               │
│  dam_readings, weather_readings, turbine_metrics   │
└──────────────────────┬───────────────────────────┘
                       │ Notebook / SQL
                       ▼
┌──────────────────────────────────────────────────┐
│                LAKEHOUSE — GOLD                     │
│  Agrégats métier, KPI, vues pour Power BI          │
│  daily_production, flood_risk_index, water_balance  │
└──────────────────────┬───────────────────────────┘
                       │ Direct Lake
                       ▼
┌──────────────────────────────────────────────────┐
│                    POWER BI                         │
│  Dashboard : Production, Risque crue, Bilan eau    │
└──────────────────────────────────────────────────┘
```

---

## Prérequis

- **Abonnement Azure** pour : Azure SQL Database + Azure Functions
- **Tenant Microsoft Fabric** (Trial ou Capacity)
- **Python 3.9+** installé localement
- **Power BI Desktop** installé (gratuit)
- **SSMS** ou **Azure Data Studio** pour gérer Azure SQL Database

---

# PHASE 1 — SOURCES DE DONNÉES

---

## Partie 1 — Créer la base Azure SQL Database (données SCADA)

### 1.1 — Créer le serveur et la base

1. Aller sur **portal.azure.com**
2. **+ Create a resource** → chercher **SQL Database** → **Create**
3. Remplir :

| Champ                  | Valeur                                         |
| ---------------------- | ---------------------------------------------- |
| **Resource group**     | Créer : `rg-barrage`                           |
| **Database name**      | `db-sidi-salem`                                |
| **Server**             | Créer nouveau : `srv-barrage-<votre-initiale>` |
| **Location**           | France Central ou North Europe                 |
| **Authentication**     | Use SQL authentication                         |
| **Server admin login** | `adminbarrage`                                 |
| **Password**           | Un mot de passe fort (notez-le)                |

4. Onglet **Compute + storage** → sélectionner **Basic** ou **Free offer** (si disponible)
5. Onglet **Networking** :
   - **Connectivity method** : Public endpoint
   - Cocher ✅ **Allow Azure services and resources to access this server**
   - Cocher ✅ **Add current client IP address**
6. **Review + create** → **Create**
7. Attendre le déploiement → **Go to resource**

### 1.2 — Activer le Managed Identity (obligatoire pour le mirroring)

1. Dans le portail Azure, aller sur le **SQL Server** (pas la database, le serveur)
2. Menu gauche → **Security** → **Identity**
3. Onglet **System assigned** → basculer **Status** sur **On**
4. Cliquer **Save**

### 1.3 — Créer les tables et insérer les données

Se connecter à `db-sidi-salem` avec **SSMS** ou **Azure Data Studio** et exécuter :

```sql
-- =====================================================
-- TABLE 1 : Niveaux et volumes du barrage
-- =====================================================
CREATE TABLE DamLevels (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ReadingTime DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    WaterLevelM DECIMAL(6,2) NOT NULL,        -- Cote du plan d'eau (metres)
    UsableVolumeM3 DECIMAL(12,0) NOT NULL,     -- Volume utile (m3)
    TotalInflowM3s DECIMAL(8,3) NOT NULL,      -- Debit entrant total (m3/s)
    TotalOutflowM3s DECIMAL(8,3) NOT NULL,     -- Debit sortant total (m3/s)
    SpillwayActive BIT NOT NULL DEFAULT 0,     -- Evacuateur de crue actif
    FloodAlertLevel VARCHAR(10) NOT NULL        -- NORMAL, VIGILANCE, ALERTE, CRUE
);

-- =====================================================
-- TABLE 2 : Operations des turbines
-- =====================================================
CREATE TABLE TurbineOps (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ReadingTime DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    TurbineId VARCHAR(10) NOT NULL,             -- TURB-01, TURB-02, TURB-03
    Status VARCHAR(15) NOT NULL,                -- RUNNING, STOPPED, MAINTENANCE
    FlowRateM3s DECIMAL(8,3) NOT NULL,         -- Debit turbine (m3/s)
    PowerOutputKW DECIMAL(10,2) NOT NULL,       -- Puissance produite (kW)
    Efficiency DECIMAL(5,2) NOT NULL,           -- Rendement (%)
    HeadM DECIMAL(6,2) NOT NULL,               -- Hauteur de chute (metres)
    VibrationMmS DECIMAL(6,2) NOT NULL,        -- Vibrations (mm/s)
    BearingTempC DECIMAL(5,2) NOT NULL          -- Temperature palier (°C)
);

-- =====================================================
-- TABLE 3 : Positions des vannes
-- =====================================================
CREATE TABLE GatePositions (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    ReadingTime DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    GateId VARCHAR(10) NOT NULL,               -- GATE-01 a GATE-06
    GateType VARCHAR(20) NOT NULL,             -- FOND, DEMI_FOND, SURFACE
    OpeningPct DECIMAL(5,2) NOT NULL,          -- Ouverture (0-100%)
    FlowRateM3s DECIMAL(8,3) NOT NULL,         -- Debit evacue (m3/s)
    Command VARCHAR(10) NOT NULL               -- AUTO, MANUAL, EMERGENCY
);

-- =====================================================
-- TABLE 4 : Reference des equipements
-- =====================================================
CREATE TABLE Equipment (
    EquipmentId VARCHAR(10) PRIMARY KEY,
    EquipmentType VARCHAR(20) NOT NULL,
    Description_FR VARCHAR(100) NOT NULL,
    NominalCapacity VARCHAR(50),
    InstallDate DATE,
    LastMaintenanceDate DATE
);

-- Insertion des equipements de reference
INSERT INTO Equipment VALUES
('TURB-01', 'TURBINE', 'Turbine Francis axe vertical n°1', '12 MW', '2005-03-15', '2025-09-10'),
('TURB-02', 'TURBINE', 'Turbine Francis axe vertical n°2', '12 MW', '2005-03-15', '2025-06-22'),
('TURB-03', 'TURBINE', 'Turbine Francis axe vertical n°3', '8 MW', '2012-11-08', '2025-11-15'),
('GATE-01', 'VANNE', 'Vanne de fond n°1', '150 m3/s', '2003-01-20', '2025-04-01'),
('GATE-02', 'VANNE', 'Vanne de fond n°2', '150 m3/s', '2003-01-20', '2025-04-01'),
('GATE-03', 'VANNE', 'Vanne demi-fond n°1', '200 m3/s', '2003-01-20', '2024-12-10'),
('GATE-04', 'VANNE', 'Vanne demi-fond n°2', '200 m3/s', '2003-01-20', '2024-12-10'),
('GATE-05', 'VANNE', 'Vanne de surface n°1', '300 m3/s', '2003-01-20', '2025-08-05'),
('GATE-06', 'VANNE', 'Vanne de surface n°2', '300 m3/s', '2003-01-20', '2025-08-05');
GO
```

### 1.4 — Script Python pour alimenter les données SCADA en continu

Créer **`scada_simulator.py`** :

```python
import pyodbc
import random
import time
from datetime import datetime, timezone

# ============================================================
# CONFIGURATION — Votre Azure SQL Database
# ============================================================
SERVER = "<votre-serveur>.database.windows.net"
DATABASE = "db-sidi-salem"
USERNAME = "adminbarrage"
PASSWORD = "<votre-mot-de-passe>"
# ============================================================

conn_str = (
    f"DRIVER={{ODBC Driver 18 for SQL Server}};"
    f"SERVER={SERVER};DATABASE={DATABASE};"
    f"UID={USERNAME};PWD={PASSWORD};"
    f"Encrypt=yes;TrustServerCertificate=no;"
)

TURBINES = ["TURB-01", "TURB-02", "TURB-03"]
GATES = [
    ("GATE-01", "FOND"), ("GATE-02", "FOND"),
    ("GATE-03", "DEMI_FOND"), ("GATE-04", "DEMI_FOND"),
    ("GATE-05", "SURFACE"), ("GATE-06", "SURFACE")
]

# Etat initial du barrage
water_level = 85.0  # metres (max ~120m pour Sidi Salem)
usable_volume = 350_000_000  # m3

def simulate_dam_levels(cursor):
    global water_level, usable_volume

    # Debit entrant (riviere + pluie)
    inflow = random.uniform(15, 80)
    # Anomalie crue (5% du temps)
    if random.random() < 0.05:
        inflow += random.uniform(100, 300)

    # Debit sortant (turbines + vannes + evaporation)
    outflow = random.uniform(20, 60)

    # Mise a jour niveau
    delta_volume = (inflow - outflow) * 5  # 5 secondes
    usable_volume = max(100_000_000, min(700_000_000, usable_volume + delta_volume))
    water_level = 60 + (usable_volume / 700_000_000) * 60  # simplification lineaire

    spillway = inflow > 200
    alert = "NORMAL"
    if water_level > 110:
        alert = "CRUE"
    elif water_level > 100:
        alert = "ALERTE"
    elif water_level > 95:
        alert = "VIGILANCE"

    cursor.execute("""
        INSERT INTO DamLevels (WaterLevelM, UsableVolumeM3, TotalInflowM3s, 
                               TotalOutflowM3s, SpillwayActive, FloodAlertLevel)
        VALUES (?, ?, ?, ?, ?, ?)
    """, round(water_level, 2), round(usable_volume), round(inflow, 3),
         round(outflow, 3), 1 if spillway else 0, alert)

    return water_level, inflow, alert

def simulate_turbine_ops(cursor, water_level):
    for turb_id in TURBINES:
        # Arret si niveau trop bas
        if water_level < 65:
            status = "STOPPED"
            flow, power, eff, head, vib, temp = 0, 0, 0, 0, 0, 25
        else:
            status = random.choice(["RUNNING"] * 9 + ["MAINTENANCE"])
            if status == "RUNNING":
                head = water_level - 60 + random.uniform(-2, 2)
                flow = random.uniform(15, 40)
                eff = random.uniform(85, 95)
                power = flow * head * 9.81 * (eff / 100)  # P = Q * H * g * eta
                vib = random.uniform(1.0, 3.5)
                temp = random.uniform(40, 65)
                # Anomalie (8%)
                if random.random() < 0.08:
                    vib += random.uniform(3, 8)
                    temp += random.uniform(10, 25)
                    eff -= random.uniform(10, 25)
                    power *= 0.6
            else:
                flow, power, eff, head, vib, temp = 0, 0, 0, 0, 0, 25

        cursor.execute("""
            INSERT INTO TurbineOps (TurbineId, Status, FlowRateM3s, PowerOutputKW,
                                    Efficiency, HeadM, VibrationMmS, BearingTempC)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, turb_id, status, round(flow, 3), round(max(0, power), 2),
             round(max(0, eff), 2), round(max(0, head), 2),
             round(vib, 2), round(temp, 2))

def simulate_gate_positions(cursor, alert):
    for gate_id, gate_type in GATES:
        if alert == "CRUE":
            opening = random.uniform(60, 100)
            command = "EMERGENCY"
        elif alert == "ALERTE":
            opening = random.uniform(30, 60)
            command = "AUTO"
        elif alert == "VIGILANCE":
            opening = random.uniform(10, 30)
            command = "AUTO"
        else:
            opening = random.uniform(0, 15)
            command = random.choice(["AUTO"] * 8 + ["MANUAL"] * 2)

        flow = opening / 100 * (150 if gate_type == "FOND" else 200 if gate_type == "DEMI_FOND" else 300)
        flow += random.uniform(-5, 5)

        cursor.execute("""
            INSERT INTO GatePositions (GateId, GateType, OpeningPct, FlowRateM3s, Command)
            VALUES (?, ?, ?, ?, ?)
        """, gate_id, gate_type, round(opening, 2), round(max(0, flow), 3), command)

def main():
    conn = pyodbc.connect(conn_str)
    conn.autocommit = True
    cursor = conn.cursor()
    print("Simulation SCADA du barrage de Sidi Salem...")

    try:
        while True:
            level, inflow, alert = simulate_dam_levels(cursor)
            simulate_turbine_ops(cursor, level)
            simulate_gate_positions(cursor, alert)
            status_icon = {"NORMAL": "🟢", "VIGILANCE": "🟡", "ALERTE": "🟠", "CRUE": "🔴"}.get(alert, "")
            print(f"  [{datetime.now(timezone.utc).strftime('%H:%M:%S')}] "
                  f"Niveau: {level:.1f}m | Debit entrant: {inflow:.1f}m3/s | "
                  f"Alerte: {alert} {status_icon}")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Arret du simulateur SCADA.")
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    main()
```

Installer le driver et lancer :

```bash
pip install pyodbc
py scada_simulator.py
```

> 💡 **Astuce** : Laissez tourner **10 minutes** minimum avant de configurer le mirroring, pour avoir assez de données pour le snapshot initial.

---

## Partie 2 — Configurer le Mirroring Azure SQL → Fabric

### 2.1 — Créer la Mirrored Database dans Fabric

1. Aller sur **app.fabric.microsoft.com** → votre **workspace**
2. Cliquer **+ New item** → sous **Connect to external data** → sélectionner **Mirrored Azure SQL Database**
3. Remplir la connexion :

| Champ              | Valeur                                              |
| ------------------ | --------------------------------------------------- |
| **Server**         | `srv-barrage-<votre-initiale>.database.windows.net` |
| **Database**       | `db-sidi-salem`                                     |
| **Connection**     | Create new connection                               |
| **Authentication** | SQL authentication                                  |
| **Username**       | `adminbarrage`                                      |
| **Password**       | Votre mot de passe                                  |

4. Cliquer **Connect**
5. Fabric scanne les tables → cocher ✅ toutes les tables (DamLevels, TurbineOps, GatePositions, Equipment)
6. Cliquer **Connect**
7. Nommer la mirrored database : **`MirrorBarrage`**

### 2.2 — Vérifier la réplication

1. Fabric affiche la page **Monitor replication**
2. Attendre que le statut de chaque table passe à **Running** (peut prendre 1-2 minutes)
3. Le compteur de lignes répliquées doit augmenter au fur et à mesure

> ⚠️ **Piège** : Si le mirroring échoue, vérifiez que le **Managed Identity** est activé sur le serveur SQL (étape 1.2) et que **Allow Azure services** est coché dans le Networking.

> 💡 **Astuce** : Le mirroring réplique les changements toutes les **15 secondes** environ. Les données du simulateur SCADA arrivent quasi en temps réel dans Fabric.

### 2.3 — Explorer les données mirrorées

1. Dans votre workspace, cliquer sur **MirrorBarrage** → **SQL analytics endpoint**
2. Vous pouvez requêter les données mirrorées en T-SQL (lecture seule) :

```sql
SELECT TOP 20 * FROM dbo.DamLevels ORDER BY ReadingTime DESC;
```

**Ce que vous voyez** : les mêmes données que dans Azure SQL Database, répliquées automatiquement dans Fabric OneLake au format Delta Lake.

---

## Partie 3 — Azure Functions (données météo)

### 3.1 — Créer la Function App dans Azure

1. **portal.azure.com** → **+ Create a resource** → chercher **Function App** → **Create**
2. Remplir :

| Champ                 | Valeur                        |
| --------------------- | ----------------------------- |
| **Resource group**    | `rg-barrage`                  |
| **Function App name** | `func-meteo-barrage` (unique) |
| **Runtime stack**     | `Python`                      |
| **Version**           | `3.11`                        |
| **Region**            | Même que votre SQL Database   |
| **Plan type**         | `Consumption (Serverless)`    |

3. **Review + create** → **Create**

### 3.2 — Créer la fonction Timer Trigger

Dans VS Code avec l'extension **Azure Functions** :

1. **Ctrl+Shift+P** → **Azure Functions: Create New Project**
2. Sélectionner un dossier local (ex: `D:\msfabric\func-meteo`)
3. Language : **Python**
4. Template : **Timer trigger**
5. Nom : **`MeteoCollector`**
6. Schedule : **`0 */15 * * * *`** (toutes les 15 minutes)

Remplacer le contenu de **`function_app.py`** :

```python
import azure.functions as func
import json
import random
import logging
import requests
from datetime import datetime, timezone

app = func.FunctionApp()

# ============================================================
# CONFIGURATION — Endpoint Lakehouse (via API OneLake)
# Pour simplifier l'atelier, on ecrit dans un Blob/ADLS
# que le Lakehouse lira via shortcut
# ============================================================
STORAGE_CONNECTION = "<votre_storage_connection_string>"
CONTAINER_NAME = "meteo-data"
# ============================================================

def generate_weather_data():
    """Simule les donnees meteo autour du barrage de Sidi Salem"""
    hour = datetime.now(timezone.utc).hour

    # Temperature air (cycle jour/nuit)
    if 6 <= hour <= 18:
        air_temp = 15 + (hour - 6) * 1.5 + random.uniform(-3, 3)
    else:
        air_temp = 12 + random.uniform(-4, 4)

    # Temperature eau (plus stable)
    water_temp = 14 + random.uniform(-2, 3)

    # Pluviometrie (mm/15min)
    rain = 0
    if random.random() < 0.25:  # 25% de chance de pluie
        rain = random.uniform(0.5, 8)
        # Orage (5%)
        if random.random() < 0.2:
            rain += random.uniform(10, 35)

    # Humidite
    humidity = min(100, 50 + rain * 5 + random.uniform(-10, 10))

    # Vent
    wind_speed = random.uniform(1, 15)
    wind_dir = random.choice(["N", "NE", "E", "SE", "S", "SO", "O", "NO"])

    # Evaporation estimee (mm/15min) — fonction temperature et vent
    evaporation = max(0, (air_temp - 10) * 0.01 * wind_speed * 0.1 + random.uniform(0, 0.05))

    return {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "station_id": "METEO-SIDI-SALEM",
        "air_temp_c": round(air_temp, 1),
        "water_temp_c": round(water_temp, 1),
        "rainfall_mm": round(rain, 2),
        "humidity_pct": round(humidity, 1),
        "wind_speed_ms": round(wind_speed, 1),
        "wind_direction": wind_dir,
        "evaporation_mm": round(evaporation, 3),
        "atmospheric_pressure_hpa": round(1013 + random.uniform(-15, 15), 1)
    }

@app.timer_trigger(schedule="0 */15 * * * *",
                    arg_name="myTimer",
                    run_after_startup=True)
def MeteoCollector(myTimer: func.TimerRequest) -> None:
    weather = generate_weather_data()
    logging.info(f"Meteo: {json.dumps(weather)}")

    # Ecriture dans Azure Blob Storage
    # Le Lakehouse lira ces fichiers via un shortcut
    from azure.storage.blob import BlobServiceClient
    blob_service = BlobServiceClient.from_connection_string(STORAGE_CONNECTION)
    container = blob_service.get_container_client(CONTAINER_NAME)

    blob_name = f"weather/{datetime.now(timezone.utc).strftime('%Y/%m/%d/%H%M%S')}.json"
    container.upload_blob(name=blob_name, data=json.dumps(weather), overwrite=True)
    logging.info(f"Fichier ecrit: {blob_name}")
```

Ajouter dans **`requirements.txt`** :

```
azure-functions
azure-storage-blob
requests
```

### 3.3 — Créer le Storage Account pour les données météo

1. **portal.azure.com** → **+ Create a resource** → **Storage account**
2. Resource group : `rg-barrage`
3. Nom : `stmeteobarrage` (unique, minuscules)
4. **Review + create** → **Create**
5. Dans le Storage Account → **Containers** → **+ Container** → nom : `meteo-data`
6. Copier la **Connection string** (Storage Account → **Access keys** → **Connection string**)
7. Coller dans le script Azure Function à la place de `<votre_storage_connection_string>`

### 3.4 — Déployer et tester

1. Dans VS Code → **Ctrl+Shift+P** → **Azure Functions: Deploy to Function App**
2. Sélectionner `func-meteo-barrage`
3. Après déploiement, aller dans le **portail Azure** → Function App → **MeteoCollector** → **Monitor**
4. Vérifier que les exécutions apparaissent toutes les 15 minutes
5. Vérifier dans le Storage Account que les fichiers JSON arrivent dans `meteo-data/weather/...`

---

# PHASE 2 — LAKEHOUSE MEDALLION

---

## Partie 4 — Créer le Lakehouse et ingérer les données Bronze

### 4.1 — Créer le Lakehouse

1. Dans Fabric → votre workspace → **+ New item** → **Lakehouse**
2. Nom : **`LH_Barrage`**
3. Cliquer **Create**

### 4.2 — Shortcut vers les données mirrorées (Bronze - SCADA)

**Problème terrain** : Les données SCADA sont mirrorées dans `MirrorBarrage`, mais on veut les exploiter dans le Lakehouse pour les combiner avec les données météo.

1. Dans **LH_Barrage** → panneau gauche → **Tables** → clic droit → **New shortcut**
2. Sélectionner **Microsoft OneLake**
3. Naviguer vers **MirrorBarrage** → sélectionner les tables :
   - ✅ `DamLevels`
   - ✅ `TurbineOps`
   - ✅ `GatePositions`
   - ✅ `Equipment`
4. Cliquer **Create**

> 💡 **Astuce** : Les shortcuts ne copient pas les données. Elles pointent vers les données mirrorées dans OneLake. C'est instantané et ne consomme pas de stockage supplémentaire.

**Interprétation** : Vous avez maintenant dans votre Lakehouse un accès direct aux données SCADA du barrage, répliquées en quasi temps réel depuis Azure SQL Database, sans aucun pipeline ETL. C'est la puissance du mirroring + shortcuts.

### 4.3 — Shortcut vers les données météo (Bronze - Météo)

1. Dans **LH_Barrage** → **Files** → clic droit → **New shortcut**
2. Sélectionner **Azure Data Lake Storage Gen2**
3. Remplir :

| Champ               | Valeur                                        |
| ------------------- | --------------------------------------------- |
| **URL**             | `https://stmeteobarrage.dfs.core.windows.net` |
| **Connection name** | `meteo-storage`                               |
| **Authentication**  | Account key                                   |
| **Account key**     | Coller la clé du Storage Account              |

4. Naviguer vers le container **meteo-data** → sélectionner le dossier **weather**
5. Cliquer **Create**

**Résultat Bronze** : Votre Lakehouse contient maintenant :

- **Tables/** : DamLevels, TurbineOps, GatePositions, Equipment (shortcuts mirrorés)
- **Files/weather/** : fichiers JSON des données météo

---

## Partie 5 — Transformation Silver (Notebook)

### 5.1 — Créer le Notebook

1. Dans votre workspace → **+ New item** → **Notebook**
2. Nommer : **`NB_Bronze_to_Silver`**
3. Attacher au Lakehouse **LH_Barrage** (sélecteur en haut à gauche)

### 5.2 — Cellule 1 : Charger et nettoyer les données SCADA

**Problème terrain** : Les données brutes du SCADA contiennent des valeurs aberrantes (capteurs défaillants qui envoient des zéros ou des valeurs impossibles) et des types incohérents. Il faut les nettoyer avant toute analyse.

**Question métier** : Comment obtenir un jeu de données fiable à partir des lectures brutes ?

```python
# Cellule 1 : Nettoyage des donnees SCADA (DamLevels)
from pyspark.sql import functions as F

df_dam_raw = spark.sql("SELECT * FROM LH_Barrage.DamLevels")

# Nettoyage : supprimer les valeurs physiquement impossibles
df_dam_clean = (df_dam_raw
    .filter(F.col("WaterLevelM").between(50, 130))        # Sidi Salem : 50-120m possible
    .filter(F.col("TotalInflowM3s") >= 0)
    .filter(F.col("TotalOutflowM3s") >= 0)
    .filter(F.col("UsableVolumeM3") > 0)
    .withColumn("ReadingDate", F.to_date("ReadingTime"))
    .withColumn("ReadingHour", F.hour("ReadingTime"))
    .withColumn("NetFlowM3s", F.round(F.col("TotalInflowM3s") - F.col("TotalOutflowM3s"), 3))
    .withColumn("FillingPct", F.round(F.col("UsableVolumeM3") / 700_000_000 * 100, 2))
)

# Ecriture Silver
df_dam_clean.write.mode("overwrite").format("delta").saveAsTable("LH_Barrage.silver_dam_readings")
print(f"silver_dam_readings : {df_dam_clean.count()} lignes")
```

**Interprétation** : On élimine les lectures impossibles (un niveau d'eau de 0m ou 200m n'existe pas physiquement pour ce barrage). On ajoute `NetFlowM3s` (bilan entrée-sortie) et `FillingPct` (taux de remplissage). Ce sont les deux indicateurs que le chef d'exploitation regarde en premier chaque matin.

### 5.3 — Cellule 2 : Nettoyer les données turbines

**Problème terrain** : Les turbines arrêtées envoient quand même des données (avec des zéros partout). Il faut les distinguer des vrais zéros (panne pendant le fonctionnement).

```python
# Cellule 2 : Nettoyage des donnees turbines
df_turb_raw = spark.sql("SELECT * FROM LH_Barrage.TurbineOps")

df_turb_clean = (df_turb_raw
    .filter(F.col("Efficiency").between(0, 100))
    .filter(F.col("BearingTempC").between(-10, 120))
    .withColumn("ReadingDate", F.to_date("ReadingTime"))
    .withColumn("ReadingHour", F.hour("ReadingTime"))
    .withColumn("IsAnomaly", 
        F.when(
            (F.col("Status") == "RUNNING") & 
            ((F.col("VibrationMmS") > 6) | (F.col("BearingTempC") > 75) | (F.col("Efficiency") < 70)),
            True
        ).otherwise(False))
)

df_turb_clean.write.mode("overwrite").format("delta").saveAsTable("LH_Barrage.silver_turbine_readings")
print(f"silver_turbine_readings : {df_turb_clean.count()} lignes")
```

**Interprétation** : La colonne `IsAnomaly` identifie les moments où une turbine tourne mais présente des signes de défaillance. C'est une information cruciale : un arrêt planifié coûte 10x moins cher qu'une casse en fonctionnement.

### 5.4 — Cellule 3 : Charger les données météo (JSON → table)

**Problème terrain** : Les données météo arrivent en fichiers JSON individuels. Il faut les consolider en une table structurée.

```python
# Cellule 3 : Lecture et structuration des fichiers meteo JSON
df_weather_raw = (spark.read
    .option("multiLine", True)
    .json("Files/weather/**/*.json")
)

df_weather_clean = (df_weather_raw
    .withColumn("timestamp", F.to_timestamp("timestamp"))
    .withColumn("ReadingDate", F.to_date("timestamp"))
    .withColumn("ReadingHour", F.hour("timestamp"))
    .filter(F.col("air_temp_c").between(-10, 55))
    .filter(F.col("rainfall_mm") >= 0)
    .filter(F.col("humidity_pct").between(0, 100))
)

df_weather_clean.write.mode("overwrite").format("delta").saveAsTable("LH_Barrage.silver_weather_readings")
print(f"silver_weather_readings : {df_weather_clean.count()} lignes")
```

**Interprétation** : Les fichiers JSON éparpillés sont maintenant une table Delta Lake propre et requêtable en SQL. L'ingénieur peut croiser la pluviométrie avec les niveaux du barrage — ce qui était impossible quand les deux systèmes étaient séparés.

---

## Partie 6 — Agrégation Gold (SQL dans le Lakehouse)

Ouvrir le **SQL analytics endpoint** de **LH_Barrage** (cliquer sur le sélecteur en haut à droite du Lakehouse → **SQL analytics endpoint**).

### Requête Gold 1 — Production électrique journalière

**Problème terrain** : Le gestionnaire du réseau électrique (STEG) demande chaque jour le volume de production pour la facturation et le planning réseau.

**Question métier** : Quelle est la production totale et par turbine pour chaque jour ?

```sql
CREATE VIEW gold_daily_production AS
SELECT
    ReadingDate,
    TurbineId,
    COUNT(*) AS NbReadings,
    ROUND(AVG(PowerOutputKW), 2) AS AvgPowerKW,
    ROUND(MAX(PowerOutputKW), 2) AS MaxPowerKW,
    ROUND(SUM(PowerOutputKW * 5.0 / 3600), 2) AS EnergyKWh,  -- 5 sec par lecture
    ROUND(AVG(Efficiency), 2) AS AvgEfficiency,
    SUM(CASE WHEN IsAnomaly = 1 THEN 1 ELSE 0 END) AS NbAnomalies,
    ROUND(AVG(CASE WHEN Status = 'RUNNING' THEN 1.0 ELSE 0.0 END) * 100, 1) AS AvailabilityPct
FROM silver_turbine_readings
GROUP BY ReadingDate, TurbineId;
```

**Interprétation** : `EnergyKWh` est la valeur facturée au réseau. `AvailabilityPct` est le taux de disponibilité — un indicateur contractuel. Si une turbine tombe sous 90% de disponibilité, l'exploitant est pénalisé. `NbAnomalies` anticipe les pannes futures : une turbine avec 15 anomalies aujourd'hui sera probablement en panne demain.

---

### Requête Gold 2 — Bilan hydrique journalier

**Problème terrain** : Le ministère de l'Agriculture demande un bilan hydrique mensuel pour planifier les lâchers d'eau pour l'irrigation. Il faut savoir combien d'eau entre, sort, et reste dans le barrage.

**Question métier** : Quel est le bilan entrée-sortie d'eau par jour ?

```sql
CREATE VIEW gold_water_balance AS
SELECT
    ReadingDate,
    ROUND(AVG(WaterLevelM), 2) AS AvgLevelM,
    ROUND(MIN(WaterLevelM), 2) AS MinLevelM,
    ROUND(MAX(WaterLevelM), 2) AS MaxLevelM,
    ROUND(AVG(FillingPct), 1) AS AvgFillingPct,
    ROUND(AVG(TotalInflowM3s), 2) AS AvgInflowM3s,
    ROUND(AVG(TotalOutflowM3s), 2) AS AvgOutflowM3s,
    ROUND(AVG(NetFlowM3s), 2) AS AvgNetFlowM3s,
    ROUND(SUM(TotalInflowM3s * 5.0), 0) AS TotalInflowM3,   -- Volume entrant (m3)
    ROUND(SUM(TotalOutflowM3s * 5.0), 0) AS TotalOutflowM3, -- Volume sortant (m3)
    SUM(CASE WHEN SpillwayActive = 1 THEN 1 ELSE 0 END) AS SpillwayActivations,
    MAX(FloodAlertLevel) AS MaxAlertLevel
FROM silver_dam_readings
GROUP BY ReadingDate;
```

**Interprétation** : `TotalInflowM3` vs `TotalOutflowM3` = le bilan du jour. Si le barrage perd plus qu'il ne reçoit pendant 10 jours consécutifs en été, il faut réduire les lâchers d'irrigation. `SpillwayActivations` > 0 signifie qu'on a dû ouvrir l'évacuateur de crue — c'est de l'eau "perdue" non turbinée, donc non facturée. L'exploitant veut minimiser ce chiffre.

---

### Requête Gold 3 — Indice de risque de crue

**Problème terrain** : Le gouverneur de la région a besoin d'un indicateur simple (un score de 0 à 100) pour décider s'il faut alerter la population en aval du barrage.

**Question métier** : Quel est le niveau de risque de crue en temps réel ?

```sql
CREATE VIEW gold_flood_risk AS
SELECT
    ReadingDate,
    ReadingHour,
    ROUND(AVG(WaterLevelM), 2) AS AvgLevelM,
    ROUND(AVG(TotalInflowM3s), 2) AS AvgInflowM3s,
    ROUND(AVG(NetFlowM3s), 2) AS AvgNetFlowM3s,
    ROUND(AVG(FillingPct), 1) AS FillingPct,
    -- Score de risque composite (0-100)
    ROUND(
        CASE
            -- Niveau critique (> 110m) = risque max
            WHEN AVG(WaterLevelM) > 110 THEN 95
            -- Niveau eleve + debit entrant fort
            WHEN AVG(WaterLevelM) > 100 AND AVG(TotalInflowM3s) > 100 THEN 80
            -- Niveau eleve seul
            WHEN AVG(WaterLevelM) > 100 THEN 60
            -- Niveau moyen + debit entrant tres fort (crue eclair)
            WHEN AVG(WaterLevelM) > 90 AND AVG(TotalInflowM3s) > 150 THEN 70
            -- Niveau moyen + tendance haussiere
            WHEN AVG(WaterLevelM) > 90 AND AVG(NetFlowM3s) > 30 THEN 45
            -- Vigilance
            WHEN AVG(WaterLevelM) > 85 AND AVG(NetFlowM3s) > 20 THEN 30
            ELSE GREATEST(0, (AVG(WaterLevelM) - 70) * 2)
        END, 0
    ) AS FloodRiskScore,
    CASE
        WHEN AVG(WaterLevelM) > 110 THEN 'EVACUATION'
        WHEN AVG(WaterLevelM) > 100 AND AVG(TotalInflowM3s) > 100 THEN 'ALERTE ROUGE'
        WHEN AVG(WaterLevelM) > 100 THEN 'ALERTE ORANGE'
        WHEN AVG(WaterLevelM) > 90 AND AVG(TotalInflowM3s) > 150 THEN 'ALERTE ORANGE'
        WHEN AVG(WaterLevelM) > 90 AND AVG(NetFlowM3s) > 30 THEN 'VIGILANCE'
        ELSE 'NORMAL'
    END AS AlertLabel
FROM silver_dam_readings
GROUP BY ReadingDate, ReadingHour;
```

**Interprétation** : Le `FloodRiskScore` est ce que le gouverneur regarde sur son téléphone. Un score de 80+ → il déclenche le plan d'évacuation des zones inondables en aval. Un score de 45-70 → il prévient les services de secours. C'est une donnée qui peut **sauver des vies**. Sans cette vue consolidée, le gouverneur devait appeler l'exploitant du barrage qui lui-même devait regarder 3 écrans SCADA différents pour donner une réponse — temps perdu critique en situation d'urgence.

---

### Requête Gold 4 — Corrélation météo-barrage

**Problème terrain** : L'ingénieur hydrologue veut comprendre l'impact de la pluie sur le niveau du barrage, avec un décalage temporel (la pluie qui tombe à 8h fait monter le barrage à 14h).

**Question métier** : Quelle est la corrélation entre pluviométrie et débit entrant ?

```sql
CREATE VIEW gold_meteo_dam_correlation AS
SELECT
    d.ReadingDate,
    d.ReadingHour,
    ROUND(AVG(d.TotalInflowM3s), 2) AS AvgInflowM3s,
    ROUND(AVG(d.WaterLevelM), 2) AS AvgLevelM,
    ROUND(AVG(d.NetFlowM3s), 2) AS AvgNetFlowM3s,
    ROUND(COALESCE(AVG(w.rainfall_mm), 0), 2) AS AvgRainfallMm,
    ROUND(COALESCE(AVG(w.air_temp_c), 0), 1) AS AvgAirTempC,
    ROUND(COALESCE(AVG(w.wind_speed_ms), 0), 1) AS AvgWindSpeedMs,
    ROUND(COALESCE(AVG(w.evaporation_mm), 0), 3) AS AvgEvaporationMm
FROM silver_dam_readings d
LEFT JOIN silver_weather_readings w
    ON d.ReadingDate = w.ReadingDate
    AND d.ReadingHour = w.ReadingHour
GROUP BY d.ReadingDate, d.ReadingHour;
```

**Interprétation** : Cette vue est la base du modèle prédictif. Si on constate que 15mm de pluie en 1h entraîne systématiquement une montée de 2m du barrage 6h plus tard, on peut **anticiper** les ouvertures de vannes au lieu de réagir dans l'urgence. L'ingénieur hydrologue peut calibrer ses modèles de propagation de crue avec des données réelles plutôt que des estimations théoriques.

---

### Requête Gold 5 — Tableau de bord exécutif

**Problème terrain** : Le directeur de la centrale veut un résumé quotidien envoyé automatiquement aux parties prenantes (ministère, STEG, gouvernorat).

**Question métier** : Résumez-moi la journée en un seul tableau.

```sql
CREATE VIEW gold_executive_summary AS
SELECT
    d.ReadingDate,
    -- Barrage
    ROUND(AVG(d.AvgLevelM), 1) AS NiveauMoyenM,
    ROUND(AVG(d.AvgFillingPct), 1) AS RemplissagePct,
    d.MaxAlertLevel AS NiveauAlerte,
    ROUND(AVG(d.TotalInflowM3), 0) AS VolumeEntrantM3,
    ROUND(AVG(d.TotalOutflowM3), 0) AS VolumeSortantM3,
    -- Production
    ROUND(SUM(p.EnergyKWh), 0) AS ProductionTotaleKWh,
    ROUND(AVG(p.AvgEfficiency), 1) AS RendementMoyenPct,
    ROUND(AVG(p.AvailabilityPct), 1) AS DisponibilitePct,
    SUM(p.NbAnomalies) AS TotalAnomalies,
    -- Risque
    ROUND(MAX(f.FloodRiskScore), 0) AS RisqueCrueMax,
    MAX(f.AlertLabel) AS AlerteCrueMax
FROM gold_water_balance d
LEFT JOIN gold_daily_production p ON d.ReadingDate = p.ReadingDate
LEFT JOIN gold_flood_risk f ON d.ReadingDate = f.ReadingDate
GROUP BY d.ReadingDate, d.MaxAlertLevel;
```

**Interprétation** : Ce tableau est le **rapport du directeur**. Une ligne par jour, 12 colonnes. Le ministère voit le remplissage (est-ce qu'on aura assez d'eau pour l'été ?). La STEG voit la production (est-ce qu'on tient le contrat ?). Le gouvernorat voit le risque de crue (est-ce qu'il faut alerter ?). Trois publics, un seul tableau. C'est exactement ce qu'Excel ne pouvait pas faire : une vue consolidée, automatique, à jour, sans intervention humaine.

---

# PHASE 3 — POWER BI

---

## Partie 7 — Créer le rapport Power BI

### 7.1 — Connexion Direct Lake

1. Dans Fabric → votre workspace → cliquer sur **LH_Barrage** (le Lakehouse)
2. Cliquer sur **SQL analytics endpoint** (en haut)
3. Dans la barre du haut → cliquer **Create Power BI report** (ou **New Power BI dataset**)
4. Sélectionner les vues Gold :
   - ✅ `gold_daily_production`
   - ✅ `gold_water_balance`
   - ✅ `gold_flood_risk`
   - ✅ `gold_meteo_dam_correlation`
   - ✅ `gold_executive_summary`
5. Cliquer **Create**

> 💡 **Astuce** : Direct Lake permet à Power BI de lire directement les fichiers Delta Lake dans OneLake sans import ni DirectQuery. C'est le mode le plus rapide.

### 7.2 — Page 1 : Production électrique

1. **Card** : `SUM(ProductionTotaleKWh)` → titre "Production totale"
2. **Line chart** : Axe = `ReadingDate`, Valeur = `EnergyKWh`, Légende = `TurbineId`
3. **Gauge** : Valeur = `AVG(RendementMoyenPct)`, Min = 0, Max = 100, Cible = 90
4. **Table** : TurbineId, AvgPowerKW, AvailabilityPct, NbAnomalies

### 7.3 — Page 2 : Gestion de l'eau

1. **Area chart** : Axe = `ReadingDate` + `ReadingHour`, Valeurs = `AvgInflowM3s`, `AvgOutflowM3s`
2. **KPI** : Valeur = `AvgFillingPct`, Cible = 70
3. **Gauge** : `FloodRiskScore`, Min = 0, Max = 100, seuils couleur : Vert < 30, Orange < 70, Rouge ≥ 70
4. **Slicer** : `AlertLabel` pour filtrer par niveau d'alerte

### 7.4 — Page 3 : Corrélation météo

1. **Scatter plot** : X = `AvgRainfallMm`, Y = `AvgInflowM3s`, taille = `AvgLevelM`
2. **Combo chart** : Colonnes = `AvgRainfallMm`, Ligne = `AvgLevelM`, Axe = `ReadingHour`
3. **Card** : `AVG(AvgAirTempC)`, `SUM(AvgRainfallMm)`, `AVG(AvgEvaporationMm)`

### 7.5 — Publier

1. **File** → **Save** → nommer : `Rapport_Barrage_SidiSalem`
2. Le rapport est automatiquement disponible dans votre workspace Fabric
3. Configurer un **rafraîchissement automatique** si souhaité

---

## Nettoyage

1. **Ctrl+C** pour arrêter le simulateur SCADA
2. Dans **Fabric** → supprimer : rapport Power BI, Lakehouse, Mirrored Database, Notebook
3. Dans **Azure** → supprimer le resource group `rg-barrage` (supprime SQL DB + Function App + Storage)

> 💡 **Astuce** : Supprimer le resource group Azure est le moyen le plus propre et le plus rapide.

---

## Récapitulatif de l'architecture Medallion

| Couche           | Contenu                                        | Comment                                 |
| ---------------- | ---------------------------------------------- | --------------------------------------- |
| **Bronze**       | Données brutes mirrorées + fichiers JSON météo | Mirroring + Azure Functions + Shortcuts |
| **Silver**       | Tables nettoyées, typées, colonnes calculées   | Notebook PySpark                        |
| **Gold**         | Vues agrégées, KPI, scores de risque           | SQL Views dans le Lakehouse             |
| **Présentation** | Tableaux de bord interactifs                   | Power BI Direct Lake                    |
