# Atelier : Supervision d'une ferme solaire avec KQL — 20 requêtes pour maîtriser Kusto Query Language

Vous allez construire un pipeline temps réel pour superviser une ferme solaire photovoltaïque, puis exploiter les données avec **20 requêtes KQL progressives** qui couvrent l'ensemble des opérateurs fondamentaux et intermédiaires.

Résultat attendu : un pipeline Eventstream → KQL Database fonctionnel, une maîtrise pratique de KQL appliquée à un cas réel de monitoring énergétique, un Real-Time Dashboard et des alertes Activator.

---

## Contexte métier : la ferme solaire de Tozeur

La **ferme solaire de Tozeur** (sud tunisien) est composée de 8 onduleurs connectés à des panneaux photovoltaïques. Chaque onduleur remonte toutes les 5 secondes :

| Capteur           | Signification                        | Unité |
| ----------------- | ------------------------------------ | ----- |
| **Irradiance**    | Ensoleillement reçu par les panneaux | W/m²  |
| **PanelTempC**    | Température de surface des panneaux  | °C    |
| **PowerOutputKW** | Puissance électrique produite        | kW    |
| **Voltage**       | Tension de sortie                    | V     |
| **Current**       | Intensité de sortie                  | A     |
| **Efficiency**    | Rendement de conversion (%)          | %     |
| **AmbientTempC**  | Température ambiante                 | °C    |
| **WindSpeedMs**   | Vitesse du vent (refroidissement)    | m/s   |

**Problèmes réels rencontrés par les exploitants solaires :**

- Chute de rendement inexpliquée sur certains onduleurs (poussière, ombrage, dégradation)
- Surchauffe des panneaux en été réduisant la production de 10 à 25%
- Onduleurs défaillants qui passent inaperçus pendant des jours
- Absence de visibilité temps réel sur la production vs la capacité théorique
- Pas d'alertes automatiques quand un seuil critique est franchi

---

## KQL en 2 minutes — Ce qu'il faut retenir avant de commencer

**KQL (Kusto Query Language)** est le langage de requête des KQL Databases dans Microsoft Fabric. Son style **pipeline** (chaîne de pipes `|`) le rend très lisible :

```
Table
| filtre 1
| filtre 2
| agrégation
| tri
```

**Différences clés avec SQL :**

| Aspect                  | SQL (T-SQL)             | KQL                               |
| ----------------------- | ----------------------- | --------------------------------- |
| Séparateur de commandes | `;`                     | Chaque requête est indépendante   |
| Ordre de lecture        | FROM → WHERE → GROUP BY | Table → filtres → agrégats        |
| Case sensitive          | Souvent non             | **Oui** (noms de colonnes/tables) |
| Fenêtres temporelles    | DATEADD / BETWEEN       | `ago()`, `between`, `bin()`       |
| Limiter les résultats   | TOP / OFFSET FETCH      | `take`, `top`                     |

**Top 8 opérateurs à connaître :**

| Opérateur                                     | Rôle                             | Équivalent SQL                 |
| --------------------------------------------- | -------------------------------- | ------------------------------ |
| `take` / `limit`                              | Voir un échantillon              | `TOP`                          |
| `where`                                       | Filtrer                          | `WHERE`                        |
| `project`                                     | Sélectionner / renommer colonnes | `SELECT`                       |
| `extend`                                      | Créer colonnes calculées         | Colonne calculée dans `SELECT` |
| `summarize`                                   | Agrégation par groupe            | `GROUP BY` + fonctions         |
| `count`, `sum`, `avg`, `min`, `max`, `dcount` | Fonctions d'agrégation           | Idem en SQL                    |
| `join`, `union`                               | Joindre / combiner tables        | `JOIN`, `UNION`                |
| `bin()` + `ago()`                             | Fenêtres temporelles             | `DATEPART` + `DATEADD`         |

**Où écrire du KQL dans Fabric :**

- **KQL Queryset** → éditeur principal (c'est là qu'on travaille dans cet atelier)
- **Real-Time Dashboard** → dans chaque tuile
- **Notebooks** → avec la magic `%%kql`
- **Activator rules** → conditions d'alerte

---

## Fichiers nécessaires

- `solar_farm_simulator.py` — script Python fourni en Partie 3 (copier-coller)
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
4. Nom : **`SolarFarmEventhouse`**
5. Cliquer **Create**

> Un **KQL Database** du même nom (`SolarFarmEventhouse`) est automatiquement créé.

⚠️ **Piège** : Ne créez pas la table manuellement. Elle sera créée automatiquement en Partie 2.

---

## Partie 2 — Créer l'Eventstream

### 2.1 — Créer le flux et le Custom Endpoint

1. Retourner dans votre **workspace**
2. Cliquer **+ New item** → **Eventstream**
3. Nom : **`SolarInverterStream`**
4. Cliquer **Create**
5. Sur le canvas, cliquer **Use custom endpoint**
6. Nom du endpoint : **`SolarInverterEndpoint`**
7. Cliquer **Add**
8. Cliquer **Publish** (en haut à droite)

> 💡 **Astuce** : Le Publish est obligatoire pour générer les clés de connexion SAS.

### 2.2 — Ajouter la destination Eventhouse

1. Cliquer **Edit** (barre du haut)
2. Sur le canvas, cliquer le bloc vert **"Transform events or add destination"**
3. Sélectionner **Eventhouse**
4. Dans le panneau de droite, remplir :

| Champ                     | Valeur                                       |
| ------------------------- | -------------------------------------------- |
| **Data ingestion mode**   | `Event processing before ingestion`          |
| **Destination name**      | `SolarEventsDestination`                     |
| **Workspace**             | Votre workspace                              |
| **Eventhouse**            | `SolarFarmEventhouse`                        |
| **KQL Database**          | `SolarFarmEventhouse`                        |
| **KQL Destination table** | Taper `SolarEvents` (cliquer **Create new**) |
| **Input data format**     | `Json`                                       |

5. Cocher ✅ **Activate ingestion after adding the data source**
6. Cliquer **Save**
7. Cliquer **Publish** (en haut à droite)

### 2.3 — Récupérer les clés de connexion

1. Vous êtes maintenant en mode **Live**
2. Cliquer sur le nœud **SolarInverterEndpoint** (bloc de gauche sur le canvas)
3. En bas de l'écran → panneau **Details**
4. Cliquer **SAS Key Authentication** (colonne de gauche du panneau)
5. Copier ces 2 valeurs dans un **bloc-notes** :

| Valeur                            | Où la trouver                                 |
| --------------------------------- | --------------------------------------------- |
| **Event hub name**                | Affiché en clair (ex: `es_abc123-...`)        |
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

Créer un fichier **`solar_farm_simulator.py`** et coller ce code :

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

INVERTERS = [f"INV-{str(i).zfill(3)}" for i in range(1, 9)]  # INV-001 a INV-008
FARM_NAME = "Ferme Solaire Tozeur"

# Zones geographiques des onduleurs (utile pour le join)
INVERTER_ZONES = {
    "INV-001": "Zone_Nord", "INV-002": "Zone_Nord",
    "INV-003": "Zone_Centre", "INV-004": "Zone_Centre",
    "INV-005": "Zone_Sud", "INV-006": "Zone_Sud",
    "INV-007": "Zone_Est", "INV-008": "Zone_Est"
}

INVERTER_CAPACITY_KW = {
    "INV-001": 500, "INV-002": 500,
    "INV-003": 600, "INV-004": 600,
    "INV-005": 550, "INV-006": 550,
    "INV-007": 480, "INV-008": 480
}

def get_simulated_hour():
    """Simule un cycle jour/nuit : retourne une heure entre 5h et 20h"""
    return random.randint(5, 20)

def generate_solar_event(inverter_id):
    hour = get_simulated_hour()
    capacity = INVERTER_CAPACITY_KW[inverter_id]
    zone = INVERTER_ZONES[inverter_id]

    # Irradiance selon l'heure (pic a midi)
    if hour < 6 or hour > 19:
        irradiance = random.uniform(0, 50)
    elif 10 <= hour <= 14:
        irradiance = random.uniform(700, 1100)
    else:
        irradiance = random.uniform(200, 700)

    # Temperature ambiante (Tozeur : chaud)
    ambient_temp = 25 + (hour - 6) * 2.5 + random.uniform(-3, 3)
    if hour > 14:
        ambient_temp -= (hour - 14) * 1.5

    # Temperature panneau = ambiante + effet irradiance
    panel_temp = ambient_temp + irradiance * 0.03 + random.uniform(-2, 2)

    # Rendement : baisse avec la temperature (coeff -0.4%/degre au-dessus de 25C)
    base_efficiency = 21.5  # rendement STC
    temp_loss = max(0, (panel_temp - 25) * 0.4)
    efficiency = max(5, base_efficiency - temp_loss + random.uniform(-1, 1))

    # Puissance = irradiance * surface * rendement (simplifie)
    power = min(capacity, irradiance * (capacity / 1000) * (efficiency / 100))
    power = max(0, power + random.uniform(-10, 10))

    # Tension et courant
    voltage = 350 + random.uniform(-20, 20) + (irradiance / 1100) * 250
    current = power / voltage if voltage > 0 else 0

    # ==========================================
    # INJECTION D'ANOMALIES (15% du temps)
    # ==========================================
    anomaly = "None"
    if random.random() < 0.15:
        anomaly_type = random.choice([
            "dust_buildup",       # Poussiere sur les panneaux
            "inverter_fault",     # Panne onduleur
            "overheat",           # Surchauffe
            "partial_shading",    # Ombrage partiel
            "degradation"         # Degradation cellules
        ])
        if anomaly_type == "dust_buildup":
            power *= random.uniform(0.5, 0.75)
            efficiency *= 0.7
            anomaly = "dust_buildup"
        elif anomaly_type == "inverter_fault":
            power = 0
            voltage = 0
            current = 0
            anomaly = "inverter_fault"
        elif anomaly_type == "overheat":
            panel_temp += random.uniform(15, 30)
            power *= random.uniform(0.6, 0.8)
            anomaly = "overheat"
        elif anomaly_type == "partial_shading":
            power *= random.uniform(0.3, 0.6)
            anomaly = "partial_shading"
        elif anomaly_type == "degradation":
            efficiency *= random.uniform(0.5, 0.7)
            power *= random.uniform(0.5, 0.7)
            anomaly = "degradation"

    return {
        "InverterId": inverter_id,
        "Timestamp": datetime.now(timezone.utc).isoformat(),
        "Irradiance": round(irradiance, 2),
        "PanelTempC": round(panel_temp, 2),
        "PowerOutputKW": round(max(0, power), 2),
        "Voltage": round(max(0, voltage), 2),
        "Current": round(max(0, current), 2),
        "Efficiency": round(max(0, efficiency), 2),
        "AmbientTempC": round(ambient_temp, 2),
        "WindSpeedMs": round(random.uniform(0.5, 12.0), 2),
        "Zone": zone,
        "CapacityKW": capacity,
        "Anomaly": anomaly,
        "FarmName": FARM_NAME
    }

def main():
    producer = EventHubProducerClient.from_connection_string(
        conn_str=CONNECTION_STR,
        eventhub_name=EVENTHUB_NAME
    )
    print("Envoi d'evenements solaires vers Fabric Eventstream...")

    try:
        while True:
            batch = producer.create_batch()
            for inv_id in INVERTERS:
                event = generate_solar_event(inv_id)
                batch.add(EventData(json.dumps(event)))
                status = f" *** {event['Anomaly'].upper()} ***" if event['Anomaly'] != "None" else ""
                print(f"  [{event['Timestamp'][:19]}] {inv_id} | "
                      f"Irr: {event['Irradiance']}W/m2 | "
                      f"Puiss: {event['PowerOutputKW']}kW | "
                      f"Temp: {event['PanelTempC']}C | "
                      f"Eff: {event['Efficiency']}%{status}")
            producer.send_batch(batch)
            print(f"  -> Batch de {len(INVERTERS)} evenements envoye\n")
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
5. Dans le terminal :

```bash
cd D:\msfabric
py solar_farm_simulator.py
```

**Output attendu :**

```
Envoi d'evenements solaires vers Fabric Eventstream...
  [2026-02-11T09:15:03] INV-001 | Irr: 856.3W/m2 | Puiss: 412.5kW | Temp: 48.2C | Eff: 18.7%
  [2026-02-11T09:15:03] INV-002 | Irr: 923.1W/m2 | Puiss: 0kW | Temp: 51.3C | Eff: 17.2% *** INVERTER_FAULT ***
  [2026-02-11T09:15:03] INV-003 | Irr: 780.4W/m2 | Puiss: 389.2kW | Temp: 45.6C | Eff: 19.1%
  -> Batch de 8 evenements envoye
```

> 💡 **Astuce** : Laissez le script tourner **au moins 5 minutes** avant de commencer les requêtes pour avoir suffisamment de données. Utilisez **Ctrl+C** pour l'arrêter à la fin.

---

## Partie 4 — Vérifier l'ingestion des données

1. Retourner sur **app.fabric.microsoft.com** → votre **workspace**
2. Cliquer sur **SolarFarmEventhouse**
3. Dans le panneau gauche → **KQL databases** → **SolarFarmEventhouse**
4. Sous **Tables** → vérifier que **SolarEvents** apparaît
5. Cliquer sur **SolarEvents** → onglet **Data preview**

**Résultat attendu :** un tableau avec les colonnes InverterId, Timestamp, Irradiance, PanelTempC, PowerOutputKW, Voltage, Current, Efficiency, AmbientTempC, WindSpeedMs, Zone, CapacityKW, Anomaly, FarmName.

> ⚠️ **Piège** : Si le nom de la table a un espace à la fin (bug Fabric connu), utilisez **`['SolarEvents ']`** dans toutes vos requêtes. Testez avec `SolarEvents` d'abord — si ça échoue, ajoutez les crochets.

---

## Partie 5 — 20 requêtes KQL progressives

Aller dans **SolarFarmEventhouse_queryset** (panneau gauche).

> 💡 **Astuce** : Sélectionnez uniquement la requête à exécuter avant de cliquer **Run** (▶️), sinon toutes les requêtes s'exécutent.

> ⚠️ **Convention** : Dans toutes les requêtes ci-dessous, on utilise `SolarEvents`. Si vous avez le bug de l'espace, remplacez par `['SolarEvents ']`.

---

### 🔹 NIVEAU DÉBUTANT — Opérateurs fondamentaux

---

### Requête 1 — `take` : Premier contact avec les données

**Problème terrain** : L'ingénieur vient d'installer le système de monitoring. Il veut vérifier que les capteurs remontent bien les données.

**Question métier** : Est-ce que je reçois des données ? À quoi ressemblent-elles ?

```kql
SolarEvents
| take 10
```

**Équivalent SQL** :

```sql
SELECT TOP 10 * FROM SolarEvents
```

**Interprétation** : Vous voyez 10 lignes brutes avec toutes les colonnes. C'est le premier réflexe à avoir : vérifier la structure, les types de données et la fraîcheur des données (regardez la colonne Timestamp). Si les timestamps sont anciens, le pipeline a un problème.

---

### Requête 2 — `count` : Volume de données ingérées

**Problème terrain** : Le responsable IT veut s'assurer que le pipeline n'a pas de pertes de données. Avec 8 onduleurs envoyant 1 événement toutes les 5 secondes, on attend ~96 événements/minute.

**Question métier** : Combien d'événements ai-je reçus dans les 10 dernières minutes ?

```kql
SolarEvents
| where Timestamp > ago(10m)
| count
```

**Équivalent SQL** :

```sql
SELECT COUNT(*) FROM SolarEvents WHERE Timestamp > DATEADD(MINUTE, -10, GETUTCDATE())
```

**Interprétation** : Si le compte est nettement inférieur à ~960 (96/min × 10 min), il y a des pertes dans le pipeline. Si c'est supérieur, le simulateur a peut-être des doublons. Ce chiffre est votre indicateur de santé du pipeline lui-même.

---

### Requête 3 — `where` : Filtrer les anomalies

**Problème terrain** : L'opérateur reçoit un appel du gestionnaire du réseau électrique : "Votre production a chuté à 14h, que s'est-il passé ?" Il doit identifier rapidement les événements anormaux.

**Question métier** : Quels sont les événements d'anomalie détectés dans la dernière heure ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Anomaly != "None"
```

**Équivalent SQL** :

```sql
SELECT * FROM SolarEvents WHERE Timestamp > DATEADD(HOUR, -1, GETUTCDATE()) AND Anomaly <> 'None'
```

**Interprétation** : Chaque ligne est un incident. Les types d'anomalies (dust_buildup, inverter_fault, overheat...) orientent immédiatement l'équipe de maintenance vers l'action correcte : nettoyage, remplacement, ou arrêt préventif.

---

### Requête 4 — `project` : Sélectionner les colonnes pertinentes

**Problème terrain** : Le tableau précédent contient 14 colonnes. Le technicien sur le terrain n'a besoin que de savoir quel onduleur a un problème, quand, et quel type d'anomalie.

**Question métier** : Donnez-moi uniquement l'essentiel : onduleur, heure, type d'anomalie et puissance.

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Anomaly != "None"
| project Timestamp, InverterId, Anomaly, PowerOutputKW, PanelTempC
```

**Équivalent SQL** :

```sql
SELECT Timestamp, InverterId, Anomaly, PowerOutputKW, PanelTempC
FROM SolarEvents
WHERE Timestamp > DATEADD(HOUR, -1, GETUTCDATE()) AND Anomaly <> 'None'
```

**Interprétation** : Un tableau épuré, lisible sur un écran de contrôle ou un téléphone. Le technicien voit en un coup d'œil : "INV-003, surchauffe à 14h12, puissance tombée à 180 kW". Il sait exactement où aller et quoi vérifier.

---

### Requête 5 — `extend` : Créer une colonne calculée

**Problème terrain** : Le rendement brut (Efficiency) ne dit pas tout. Ce qui intéresse le gestionnaire, c'est l'écart entre la production réelle et ce que l'onduleur devrait produire compte tenu de l'irradiance reçue.

**Question métier** : Quel est le ratio de performance réel vs théorique de chaque onduleur ?

```kql
SolarEvents
| where Timestamp > ago(30m)
| extend TheoreticalKW = Irradiance * (CapacityKW / 1000.0) * 0.215
| extend PerformanceRatio = iff(TheoreticalKW > 0, round(PowerOutputKW / TheoreticalKW * 100, 1), 0.0)
| project Timestamp, InverterId, PowerOutputKW, TheoreticalKW = round(TheoreticalKW, 1), PerformanceRatio, Anomaly
```

**Équivalent SQL** :

```sql
SELECT Timestamp, InverterId, PowerOutputKW,
       ROUND(Irradiance * (CapacityKW / 1000.0) * 0.215, 1) AS TheoreticalKW,
       CASE WHEN Irradiance * (CapacityKW / 1000.0) * 0.215 > 0
            THEN ROUND(PowerOutputKW / (Irradiance * (CapacityKW / 1000.0) * 0.215) * 100, 1)
            ELSE 0 END AS PerformanceRatio
FROM SolarEvents WHERE Timestamp > DATEADD(MINUTE, -30, GETUTCDATE())
```

**Interprétation** : Un PerformanceRatio de 100% = l'onduleur produit exactement ce qu'il devrait. En dessous de 75% = problème. En dessous de 50% = alerte critique. Ce ratio est l'indicateur n°1 utilisé par les exploitants solaires dans le monde réel (norme IEC 61724).

---

### Requête 6 — `summarize` + `count` : Compter les anomalies par type

**Problème terrain** : Le directeur technique prépare son rapport mensuel de maintenance. Il veut savoir quelle catégorie de problème est la plus fréquente pour ajuster le budget maintenance.

**Question métier** : Quelle est la répartition des anomalies par type ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Anomaly != "None"
| summarize NombreIncidents = count() by Anomaly
| order by NombreIncidents desc
```

**Équivalent SQL** :

```sql
SELECT Anomaly, COUNT(*) AS NombreIncidents
FROM SolarEvents
WHERE Timestamp > DATEADD(HOUR, -1, GETUTCDATE()) AND Anomaly <> 'None'
GROUP BY Anomaly
ORDER BY NombreIncidents DESC
```

**Interprétation** : Si "dust_buildup" domine → investir dans un système de nettoyage automatique. Si "inverter_fault" domine → revoir le contrat de maintenance des onduleurs. Si "overheat" domine → installer des systèmes de ventilation ou changer l'angle d'inclinaison. Le budget suit les données.

---

### Requête 7 — `summarize` + `avg`, `min`, `max` : Statistiques par onduleur

**Problème terrain** : L'exploitant soupçonne que certains onduleurs sous-performent systématiquement par rapport aux autres, mais il n'a que des impressions, pas de chiffres.

**Question métier** : Quelle est la performance moyenne, min et max de chaque onduleur ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| summarize
    AvgPower = round(avg(PowerOutputKW), 1),
    MinPower = round(min(PowerOutputKW), 1),
    MaxPower = round(max(PowerOutputKW), 1),
    AvgEfficiency = round(avg(Efficiency), 1),
    AvgPanelTemp = round(avg(PanelTempC), 1),
    Events = count()
  by InverterId
| order by AvgPower desc
```

**Interprétation** : Si INV-007 produit en moyenne 280 kW alors que INV-003 produit 410 kW avec la même irradiance, c'est un signal fort. L'exploitant peut maintenant comparer objectivement ses 8 onduleurs et prioriser les interventions sur ceux qui tirent la production vers le bas.

---

### Requête 8 — `top` : Les pires moments de production

**Problème terrain** : Le gestionnaire du réseau électrique demande à l'exploitant : "Vos 5 pires creux de production de l'heure passée, c'est quand ?" Il doit répondre précisément.

**Question métier** : Quels sont les 5 événements avec la production la plus basse (hors nuit) ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Irradiance > 200
| top 5 by PowerOutputKW asc
| project Timestamp, InverterId, PowerOutputKW, Irradiance, Anomaly, PanelTempC
```

**Équivalent SQL** :

```sql
SELECT TOP 5 Timestamp, InverterId, PowerOutputKW, Irradiance, Anomaly, PanelTempC
FROM SolarEvents
WHERE Timestamp > DATEADD(HOUR, -1, GETUTCDATE()) AND Irradiance > 200
ORDER BY PowerOutputKW ASC
```

**Interprétation** : On filtre `Irradiance > 200` pour exclure les moments de faible ensoleillement (matin tôt, soir). Les 5 pires moments sont donc des baisses anormales. La colonne Anomaly donne directement la cause. C'est la réponse factuelle que l'exploitant transmet au gestionnaire réseau.

---

### Requête 9 — `bin()` + `ago()` : Fenêtres temporelles

**Problème terrain** : L'exploitant veut voir l'évolution de la production toutes les 5 minutes pour détecter les tendances et les chutes brutales.

**Question métier** : Quelle est la production totale de la ferme par tranche de 5 minutes ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| summarize
    TotalPowerKW = round(sum(PowerOutputKW), 1),
    AvgIrradiance = round(avg(Irradiance), 1),
    NbAnomalies = countif(Anomaly != "None")
  by bin(Timestamp, 5m)
| order by Timestamp asc
```

**Équivalent SQL** :

```sql
SELECT DATEADD(MINUTE, DATEDIFF(MINUTE, 0, Timestamp) / 5 * 5, 0) AS TimeWindow,
       ROUND(SUM(PowerOutputKW), 1) AS TotalPowerKW,
       ROUND(AVG(Irradiance), 1) AS AvgIrradiance,
       SUM(CASE WHEN Anomaly <> 'None' THEN 1 ELSE 0 END) AS NbAnomalies
FROM SolarEvents WHERE Timestamp > DATEADD(HOUR, -1, GETUTCDATE())
GROUP BY DATEADD(MINUTE, DATEDIFF(MINUTE, 0, Timestamp) / 5 * 5, 0)
ORDER BY TimeWindow ASC
```

**Interprétation** : Ce tableau est la base d'une courbe de production. Une chute brutale de TotalPowerKW corrélée à un NbAnomalies élevé = incident confirmé. Une chute de TotalPowerKW avec AvgIrradiance stable = problème technique. Une chute des deux = passage nuageux normal. C'est la différence entre une fausse alerte et un vrai problème.

---

### Requête 10 — `distinct` + `dcount` : Inventaire des équipements actifs

**Problème terrain** : Après une tempête de sable, le responsable veut vérifier que tous les onduleurs ont repris la communication. Si un onduleur ne remonte plus de données, c'est peut-être une panne totale.

**Question métier** : Combien d'onduleurs distincts ont communiqué dans les 10 dernières minutes ?

```kql
SolarEvents
| where Timestamp > ago(10m)
| summarize
    OnduleursActifs = dcount(InverterId),
    ListeOnduleurs = make_set(InverterId)
```

**Équivalent SQL** :

```sql
SELECT COUNT(DISTINCT InverterId) AS OnduleursActifs
FROM SolarEvents WHERE Timestamp > DATEADD(MINUTE, -10, GETUTCDATE())
```

**Interprétation** : On attend 8 onduleurs actifs. Si le résultat est 7, un onduleur ne communique plus → intervention immédiate. `make_set` donne la liste exacte, ce qui permet d'identifier par élimination lequel manque. En production réelle, cette requête tourne toutes les minutes en alerte automatique.

---

### 🔹 NIVEAU INTERMÉDIAIRE — Opérateurs avancés

---

### Requête 11 — `summarize` par deux dimensions : Production par zone et par tranche horaire

**Problème terrain** : La ferme est divisée en 4 zones (Nord, Centre, Sud, Est). Le chef d'exploitation veut savoir si une zone sous-performe à cause de son orientation ou d'un problème localisé.

**Question métier** : Comment se répartit la production par zone géographique ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| summarize
    AvgPower = round(avg(PowerOutputKW), 1),
    TotalPower = round(sum(PowerOutputKW), 1),
    AvgEfficiency = round(avg(Efficiency), 1),
    NbAnomalies = countif(Anomaly != "None")
  by Zone
| order by TotalPower desc
```

**Interprétation** : Si Zone_Sud produit 30% de moins que Zone_Nord avec une irradiance similaire, c'est un signal d'alerte localisé. Causes possibles : ombrage d'un bâtiment voisin, poussière accumulée sur les panneaux de cette zone, ou dégradation des cellules. L'exploitant sait exactement quelle zone inspecter en premier.

---

### Requête 12 — `percentile` : Identifier les valeurs extrêmes

**Problème terrain** : Les moyennes masquent les extrêmes. Un onduleur peut avoir une bonne moyenne mais des chutes brutales ponctuelles qui passent inaperçues.

**Question métier** : Quels sont les percentiles de production pour détecter les comportements extrêmes ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Irradiance > 200
| summarize
    P10 = round(percentile(PowerOutputKW, 10), 1),
    P50_Mediane = round(percentile(PowerOutputKW, 50), 1),
    P90 = round(percentile(PowerOutputKW, 90), 1),
    Moyenne = round(avg(PowerOutputKW), 1)
  by InverterId
| extend Ecart_P10_P90 = P90 - P10
| order by Ecart_P10_P90 desc
```

**Interprétation** : Un grand écart entre P10 et P90 signifie un onduleur instable. Si INV-005 a P10=80kW et P90=480kW alors que INV-001 a P10=350kW et P90=490kW, INV-005 est beaucoup plus erratique. C'est un signe de panne intermittente — le type le plus difficile à diagnostiquer sans données.

---

### Requête 13 — `iff` + `case` : Classification conditionnelle

**Problème terrain** : L'exploitant doit classer chaque onduleur en catégorie de risque pour prioriser les ordres de travail de la journée.

**Question métier** : Quel est le niveau de risque de chaque onduleur en ce moment ?

```kql
SolarEvents
| where Timestamp > ago(30m)
| summarize
    AvgEfficiency = avg(Efficiency),
    MaxTemp = max(PanelTempC),
    NbFaults = countif(Anomaly == "inverter_fault"),
    NbAnomalies = countif(Anomaly != "None")
  by InverterId
| extend RiskLevel = case(
    NbFaults > 0, "CRITIQUE - Panne onduleur",
    MaxTemp > 75, "ELEVE - Surchauffe",
    NbAnomalies > 3, "ELEVE - Anomalies frequentes",
    AvgEfficiency < 12, "MOYEN - Rendement faible",
    "NORMAL")
| project InverterId, RiskLevel, round(AvgEfficiency, 1), round(MaxTemp, 1), NbFaults, NbAnomalies
| order by RiskLevel asc
```

**Interprétation** : Ce tableau est l'ordre de mission du technicien. Il commence par les CRITIQUE (panne onduleur → arrêt de production = perte directe d'argent), puis ELEVE, puis MOYEN. Les NORMAL ne nécessitent pas d'intervention. C'est exactement comme un triage aux urgences : on traite les cas les plus graves en premier.

---

### Requête 14 — `make_list` + `mv-expand` : Historique des anomalies par onduleur

**Problème terrain** : Le technicien arrive devant INV-004. Avant d'ouvrir l'armoire, il veut connaître l'historique récent des anomalies de cet onduleur spécifique.

**Question métier** : Quelles anomalies a subi INV-004 dans la dernière heure, dans l'ordre chronologique ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where InverterId == "INV-004"
| where Anomaly != "None"
| project Timestamp, Anomaly, PowerOutputKW, PanelTempC
| order by Timestamp asc
```

**Interprétation** : Le technicien lit l'historique comme un journal de bord : "13h05 surchauffe (67°C), 13h22 poussière, 13h40 dégradation..." Si les anomalies s'enchaînent et se diversifient, c'est un signe de défaillance multiple → remplacement complet plutôt que réparation ponctuelle.

---

### Requête 15 — `join` : Croiser avec les données de référence

**Problème terrain** : L'exploitant veut comparer la production réelle de chaque onduleur avec sa capacité nominale installée, pour calculer le taux d'utilisation réel de son parc.

**Question métier** : Quel est le taux d'utilisation (capacity factor) de chaque onduleur ?

```kql
let InverterRef = datatable(InverterId: string, CapacityKW: int, InstallDate: string) [
    "INV-001", 500, "2022-03-15",
    "INV-002", 500, "2022-03-15",
    "INV-003", 600, "2022-06-20",
    "INV-004", 600, "2022-06-20",
    "INV-005", 550, "2023-01-10",
    "INV-006", 550, "2023-01-10",
    "INV-007", 480, "2023-09-01",
    "INV-008", 480, "2023-09-01"
];
SolarEvents
| where Timestamp > ago(1h)
| summarize AvgPower = avg(PowerOutputKW) by InverterId
| join kind=inner InverterRef on InverterId
| extend CapacityFactor = round(AvgPower / CapacityKW * 100, 1)
| project InverterId, round(AvgPower, 1), CapacityKW, CapacityFactor, InstallDate
| order by CapacityFactor desc
```

**Équivalent SQL** :

```sql
SELECT s.InverterId, ROUND(AVG(s.PowerOutputKW), 1) AS AvgPower,
       r.CapacityKW, ROUND(AVG(s.PowerOutputKW) / r.CapacityKW * 100, 1) AS CapacityFactor
FROM SolarEvents s INNER JOIN InverterRef r ON s.InverterId = r.InverterId
WHERE s.Timestamp > DATEADD(HOUR, -1, GETUTCDATE())
GROUP BY s.InverterId, r.CapacityKW
```

**Interprétation** : Le capacity factor est l'indicateur clé des investisseurs. Un onduleur à 35% de taux d'utilisation quand les autres sont à 55% représente un manque à gagner direct. Le croisement avec InstallDate peut révéler que les onduleurs les plus anciens sous-performent → argument pour le renouvellement.

---

### Requête 16 — `union` : Combiner plusieurs sources

**Problème terrain** : L'exploitant gère deux tables — les événements courants et une table d'alertes historiques. Il veut une vue unifiée.

**Question métier** : Peut-on fusionner les anomalies récentes avec un historique connu ?

```kql
let AlertesHistoriques = datatable(InverterId: string, AlertDate: datetime, AlertType: string, Resolution: string) [
    "INV-003", datetime(2026-02-01), "overheat", "Ventilateur remplace",
    "INV-007", datetime(2026-01-15), "inverter_fault", "Carte mere remplacee",
    "INV-005", datetime(2026-02-05), "dust_buildup", "Nettoyage effectue"
];
let AnomaliesRecentes = SolarEvents
    | where Timestamp > ago(1h)
    | where Anomaly != "None"
    | summarize DerniereAnomalie = max(Timestamp), NbOccurrences = count() by InverterId, Anomaly
    | project InverterId, AlertDate = DerniereAnomalie, AlertType = Anomaly, Resolution = "En attente";
AlertesHistoriques
| union AnomaliesRecentes
| order by AlertDate desc
```

**Interprétation** : Cette vue consolidée permet de voir si un problème est récurrent. Si INV-003 a eu une surchauffe résolue le 1er février et qu'il a de nouveau des surchauffes aujourd'hui, la réparation précédente n'a pas suffi. L'exploitant évite de refaire la même intervention inutile et escalade vers une solution plus radicale.

---

### Requête 17 — `render` : Préparer une visualisation

**Problème terrain** : Le directeur de la ferme a une réunion avec les investisseurs dans 1 heure. Il veut un graphique montrant l'évolution de la production sur la dernière heure.

**Question métier** : Montrez-moi la courbe de production totale par tranche de 2 minutes.

```kql
SolarEvents
| where Timestamp > ago(1h)
| summarize TotalPowerKW = sum(PowerOutputKW) by bin(Timestamp, 2m)
| order by Timestamp asc
| render timechart with (title="Production totale - Ferme Solaire Tozeur")
```

**Interprétation** : Le `render timechart` génère directement un graphique dans le queryset. Les investisseurs voient la courbe de production avec ses pics et ses creux. Chaque creux est explicable (passage nuageux, anomalie). Ce graphique peut être directement exporté ou intégré dans un dashboard.

---

### Requête 18 — `prev()` + `next()` : Détecter les chutes brutales

**Problème terrain** : Les chutes progressives de rendement passent inaperçues. L'exploitant veut être alerté quand un onduleur perd plus de 30% de sa puissance en un seul intervalle de mesure.

**Question métier** : Y a-t-il eu des chutes brutales de production (> 30% d'un point à l'autre) ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Irradiance > 200
| order by InverterId, Timestamp asc
| extend PrevPower = prev(PowerOutputKW, 1)
| extend PrevInverter = prev(InverterId, 1)
| where InverterId == PrevInverter
| where PrevPower > 0
| extend DropPercent = round((PrevPower - PowerOutputKW) / PrevPower * 100, 1)
| where DropPercent > 30
| project Timestamp, InverterId, PrevPower, PowerOutputKW, DropPercent, Anomaly
| order by DropPercent desc
```

**Interprétation** : Une chute de 30%+ en 5 secondes n'est jamais normale quand l'irradiance est stable. C'est soit une panne onduleur (chute à 0), soit un ombrage soudain (nuage, oiseau, débris), soit un court-circuit. Cette requête est la base des alertes de type "événement soudain" qui déclenchent une inspection immédiate.

---

### Requête 19 — `arg_max` + `arg_min` : Trouver les records

**Problème terrain** : Pour le rapport mensuel, l'exploitant doit documenter les pics de production et les pires moments, avec le contexte complet (heure, irradiance, température).

**Question métier** : Quel est le meilleur et le pire moment de production par onduleur ?

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Irradiance > 200
| summarize
    arg_max(PowerOutputKW, Timestamp, Irradiance, PanelTempC, Efficiency) by InverterId
| project InverterId,
    MeilleurMoment = Timestamp,
    MaxPower = round(PowerOutputKW, 1),
    Irradiance_au_pic = round(Irradiance, 1),
    Temp_au_pic = round(PanelTempC, 1),
    Efficiency_au_pic = round(Efficiency, 1)
| order by MaxPower desc
```

**Interprétation** : `arg_max` retourne non seulement la valeur maximale, mais aussi toutes les colonnes de cette ligne. L'exploitant voit que le pic de INV-003 était à 13h20, avec 1050 W/m² d'irradiance et 42°C de température panneau. Ça lui dit que les conditions optimales sont : forte irradiance + température modérée. Il peut optimiser l'angle des panneaux et le système de refroidissement en conséquence.

---

### Requête 20 — Requête avancée complète : Tableau de bord opérationnel

**Problème terrain** : Le directeur d'exploitation veut un seul tableau qui résume tout : état de chaque onduleur, production, rendement, anomalies, risque. Un tableau qui remplace 10 minutes de briefing matinal.

**Question métier** : Donnez-moi LE tableau de synthèse opérationnel de la ferme en ce moment.

```kql
SolarEvents
| where Timestamp > ago(30m)
| summarize
    AvgPower = avg(PowerOutputKW),
    MaxPower = max(PowerOutputKW),
    AvgEfficiency = avg(Efficiency),
    AvgPanelTemp = avg(PanelTempC),
    MaxPanelTemp = max(PanelTempC),
    AvgIrradiance = avg(Irradiance),
    TotalAnomalies = countif(Anomaly != "None"),
    NbFaults = countif(Anomaly == "inverter_fault"),
    NbOverheat = countif(Anomaly == "overheat"),
    NbDust = countif(Anomaly == "dust_buildup"),
    Events = count()
  by InverterId, Zone, CapacityKW
| extend CapacityFactor = round(AvgPower / CapacityKW * 100, 1)
| extend HealthScore = case(
    NbFaults > 0, 0,
    NbOverheat > 2, 25,
    TotalAnomalies > 5, 50,
    AvgEfficiency < 12, 60,
    CapacityFactor < 30, 70,
    CapacityFactor < 50, 85,
    100)
| extend Status = case(
    HealthScore == 0, "PANNE",
    HealthScore <= 25, "CRITIQUE",
    HealthScore <= 50, "DEGRADE",
    HealthScore <= 70, "ATTENTION",
    HealthScore <= 85, "SURVEILLER",
    "OPERATIONNEL")
| project
    InverterId, Zone, Status, HealthScore,
    AvgPower = round(AvgPower, 1),
    CapacityFactor,
    AvgEfficiency = round(AvgEfficiency, 1),
    MaxPanelTemp = round(MaxPanelTemp, 1),
    TotalAnomalies, NbFaults, NbOverheat, NbDust
| order by HealthScore asc
```

**Interprétation** : Ce tableau est le **cockpit** du directeur d'exploitation. En un regard :

- Les onduleurs en PANNE (HealthScore = 0) nécessitent une intervention immédiate — chaque minute perdue = perte de revenus
- Les CRITIQUE et DÉGRADÉ sont les prochains dans la file d'attente
- Le CapacityFactor révèle combien d'argent chaque onduleur laisse sur la table
- La corrélation Zone + anomalies révèle si le problème est localisé (une zone entière) ou isolé (un seul onduleur)
- Ce tableau remplace le tour de terrain matinal de 45 minutes par un écran consultable en 30 secondes depuis n'importe où

---

## Partie 6 — Real-Time Dashboard

### 6.1 — Tuile tableau de synthèse

1. Dans le **queryset**, sélectionner la **requête 20**
2. Cliquer **Save to Dashboard**
3. Sélectionner **Create new dashboard**
4. Nom : **`SolarFarm-LiveMonitoring`**
5. Nom de la tuile : **`Synthese operationnelle`**
6. Cliquer **Create** → **Open dashboard**

### 6.2 — Tuile courbe de production

1. Cliquer **Manage** → **+ Add tile**
2. Coller la **requête 17** (render timechart)
3. Le type **Line chart** est appliqué automatiquement grâce au `render`
4. Cliquer **Apply changes**

### 6.3 — Tuile répartition des anomalies

1. Cliquer **+ Add tile**
2. Coller :

```kql
SolarEvents
| where Timestamp > ago(1h)
| where Anomaly != "None"
| summarize Count = count() by Anomaly
| render piechart with (title="Repartition des anomalies")
```

3. Le type **Pie chart** est appliqué automatiquement
4. Cliquer **Apply changes**

> 💡 **Astuce** : **Manage** → icône ⚙️ → **Auto refresh** → **30 secondes** pour un rafraîchissement automatique.

---

## Partie 7 — Alertes Activator

1. Dans le dashboard, cliquer sur la tuile **courbe de production** (6.2)
2. Cliquer **Set alert** (barre du haut)
3. Configurer :

| Champ         | Valeur                 |
| ------------- | ---------------------- |
| **Measure**   | `TotalPowerKW`         |
| **Condition** | Is less than           |
| **Value**     | `1000`                 |
| **Action**    | Email ou Teams message |

4. Cliquer **Create**

> ⚠️ **Piège** : **Set alert** ne fonctionne que sur les tuiles de type **graphique** (Line chart, Bar chart, Pie chart). Pas sur les tuiles de type **Table**.

---

## Nettoyage (optionnel)

1. Arrêter le script Python : **Ctrl+C** dans le terminal
2. Dans votre workspace Fabric, supprimer :
   - Le dashboard **SolarFarm-LiveMonitoring**
   - L'eventstream **SolarInverterStream**
   - L'eventhouse **SolarFarmEventhouse**
