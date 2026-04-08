# Atelier 5 — Traitement des données non structurées

#### Partie 2 : Pipeline automatisé + alertes sur appels critiques

#### Thème : Orchestration Data Factory + Activator (Real-Time Intelligence)

---

## Rappel et contexte

La Partie 1 a créé la table `silver_appels_enrichis` avec 120 appels analysés manuellement. 

Problème : **ce traitement doit se déclencher automatiquement** à chaque nouveau fichier audio entrant. Un opérateur ne peut pas relancer manuellement le Notebook chaque jour.

**Objectif de la Partie 2 :** Construire un Pipeline Data Factory qui :

1. Se déclenche à l'arrivée d'un nouveau fichier dans le dossier `audio_calls/`
2. Traite le fichier (mise à jour de la table Silver)
3. Enregistre une alerte dans la table `alertes_critiques` si le score churn ≥ 50 (visible dans Fabric Monitor et Power BI)

**Architecture de cette partie — 100% native Fabric**

```
Nouveau fichier .txt dans Files/audio_calls/
        ↓
  Pipeline Data Factory (déclencheur planifié toutes les 15 min)
     ├─ Activité 1 : Notebook paramétré (enrichissement + MERGE Silver)
     ├─ Activité 2 : If Condition (score_risque_churn ≥ 50 ?)
     │       ├─ OUI → Set Variable "ALERTE" (visible Monitor) + écriture table alertes_critiques
     │       └─ NON → Set Variable "OK" (visible Monitor)
        ↓
  Table Delta alertes_critiques (consultable SQL + Power BI Partie 3)
```

> 💡 **Choix pédagogique :** Toutes les alertes sont tracées dans une table Delta `alertes_critiques` dans le Lakehouse. Cette approche est gratuite, persistante, requêtable en SQL, et directement exploitable dans le rapport Power BI de la Partie 3 — sans aucun abonnement externe.

---

# PARTIE 2

---

## Bloc 1 — Notebook paramétré (traitement d'un fichier unique)

> La Partie 1 traitait les 120 fichiers en batch. Ici, on traite **un seul fichier à la fois** de façon dynamique, via un paramètre passé par le Pipeline.

### 1.1 — Créer le Notebook paramétré

1. Workspace → **+ New item** → **Notebook**
2. Nommer : `NB_Traitement_Incremental`
3. Ajouter `LH_SolarVoix`

### 1.2 — Cellule 1 : Déclaration du paramètre

Ajoutez cette cellule au début du Notebook pour installer `sentencepiece` 

    %pip install transformers torch sentencepiece --quiet

```python
# === CELLULE 1 : Paramètre d'entrée ===
#
# OBJECTIF : Déclarer la variable call_file_path comme paramètre du Notebook.
#            Quand le Pipeline Data Factory appelle ce Notebook, il injecte
#            la valeur réelle du chemin de fichier via ce paramètre.
#
# IMPORTANT : Cette cellule DOIT être marquée comme "Parameters cell" dans Fabric.
# Comment faire :
#   1. Cliquer sur "..." à droite de la cellule
#   2. Sélectionner "Toggle parameter cell"
#   3. Un bandeau bleu "Parameters" apparaît en bas de la cellule
#
# call_file_path : chemin relatif du fichier, ex: "Files/audio_calls/CALL_0121.txt"
# La valeur par défaut permet de tester manuellement le Notebook sans Pipeline.

call_file_path = "Files/audio_calls/CALL_0001.txt"  # valeur par défaut pour test

print(f"Paramètre reçu : call_file_path = {call_file_path}")
```

> ⚠️ **Piège courant :** Oublier de toggler la cellule en mode "Parameters" empêche le Pipeline de passer ses valeurs. Le Notebook s'exécutera avec les valeurs par défaut sans message d'erreur — difficile à déboguer.

Pour tester il est pssoble d'executer cette commande

```powershell
print(call_file_path)
```

Avec un resultat 

```text
 Files/audio_calls/CALL_0001.txt
```

Il est necessaire d'installer sentencepiece qui est une dépendance necessaire

```python
# === CELLULE : Installation des packages via session Spark (recommandé dans Pipeline) ===

import subprocess
import sys

def install_package(package):
    subprocess.check_call([sys.executable, "-m", "pip", "install", package, "--quiet"])

print("Installation des packages nécessaires...")
install_package("transformers")
install_package("torch")
install_package("sentencepiece")

print("✅ Packages installés avec succès")
```

### 1.3 — Cellule 2 : Extraction du call_id depuis le chemin

```python
# === CELLULE 2 : Extraction du call_id ===
#
# OBJECTIF : Dériver le call_id depuis le chemin de fichier reçu en paramètre.
#
# Exemple : "Files/audio_calls/CALL_0121.txt"
#           → call_id = "CALL_0121"
#
# On utilise os.path.basename pour extraire le nom du fichier,
# puis str.replace pour supprimer l'extension.
# Robuste même si le chemin contient des sous-dossiers supplémentaires.

import os
import re

nom_fichier = os.path.basename(call_file_path)   # "CALL_0121.txt"
call_id = nom_fichier.replace(".txt", "")         # "CALL_0121"

# Validation : le call_id doit correspondre au pattern CALL_XXXX
if not re.match(r"^CALL_\d{4}$", call_id):
    raise ValueError(f"Format call_id invalide : '{call_id}'. Attendu: CALL_XXXX")

print(f"call_id extrait : {call_id}")
```

### 1.4 — Cellule 3 : Lecture et enrichissement du fichier

```python
# === CELLULE 3 : Traitement d'un seul appel (Version corrigée) ===

from transformers import pipeline as hf_pipeline
import pyspark.sql.functions as F

# ====================== VARIABLES PAR DÉFAUT ======================
# Sécurité : valeurs par défaut si la cellule est exécutée isolément
try:
    call_file_path
except NameError:
    call_file_path = "Files/audio_calls/CALL_0001.txt"

try:
    call_id
except NameError:
    # On extrait le nom du fichier comme call_id (ex: CALL_0001)
    call_id = call_file_path.split("/")[-1].replace(".txt", "")

# ====================== LECTURE DU FICHIER ======================
try:
    # mssparkutils.fs.head retourne déjà un str (UTF-8)
    transcription_text = mssparkutils.fs.head(call_file_path, 10000).strip()

    if not transcription_text:
        raise ValueError("Le fichier est vide ou ne contient que des espaces.")

    print(f"Fichier lu avec succès : {len(transcription_text)} caractères")
    print(f"Call ID : {call_id} | Chemin : {call_file_path}")

except Exception as e:
    raise FileNotFoundError(f"Impossible de lire le fichier {call_file_path} : {e}") from e

# ====================== CHARGEMENT DU MODÈLE ======================
print("Chargement du modèle de sentiment (nlptown/bert-base-multilingual-uncased-sentiment)...")
sentiment_pipeline = hf_pipeline(
    "sentiment-analysis",
    model="nlptown/bert-base-multilingual-uncased-sentiment",
    device=-1,          # CPU
    truncation=True,
    max_length=512
)

def mapper_sentiment(label: str) -> str:
    nb = int(label[0])
    if nb <= 2:
        return "negatif"
    elif nb == 3:
        return "neutre"
    else:
        return "positif"

# ====================== FONCTION PRINCIPALE ======================
def enrichir_appel(call_id: str, texte: str, duree_sec: int = 180) -> dict:
    """
    Applique l'analyse IA et calcule le score churn pour un appel unique.
    Retourne un dictionnaire prêt pour la table silver_appels_enrichis.
    """
    # Sentiment IA
    res = sentiment_pipeline([texte], batch_size=1)[0]
    sentiment_ia = mapper_sentiment(res["label"])
    score_sentiment = round(res["score"], 4)

    # Détection d'intention (mots-clés)
    KEYWORDS_INTENT = {
        "resiliation":         ["résilie", "résiliation", "annuler", "quitter", "résilier"],
        "menace_juridique":    ["avocat", "plainte", "dgccrf", "médiateur", "justice"],
        "plainte_technique":   ["panne", "ne fonctionne pas", "réparer", "défaillant", "bug"],
        "plainte_sav":         ["rappelle pas", "inacceptable", "scandaleux", "lamentable"],
        "question_facturation":["facture", "tva", "remboursement", "tarif", "augmentation"],
        "satisfaction":        ["merci", "excellent", "parfait", "satisfait", "super"],
        "information":         ["information", "renseignement", "je veux savoir"],
    }

    texte_lower = texte.lower()
    intent_detecte = "autre"
    for intent, keywords in KEYWORDS_INTENT.items():
        if any(kw in texte_lower for kw in keywords):
            intent_detecte = intent
            break

    # Calcul du score risque churn
    score = 0
    if sentiment_ia == "negatif":
        score += 30
    mots_crit = ["résilie", "résiliation", "avocat", "plainte", "remboursement total", "résilier"]
    if any(m in texte_lower for m in mots_crit):
        score += 40
    if duree_sec > 300:
        score += 10

    score_risque_churn = min(score, 100)

    return {
        "call_id":            call_id,
        "sentiment_ia":       sentiment_ia,
        "score_sentiment":    score_sentiment,
        "intent_detecte":     intent_detecte,
        "score_risque_churn": score_risque_churn,
        "alerte_critique":    score_risque_churn >= 50,
        "duree_sec":          duree_sec,           # utile de le garder
    }


# ====================== EXÉCUTION ======================
resultat = enrichir_appel(call_id, transcription_text, duree_sec=180)

print(f"\n✅ Résultat de l'enrichissement de l'appel :")
for k, v in resultat.items():
    print(f"   {k:20} : {v}")
```

### 1.5 — Cellule 4 : Mise à jour UPSERT de la table Silver

```python
# === CELLULE 4 : UPSERT dans la table Silver (Delta MERGE) ===
#
# OBJECTIF : Mettre à jour la table silver_appels_enrichis pour le call_id traité.
#            Si le call_id existe déjà → UPDATE (ré-analyse).
#            Si le call_id est nouveau → INSERT.
#
# MERGE INTO est la commande Delta pour les UPSERTS.
# Plus efficace que DELETE + INSERT car Delta ne réécrit que les fichiers concernés.
#
# Note : mssparkutils.notebook.exit() permet de passer une valeur de retour
# au Pipeline Data Factory. On l'utilise ici pour transmettre le score churn
# afin que le Pipeline puisse décider d'envoyer ou non une alerte.

from datetime import datetime
from pyspark.sql import Row

# Création d'un DataFrame temporaire avec le résultat
df_nouveau = spark.createDataFrame([Row(
    call_id           = resultat["call_id"],
    sentiment_ia      = resultat["sentiment_ia"],
    score_sentiment   = float(resultat["score_sentiment"]),
    intent_detecte    = resultat["intent_detecte"],
    score_risque_churn= int(resultat["score_risque_churn"]),
    alerte_critique   = bool(resultat["alerte_critique"]),
    date_mise_a_jour  = datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
)])
df_nouveau.createOrReplaceTempView("staging_appel")

# MERGE INTO : UPSERT sur call_id
spark.sql("""
    MERGE INTO silver_appels_enrichis AS target
    USING staging_appel AS source
    ON target.call_id = source.call_id
    WHEN MATCHED THEN
        UPDATE SET
            target.sentiment_ia       = source.sentiment_ia,
            target.score_sentiment    = source.score_sentiment,
            target.intent_detecte     = source.intent_detecte,
            target.score_risque_churn = source.score_risque_churn,
            target.alerte_critique    = source.alerte_critique
    WHEN NOT MATCHED THEN
        INSERT (call_id, sentiment_ia, score_sentiment,
                intent_detecte, score_risque_churn, alerte_critique)
        VALUES (source.call_id, source.sentiment_ia, source.score_sentiment,
                source.intent_detecte, source.score_risque_churn, source.alerte_critique)
""")

print(f"MERGE terminé pour {call_id}")
print(f"Score churn : {resultat['score_risque_churn']} — Alerte : {resultat['alerte_critique']}")

# -------------------------------------------------------
# ÉCRITURE DANS LA TABLE alertes_critiques (si score ≥ 50)
# -------------------------------------------------------
# Cette table est la seule "notification" nécessaire : elle est
# requêtable en SQL, visible dans Power BI, et ne dépend d'aucun
# service externe (pas de Teams, pas d'email, pas de webhook).
#
# Le Pipeline lit le score via mssparkutils.notebook.exit()
# pour afficher le statut dans le panneau Monitor de Fabric.

if resultat["alerte_critique"]:
    df_alerte = spark.createDataFrame([{
        "call_id":            resultat["call_id"],
        "score_risque_churn": int(resultat["score_risque_churn"]),
        "sentiment_ia":       resultat["sentiment_ia"],
        "intent_detecte":     resultat["intent_detecte"],
        "statut":             "NON_TRAITEE",
        "date_alerte":        datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
    }])
    df_alerte.write.mode("append").format("delta").saveAsTable("alertes_critiques")
    print(f"🚨 Alerte écrite dans alertes_critiques pour {call_id}")
else:
    print(f"✅ Appel {call_id} traité sans alerte (score = {resultat['score_risque_churn']})")

# Retourne le score au Pipeline → visible dans Monitor → panneau Output
mssparkutils.notebook.exit(str(resultat["score_risque_churn"]))
```

---

## Bloc 2 — Pipeline Data Factory

### 2.1 — Créer le Pipeline

1. Workspace → **+ New item** → **Data pipeline**
2. Nommer : `PL_Traitement_Appel_Entrant`

### 2.2 — Activité 1 : Notebook paramétré

1. Dans le canvas → **Activities** (panneau gauche) → glisser **Notebook** sur le canvas
2. Nommer l'activité : `ACT_Analyser_Appel`
3. Dans l'onglet **Settings** :
   - **Notebook** : `NB_Traitement_Incremental`
   - **Base parameters** → **+ New parameter** :
     - Nom : `call_file_path`
     - Valeur : @pipeline().parameters.fichier_entrant

> 💡 **Explication `@pipeline().parameters.fichier_entrant` :** Cette expression dynamique (langage d'expressions Data Factory) lit la valeur du paramètre `fichier_entrant` qui sera passé au Pipeline au moment du déclenchement (par l'Eventstream ou manuellement pour les tests).

4. Onglet **Parameters** du Pipeline (pas de l'activité) → **+ New** :
   - Nom : `fichier_entrant`
   - Type : `String`
   - Valeur par défaut : `Files/audio_calls/CALL_0001.txt`

### 2.3 — Activité 2 : Condition If (seuil alerte)

1. Glisser **If Condition** sur le canvas après `ACT_Analyser_Appel`

2. Relier `ACT_Analyser_Appel` → `If Condition` (flèche verte = succès)

3. Nommer : `ACT_Condition_Alerte`

4. Expression :
   
   ```
   @greaterOrEquals(
     int(activity('ACT_Analyser_Appel').output.result.exitValue),
     50
   )
   ```

> 💡 **Explication :** `activity('ACT_Analyser_Appel').output.status.Output.result.exitValue` récupère la valeur retournée par `mssparkutils.notebook.exit()` dans le Notebook. On la convertit en entier avec `int()` pour la comparer au seuil 50.

**Branche TRUE — Alerte enregistrée :**

1. Dans la branche TRUE → **+ Add activity** → **Set variable**

2. Nommer : `ACT_Log_Alerte`

3. Variables du Pipeline → **+ New** : nom `statut_traitement`, type `String`

4. Valeur :
   
   ```
   @concat('ALERTE CRITIQUE — ', pipeline().parameters.fichier_entrant, ' — Score: ', activity('ACT_Analyser_Appel').output.status.Output.result.exitValue, '/100')
   ```

5. Cette valeur apparaît dans **Monitor → Pipeline runs → Output** de chaque exécution

> 💡 L'alerte est déjà écrite dans `alertes_critiques` par le Notebook (Cellule 4). Cette activité Set Variable sert uniquement à rendre le statut **lisible dans le panneau Monitor** de Fabric sans outil supplémentaire.

**Branche FALSE — Logging normal :**

1. Dans la branche FALSE → **+ Add activity** → **Set variable**
2. Nommer : `ACT_Log_Normal`
3. Même variable `statut_traitement`
4. Valeur : `@concat('OK — ', pipeline().parameters.fichier_entrant, ' traité sans alerte')`

### 2.4 — Test manuel du Pipeline

1. Dans le Pipeline → cliquer **Validate** (barre du haut) → **Run**
2. Dans la popup → **fichier_entrant** : `Files/audio_calls/CALL_0001.txt`
3. Cliquer **OK**
4. Observer l'exécution dans le panneau **Output** en bas :
   - `ACT_Analyser_Appel` → statut In progress → Succeeded
   - `ACT_Condition_Alerte` → True ou False selon le score
   - Activité correspondante → Succeeded

--- 

### Bloc 3 — Déclencheur automatique (Approche hybride recommandée 2026)

> 💡 **Choix pédagogique 2026** :  
> L’approche pure Eventstream + Activator est intéressante pour le Real-Time, mais le passage dynamique du chemin du fichier (`fichier_entrant`) reste souvent instable.  
> Nous adoptons donc une **approche hybride** plus robuste et pédagogique :
> 
> - Eventstream pour la surveillance et le monitoring Real-Time
> - Déclencheur planifié toutes les 15 minutes (fiable et simple)
> - Détection automatique des nouveaux fichiers directement dans le Notebook

#### 3.1 — Créer l’Eventstream (pour monitoring Real-Time)

1. Dans le Workspace → **+ New item** → **Eventstream**
2. Nommer : `ES_Nouveaux_Appels`
3. Dans l’Eventstream → **+ Add source** → **OneLake events**
4. Configurer :
   - **Lakehouse** : `LH_SolarVoix`
   - **Event type** : `Microsoft.Fabric.OneLake.FileCreated`
5. Sélectionner le dossier `audio_calls`
6. Ajouter les filtres recommandés :
   - `data.api` **contains** `FlushWithClose`
   - `data.blobUrl` **contains** `audio_calls`
7. **Publish** l’Eventstream

> 💡 Cet Eventstream permet de visualiser les événements en temps réel dans le Real-Time Hub, même si le déclenchement principal se fait via le trigger planifié.

#### 3.2 — Configurer le déclencheur planifié (Solution principale recommandée)

1. Ouvre le Pipeline `PL_Traitement_Appel_Entrant`
2. Clique sur **Manage** (en haut à droite) → **Triggers** → **+ Add trigger**
3. Choisis **Schedule**
4. Configure le trigger :
   - **Name** : `TRG_Appels_Entrants`
   - **Recurrence** : **Every 15 minutes**
   - **Start time** : Date et heure actuelle
   - Laisse les autres options par défaut
5. Clique sur **Apply** puis **Publish** le Pipeline

#### 3.3 — Modifier le Notebook pour la détection automatique des nouveaux fichiers

Remplace la  ****Cellule 1** du Notebook `NB_Traitement_Incremental` par le code suivant :

```python
# === CELLULE 1 : Paramètre + Détection automatique des nouveaux fichiers ===
#
# OBJECTIF : Garder la compatibilité avec les tests manuels ET permettre 
#            la détection automatique quand le Notebook est appelé par le Pipeline planifié.

# Valeur par défaut pour tests manuels du Notebook
call_file_path = "Files/audio_calls/CALL_0001.txt"

try:
    # === Détection automatique des nouveaux fichiers ===
    fichiers_dossier = mssparkutils.fs.ls("Files/audio_calls/")
    ids_dossier = {
        f.name.replace(".txt", "")
        for f in fichiers_dossier
        if f.name.endswith(".txt")
    }

    # call_ids déjà traités dans silver_appels_enrichis
    df_silver = spark.table("silver_appels_enrichis")
    ids_silver = {row.call_id for row in df_silver.select("call_id").collect()}

    nouveaux_ids = ids_dossier - ids_silver

    print(f"📊 Fichiers présents dans audio_calls : {len(ids_dossier)}")
    print(f"📊 Appels déjà traités dans Silver    : {len(ids_silver)}")
    print(f"📊 Nouveaux appels à traiter          : {len(nouveaux_ids)}")

    if nouveaux_ids:
        # On prend le plus ancien (tri alphabétique)
        call_id_temp = sorted(nouveaux_ids)[0]
        call_file_path = f"Files/audio_calls/{call_id_temp}.txt"
        print(f"🚀 Nouveau fichier détecté automatiquement → {call_file_path}")
    else:
        print("✅ Aucun nouveau fichier détecté. Utilisation de la valeur par défaut pour test manuel.")

except Exception as e:
    print(f"⚠️ Erreur lors de la détection automatique : {e}")
    print("→ Utilisation de la valeur par défaut du paramètre.")

print(f"Paramètre final utilisé : call_file_path = {call_file_path}")
```

### Ordre d’exécution pour le test (le plus efficace) :

1. **D’abord** : Exécute le Notebook de test (`Test_Simulation_Appel_Critique`)
   → Cela crée le fichier `CALL_0121.txt` dans le dossier `Files/audio_calls/`

2. **Ensuite** : Tu as deux possibilités :
   
   - **Option rapide (recommandée pour tester maintenant)** :  
     Va dans ton Pipeline `PL_Traitement_Appel_Entrant` → clique sur **Debug**  
     → Lance l’exécution manuelle du Pipeline.
   
   - **Option automatique** :  
     Attends que le trigger planifié se déclenche (toutes les 15 minutes).

---

### 3.4 — Test de bout en bout

1. **Créer un Notebook dédié au test** :
   
   - Workspace → **+ New item** → **Notebook**
   - Nom : `Test_Simulation_Appel_Critique`
   - Attacher le Lakehouse `LH_SolarVoix`

2. **Étape 0 — Initialiser la table `alertes_critiques`** (à exécuter en premier) :
   
   > Cette cellule crée la table vide si elle n’existe pas encore, ce qui évite l’erreur `Invalid object name` lors des vérifications SQL ultérieures.

```python
# === INITIALISATION — Création préventive de la table alertes_critiques ===
from pyspark.sql.types import StructType, StructField, StringType, IntegerType, TimestampType
from datetime import datetime

schema_alertes = StructType([
    StructField("call_id",             StringType(),    True),
    StructField("client_id",           StringType(),    True),
    StructField("produit",             StringType(),    True),
    StructField("score_risque_churn",  IntegerType(),   True),
    StructField("sentiment_ia",        StringType(),    True),
    StructField("intent_detecte",      StringType(),    True),
    StructField("resume_appel",        StringType(),    True),
    StructField("statut",              StringType(),    True),
    StructField("date_alerte",         TimestampType(), True),
])

# Crée la table Delta vide seulement si elle n’existe pas déjà
if not spark.catalog.tableExists("alertes_critiques"):
    df_vide = spark.createDataFrame([], schema_alertes)
    df_vide.write.format("delta").saveAsTable("alertes_critiques")
    print("✅ Table alertes_critiques créée (vide) — prête à recevoir des alertes.")
else:
    print("ℹ️ Table alertes_critiques déjà existante.")
```

3. **Exécuter le script de simulation** :

```python
# === TEST DE SIMULATION — Création d’un nouvel appel critique ===

texte_critique = """[Appel entrant - 08/04/2026] Client : Marie Dubois.
Produit concerné : Pompe à chaleur PAC.
Transcription : Je suis extrêmement en colère. Votre pompe à chaleur est tombée en panne
pour la troisième fois ce mois-ci. J’ai des enfants en bas âge et il fait froid.
J’ai contacté votre SAV cinq fois sans résultat. Je vais résilier mon contrat dès demain
et contacter mon avocat. C’est inadmissible et je veux un remboursement complet."""

mssparkutils.fs.put(
    "Files/audio_calls/CALL_0121.txt",
    texte_critique,
    overwrite=True
)

print("✅ Fichier CALL_0121.txt créé dans audio_calls/")
```

4. **Lancer le Pipeline** :
   
   > 💡 **Pourquoi lancer manuellement alors qu'on a configuré un déclencheur automatique ?**
   > 
   > Dans cette architecture, **rien ne déclenche le Pipeline instantanément à l'arrivée du fichier** :
   > 
   > - L'**Eventstream** (Bloc 3.1) observe les événements OneLake mais **ne lance pas le Pipeline** — c'est un outil de monitoring visuel.
   > - L'**Activator** (Bloc 4) réagit à des **données dans une table Delta** (score churn ≥ 50) — il n'écoute pas les fichiers.
   > - Le **trigger planifié** (Bloc 3.2) est le seul qui lance vraiment le Pipeline, mais toutes les 15 minutes.
   > 
   > En **production** : déposer le fichier suffit — le trigger planifié le traitera dans les 15 min.
   > En **test** : on utilise **Debug** pour déclencher immédiatement sans attendre.
   
   - **Pour tester maintenant** : Pipeline `PL_Traitement_Appel_Entrant` → **Run**
   - **En production** : rien à faire — le trigger planifié `TRG_Appels_Entrants` s'en charge automatiquement

5. **Vérifier le résultat** :
   
   **a) Vérifier l'exécution du Pipeline via le Monitoring Fabric**
   
   Le **Monitor** est le panneau de surveillance centralisé de Microsoft Fabric. Il affiche l'historique de toutes les exécutions de Pipelines, Notebooks et Dataflows de votre workspace.
   
   Pour y accéder :
   
   1. Dans la barre latérale gauche de Fabric → cliquez sur l'icône **Monitor** (icône chronomètre/horloge)
   2. Section **Pipeline runs** → cherchez `PL_Traitement_Appel_Entrant`
   3. Vérifiez que le statut est **Succeeded** (cercle vert)
   4. Cliquez sur le nom de l'exécution pour voir le détail activité par activité
   
   **b) Vérifier les données dans le Lakehouse** 

```sql
SELECT * FROM silver_appels_enrichis WHERE call_id = ‘CALL_0121’;
SELECT * FROM alertes_critiques WHERE call_id = ‘CALL_0121’;
```

---

**Résumé simple :**

1. Exécuter la cellule **Étape 0** → la table `alertes_critiques` est garantie d’exister
2. Exécuter le script de simulation → fichier `CALL_0121.txt` créé
3. Lancer le Pipeline → traitement + écriture alerte
4. Vérifier via `spark.sql()` ou SQL endpoint