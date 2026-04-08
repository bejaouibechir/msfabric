# Atelier 5 — Traitement des données non structurées

## Partie 1 : Ingestion, enrichissement IA et couche Silver

### Thème : Appels clients audio — Secteur Énergies Renouvelables

---

## Contexte métier

**SolarVoix** est un acteur français des énergies renouvelables (panneaux solaires, pompes à chaleur, bornes de recharge VE). Leur centre de relation client reçoit **120 appels par semaine**. Aujourd'hui, ces appels sont enregistrés en MP3, archivés dans un dossier réseau, et **personne ne les analyse**. Résultat : des clients mécontents partent sans que l'entreprise le sache, et le taux de churn grimpe.

**Problématique :** Comment détecter automatiquement les appels à risque (sentiment très négatif, intention de résiliation) pour alerter le responsable SAV en temps réel ?

**Architecture cible (3 parties) :**

```
Fichiers audio (MP3 synthétiques)
        ↓
  Lakehouse Bronze  ← ingestion brute
        ↓
  Notebook PySpark + Analyse IA (transformers, sans clé API)
        ↓
  Lakehouse Silver  ← transcriptions + scores enrichis
        ↓
  Pipeline Data Factory + Activator (Partie 2)
        ↓
  Modèle sémantique + Rapport Power BI Fabric (Partie 3)
```

> 💡 **Choix pédagogique :** Cet atelier n'utilise **aucune clé Azure payante**. La transcription et l'analyse IA s'appuient sur des bibliothèques open-source (`transformers`, `pipeline` HuggingFace). Vous pouvez rejouer l'atelier indéfiniment sans dépendance externe.

---

## Prérequis

| Élément          | Valeur                                                            |
| ---------------- | ----------------------------------------------------------------- |
| Workspace Fabric | `WS_SolarVoix` (F64 ou capacité Trial)                            |
| Lakehouse        | `LH_SolarVoix`                                                    |
| Notebook 1       | `NB_Generation_Donnees`                                           |
| Notebook 2       | `NB_Bronze_to_Silver`                                             |
| Notebook 3       | `NB_Visualisations`                                               |
| Bibliothèques    | `transformers`, `torch`, `pydub`, `faker` (installables via %pip) |

---

# PARTIE 1

---

## Bloc 1 — Mise en place de l'environnement

### 1.1 — Créer le Workspace

1. Aller sur **app.fabric.microsoft.com**
2. Dans le menu gauche → **Workspaces** → **+ New workspace**
3. Nom : `WS_SolarVoix`
4. Mode de licence : **Trial** ou **Fabric capacity**
5. Cliquer **Apply**

> ⚠️ **Piège courant :** Si vous utilisez une capacité Trial, elle expire après 60 jours. Notez la date d'expiration dans vos prérequis de formation.

### 1.2 — Créer le Lakehouse

1. Dans `WS_SolarVoix` → **+ New item** → **Lakehouse**
2. Nom : `LH_SolarVoix`
3. Cliquer **Create**
4. Vérifier que les dossiers **Tables** et **Files** apparaissent dans l'explorateur gauche

### 1.3 — Créer le premier Notebook

1. Workspace → **+ New item** → **Notebook**
2. Nommer : `NB_Generation_Donnees`
3. Dans le panneau **Lakehouses** à gauche → **Add** → sélectionner `LH_SolarVoix`

---

## Bloc 2 — Génération des données synthétiques

> 💡 **Pourquoi générer des données ?** Dans un contexte réel, vous auriez des MP3 enregistrés par votre centre d'appels. Pour cet atelier, nous générons 120 appels fictifs mais réalistes (produits, plaintes, intentions typiques du secteur énergie). Cela permet de rejouer l'atelier autant de fois que souhaité.

### 2.1 — Cellule 1 : Installation des bibliothèques

```python
# === CELLULE 1 : Installation des dépendances ===
#
# OBJECTIF : Installer les bibliothèques nécessaires pour générer les données
#            synthétiques et effectuer l'analyse IA sans clé externe.
#
# %pip install s'exécute dans l'environnement du cluster Spark.
# L'installation est temporaire (durée de la session Spark).
# Pour persister, utilisez Environment items dans Fabric.
#
# faker    → génère des noms, villes, dates aléatoires réalistes
# pydub    → manipulation audio (création de fichiers WAV/MP3 vides)
# transformers → modèles HuggingFace pour sentiment sans clé API
# torch    → requis par transformers (backend de calcul)

%pip install faker pydub transformers torch sentencepiece --quiet
print("Installation terminée")
```

**Résultat attendu :** `Installation terminée` (peut prendre 2-3 minutes au premier lancement)

### 2.2 — Cellule 2 : Génération des transcriptions et métadonnées

```python
# === CELLULE 2 : Génération des 120 appels synthétiques ===
#
# OBJECTIF : Créer deux fichiers dans le Lakehouse :
#   1. 120 fichiers .txt dans Files/audio_calls/  (simulent des transcriptions)
#   2. Un fichier calls_metadata.csv (horodatage, durée, client, produit)
#
# Dans un projet réel, les .txt seraient remplacés par des .mp3 et la
# transcription serait effectuée par un modèle Whisper ou Azure Speech.
# La structure des données est identique — seule la source change.
#
# Vocabulaire métier SolarVoix :
#   - PSF  = Panneaux Solaires Fotovoltaïques
#   - PAC  = Pompe À Chaleur
#   - BORNE = Borne de recharge VE

import random
import csv
import os
from datetime import datetime, timedelta
from faker import Faker

fake = Faker("fr_FR")
random.seed(42)  # Graine fixe → résultats reproductibles entre sessions

# -------------------------------------------------------
# DÉFINITION DU CORPUS DE TRANSCRIPTIONS
# -------------------------------------------------------
# Chaque catégorie contient des phrases typiques d'un appel client.
# Les catégories couvrent le spectre complet : très satisfait → très mécontent.

TEMPLATES = {
    "positif": [
        "Bonjour, je voulais juste vous remercier pour l'installation de mes panneaux solaires. "
        "Le technicien était très professionnel et tout fonctionne parfaitement. "
        "Je suis vraiment satisfait du service et je vous recommanderai à mes voisins.",

        "Votre équipe a fait un travail remarquable pour ma pompe à chaleur. "
        "L'installation a été rapide, propre, et les économies sur ma facture sont déjà visibles. "
        "Continuez comme ça, c'est exactement ce qu'on attend.",

        "Je viens de recevoir ma première facture EDF depuis l'installation des panneaux. "
        "J'économise déjà 40 pourcent. Votre solution est excellente, merci à toute l'équipe.",
    ],
    "neutre": [
        "Bonjour, je souhaite avoir des informations sur vos offres de maintenance pour panneaux solaires. "
        "Mon contrat expire dans trois mois et je voudrais connaître les options de renouvellement.",

        "Je vous appelle pour signaler un délai de livraison de ma borne de recharge. "
        "On m'avait annoncé 10 jours, il en est au 14ème. Pouvez-vous me donner une date précise ?",

        "Bonjour, j'aimerais avoir une information sur le remboursement de la TVA "
        "pour mon installation de panneaux solaires. Quels documents dois-je fournir ?",
    ],
    "negatif": [
        "Ça fait deux semaines que j'attends un technicien pour réparer ma pompe à chaleur. "
        "C'est inacceptable, j'ai des enfants à la maison et il fait froid. "
        "Si ça continue, je vais déposer une plainte auprès de la DGCCRF.",

        "Mon application de suivi de production solaire ne fonctionne plus depuis 10 jours. "
        "J'ai appelé trois fois, personne ne rappelle. C'est un manque de respect total envers les clients. "
        "Je suis vraiment déçu de votre service après-vente.",

        "Vos techniciens ont endommagé ma toiture lors de la pose des panneaux. "
        "J'attends toujours une réponse de votre responsable depuis deux semaines. "
        "Cette situation est inadmissible et je vais en parler à mon assurance.",
    ],
    "tres_negatif": [
        "Je vais résilier mon contrat immédiatement. Ça fait trois mois que votre borne de recharge "
        "ne fonctionne pas et vous ne faites rien. J'ai perdu confiance en votre entreprise. "
        "Je vais laisser des avis négatifs partout et déposer une plainte formelle.",

        "C'est la dernière fois que je vous appelle. Vous m'avez vendu une pompe à chaleur "
        "qui tombe en panne chaque mois. Je veux un remboursement complet et je vais saisir "
        "le médiateur de l'énergie si vous ne réglez pas ça dans les 48 heures.",

        "Votre entreprise est une arnaque. Mes panneaux solaires n'ont jamais produit "
        "ce que vous m'aviez promis. Je contacte mon avocat cette semaine "
        "et je résilie tous mes contrats avec vous. Vous allez avoir de mes nouvelles.",
    ],
}

PRODUITS = ["Panneaux solaires PSF", "Pompe à chaleur PAC", "Borne recharge VE", "Batterie stockage"]
INTENTIONS = {
    "positif":     ["satisfaction", "recommandation"],
    "neutre":      ["information", "suivi_commande", "question_facturation"],
    "negatif":     ["plainte_technique", "plainte_sav", "reclamation"],
    "tres_negatif":["resiliation", "menace_juridique", "churn_imminent"],
}

# -------------------------------------------------------
# GÉNÉRATION DES 120 APPELS
# -------------------------------------------------------
# Répartition : 30 positifs, 30 neutres, 35 négatifs, 25 très négatifs
# → Représentation réaliste d'un centre SAV sous tension

REPARTITION = (
    [("positif", 30)] +
    [("neutre", 30)] +
    [("negatif", 35)] +
    [("tres_negatif", 25)]
)

appels = []
call_id = 1
date_debut = datetime(2024, 10, 1)

for sentiment, count in REPARTITION:
    for _ in range(count):
        template = random.choice(TEMPLATES[sentiment])
        intention = random.choice(INTENTIONS[sentiment])
        produit = random.choice(PRODUITS)
        duree_sec = random.randint(60, 480)  # 1 à 8 minutes
        date_appel = date_debut + timedelta(
            days=random.randint(0, 89),      # sur 3 mois
            hours=random.randint(8, 18),
            minutes=random.randint(0, 59)
        )
        # Enrichissement du texte avec le produit mentionné
        texte_complet = f"[Appel entrant - {date_appel.strftime('%d/%m/%Y %H:%M')}] " \
                        f"Client : {fake.name()}. Produit concerné : {produit}. " \
                        f"Transcription : {template}"

        appels.append({
            "call_id": f"CALL_{call_id:04d}",
            "client_nom": fake.name(),
            "client_email": fake.email(),
            "ville": fake.city(),
            "produit": produit,
            "date_appel": date_appel.strftime("%Y-%m-%d %H:%M:%S"),
            "duree_secondes": duree_sec,
            "sentiment_reel": sentiment,       # colonne de vérité terrain (pour évaluation)
            "intention_reelle": intention,
            "texte_transcription": texte_complet,
        })
        call_id += 1

random.shuffle(appels)  # Mélanger pour ne pas avoir les sentiments triés
print(f"Nombre d'appels générés : {len(appels)}")
print(f"Répartition sentiments : { {s: sum(1 for a in appels if a['sentiment_reel']==s) for s in TEMPLATES} }")
```

**Résultat attendu :**

```
Nombre d'appels générés : 120
Répartition sentiments : {'positif': 30, 'neutre': 30, 'negatif': 35, 'tres_negatif': 25}
```

### 2.3 — Cellule 3 : Sauvegarde dans le Lakehouse

```python
# === CELLULE 3 : Écriture dans le Lakehouse (couche Bronze) ===
#
# OBJECTIF : Persister les données générées dans deux formats :
#   1. Fichiers .txt individuels dans Files/audio_calls/
#      → Simulant des transcriptions de fichiers audio réels
#      → En production : ce seraient des .mp3 traités par Whisper ou Azure Speech
#   2. Fichier CSV de métadonnées dans Files/metadata/
#      → Contient toutes les colonnes sauf le texte de transcription
#
# mssparkutils.fs.put() écrit directement dans le système de fichiers OneLake
# du Lakehouse attaché au Notebook.
# overwrite=True → idempotent (peut être relancé sans dupliquer les données)

# -------------------------------------------------------
# ÉCRITURE DES FICHIERS .TXT DE TRANSCRIPTION
# -------------------------------------------------------
for appel in appels:
    chemin = f"Files/audio_calls/{appel['call_id']}.txt"
    mssparkutils.fs.put(chemin, appel["texte_transcription"], overwrite=True)

print(f"✅ {len(appels)} fichiers .txt écrits dans Files/audio_calls/")

# -------------------------------------------------------
# ÉCRITURE DU CSV MÉTADONNÉES
# -------------------------------------------------------
# On utilise Python natif (io + csv) pour construire le CSV en mémoire
# puis mssparkutils.fs.put() pour l'écrire dans le Lakehouse en une seule opération.
# Évite de créer un fichier temporaire local (/tmp/...) qui ne persiste pas.

import io, csv as csv_module

buffer = io.StringIO()
champs = ["call_id","client_nom","client_email","ville","produit",
          "date_appel","duree_secondes","sentiment_reel","intention_reelle"]
writer = csv_module.DictWriter(buffer, fieldnames=champs, extrasaction="ignore")
writer.writeheader()
writer.writerows(appels)

mssparkutils.fs.put("Files/metadata/calls_metadata.csv", buffer.getvalue(), overwrite=True)
print("✅ calls_metadata.csv écrit dans Files/metadata/")
```

**Vérification visuelle :**
Dans l'explorateur gauche du Lakehouse → **Files** → vous devez voir deux dossiers : `audio_calls/` (120 fichiers .txt) et `metadata/` (1 fichier CSV).

---

## Bloc 3 — Ingestion Bronze

### 3.1 — Créer le Notebook d'ingestion

1. Workspace → **+ New item** → **Notebook**
2. Nommer : `NB_Bronze_to_Silver`
3. Ajouter `LH_SolarVoix` dans le panneau Lakehouses

### 3.2 — Cellule 1 : Chargement Bronze des transcriptions

```python
# === CELLULE 1 : Ingestion Bronze — Fichiers texte ===
#
# OBJECTIF : Lire tous les fichiers .txt du dossier audio_calls/
#            en une seule opération Spark et créer la table bronze_transcriptions.
#
# spark.read.text() lit chaque fichier comme une ligne par ligne.
# Pour avoir une ligne par FICHIER (= un appel complet), on utilise
# spark.read.format("binaryFile") qui charge le contenu binaire du fichier,
# puis on le décode en UTF-8.
#
# Colonnes créées automatiquement par binaryFile :
#   path    → chemin complet du fichier (ex: abfss://...CALL_0001.txt)
#   content → contenu brut en bytes
#   length  → taille du fichier en bytes

from pyspark.sql import functions as F

# Lecture de tous les fichiers .txt en mode binaryFile
df_raw = (
    spark.read
    .format("binaryFile")
    .option("pathGlobFilter", "*.txt")  # filtre sur l'extension
    .load("Files/audio_calls/")
)

# Décodage UTF-8 + extraction du call_id depuis le nom du fichier
# F.decode(content, "utf-8") convertit les bytes en chaîne lisible
# F.regexp_extract extrait "CALL_0001" depuis le chemin complet du fichier
df_bronze_transcriptions = (
    df_raw
    .withColumn("transcription_text", F.decode(F.col("content"), "utf-8"))
    .withColumn("call_id",
        F.regexp_extract(F.col("path"), r"(CALL_\d+)\.txt", 1))
    .withColumn("file_size_bytes", F.col("length"))
    .select("call_id", "transcription_text", "file_size_bytes")
)

df_bronze_transcriptions.write \
    .mode("overwrite") \
    .format("delta") \
    .saveAsTable("bronze_transcriptions")

print(f"bronze_transcriptions : {df_bronze_transcriptions.count()} lignes")
df_bronze_transcriptions.show(3, truncate=80)
```

### 3.3 — Cellule 2 : Chargement Bronze des métadonnées

```python
# === CELLULE 2 : Ingestion Bronze — Métadonnées CSV ===
#
# OBJECTIF : Lire le fichier calls_metadata.csv et créer bronze_calls_metadata.
#
# inferSchema=True détecte automatiquement :
#   - date_appel → TimestampType (si format reconnu)
#   - duree_secondes → IntegerType
#   - les colonnes texte → StringType
#
# Bonne pratique : en production, définir un StructType explicite
# pour éviter les surprises de typage sur de gros volumes.

df_meta = (
    spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("Files/metadata/calls_metadata.csv")
)

df_meta.write \
    .mode("overwrite") \
    .format("delta") \
    .saveAsTable("bronze_calls_metadata")

print(f"bronze_calls_metadata : {df_meta.count()} lignes")
df_meta.printSchema()
```

### 3.4 — Cellule 3 : Diagnostic qualité Bronze

```python
# === CELLULE 3 : Diagnostic qualité ===
#
# OBJECTIF : Vérifier l'intégrité des données avant de commencer l'enrichissement IA.
#
# Règle d'or : diagnostiquer avant de transformer.
# On vérifie :
#   1. Nulls dans les colonnes critiques
#   2. Cohérence du nombre d'appels (120 attendus)
#   3. Jointure entre les deux tables Bronze (call_id doit matcher)

from pyspark.sql import functions as F

df_t = spark.table("bronze_transcriptions")
df_m = spark.table("bronze_calls_metadata")

print("=== VÉRIFICATION BRONZE ===")
print(f"Transcriptions : {df_t.count()} lignes (attendu: 120)")
print(f"Métadonnées    : {df_m.count()} lignes (attendu: 120)")

# Vérification des nulls sur transcription_text (critique pour l'IA)
nulls_text = df_t.filter(F.col("transcription_text").isNull() |
                          (F.length("transcription_text") < 10)).count()
print(f"\nTranscriptions vides ou trop courtes : {nulls_text}")

# Vérification de la jointure (call_ids qui matchent)
ids_t = set(r.call_id for r in df_t.select("call_id").collect())
ids_m = set(r.call_id for r in df_m.select("call_id").collect())
orphelins = ids_t.symmetric_difference(ids_m)
print(f"call_ids sans correspondance : {len(orphelins)}")
if len(orphelins) > 0:
    print(f"  ⚠️ IDs orphelins : {list(orphelins)[:5]}")
else:
    print("  ✅ Jointure parfaite entre les deux tables")

# Distribution des sentiments réels (vérité terrain)
print("\n=== RÉPARTITION SENTIMENTS (vérité terrain) ===")
df_m.groupBy("sentiment_reel").count().orderBy("count", ascending=False).show()
```

**Interprétation :** 120 lignes, aucun null, jointure parfaite. La distribution réelle (25 très négatifs + 35 négatifs = 50% d'appels problématiques) représente un centre SAV sous forte pression.

---

## Bloc 4 — Enrichissement IA (sans clé API)

> 💡 **Architecture IA sans dépendance externe :** On utilise `transformers` de HuggingFace avec le modèle `cardiffnlp/twitter-xlm-roberta-base-sentiment` — un modèle multilingue (français inclus) pour l'analyse de sentiment. Il est téléchargé une seule fois par le cluster, puis mis en cache. Pas de clé, pas de coût par appel.

### 4.1 — Cellule 4 : Analyse de sentiment IA

```python
# === CELLULE 4 : Analyse de sentiment avec HuggingFace Transformers ===
#
# OBJECTIF : Attribuer un score de sentiment (positif/neutre/négatif)
#            à chaque transcription via un modèle de NLP pré-entraîné.
#
# Modèle : cardiffnlp/twitter-xlm-roberta-base-sentiment
#   → Entraîné sur 198 millions de tweets en 100 langues dont le français
#   → Labels : negative / neutral / positive
#   → Taille : ~280 MB (téléchargé automatiquement au premier appel)
#
# Stratégie d'exécution :
#   - On collecte les transcriptions dans le driver (120 textes courts = OK)
#   - On applique le pipeline NLP en batch sur le driver
#   - Pour des millions de documents, on utiliserait une UDF Spark distribuée
#
# truncation=True, max_length=512 → les transcriptions longues sont tronquées
# à 512 tokens (limite du modèle BERT/RoBERTa)

from transformers import pipeline as hf_pipeline

print("Chargement du modèle de sentiment (première fois : ~1 min)...")

# Modèle : nlptown/bert-base-multilingual-uncased-sentiment
# Tokenizer BERT standard (WordPiece) — aucune dépendance sentencepiece
# Supporte le français nativement (entraîné sur 6 langues)
# Labels de sortie : "1 star" à "5 stars"
sentiment_pipeline = hf_pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    device=-1,
    truncation=True,
    max_length=512
)

print("Modèle chargé ✅")

rows = spark.table("bronze_transcriptions").collect()
texts = [r.transcription_text for r in rows]
call_ids = [r.call_id for r in rows]

resultats_sentiment = sentiment_pipeline(texts, batch_size=16)

# Mapping : 1-2 étoiles → negatif | 3 étoiles → neutre | 4-5 étoiles → positif
def mapper_sentiment(label: str) -> str:
    nb = int(label[0])
    if nb <= 2:
        return "negatif"
    elif nb == 3:
        return "neutre"
    else:
        return "positif"

resultats = []
for call_id, texte, res in zip(call_ids, texts, resultats_sentiment):
    sentiment_ia = mapper_sentiment(res["label"])
    score_confiance = round(res["score"], 4)
    resultats.append({
        "call_id": call_id,
        "sentiment_ia": sentiment_ia,
        "score_sentiment": score_confiance,
    })

print(f"\nAnalyse terminée : {len(resultats)} appels traités")
# Aperçu des 5 premiers résultats
for r in resultats[:5]:
    print(f"  {r['call_id']} → {r['sentiment_ia']} (confiance: {r['score_sentiment']})")
```

### 4.2 — Cellule 5 : Détection d'intention et score de risque churn

```python
# === CELLULE 5 : Détection d'intention par règles + calcul du score churn ===
#
# OBJECTIF : Deux enrichissements complémentaires :
#   1. intent_detecte : catégorie d'intention basée sur mots-clés métier
#      (plus rapide et explicable qu'un modèle NLP pour la classification métier)
#   2. score_risque_churn : score de 0 à 100 combinant plusieurs signaux
#
# Logique du score risque churn :
#   - Sentiment IA très négatif  : +50 points
#   - Sentiment IA négatif       : +25 points
#   - Mots de résiliation        : +30 points
#   - Mots de menace (avocat, DGCCRF) : +20 points
#   - Durée > 5 minutes (frustration prolongée) : +10 points
#   - Score plafonné à 100
#
# Cette formule est délibérément simple et explicable.
# En production, on l'enrichirait avec l'historique CRM du client.

import re

# Dictionnaire des mots-clés par intention métier
KEYWORDS_INTENT = {
    "resiliation":         ["résilie", "résiliation", "annuler", "annule", "partir", "quitter"],
    "menace_juridique":    ["avocat", "plainte", "dgccrf", "médiateur", "tribunal", "juridique"],
    "churn_imminent":      ["jamais", "arnaque", "honte", "incompétent", "remboursement total"],
    "plainte_technique":   ["panne", "ne fonctionne pas", "cassé", "défaillant", "réparer"],
    "plainte_sav":         ["rappelle pas", "personne ne", "inacceptable", "scandaleux"],
    "question_facturation":["facture", "tva", "remboursement", "devis", "tarif", "prix"],
    "suivi_commande":      ["livraison", "délai", "date", "quand", "attends"],
    "satisfaction":        ["merci", "excellent", "parfait", "satisfait", "recommande"],
    "information":         ["information", "renseignement", "savoir", "comprendre"],
}

def detecter_intention(texte: str) -> str:
    """Retourne la première intention trouvée par ordre de priorité."""
    texte_lower = texte.lower()
    # Ordre de priorité : les intentions critiques d'abord
    priorite = ["resiliation", "menace_juridique", "churn_imminent",
                "plainte_technique", "plainte_sav", "question_facturation",
                "suivi_commande", "satisfaction", "information"]
    for intent in priorite:
        for kw in KEYWORDS_INTENT[intent]:
            if kw in texte_lower:
                return intent
    return "autre"

def calculer_score_churn(sentiment: str, texte: str, duree_sec: int) -> int:
    """
    Calcule un score de risque churn entre 0 et 100.
    Plus le score est élevé, plus le risque que le client parte est important.
    """
    score = 0
    texte_lower = texte.lower()

    # Signal 1 : Sentiment IA (base élevée — le sentiment est le signal le plus fort)
    if sentiment == "negatif":
        score += 40

    # Signal 2 : Mots de résiliation explicites
    mots_resil = ["résilie", "résiliation", "annuler", "quitter", "partir", "dernier"]
    if any(m in texte_lower for m in mots_resil):
        score += 30

    # Signal 3 : Menaces juridiques ou institutionnelles
    mots_menace = ["avocat", "plainte", "dgccrf", "médiateur", "tribunal", "assurance"]
    if any(m in texte_lower for m in mots_menace):
        score += 20

    # Signal 4 : Plainte technique ou SAV explicite
    mots_plainte = ["panne", "ne fonctionne pas", "inacceptable", "scandaleux",
                    "inadmissible", "trois fois", "cinq fois", "rappelle pas"]
    if any(m in texte_lower for m in mots_plainte):
        score += 15

    # Signal 5 : Durée prolongée (>5 min = client insistant = problème sérieux)
    if duree_sec > 300:
        score += 10

    # Plafonnement à 100
    return min(score, 100)

# -------------------------------------------------------
# APPLICATION SUR LES 120 APPELS
# -------------------------------------------------------
# On joint les résultats de sentiment avec les métadonnées (durée)
df_meta_pd = spark.table("bronze_calls_metadata").toPandas()
df_meta_dict = {r["call_id"]: r for _, r in df_meta_pd.iterrows()}

for r in resultats:
    texte = next(t for c, t in zip(call_ids, texts) if c == r["call_id"])
    meta = df_meta_dict.get(r["call_id"], {})
    duree = meta.get("duree_secondes", 0)

    r["intent_detecte"] = detecter_intention(texte)
    r["score_risque_churn"] = calculer_score_churn(r["sentiment_ia"], texte, duree)
    r["alerte_critique"] = r["score_risque_churn"] >= 50  # booléen pour Activator (Partie 2)

# Statistiques rapides
scores = [r["score_risque_churn"] for r in resultats]
alertes = sum(r["alerte_critique"] for r in resultats)
print(f"Score churn moyen : {sum(scores)/len(scores):.1f}/100")
print(f"Score churn max   : {max(scores)}/100")
print(f"Appels en alerte critique (score ≥ 50) : {alertes}")
```

**Interprétation métier :** Score moyen de 31.8/100, 20 alertes critiques (score ≥ 50) sur 120 appels soit 16.7%. Le score maximum de 85 correspond aux appels combinant sentiment négatif + mots de résiliation + menace juridique — ce sont les cas à traiter en priorité absolue dans les 24h. Chaque alerte représente un risque de perte estimé à 2 000–8 000€ de contrats récurrents (maintenance, renouvellement, extension).

> 💡 **Note modèle IA :** Le modèle `nlptown` est binaire en pratique : il classe les appels neutres ET très négatifs tous comme « negatif ». C'est visible dans la matrice de cohérence (neutre → negatif : 30 cas). Cette limitation est compensée par la détection de mots-clés (Cellule 5) qui discrimine les niveaux de gravité via le score churn.

---

## Bloc 5 — Création de la couche Silver

### 5.1 — Cellule 6 : Jonction et écriture Silver

```python
# === CELLULE 6 : Construction de la table Silver ===
#
# OBJECTIF : Créer silver_appels_enrichis en joignant :
#   - bronze_calls_metadata  (informations client, produit, date)
#   - Les résultats d'enrichissement IA (sentiment, intent, churn)
#
# La couche Silver = données propres + enrichies, prêtes pour le rapport.
# On écrit en Delta → partitionnement par sentiment_ia pour accélérer
# les requêtes filtrées dans Power BI.
#
# Colonnes finales de la table Silver :
#   call_id, client_nom, client_email, ville, produit
#   date_appel, duree_secondes, duree_minutes (calculée)
#   sentiment_ia, score_sentiment
#   intent_detecte, score_risque_churn, alerte_critique
#   (sentiment_reel, intention_reelle → colonnes de vérité terrain pour audit)

from pyspark.sql import Row
import pyspark.sql.functions as F

# Conversion de la liste Python → DataFrame Spark
df_enrichi = spark.createDataFrame([Row(**r) for r in resultats])

# Jointure avec les métadonnées Bronze
df_meta_spark = spark.table("bronze_calls_metadata")

df_silver = (
    df_meta_spark
    .join(df_enrichi, on="call_id", how="inner")

    # Calcul de la durée en minutes (arrondi 1 décimale) pour lisibilité métier
    .withColumn("duree_minutes",
        F.round(F.col("duree_secondes") / 60.0, 1))

    # Conversion de la date en type Timestamp pour Power BI
    .withColumn("date_appel", F.to_timestamp("date_appel"))

    # Extraction jour de la semaine (1=Lundi ... 7=Dimanche) pour analyses
    .withColumn("jour_semaine", F.dayofweek("date_appel"))

    # Extraction heure pour analyser les pics d'appels
    .withColumn("heure_appel", F.hour("date_appel"))

    # Tranche horaire métier (matin / après-midi / fin de journée)
    .withColumn("tranche_horaire",
        F.when(F.col("heure_appel") < 12, "Matin")
        .when(F.col("heure_appel") < 17, "Après-midi")
        .otherwise("Fin de journée"))

    # Sélection et ordre des colonnes finales
    .select(
        "call_id", "client_nom", "client_email", "ville", "produit",
        "date_appel", "duree_secondes", "duree_minutes",
        "tranche_horaire", "jour_semaine",
        "sentiment_ia", "score_sentiment",
        "intent_detecte", "score_risque_churn", "alerte_critique",
        "sentiment_reel", "intention_reelle"  # colonnes audit
    )
)

# Écriture Silver partitionnée par sentiment_ia
# Avantage : Power BI en mode Direct Lake lit uniquement les partitions filtrées
df_silver.write \
    .mode("overwrite") \
    .format("delta") \
    .partitionBy("sentiment_ia") \
    .saveAsTable("silver_appels_enrichis")

print(f"silver_appels_enrichis : {df_silver.count()} lignes")
print("\nDistribution sentiment IA :")
df_silver.groupBy("sentiment_ia").count().orderBy("count", ascending=False).show()
```

### 5.2 — Cellule 7 : Contrôle qualité Silver

```python
# === CELLULE 7 : Contrôle qualité Silver ===
#
# OBJECTIF : Valider la qualité de la table Silver avant de passer à la visualisation.
# On vérifie les distributions, les scores extrêmes, et la cohérence métier.

df_s = spark.table("silver_appels_enrichis")

print("=== CONTRÔLE QUALITÉ SILVER ===\n")

# 1. Nulls sur les colonnes critiques
cols_critiques = ["sentiment_ia", "intent_detecte", "score_risque_churn"]
for col in cols_critiques:
    nulls = df_s.filter(F.col(col).isNull()).count()
    statut = "✅" if nulls == 0 else "⚠️"
    print(f"{statut} {col} : {nulls} nulls")

# 2. Distribution des scores churn
print("\n--- Distribution score_risque_churn ---")
df_s.select(
    F.min("score_risque_churn").alias("min"),
    F.max("score_risque_churn").alias("max"),
    F.avg("score_risque_churn").alias("moyenne"),
    F.percentile_approx("score_risque_churn", 0.75).alias("p75"),
    F.percentile_approx("score_risque_churn", 0.90).alias("p90"),
).show()

# 3. Appels en alerte critique par produit
print("--- Alertes critiques par produit ---")
df_s.filter(F.col("alerte_critique") == True) \
    .groupBy("produit") \
    .count() \
    .orderBy("count", ascending=False) \
    .show()

# 4. Cohérence : sentiment IA vs sentiment réel (matrice de confusion simplifiée)
print("--- Cohérence IA vs vérité terrain ---")
df_s.groupBy("sentiment_reel", "sentiment_ia").count() \
    .orderBy("sentiment_reel", "sentiment_ia") \
    .show()
```

**Interprétation :** La matrice confirme que le modèle est parfait sur les appels positifs (30/30) et les appels vraiment négatifs (35/35). En revanche, il classe les 30 appels neutres et les 25 très négatifs tous dans « negatif » — comportement attendu pour un modèle généraliste. La colonne `score_risque_churn` (Cellule 5) prend le relais pour discriminer les niveaux de gravité au sein des appels négatifs.

---

## Bloc 6 — Visualisations analytiques

### 6.1 — Créer le Notebook de visualisations

1. Workspace → **+ New item** → **Notebook**
2. Nommer : `NB_Visualisations`
3. Ajouter `LH_SolarVoix`

### 6.2 — Cellule 1 : Imports et chargement

```python
# === CELLULE 1 : Chargement des données pour visualisation ===
#
# On convertit la table Silver en Pandas DataFrame pour seaborn/matplotlib.
# Acceptable ici : 120 lignes. Au-delà de 100K lignes, utiliser des agrégats Spark.

import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.ticker as mticker
import seaborn as sns
import warnings
warnings.filterwarnings("ignore")

# Style cohérent pour toutes les figures
sns.set_theme(style="whitegrid", palette="muted", font_scale=1.1)
COULEURS_SENTIMENT = {
    "positif": "#27AE60",
    "neutre":  "#F39C12",
    "negatif": "#E74C3C",
}

df = spark.table("silver_appels_enrichis").toPandas()
df["date_appel"] = pd.to_datetime(df["date_appel"])
df["semaine"] = df["date_appel"].dt.isocalendar().week.astype(int)

print(f"Données chargées : {len(df)} appels")
```

### 6.3 — Cellule 2 : Tableau de bord sentiment + churn

```python
# === CELLULE 2 : Dashboard 4 visualisations ===
#
# VIZ 1 : Distribution des sentiments (donut chart)
# VIZ 2 : Score churn par produit (boxplot)
# VIZ 3 : Évolution temporelle des alertes (lineplot hebdomadaire)
# VIZ 4 : Heatmap heure × intention (qui appelle quand et pourquoi)

fig, axes = plt.subplots(2, 2, figsize=(16, 12))
fig.suptitle("SolarVoix — Analyse des 120 appels clients", fontsize=16, fontweight="bold", y=1.01)

# -------------------------------------------------------
# VIZ 1 : Donut — Répartition des sentiments IA
# -------------------------------------------------------
ax1 = axes[0, 0]
counts_sent = df["sentiment_ia"].value_counts()
couleurs = [COULEURS_SENTIMENT.get(s, "#95A5A6") for s in counts_sent.index]
wedges, texts, autotexts = ax1.pie(
    counts_sent.values, labels=counts_sent.index,
    autopct="%1.0f%%", colors=couleurs,
    wedgeprops={"width": 0.5},   # width < 1 → donut
    startangle=90
)
for at in autotexts:
    at.set_fontsize(11)
ax1.set_title("Répartition des sentiments (IA)", fontweight="bold")

# -------------------------------------------------------
# VIZ 2 : Boxplot — Score churn par produit
# -------------------------------------------------------
ax2 = axes[0, 1]
ordre_produits = df.groupby("produit")["score_risque_churn"].median() \
                   .sort_values(ascending=False).index
sns.boxplot(data=df, x="produit", y="score_risque_churn",
            order=ordre_produits, ax=ax2,
            palette="Reds", linewidth=1.5)
ax2.axhline(50, color="red", linestyle="--", linewidth=1, label="Seuil alerte (50)")
ax2.set_title("Score de risque churn par produit", fontweight="bold")
ax2.set_xlabel("")
ax2.set_ylabel("Score churn (0-100)")
ax2.tick_params(axis="x", rotation=20)
ax2.legend(fontsize=9)

# -------------------------------------------------------
# VIZ 3 : Lineplot — Alertes critiques par semaine
# -------------------------------------------------------
ax3 = axes[1, 0]
alertes_semaine = (
    df[df["alerte_critique"]]
    .groupby("semaine")
    .size()
    .reset_index(name="nb_alertes")
)
sns.lineplot(data=alertes_semaine, x="semaine", y="nb_alertes",
             ax=ax3, marker="o", color="#E74C3C", linewidth=2)
ax3.fill_between(alertes_semaine["semaine"], alertes_semaine["nb_alertes"],
                  alpha=0.15, color="#E74C3C")
ax3.set_title("Alertes critiques par semaine (score ≥ 50)", fontweight="bold")
ax3.set_xlabel("Semaine de l'année")
ax3.set_ylabel("Nombre d'alertes")
ax3.yaxis.set_major_locator(mticker.MaxNLocator(integer=True))

# -------------------------------------------------------
# VIZ 4 : Heatmap — Intentions par tranche horaire
# -------------------------------------------------------
ax4 = axes[1, 1]
pivot = (
    df.groupby(["tranche_horaire", "intent_detecte"])
    .size()
    .unstack(fill_value=0)
)
# Garder les 6 intentions les plus fréquentes pour lisibilité
top6_intents = df["intent_detecte"].value_counts().head(6).index
pivot = pivot[[c for c in top6_intents if c in pivot.columns]]

sns.heatmap(pivot, annot=True, fmt="d", cmap="YlOrRd",
            linewidths=0.5, ax=ax4, cbar_kws={"label": "Nb appels"})
ax4.set_title("Intentions par tranche horaire", fontweight="bold")
ax4.set_xlabel("")
ax4.set_ylabel("")
ax4.tick_params(axis="x", rotation=30)

plt.tight_layout()
plt.savefig("/tmp/dashboard_solarvoix.png", dpi=150, bbox_inches="tight")
plt.show()
print("Dashboard sauvegardé")
```

**Interprétation des visualisations :**

**Donut — Répartition des sentiments**

- **75% d'appels négatifs** : le modèle absorbe les neutres dans "negatif" (comportement attendu, discuté en Cellule 7)
- **Aucune nuance de gris** : signal qu'un modèle à 2 classes nécessite le score churn pour discriminer les niveaux de gravité
- **25% positifs** correspondent exactement aux 30 appels de satisfaction générés — validation de cohérence

**Boxplot — Score churn par produit**

- **Batterie stockage** : médiane la plus haute (~35) et outlier à 85 — technologie récente, SAV moins mature
- **Tous les produits** restent sous le seuil 50 en médiane → les alertes proviennent des **valeurs extrêmes** (whiskers), pas de la moyenne
- **Borne recharge VE** : distribution la plus étalée — profils clients très hétérogènes (novices technologiques vs early adopters)

**Lineplot — Alertes critiques par semaine**

- **Pic semaine 40 et 44** : correspond aux premières baisses de température — PAC et chauffage sollicités, incidents en hausse
- **Maximum 3 alertes/semaine** sur ce volume de 120 appels — en production réelle (500+ appels/sem), la courbe sera bien plus critique
- **Creux semaine 49** : peut refléter une période de moindre activité (congés) ou un biais du générateur aléatoire

**Heatmap — Intentions par tranche horaire**

- **`plainte_technique` après-midi (24)** : les clients constatent les pannes en rentrant chez eux — pic prévisible et actionnable (renforcer le SAV de 14h à 18h)
- **`menace_juridique` concentrée après-midi (13)** : les clients frustrés escaladent en fin de journée — fenêtre d'intervention critique avant 17h
- **Matin dominé par `plainte_technique`** : problèmes détectés la veille au soir, appel passé dès l'ouverture du centre

### 6.4 — Cellule 3 : Visualisation de la matrice de performance IA

```python
# === CELLULE 3 : Évaluation de la qualité du modèle IA ===
#
# OBJECTIF : Visualiser la matrice de confusion (sentiment IA vs réel)
#            pour mesurer la fiabilité du modèle sur nos données métier.

from sklearn.metrics import confusion_matrix, classification_report
import numpy as np

# On mappe "tres_negatif" → "negatif" pour la comparaison
# (le modèle HuggingFace n'a que 3 classes)
df["sentiment_reel_3classes"] = df["sentiment_reel"].replace(
    {"tres_negatif": "negatif"}
)

labels = ["positif", "neutre", "negatif"]
y_true = df["sentiment_reel_3classes"]
y_pred = df["sentiment_ia"]

cm = confusion_matrix(y_true, y_pred, labels=labels)

fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=labels, yticklabels=labels,
            linewidths=0.5, ax=ax)
ax.set_xlabel("Prédiction IA", fontsize=12)
ax.set_ylabel("Vérité terrain", fontsize=12)
ax.set_title("Matrice de confusion — Modèle de sentiment", fontweight="bold")
plt.tight_layout()
plt.show()

print("\n=== RAPPORT DE CLASSIFICATION ===")
print(classification_report(y_true, y_pred, labels=labels))
```

**Interprétation :** Une précision globale de 70-80% est attendue avec ce modèle généraliste. Les faux négatifs (appels négatifs classés neutres) sont plus problématiques pour le métier que les faux positifs — un churn manqué coûte plus cher qu'une fausse alerte.

---

## Bloc 7 — Optimisation de la table Silver (optionnel mais recommandé)

### 7.1 — Cellule 8 : OPTIMIZE et VACUUM

```python
# === CELLULE 8 : Optimisation Delta ===
#
# OBJECTIF : Optimiser la table Silver pour les lectures Power BI Direct Lake.
#
# OPTIMIZE : compacte les petits fichiers Parquet en fichiers de ~128-256 MB
#   → réduit le nombre de fichiers à lire pour Power BI
#   → améliore les temps de requête
#
# VACUUM (7 jours) : supprime les anciens fichiers Delta non référencés
#   → libère l'espace de stockage OneLake
#   ⚠️ Ne pas descendre sous 7 jours si vous avez du Time Travel actif

spark.sql("OPTIMIZE silver_appels_enrichis")
print("OPTIMIZE terminé")

spark.sql("VACUUM silver_appels_enrichis RETAIN 168 HOURS")
print("VACUUM terminé")

# Statistiques de la table après optimisation
spark.sql("DESCRIBE DETAIL silver_appels_enrichis") \
    .select("numFiles", "sizeInBytes", "partitionColumns") \
    .show(truncate=False)
```

---

## Récapitulatif de la Partie 1

| Étape               | Outil                    | Résultat                          |
| ------------------- | ------------------------ | --------------------------------- |
| Génération données  | Python / Faker           | 120 appels synthétiques réalistes |
| Ingestion Bronze    | Spark binaryFile + CSV   | 2 tables Delta Bronze             |
| Analyse sentiment   | HuggingFace Transformers | sentiment_ia + score_sentiment    |
| Détection intention | Règles métier            | intent_detecte (9 catégories)     |
| Score churn         | Formule pondérée         | s                                 |