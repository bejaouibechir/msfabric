# Atelier : Monitoring temps réel d'un parc éolien — Eventstream & KQL Database

Vous allez ingérer des données IoT simulées (capteurs de turbines éoliennes) dans **Microsoft Fabric** via **Eventstream**, les stocker dans une **KQL Database**, les analyser avec des requêtes **KQL**, les visualiser dans un **Real-Time Dashboard** et configurer des **alertes automatiques**.

Résultat attendu : un pipeline temps réel complet qui détecte les anomalies (surchauffe, vibrations) sur 5 turbines éoliennes.

---

## Fichiers nécessaires

- `wind_turbine_simulator.py` — script Python fourni en Partie 3 (copier-coller)
- Package Python : `azure-eventhub`

## Prérequis

- Tenant Microsoft Fabric (licence **Trial** ou **Capacity**, minimum **F4**)
- **Python 3.9+** installé sur votre poste
- Un **workspace Fabric** existant

---

## Partie 1 — Créer l'Eventhouse

1. Ouvrir **app.fabric.microsoft.com** → votre **workspace**
2. Cliquer **+ New item**
3. Sélectionner **Eventhouse**
4. Nom : **`WindFarmEventhouse`**
5. Cliquer **Create**

> Un **KQL Database** du même nom (`WindFarmEventhouse`) est automatiquement créé.

⚠️ **Piège** : Ne créez pas la table manuellement. Elle sera créée automatiquement en Partie 2.

---

## Partie 2 — Créer l'Eventstream

### 2.1 — Créer le flux et le Custom Endpoint

1. Retourner dans votre **workspace**
2. Cliquer **+ New item** → **Eventstream**
3. Nom : **`WindTurbineStream`**
4. Cliquer **Create**
5. Sur le canvas, cliquer **Use custom endpoint**
6. Nom du endpoint : **`WindTurbineStream-Endpoint`**
7. Cliquer **Add**
8. Cliquer **Publish** (en haut à droite)

> 💡 **Astuce** : Le Publish est obligatoire pour générer les clés de connexion SAS.

### 2.2 — Ajouter la destination Eventhouse

1. Cliquer **Edit** (barre du haut)
2. Sur le canvas, cliquer le bloc vert **"Transform events or add destination"**
3. Sélectionner **Eventhouse**
4. Dans le panneau de droite, remplir :

| Champ                     | Valeur                                         |
| ------------------------- | ---------------------------------------------- |
| **Data ingestion mode**   | `Event processing before ingestion`            |
| **Destination name**      | `TurbineEventsDestination`                     |
| **Workspace**             | Votre workspace                                |
| **Eventhouse**            | `WindFarmEventhouse`                           |
| **KQL Database**          | `WindFarmEventhouse`                           |
| **KQL Destination table** | Taper `TurbineEvents` (cliquer **Create new**) |
| **Input data format**     | `Json`                                         |

5. Cocher ✅ **Activate ingestion after adding the data source**
6. Cliquer **Save**
7. Cliquer **Publish** (en haut à droite)

### 2.3 — Récupérer les clés de connexion

1. Vous êtes maintenant en mode **Live**
2. Cliquer sur le nœud **WindTurbineStream-Endpoint** (bloc de gauche sur le canvas)
3. En bas de l'écran → panneau **Details**
4. Cliquer **SAS Key Authentication** (colonne de gauche du panneau)
5. Copier ces 2 valeurs dans un **bloc-notes** :

| Valeur                            | Où la trouver                                 |
| --------------------------------- | --------------------------------------------- |
| **Event hub name**                | Affiché en clair (ex: `es_cf791d0f-835d-...`) |
| **Connection string–primary key** | Cliquer l'icône 👁️ pour révéler, puis copier |

⚠️ **Piège** : La Connection string n'est pas visible par défaut. Il faut cliquer sur l'icône œil pour la révéler avant de pouvoir la copier.

---

## Partie 3 — Le simulateur Python

### 3.1 — Installer le package

Ouvrir un **terminal** (PowerShell ou CMD) :

```bash
pip install azure-eventhub
```

### 3.2 — Créer le script

Créer un fichier **`wind_turbine_simulator.py`** et coller ce code :

```python
import json
import time
import random
from datetime import datetime, timezone
from azure.eventhub import EventHubProducerClient, EventData

# ============================================================
# CONFIGURATION — Coller vos valeurs depuis l'Eventstream
# ============================================================
CONNECTION_STR = "<votre_connection_string_primary_key>"
EVENTHUB_NAME = "<votre_event_hub_name>"
# ============================================================

TURBINES = ["WT-001", "WT-002", "WT-003", "WT-004", "WT-005"]
PARK_NAME = "Parc Eolien Bizerte"

def generate_turbine_event(turbine_id):
    wind_speed = random.uniform(3.0, 25.0)

    # Courbe de puissance simplifiee
    if wind_speed < 3.5:
        power = 0
    elif wind_speed > 22:
        power = 0
    else:
        power = min(3000, (wind_speed - 3.5) ** 2 * 18)

    rotor_rpm = wind_speed * 1.2 + random.uniform(-1, 1)
    gen_temp = 55 + (power / 3000) * 35 + random.uniform(-3, 3)
    vibration = 2.0 + random.uniform(0, 1.5)

    # Injection d'anomalies (10% du temps)
    if random.random() < 0.10:
        anomaly_type = random.choice(["overheat", "vibration", "underperform"])
        if anomaly_type == "overheat":
            gen_temp += random.uniform(25, 45)
        elif anomaly_type == "vibration":
            vibration += random.uniform(5, 12)
        elif anomaly_type == "underperform":
            power *= random.uniform(0.2, 0.5)

    return {
        "TurbineId": turbine_id,
        "Timestamp": datetime.now(timezone.utc).isoformat(),
        "WindSpeedMs": round(wind_speed, 2),
        "RotorRPM": round(rotor_rpm, 2),
        "PowerOutputKW": round(power, 2),
        "GeneratorTempC": round(gen_temp, 2),
        "VibrationMmS": round(vibration, 2),
        "NacelleOrientation": round(random.uniform(0, 360), 1),
        "AmbientTempC": round(random.uniform(15, 35), 1),
        "ParkName": PARK_NAME
    }

def main():
    producer = EventHubProducerClient.from_connection_string(
        conn_str=CONNECTION_STR,
        eventhub_name=EVENTHUB_NAME
    )
    print("Envoi d'evenements vers Fabric Eventstream...")

    try:
        while True:
            batch = producer.create_batch()
            for turbine_id in TURBINES:
                event = generate_turbine_event(turbine_id)
                batch.add(EventData(json.dumps(event)))
                print(f"  [{event['Timestamp'][:19]}] {turbine_id} | "
                      f"Vent: {event['WindSpeedMs']}m/s | "
                      f"Puissance: {event['PowerOutputKW']}kW | "
                      f"Temp: {event['GeneratorTempC']}C | "
                      f"Vibration: {event['VibrationMmS']}mm/s")
            producer.send_batch(batch)
            print(f"  -> Batch de {len(TURBINES)} evenements envoye\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Arret du simulateur.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
```

### 3.3 — Configurer et lancer

1. Ouvrir le fichier dans un éditeur (VS Code, Notepad++)
2. Remplacer `<votre_connection_string_primary_key>` par la **Connection string** copiée en 2.3
3. Remplacer `<votre_event_hub_name>` par le **Event hub name** copié en 2.3
4. Sauvegarder
5. Dans le terminal, naviguer vers le dossier du fichier :

```bash
cd D:\msfabric
```

6. Lancer :

```bash
py wind_turbine_simulator.py
```

**Output attendu :**

```
Envoi d'evenements vers Fabric Eventstream...
  [2026-02-10T17:04:26] WT-001 | Vent: 13.16m/s | Puissance: 1678.44kW | Temp: 77.45C | Vibration: 2.7mm/s
  [2026-02-10T17:04:26] WT-002 | Vent: 23.59m/s | Puissance: 0kW | Temp: 53.19C | Vibration: 2.52mm/s
  [2026-02-10T17:04:26] WT-003 | Vent: 24.49m/s | Puissance: 0kW | Temp: 57.79C | Vibration: 3.04mm/s
  [2026-02-10T17:04:26] WT-004 | Vent: 15.79m/s | Puissance: 2717.79kW | Temp: 83.9C | Vibration: 2.02mm/s
  [2026-02-10T17:04:26] WT-005 | Vent: 3.72m/s | Puissance: 0.89kW | Temp: 55.31C | Vibration: 2.38mm/s
  -> Batch de 5 evenements envoye
```

> 💡 **Astuce** : Laissez le script tourner pendant tout l'atelier. Utilisez **Ctrl+C** pour l'arrêter à la fin.

---

## Partie 4 — Vérifier l'ingestion des données

1. Retourner sur **app.fabric.microsoft.com** → votre **workspace**
2. Cliquer sur **WindFarmEventhouse**
3. Dans le panneau gauche → **KQL databases** → **WindFarmEventhouse**
4. Sous **Tables** → vérifier que **TurbineEvents** apparaît
5. Cliquer sur **TurbineEvents**
6. Onglet **Data preview** → les données doivent s'afficher

**Résultat attendu :** un tableau avec les colonnes TurbineId, Timestamp, WindSpeedMs, RotorRPM, PowerOutputKW, GeneratorTempC, VibrationMmS, NacelleOrientation, AmbientTempC, ParkName, IngestionTime.

> ⚠️ **Piège** : Fabric peut ajouter un **espace à la fin du nom** de la table lors de la création automatique. Si une requête KQL échoue avec `Failed to resolve table 'TurbineEvents'`, utilisez **`['TurbineEvents ']`** (avec crochets et espace) dans toutes vos requêtes.

---

## Partie 5 — Requêtes analytiques KQL

1. Dans le panneau gauche, cliquer sur **WindFarmEventhouse_queryset**
2. Supprimer le contenu par défaut
3. Copier-coller et exécuter chaque requête ci-dessous avec **Run** (▶️)

> 💡 **Astuce** : Sélectionnez uniquement la requête à exécuter avant de cliquer Run, sinon toutes les requêtes s'exécutent.

---

### 5.1 — Vérification rapide

```kql
['TurbineEvents ']
| take 20
```

---

### 5.2 — Production moyenne par turbine (10 dernières minutes)

```kql
['TurbineEvents ']
| where Timestamp > ago(10m)
| summarize
    AvgPower = avg(PowerOutputKW),
    AvgWind = avg(WindSpeedMs),
    EventCount = count()
  by TurbineId
| order by AvgPower desc
```

**Ce que vous voyez** : chaque turbine avec sa puissance moyenne, vitesse de vent moyenne et nombre d'événements.

---

### 5.3 — Détection d'anomalies thermiques (> 95°C)

```kql
['TurbineEvents ']
| where Timestamp > ago(30m)
| where GeneratorTempC > 95
| project Timestamp, TurbineId, GeneratorTempC, PowerOutputKW, WindSpeedMs
| order by GeneratorTempC desc
```

**Ce que vous voyez** : uniquement les événements où le générateur a dépassé 95°C — ce sont les surchauffes injectées par le simulateur.

---

### 5.4 — Détection de vibrations anormales (> 8 mm/s)

```kql
['TurbineEvents ']
| where Timestamp > ago(30m)
| where VibrationMmS > 8.0
| project Timestamp, TurbineId, VibrationMmS, RotorRPM
| order by VibrationMmS desc
```

**Ce que vous voyez** : les événements avec des vibrations dangereuses — signe d'un problème mécanique (roulement, pale endommagée).

---

### 5.5 — Rendement énergétique par turbine (fenêtre glissante 5 min)

```kql
['TurbineEvents ']
| where Timestamp > ago(30m)
| where WindSpeedMs between (4.0 .. 20.0)
| summarize
    AvgPower = avg(PowerOutputKW),
    AvgWind = avg(WindSpeedMs)
  by TurbineId, bin(Timestamp, 5m)
| extend EfficiencyRatio = AvgPower / (AvgWind * AvgWind * AvgWind) * 1000
| order by Timestamp desc, TurbineId
```

**Ce que vous voyez** : le ratio de rendement par turbine toutes les 5 minutes. Un ratio anormalement bas = sous-performance.

---

### 5.6 — État de santé global des turbines

```kql
['TurbineEvents ']
| where Timestamp > ago(30m)
| summarize
    AvgTemp = avg(GeneratorTempC),
    MaxTemp = max(GeneratorTempC),
    AvgVibration = avg(VibrationMmS),
    MaxVibration = max(VibrationMmS),
    AvgPower = avg(PowerOutputKW),
    TotalEvents = count()
  by TurbineId
| extend HealthStatus = case(
    MaxTemp > 95 or MaxVibration > 8.0, "CRITIQUE",
    MaxTemp > 85 or MaxVibration > 6.0, "ATTENTION",
    "NORMAL")
| order by HealthStatus asc
```

**Ce que vous voyez** : un tableau de synthèse avec un statut CRITIQUE / ATTENTION / NORMAL par turbine.

---

## Partie 6 — Créer le Real-Time Dashboard

### 6.1 — Première tuile (tableau de santé)

1. Dans le **queryset**, sélectionner la **requête 5.6** (état de santé)
2. Cliquer **Save to Dashboard** (barre du haut)
3. Sélectionner **Create new dashboard**
4. Nom du dashboard : **`WindFarm-LiveMonitoring`**
5. Nom de la tuile : **`Etat de sante des turbines`**
6. Cliquer **Create**
7. Cliquer **Open dashboard**

**Résultat attendu** : un tableau avec les 5 turbines et leur statut de santé.

### 6.2 — Deuxième tuile (graphique température)

1. Dans le dashboard, cliquer **Manage** (en haut)
2. Cliquer **+ Add tile**
3. Connecter à la **database** `WindFarmEventhouse` si demandé
4. Coller cette requête :

```kql
['TurbineEvents ']
| where Timestamp > ago(1h)
| summarize MaxTemp = max(GeneratorTempC) by TurbineId, bin(Timestamp, 1m)
```

5. Cliquer **Run**
6. Dans le panneau **Visual** (à droite) → changer le type vers **Line chart**
7. Cliquer **Apply changes**

**Résultat attendu** : un graphique en courbes avec l'évolution de la température max par turbine. Les pics d'anomalies sont visibles.

### 6.3 — Troisième tuile (graphique vibrations)

1. Cliquer **+ Add tile**
2. Coller cette requête :

```kql
['TurbineEvents ']
| where Timestamp > ago(1h)
| summarize MaxVibration = max(VibrationMmS) by TurbineId, bin(Timestamp, 1m)
```

3. Cliquer **Run**
4. Type de visualisation → **Line chart**
5. Cliquer **Apply changes**

> 💡 **Astuce** : Pour activer le rafraîchissement automatique, cliquez sur **Manage** → icône ⚙️ → **Auto refresh** → sélectionnez **30 secondes**.

---

## Partie 7 — Configurer les alertes avec Activator

1. Dans le dashboard **WindFarm-LiveMonitoring**
2. Cliquer sur la tuile **graphique température** (Line chart de la partie 6.2)
3. Cliquer **Set alert** (barre du haut)
4. Configurer :

| Champ         | Valeur                 |
| ------------- | ---------------------- |
| **Measure**   | `MaxTemp`              |
| **Condition** | Is greater than        |
| **Value**     | `95`                   |
| **Action**    | Email ou Teams message |

5. Cliquer **Create**

⚠️ **Piège** : Le bouton **Set alert** ne fonctionne que sur les tuiles de type **graphique** (Line chart, Bar chart). Il ne fonctionne **pas** sur les tuiles de type **Table**.

---

## Nettoyage (optionnel)

1. Arrêter le script Python : **Ctrl+C** dans le terminal
2. Dans votre workspace Fabric, supprimer dans cet ordre :
   - Le dashboard **WindFarm-LiveMonitoring**
   - L'eventstream **WindTurbineStream**
   - L'eventhouse **WindFarmEventhouse**

Ou bien : **Workspace settings** → **General** → **Remove this workspace**
