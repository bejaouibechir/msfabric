# Atelier : Supervision d'une centrale Biogaz avec Azure Event Hub & Microsoft Fabric

Vous allez construire deux pipelines d'ingestion temps réel pour superviser une centrale de méthanisation (biogaz), en utilisant **Azure Event Hub** comme point d'entrée central. Vous comparerez les deux approches d'ingestion dans Fabric, puis exploiterez les données avec des requêtes KQL progressives.

Résultat attendu : deux tables alimentées par le même Event Hub via deux chemins différents, une maîtrise des deux architectures, un Real-Time Dashboard et des alertes Activator.

---

## Contexte métier : la centrale de méthanisation de Jendouba

La **centrale biogaz de Jendouba** (nord-ouest tunisien) valorise les déchets agricoles (résidus d'oliviers, fumier, déchets de céréales) pour produire du biogaz converti en électricité. L'installation comprend :

- **2 digesteurs** (cuves de fermentation anaérobie)
- **4 capteurs par digesteur** remontant des données toutes les 5 secondes
- **1 moteur de cogénération** qui convertit le biogaz en électricité et chaleur

| Capteur            | Signification                         | Unité | Seuil critique                   |
| ------------------ | ------------------------------------- | ----- | -------------------------------- |
| **DigesteurTempC** | Température du digesteur              | °C    | < 35 ou > 42 (zone mésophile)    |
| **pH**             | Acidité du substrat                   | -     | < 6.5 ou > 7.8                   |
| **BiogasFlowM3h**  | Débit de biogaz produit               | m³/h  | < 50 (sous-production)           |
| **MethanePct**     | Pourcentage de méthane dans le biogaz | %     | < 50 (biogaz inutilisable)       |
| **CO2Pct**         | Pourcentage de CO2                    | %     | > 45 (fermentation perturbée)    |
| **H2SPpm**         | Hydrogène sulfuré (gaz toxique)       | ppm   | > 500 (danger santé + corrosion) |
| **PowerOutputKW**  | Puissance électrique produite         | kW    | -                                |
| **SubstrateLevel** | Niveau de substrat dans le digesteur  | %     | < 20 (alimentation insuffisante) |

**Problèmes réels rencontrés par les exploitants biogaz :**

- Acidification du digesteur (chute de pH) → arrêt de la production de méthane pendant des jours
- Pic de H2S qui corrode les équipements et met en danger le personnel
- Température instable qui ralentit la méthanogénèse sans que personne ne s'en aperçoive
- Moteur de cogénération alimenté avec du biogaz pauvre en méthane (< 50%) → panne moteur
- Pas de visibilité centralisée : l'opérateur fait des rondes physiques toutes les 4 heures

---

## Les deux approches d'ingestion : pourquoi les comparer ?

|                      | Approche A                                 | Approche B                                   |
| -------------------- | ------------------------------------------ | -------------------------------------------- |
| **Chemin**           | Event Hub → **Eventstream** → KQL Database | Event Hub → **KQL Database** (direct)        |
| **Transformations**  | Oui (no-code dans Eventstream)             | Non (transformation en KQL après ingestion)  |
| **Quand l'utiliser** | Données à nettoyer/enrichir avant stockage | Données déjà propres, ingestion brute rapide |
| **Latence**          | Quelques secondes de plus                  | Minimale                                     |
| **Complexité**       | Plus de composants à gérer                 | Plus simple, moins de composants             |
| **Table cible**      | `BiogasEventsStream`                       | `BiogasEventsDirect`                         |

Dans cet atelier, le **même simulateur Python** envoie au **même Event Hub Azure**, et les données arrivent dans **deux tables différentes** via les deux chemins.

---

## Prérequis

- **Abonnement Azure** (gratuit suffit) pour créer un Event Hub
- Tenant **Microsoft Fabric** (licence Trial ou Capacity, minimum F4)
- **Python 3.9+** installé
- Package Python : `azure-eventhub`

---

## Partie 1 — Créer l'Event Hub dans Azure

### 1.1 — Créer le namespace Event Hub

1. Aller sur **portal.azure.com**
2. Cliquer **+ Create a resource**
3. Chercher **Event Hubs** → cliquer **Create**
4. Remplir :

| Champ              | Valeur                                            |
| ------------------ | ------------------------------------------------- |
| **Subscription**   | Votre abonnement                                  |
| **Resource group** | Créer nouveau : `rg-biogaz`                       |
| **Namespace name** | `eh-biogaz-jendouba` (doit être unique)           |
| **Location**       | La plus proche (ex: France Central, North Europe) |
| **Pricing tier**   | `Basic` (suffisant pour l'atelier)                |

5. Cliquer **Review + create** → **Create**
6. Attendre le déploiement → cliquer **Go to resource**

### 1.2 — Créer l'Event Hub instance

1. Dans le namespace, cliquer **+ Event Hub** (barre du haut)
2. Nom : **`biogaz-telemetry`**
3. **Partition count** : `2` (suffisant)
4. Cliquer **Create**

### 1.3 — Créer la SAS Policy et récupérer les clés

1. Cliquer sur l'Event Hub **biogaz-telemetry** (dans la liste)
2. Dans le menu gauche → **Shared access policies**
3. Cliquer **+ Add**
4. Nom : **`fabricpolicy`**
5. Cocher ✅ **Manage** (inclut Send et Listen)
6. Cliquer **Create**
7. Cliquer sur **fabricpolicy** dans la liste
8. Copier dans un **bloc-notes** :

| Valeur                            | Usage                                  |
| --------------------------------- | -------------------------------------- |
| **Primary key**                   | Pour la connexion directe KQL Database |
| **Connection string–primary key** | Pour le script Python ET Eventstream   |

> ⚠️ **Piège** : Copiez la **Connection string** de la policy **fabricpolicy** sur l'Event Hub instance, pas celle du namespace. Les deux existent mais n'ont pas les mêmes droits.

> 💡 **Astuce** : Notez aussi le **nom du namespace** (`eh-biogaz-jendouba`) et le **nom de l'Event Hub** (`biogaz-telemetry`). Vous en aurez besoin à plusieurs reprises.

---

## Partie 2 — Créer l'Eventhouse dans Fabric

1. Aller sur **app.fabric.microsoft.com** → votre **workspace**
2. Cliquer **+ New item** → **Eventhouse**
3. Nom : **`BiogasEventhouse`**
4. Cliquer **Create**

> Un KQL Database `BiogasEventhouse` est automatiquement créé.

---

## Partie 3 — Approche A : Event Hub → Eventstream → KQL Database

### 3.1 — Créer l'Eventstream

1. Dans votre workspace → **+ New item** → **Eventstream**
2. Nom : **`BiogasEventstream`**
3. Cliquer **Create**

### 3.2 — Connecter l'Event Hub comme source

1. Cliquer **Use external source** (ou **Add source** → **External sources**)
2. Chercher **Azure Event Hubs** → cliquer **Connect**
3. Sélectionner **New connection**
4. Remplir :

| Champ                      | Valeur                                                         |
| -------------------------- | -------------------------------------------------------------- |
| **Event Hub namespace**    | `eh-biogaz-jendouba` (le nom du namespace, PAS l'URL complète) |
| **Event Hub**              | `biogaz-telemetry`                                             |
| **Shared Access Key Name** | `fabricpolicy`                                                 |
| **Shared Access Key**      | Coller la **Primary key** copiée en 1.3                        |

5. Cliquer **Connect**
6. **Consumer group** : laisser `$Default`
7. Cliquer **Next**
8. **Schema handling** : sélectionner **Fixed schema**
9. Cliquer **Connect**

### 3.3 — Ajouter la destination Eventhouse

1. Cliquer **Edit** (si pas déjà en mode édition)
2. Cliquer le bloc **"Transform events or add destination"**
3. Sélectionner **Eventhouse**
4. Remplir :

| Champ                     | Valeur                                      |
| ------------------------- | ------------------------------------------- |
| **Data ingestion mode**   | `Event processing before ingestion`         |
| **Destination name**      | `BiogasStreamDest`                          |
| **Workspace**             | Votre workspace                             |
| **Eventhouse**            | `BiogasEventhouse`                          |
| **KQL Database**          | `BiogasEventhouse`                          |
| **KQL Destination table** | Taper `BiogasEventsStream` → **Create new** |
| **Input data format**     | `Json`                                      |

5. Cocher ✅ **Activate ingestion after adding the data source**
6. Cliquer **Save** → **Publish**

---

## Partie 4 — Approche B : Event Hub → KQL Database (ingestion directe)

### 4.1 — Configurer la connexion directe

1. Aller dans votre **workspace** → cliquer sur **BiogasEventhouse**
2. Dans le panneau gauche → cliquer sur la KQL Database **BiogasEventhouse**
3. Cliquer **Get data** (barre du haut)
4. Sélectionner **Event Hubs**
5. **Table** : cliquer **+ New table** → nom : **`BiogasEventsDirect`**
6. Cliquer **Next**

### 4.2 — Configurer la connexion

1. Sélectionner **Create new connection**
2. Remplir :

| Champ                      | Valeur                                      |
| -------------------------- | ------------------------------------------- |
| **Event Hub namespace**    | `eh-biogaz-jendouba.servicebus.windows.net` |
| **Event Hub**              | `biogaz-telemetry`                          |
| **Connection name**        | `biogaz-direct-connection`                  |
| **Authentication kind**    | `Shared Access Key`                         |
| **Shared Access Key Name** | `fabricpolicy`                              |
| **Shared Access Key**      | Coller la **Primary key**                   |

3. Cliquer **Save**
4. **Consumer group** : sélectionner `$Default`
5. Cliquer **Next**
6. Fabric affiche un aperçu des données (si le simulateur tourne déjà) → vérifier le mapping des colonnes
7. Cliquer **Finish**

> 💡 **Astuce** : Pour l'approche B, Fabric crée une **data connection** permanente. Tant que l'Event Hub reçoit des données, la table `BiogasEventsDirect` est alimentée automatiquement, sans Eventstream intermédiaire.

> ⚠️ **Piège** : Pour le namespace dans l'approche B, il faut ajouter `.servicebus.windows.net` à la fin. Dans l'approche A (Eventstream), le nom seul suffit.

---

## Partie 5 — Le simulateur Python

### 5.1 — Installer le package

```bash
pip install azure-eventhub
```

### 5.2 — Créer le script

Créer un fichier **`biogas_simulator.py`** :

```python
import json
import time
import random
from datetime import datetime, timezone
from azure.eventhub import EventHubProducerClient, EventData

# ============================================================
# CONFIGURATION — Connection string de l'Event Hub Azure
# (PAS celle de l'Eventstream Fabric, celle du portail Azure)
# ============================================================
CONNECTION_STR = "<connection_string_primary_key_de_fabricpolicy>"
EVENTHUB_NAME = "biogaz-telemetry"
# ============================================================

DIGESTERS = ["DIG-001", "DIG-002"]
PLANT_NAME = "Centrale Biogaz Jendouba"

def generate_biogas_event(digester_id):
    # Temperature digesteur (zone mesophile optimale : 37-40°C)
    base_temp = 38.5
    temp = base_temp + random.uniform(-2.5, 2.5)

    # pH (optimal : 6.8 - 7.4)
    ph = 7.1 + random.uniform(-0.4, 0.4)

    # Debit biogaz (m3/h)
    biogas_flow = random.uniform(80, 200)

    # Composition du biogaz
    methane_pct = random.uniform(55, 68)
    co2_pct = random.uniform(28, 40)
    h2s_ppm = random.uniform(50, 300)

    # Puissance electrique (proportionnelle au debit * methane)
    power = biogas_flow * (methane_pct / 100) * 2.5 + random.uniform(-20, 20)

    # Niveau substrat
    substrate_level = random.uniform(30, 85)

    # ==========================================
    # INJECTION D'ANOMALIES (12% du temps)
    # ==========================================
    anomaly = "None"
    if random.random() < 0.12:
        anomaly_type = random.choice([
            "acidification",     # Chute de pH
            "temperature_drop",  # Chute de temperature
            "h2s_spike",         # Pic H2S dangereux
            "low_methane",       # Biogaz pauvre
            "substrate_low",     # Manque de substrat
            "overload"           # Surcharge organique
        ])
        if anomaly_type == "acidification":
            ph -= random.uniform(0.8, 1.5)
            methane_pct *= 0.6
            biogas_flow *= 0.5
            anomaly = "acidification"
        elif anomaly_type == "temperature_drop":
            temp -= random.uniform(5, 10)
            biogas_flow *= 0.7
            anomaly = "temperature_drop"
        elif anomaly_type == "h2s_spike":
            h2s_ppm += random.uniform(300, 800)
            anomaly = "h2s_spike"
        elif anomaly_type == "low_methane":
            methane_pct = random.uniform(35, 48)
            power *= 0.4
            anomaly = "low_methane"
        elif anomaly_type == "substrate_low":
            substrate_level = random.uniform(5, 18)
            biogas_flow *= 0.6
            anomaly = "substrate_low"
        elif anomaly_type == "overload":
            ph -= random.uniform(0.5, 1.0)
            co2_pct += random.uniform(5, 15)
            h2s_ppm += random.uniform(100, 300)
            anomaly = "overload"

        # Recalcul puissance apres anomalie
        power = biogas_flow * (methane_pct / 100) * 2.5 + random.uniform(-20, 20)

    return {
        "DigesterId": digester_id,
        "Timestamp": datetime.now(timezone.utc).isoformat(),
        "DigesteurTempC": round(temp, 2),
        "pH": round(max(4.0, ph), 2),
        "BiogasFlowM3h": round(max(0, biogas_flow), 2),
        "MethanePct": round(max(0, methane_pct), 2),
        "CO2Pct": round(min(60, max(0, co2_pct)), 2),
        "H2SPpm": round(max(0, h2s_ppm), 1),
        "PowerOutputKW": round(max(0, power), 2),
        "SubstrateLevel": round(max(0, min(100, substrate_level)), 1),
        "Anomaly": anomaly,
        "PlantName": PLANT_NAME
    }

def main():
    producer = EventHubProducerClient.from_connection_string(
        conn_str=CONNECTION_STR,
        eventhub_name=EVENTHUB_NAME
    )
    print("Envoi de telemetrie biogaz vers Azure Event Hub...")
    print(f"Event Hub: {EVENTHUB_NAME}")
    print(f"Les donnees arrivent dans Fabric via 2 chemins simultanement\n")

    try:
        while True:
            batch = producer.create_batch()
            for dig_id in DIGESTERS:
                event = generate_biogas_event(dig_id)
                batch.add(EventData(json.dumps(event)))
                status = f" *** {event['Anomaly'].upper()} ***" if event['Anomaly'] != "None" else ""
                print(f"  [{event['Timestamp'][:19]}] {dig_id} | "
                      f"Temp: {event['DigesteurTempC']}C | "
                      f"pH: {event['pH']} | "
                      f"CH4: {event['MethanePct']}% | "
                      f"H2S: {event['H2SPpm']}ppm | "
                      f"Puiss: {event['PowerOutputKW']}kW{status}")
            producer.send_batch(batch)
            print(f"  -> Batch de {len(DIGESTERS)} evenements envoye\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("Arret du simulateur.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()
```

### 5.3 — Configurer et lancer

1. Remplacer `<connection_string_primary_key_de_fabricpolicy>` par la **Connection string** copiée en 1.3
2. Sauvegarder
3. Lancer :

```bash
cd D:\msfabric
py biogas_simulator.py
```

**Output attendu :**

```
Envoi de telemetrie biogaz vers Azure Event Hub...
Event Hub: biogaz-telemetry
Les donnees arrivent dans Fabric via 2 chemins simultanement

  [2026-02-11T10:22:05] DIG-001 | Temp: 38.2C | pH: 7.03 | CH4: 62.5% | H2S: 185.3ppm | Puiss: 312.4kW
  [2026-02-11T10:22:05] DIG-002 | Temp: 33.1C | pH: 6.89 | CH4: 58.1% | H2S: 142.7ppm | Puiss: 287.6kW *** TEMPERATURE_DROP ***
  -> Batch de 2 evenements envoye
```

> 💡 **Astuce** : Laissez tourner **au moins 5 minutes** avant les requêtes. Les données arrivent simultanément dans les deux tables (`BiogasEventsStream` et `BiogasEventsDirect`).

---

## Partie 6 — Vérifier les deux tables

1. Dans Fabric → **BiogasEventhouse** → KQL Database
2. Sous **Tables**, vous devez voir **deux tables** :
   - `BiogasEventsStream` (alimentée via Eventstream — Approche A)
   - `BiogasEventsDirect` (alimentée directement — Approche B)
3. Cliquer sur chacune → onglet **Data preview** → vérifier que les données arrivent

> ⚠️ **Piège espace** : Si le nom d'une table a un espace à la fin, utilisez `['BiogasEventsStream ']` dans les requêtes KQL. Testez sans crochets d'abord.

---

## Partie 7 — 15 requêtes KQL progressives

Aller dans **BiogasEventhouse_queryset**.

> **Convention** : Les requêtes utilisent `BiogasEventsStream`. Adaptez le nom si nécessaire.

---

### 🔹 NIVEAU DÉBUTANT

---

### Requête 1 — `take` : Premier contact

**Problème terrain** : Le technicien vient de brancher les capteurs. Il veut vérifier que tout remonte.

**Question métier** : Les données arrivent-elles ? À quoi ressemblent-elles ?

```kql
BiogasEventsStream
| take 10
```

**Interprétation** : 10 lignes brutes. Vérifiez que le Timestamp est récent, que DigesterId a bien deux valeurs (DIG-001, DIG-002), et que les mesures sont dans les plages attendues. Si le Timestamp est vieux de plusieurs minutes, le pipeline a un retard.

---

### Requête 2 — Comparer les deux tables : même source, deux chemins

**Problème terrain** : Le responsable IT veut vérifier que les deux pipelines fonctionnent et qu'ils reçoivent le même volume de données.

**Question métier** : Les deux approches d'ingestion sont-elles synchronisées ?

```kql
let stream_count = BiogasEventsStream | where Timestamp > ago(10m) | count | extend Source = "Approche A (Eventstream)";
let direct_count = BiogasEventsDirect | where Timestamp > ago(10m) | count | extend Source = "Approche B (Direct)";
stream_count
| union direct_count
```

**Interprétation** : Les deux comptes doivent être proches. Un écart important signifie qu'un des deux pipelines a un retard ou une perte. L'Approche B (directe) a généralement un léger avantage en latence car il n'y a pas d'Eventstream intermédiaire.

---

### Requête 3 — `where` : Filtrer les situations dangereuses (H2S)

**Problème terrain** : L'hydrogène sulfuré (H2S) au-dessus de 500 ppm est dangereux pour le personnel et corrode les équipements. Le responsable sécurité doit savoir immédiatement si ce seuil a été franchi.

**Question métier** : Y a-t-il eu des pics de H2S dangereux dans la dernière heure ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| where H2SPpm > 500
| project Timestamp, DigesterId, H2SPpm, pH, Anomaly
| order by H2SPpm desc
```

**Interprétation** : Chaque ligne est un **incident de sécurité**. Un H2S > 500 ppm → évacuation de la zone, arrêt du digesteur, ventilation forcée. Si ces pics sont corrélés à une chute de pH (colonne pH < 6.5), la cause est une acidification → il faut ajouter de la chaux pour remonter le pH avant de redémarrer.

---

### Requête 4 — `project` + `extend` : Le digesteur est-il en zone optimale ?

**Problème terrain** : Un digesteur mésophile fonctionne entre 35°C et 42°C, avec un pH entre 6.5 et 7.8. En dehors de ces plages, les bactéries ralentissent et la production chute. L'opérateur veut savoir en un coup d'œil si chaque mesure est dans la norme.

**Question métier** : Chaque paramètre est-il dans sa zone optimale ?

```kql
BiogasEventsStream
| where Timestamp > ago(10m)
| extend TempStatus = iff(DigesteurTempC between (35.0 .. 42.0), "OK", "HORS ZONE")
| extend pHStatus = iff(pH between (6.5 .. 7.8), "OK", "HORS ZONE")
| extend H2SStatus = iff(H2SPpm < 500, "OK", "DANGER")
| extend MethaneStatus = iff(MethanePct > 50, "OK", "PAUVRE")
| project Timestamp, DigesterId, DigesteurTempC, TempStatus, pH, pHStatus, H2SPpm, H2SStatus, MethanePct, MethaneStatus
| order by Timestamp desc
```

**Interprétation** : L'opérateur ne regarde que les colonnes "Status". Tout ce qui n'est pas "OK" nécessite une action. C'est le principe du management par exception : on ne traite que ce qui dévie de la norme. Ça remplace la ronde physique de 4 heures par un écran consulté en 10 secondes.

---

### Requête 5 — `summarize` + `countif` : Bilan des anomalies par digesteur

**Problème terrain** : Le directeur technique prépare le rapport hebdomadaire. Il veut savoir quel digesteur pose le plus de problèmes et quel type d'anomalie domine.

**Question métier** : Quelle est la répartition des anomalies par digesteur et par type ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| where Anomaly != "None"
| summarize
    Acidification = countif(Anomaly == "acidification"),
    TempDrop = countif(Anomaly == "temperature_drop"),
    H2SSpike = countif(Anomaly == "h2s_spike"),
    LowMethane = countif(Anomaly == "low_methane"),
    SubstrateLow = countif(Anomaly == "substrate_low"),
    Overload = countif(Anomaly == "overload"),
    Total = count()
  by DigesterId
```

**Interprétation** : Si DIG-001 a 8 acidifications et 0 pour les autres types → le problème est ciblé et la solution est claire (ajout de tampon alcalin). Si DIG-002 a des anomalies diversifiées → le problème est systémique (substrat de mauvaise qualité, équipement vieillissant). Le rapport oriente le budget : réparation ciblée vs remplacement complet.

---

### Requête 6 — `bin()` + `ago()` : Évolution de la production toutes les 5 minutes

**Problème terrain** : Le gestionnaire du réseau électrique demande un profil de production horaire pour planifier l'intégration au réseau.

**Question métier** : Comment évolue la puissance totale produite par tranche de 5 minutes ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize
    TotalPowerKW = round(sum(PowerOutputKW), 1),
    AvgMethane = round(avg(MethanePct), 1),
    AvgpH = round(avg(pH), 2),
    NbAnomalies = countif(Anomaly != "None")
  by bin(Timestamp, 5m)
| order by Timestamp asc
```

**Interprétation** : La puissance totale doit être stable pour un digesteur continu. Une chute brutale corrélée à une baisse de MethanePct = le biogaz est devenu trop pauvre pour le moteur. Une chute corrélée à une baisse de pH = acidification en cours. La corrélation entre les colonnes raconte l'histoire de l'incident.

---

### Requête 7 — `arg_max` : Trouver le pire pic de H2S avec son contexte

**Problème terrain** : Le responsable HSE (Hygiène Sécurité Environnement) doit documenter le pire incident H2S de l'heure pour le registre de sécurité.

**Question métier** : Quel a été le pic H2S le plus élevé, avec toutes les conditions à ce moment-là ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize arg_max(H2SPpm, Timestamp, DigesterId, pH, DigesteurTempC, BiogasFlowM3h, Anomaly)
```

**Interprétation** : `arg_max` retourne la ligne complète du pire moment. Le responsable HSE voit : "Pic à 847 ppm sur DIG-002 à 14h23, pH était à 5.9, anomalie = acidification". Il sait que le H2S est une conséquence de l'acidification et peut documenter la chaîne causale dans le registre de sécurité.

---

### 🔹 NIVEAU INTERMÉDIAIRE

---

### Requête 8 — `percentile` : Variabilité de la qualité du biogaz

**Problème terrain** : Le moteur de cogénération tolère un méthane entre 50% et 70%. Les moyennes masquent les creux. L'ingénieur process veut voir les percentiles pour évaluer la stabilité.

**Question métier** : Quelle est la variabilité du taux de méthane par digesteur ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize
    P5 = round(percentile(MethanePct, 5), 1),
    P25 = round(percentile(MethanePct, 25), 1),
    P50 = round(percentile(MethanePct, 50), 1),
    P75 = round(percentile(MethanePct, 75), 1),
    P95 = round(percentile(MethanePct, 95), 1),
    Moyenne = round(avg(MethanePct), 1)
  by DigesterId
| extend Stabilite = round(P95 - P5, 1)
```

**Interprétation** : Un digesteur avec P5=42% et P95=65% (stabilité=23) est erratique : il envoie régulièrement du biogaz inutilisable au moteur. Un digesteur avec P5=56% et P95=66% (stabilité=10) est fiable. L'écart P5-P95 est l'indicateur clé pour décider s'il faut investir dans un ballon tampon de stockage du biogaz pour lisser les variations.

---

### Requête 9 — `prev()` : Détecter les chutes brutales de pH

**Problème terrain** : L'acidification ne survient pas d'un coup — elle s'installe progressivement. Mais une chute de pH de plus de 0.3 en un seul intervalle est un signal d'alarme.

**Question métier** : Y a-t-il eu des chutes brutales de pH ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| order by DigesterId, Timestamp asc
| extend PrevpH = prev(pH, 1)
| extend PrevDigester = prev(DigesterId, 1)
| where DigesterId == PrevDigester
| where PrevpH > 0
| extend pHDrop = round(PrevpH - pH, 3)
| where pHDrop > 0.3
| project Timestamp, DigesterId, PrevpH, pH, pHDrop, BiogasFlowM3h, Anomaly
| order by pHDrop desc
```

**Interprétation** : Une chute de 0.3+ de pH en 5 secondes n'est pas une dérive lente — c'est un événement soudain : injection d'un substrat trop acide, ou défaillance du système de régulation. L'opérateur doit immédiatement vérifier le dernier chargement de substrat et le système de dosage de chaux.

---

### Requête 10 — `join` : Croiser avec les spécifications techniques

**Problème terrain** : Chaque digesteur a une capacité nominale différente. L'exploitant veut comparer la production réelle vs la capacité installée.

**Question métier** : Quel est le taux d'utilisation de chaque digesteur ?

```kql
let DigesterSpecs = datatable(DigesterId: string, NominalPowerKW: int, VolumeM3: int, CommissionDate: string) [
    "DIG-001", 400, 2500, "2021-06-15",
    "DIG-002", 350, 2000, "2022-09-01"
];
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize AvgPower = avg(PowerOutputKW), AvgFlow = avg(BiogasFlowM3h) by DigesterId
| join kind=inner DigesterSpecs on DigesterId
| extend UtilizationPct = round(AvgPower / NominalPowerKW * 100, 1)
| project DigesterId, round(AvgPower, 1), NominalPowerKW, UtilizationPct, round(AvgFlow, 1), VolumeM3, CommissionDate
| order by UtilizationPct desc
```

**Interprétation** : Un taux d'utilisation de 60% signifie que 40% de la capacité installée est gaspillée. Si DIG-001 (2021) est à 75% et DIG-002 (2022) est à 55%, le problème n'est pas l'âge mais probablement l'alimentation en substrat ou un déséquilibre biologique. L'exploitant sait où concentrer ses efforts d'optimisation.

---

### Requête 11 — `union` : Vue consolidée des deux tables

**Problème terrain** : Le responsable IT veut vérifier la cohérence entre les deux pipelines en comparant les données ligne par ligne.

**Question métier** : Les deux chemins d'ingestion produisent-ils des données identiques ?

```kql
let StreamData = BiogasEventsStream
    | where Timestamp > ago(5m)
    | summarize StreamCount = count(), StreamAvgPower = round(avg(PowerOutputKW), 1) by DigesterId;
let DirectData = BiogasEventsDirect
    | where Timestamp > ago(5m)
    | summarize DirectCount = count(), DirectAvgPower = round(avg(PowerOutputKW), 1) by DigesterId;
StreamData
| join kind=inner DirectData on DigesterId
| extend CountDiff = StreamCount - DirectCount
| extend PowerDiff = round(StreamAvgPower - DirectAvgPower, 2)
| project DigesterId, StreamCount, DirectCount, CountDiff, StreamAvgPower, DirectAvgPower, PowerDiff
```

**Interprétation** : Si CountDiff est proche de 0 et PowerDiff est quasi-nul, les deux pipelines sont équivalents. Si l'approche directe a systématiquement plus de lignes, l'Eventstream introduit un léger retard. Ce test valide que les deux architectures sont interchangeables pour votre cas d'usage, ce qui est crucial avant de choisir celle que vous mettez en production.

---

### Requête 12 — `make_series` + `render` : Courbe de tendance du pH

**Problème terrain** : L'ingénieur process veut voir la tendance du pH sur l'heure passée pour chaque digesteur, pas juste les valeurs ponctuelles.

**Question métier** : Le pH est-il stable, en baisse ou en hausse ?

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize AvgpH = round(avg(pH), 2) by DigesterId, bin(Timestamp, 2m)
| order by Timestamp asc
| render timechart with (title="Evolution du pH par digesteur")
```

**Interprétation** : Un pH en baisse constante, même s'il est encore dans la zone verte (> 6.5), est un signal prédictif d'acidification imminente. Attendre qu'il passe sous 6.5 pour agir, c'est trop tard — la récupération prend des jours. La tendance est plus importante que la valeur absolue.

---

### Requête 13 — `case` : Classification du risque opérationnel

**Problème terrain** : Le directeur veut un tableau simple rouge/orange/vert pour le briefing du matin.

**Question métier** : Quel est l'état de chaque digesteur en ce moment ?

```kql
BiogasEventsStream
| where Timestamp > ago(15m)
| summarize
    AvgTemp = avg(DigesteurTempC),
    MinpH = min(pH),
    AvgpH = avg(pH),
    MaxH2S = max(H2SPpm),
    AvgMethane = avg(MethanePct),
    AvgPower = avg(PowerOutputKW),
    AvgSubstrate = avg(SubstrateLevel),
    NbAnomalies = countif(Anomaly != "None"),
    Events = count()
  by DigesterId
| extend TempRisk = case(AvgTemp < 35 or AvgTemp > 42, "ROUGE", AvgTemp < 36 or AvgTemp > 41, "ORANGE", "VERT")
| extend pHRisk = case(MinpH < 6.0, "ROUGE", MinpH < 6.5, "ORANGE", "VERT")
| extend H2SRisk = case(MaxH2S > 700, "ROUGE", MaxH2S > 500, "ORANGE", "VERT")
| extend MethaneRisk = case(AvgMethane < 45, "ROUGE", AvgMethane < 50, "ORANGE", "VERT")
| extend GlobalRisk = case(
    TempRisk == "ROUGE" or pHRisk == "ROUGE" or H2SRisk == "ROUGE", "ARRET IMMEDIAT",
    TempRisk == "ORANGE" or pHRisk == "ORANGE" or H2SRisk == "ORANGE" or MethaneRisk == "ORANGE", "SURVEILLANCE RENFORCEE",
    "FONCTIONNEMENT NORMAL")
| project DigesterId, GlobalRisk, TempRisk, round(AvgTemp, 1), pHRisk, round(AvgpH, 2), H2SRisk, round(MaxH2S, 0), MethaneRisk, round(AvgMethane, 1), round(AvgPower, 1)
| order by GlobalRisk asc
```

**Interprétation** : Ce tableau est le **cockpit du matin**. "ARRET IMMEDIAT" → le directeur appelle immédiatement l'équipe technique. "SURVEILLANCE RENFORCEE" → passage en rondes toutes les heures au lieu de 4 heures. "FONCTIONNEMENT NORMAL" → on continue. 30 secondes de lecture remplacent 1 heure de tour de terrain.

---

### Requête 14 — `dcount` + `make_set` : Vérifier la complétude des données

**Problème terrain** : Après une coupure de courant, le responsable IT veut vérifier que tous les capteurs ont repris la communication.

**Question métier** : Tous les digesteurs communiquent-ils ? Quels types d'anomalies sont apparus ?

```kql
BiogasEventsStream
| where Timestamp > ago(10m)
| summarize
    DigesteursActifs = dcount(DigesterId),
    ListeDigesteurs = make_set(DigesterId),
    TypesAnomalies = make_set(Anomaly),
    DernierMessage = max(Timestamp),
    NbMessages = count()
```

**Interprétation** : On attend 2 digesteurs actifs. Si DigesteursActifs = 1, un digesteur est muet → vérification immédiate. `make_set(Anomaly)` montre la diversité des problèmes en un regard. Si la liste contient ["acidification", "h2s_spike", "overload"], la situation est multi-factorielle et nécessite une intervention coordonnée.

---

### Requête 15 — Tableau de synthèse opérationnel complet

**Problème terrain** : Le directeur d'exploitation doit envoyer un rapport en temps réel aux investisseurs et au gestionnaire du réseau.

**Question métier** : Donnez-moi LE tableau qui résume tout en une vue.

```kql
BiogasEventsStream
| where Timestamp > ago(30m)
| summarize
    AvgTemp = avg(DigesteurTempC),
    MinTemp = min(DigesteurTempC),
    MaxTemp = max(DigesteurTempC),
    AvgpH = avg(pH),
    MinpH = min(pH),
    AvgMethane = avg(MethanePct),
    MinMethane = min(MethanePct),
    AvgBiogasFlow = avg(BiogasFlowM3h),
    MaxH2S = max(H2SPpm),
    AvgPower = avg(PowerOutputKW),
    MaxPower = max(PowerOutputKW),
    AvgSubstrate = avg(SubstrateLevel),
    TotalAnomalies = countif(Anomaly != "None"),
    Acidifications = countif(Anomaly == "acidification"),
    H2SSpikes = countif(Anomaly == "h2s_spike"),
    Events = count()
  by DigesterId
| extend HealthScore = case(
    MinpH < 6.0 or MaxH2S > 700, 0,
    MinpH < 6.5 or MaxH2S > 500 or MinTemp < 33, 25,
    TotalAnomalies > 5, 50,
    AvgMethane < 50 or AvgTemp < 36, 65,
    AvgMethane < 55, 80,
    100)
| extend Status = case(
    HealthScore == 0, "CRITIQUE",
    HealthScore <= 25, "DEGRADE",
    HealthScore <= 50, "INSTABLE",
    HealthScore <= 65, "SOUS-OPTIMAL",
    HealthScore <= 80, "ACCEPTABLE",
    "OPTIMAL")
| project
    DigesterId, Status, HealthScore,
    Temp = strcat(round(AvgTemp, 1), "C [", round(MinTemp, 1), "-", round(MaxTemp, 1), "]"),
    pH = strcat(round(AvgpH, 2), " [min:", round(MinpH, 2), "]"),
    Methane = strcat(round(AvgMethane, 1), "% [min:", round(MinMethane, 1), "]"),
    H2S_max = strcat(round(MaxH2S, 0), " ppm"),
    Power = strcat(round(AvgPower, 0), " kW"),
    Anomalies = strcat(TotalAnomalies, " (Acid:", Acidifications, " H2S:", H2SSpikes, ")")
| order by HealthScore asc
```

**Interprétation** : Ce tableau est le **rapport exécutif**. Le directeur lit de haut en bas : les digesteurs les plus critiques en premier. Chaque colonne montre la moyenne ET la plage [min-max], ce qui révèle la volatilité. Le HealthScore chiffre objectivement la santé : un investisseur comprend "Score 25/100" mieux que "pH à 6.3 avec H2S à 620 ppm". Ce tableau est le livrable que l'opérateur biogaz vend à ses partenaires pour prouver la fiabilité de son installation.

---

## Partie 8 — Real-Time Dashboard

### 8.1 — Tuile tableau de synthèse

1. Dans le **queryset**, sélectionner la **requête 15**
2. Cliquer **Save to Dashboard**
3. Sélectionner **Create new dashboard**
4. Nom : **`Biogaz-LiveMonitoring`**
5. Nom de la tuile : **`Synthese operationnelle`**
6. Cliquer **Create** → **Open dashboard**

### 8.2 — Tuile courbe de pH

1. Cliquer **Manage** → **+ Add tile**
2. Coller la **requête 12** (render timechart du pH)
3. Le type **Line chart** s'applique automatiquement
4. Cliquer **Apply changes**

### 8.3 — Tuile production électrique

1. Cliquer **+ Add tile**
2. Coller :

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| summarize TotalPowerKW = sum(PowerOutputKW) by bin(Timestamp, 2m)
| render timechart with (title="Production electrique totale (kW)")
```

3. Cliquer **Apply changes**

### 8.4 — Tuile répartition anomalies

1. Cliquer **+ Add tile**
2. Coller :

```kql
BiogasEventsStream
| where Timestamp > ago(1h)
| where Anomaly != "None"
| summarize Count = count() by Anomaly
| render piechart with (title="Repartition des anomalies")
```

3. Cliquer **Apply changes**

> 💡 **Astuce** : **Manage** → ⚙️ → **Auto refresh** → **30 secondes**.

---

## Partie 9 — Alertes Activator

1. Dans le dashboard, cliquer sur la tuile **courbe de pH** (8.2)
2. Cliquer **Set alert**
3. Configurer :

| Champ         | Valeur                 |
| ------------- | ---------------------- |
| **Measure**   | `AvgpH`                |
| **Condition** | Is less than           |
| **Value**     | `6.5`                  |
| **Action**    | Email ou Teams message |

4. Cliquer **Create**

> ⚠️ **Piège** : **Set alert** ne fonctionne que sur les tuiles de type **graphique**.

---

## Partie 10 — Comparaison finale des deux approches

Après avoir travaillé avec les deux tables, voici le bilan pratique :

| Critère                       | Approche A (Eventstream)                 | Approche B (Directe)                  |
| ----------------------------- | ---------------------------------------- | ------------------------------------- |
| **Mise en place**             | Plus d'étapes (Eventstream + config)     | Moins d'étapes (Get Data dans KQL DB) |
| **Transformations in-flight** | Oui (filter, rename, group by)           | Non (tout en KQL après ingestion)     |
| **Latence observée**          | Quelques secondes de plus                | Minimale                              |
| **Monitoring**                | Canvas visuel Eventstream                | Monitoring KQL Database               |
| **Multi-destination**         | Oui (Eventhouse + Lakehouse + Activator) | Non (une seule table cible)           |
| **Recommandation**            | Données à transformer avant stockage     | Données propres, ingestion rapide     |

---

## Nettoyage

1. **Ctrl+C** dans le terminal pour arrêter le simulateur
2. Dans **Fabric** → supprimer le dashboard, l'eventstream, l'eventhouse
3. Dans **Azure Portal** → supprimer le resource group `rg-biogaz` (supprime le namespace Event Hub et tout son contenu)

> 💡 **Astuce** : Supprimer le resource group Azure est le moyen le plus propre — ça supprime tout en une seule action.
