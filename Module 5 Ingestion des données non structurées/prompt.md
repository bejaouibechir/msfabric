### Présentation du contexte (à mettre en introduction de votre document ou de votre prompt global)

**Contexte pour la création des ateliers :**

Les trois ateliers existants sur le traitement des données non structurées 

0.Partie I - Ingestion, transcription et analyse d’appels clients audio

1.Partie II - Gestion des cas appels très négatifs 
2.Partie III - Visualisation de score de risque churn en temps réel

(appels clients audio MP3 dans le secteur des énergies renouvelables) sont **médiocres, très très mal concu, bâclés et insuffisants** pour un atelier formateur de 3 heures ou plus. Ils sont trop courts, manquent de profondeur pédagogique, ne diversifient pas assez les outils Microsoft Fabric (trop centrés sur les Notebooks), omettent des explications détaillées sur l’obtention des prérequis (comme les clés Azure AI Services), et ne permettent pas de maintenir l’étudiant occupé suffisamment longtemps avec des manipulations riches et progressives.

L’objectif est de **recréer entièrement ces trois parties** de manière **complète, professionnelle et engageante**, en s’inspirant de la structure et de la richesse de l’atelier « Atelier warehouse.md »  quise trouve dans le dossier Module 4 Whare house (qui m'a pris  3h13 minutes pour le réaliser). Chaque partie doit être autonome tout en formant une progression logique, avec des explications pas-à-pas, des astuces, des pièges courants, des contrôles qualité, et des exercices optionnels pour étendre le temps.

**Exigences globales pour tous les prompts :**

- Durée cible : viser 3 heures ou mêmeplus (ou au total pour les 3) grâce à des étapes détaillées, diagnostics, optimisations,requêtes d'analyses bien interpretées visualisations avancées et bonnes pratiques.
- Contenu riche en manœuvres Microsoft Fabric : combiner Notebooks (PySpark + SynapseML), **Dataflow Gen2** (avec AI Functions / prompts IA), **Pipelines Data Factory**, **Eventstream**, **Activator (Real-Time Intelligence)**, **Lakehouse** (Bronze/Silver/Gold), **Warehouse** si possible , **Power BI** report  ( mesures DAX), et **Semantic Link** si possible. Une partie de visualisation avec seaborn et matplotlib avec des interpretations pertinentes, je peux vous aider par exemple par l'execution et la reception des resultats que je vous communique pour interpreter. 
- Pour toute clé API ou ressource Azure : inclure une section dédiée « Comment obtenir la clé / ressource » avec étapes précises dans le portail Azure, 
  Une cellule comme cet exemple est intolerable et refusée
  
  from pyspark.sql import functions as F
  from pyspark.sql.types import *
  from synapse.ml.cognitive import *
  from synapse.ml.core.platform import *
  
  print("Imports terminés")
  
  cognitive_key = "VOTRE_CLE_AZURE_AI_SERVICES" # ← remplacez  <- laisser le partiticipant à sa entiere responsabilité à obtenir la clé sans démarche est refusé c'est très maladroit de la part du formateur ou le concepteur de l'atelier!!!!
  cognitive_region = "francecentral" # ou westeurope
  
  print("Clé et région configurées")
  
  
  
- Style : formateur expert, ton clair, captures d’écran suggérées (texte descriptif), tableaux récapitulatifs, interprétations métier, et exercices bonus pour prolonger l’atelier.
- Thème : 120 appels clients audio (panneaux solaires, PAC, bornes VE) avec transcription, sentiment, intent, score de risque churn, alertes et visualisation temps réel.
  
  Il est possible de s'inspirer du style de l'atelier  Module 5 Ingestion des données non structurées\Atelier warehouse.md qui est excellent

---

Ceux ci sont des exemples de prompts pour vous inspirer mais vous pouvez ne pas se limiter à ce qui se trouve dans ces prompts si vous avec des suggestions et idées plus pertinentes 

### **Partie 1 – Prompt suggéré**

**(Ingestion, transcription, enrichissement IA + nettoyage des données audio)**

Tu es un expert formateur Microsoft Fabric. Crée un atelier complet, détaillé et pédagogique intitulé :

"Atelier 5 – Traitement des données non structurées : Ingestion, transcription et enrichissement IA d’appels clients audio (énergies renouvelables) dans Microsoft Fabric – Partie 1"

L’atelier doit durer environ 3 heures ou plus. Il corrige les défauts de la version existante (trop courte, manque d’explications sur les clés API, peu de diversité d’outils).

**Objectif concret de la partie 1 :**  
Charger 120 fichiers MP3 d’appels clients, les transcrire, analyser sentiment/intent/score churn avec IA, nettoyer/enrichir les données, et créer une table Silver exploitable en Direct Lake.

**Structure détaillée à suivre (inspirée de l’atelier Warehouse) :**

- Contexte métier + problématiques (appels négatifs = risque churn, besoin de suivi SAV en temps réel).
- Prérequis : création du workspace, Lakehouse (nommés précisément), upload des fichiers.
- Section obligatoire : "Comment obtenir une ressource Azure AI Services (Speech + Language) et la clé" → étapes précises dans le portail Azure (créer un Cognitive Services multi-service ou Speech + Language séparés, récupérer key + region, options BYOK vs Foundry Tools intégrés dans Fabric).
- Fournir ou expliquer comment générer les 120 MP3 (script Python exemple ou lien vers un générateur fictif) + metadata.csv.
- Utiliser **plusieurs outils diversifiés** :
  - Notebook PySpark pour ingestion binaryFile + SynapseML (SpeechToTextSDK + TextSentiment).
  - **Dataflow Gen2** pour une partie du nettoyage/enrichissement (utiliser AI Functions avec prompts en langage naturel pour extraire intent ou score churn).
  - Lakehouse avec couches Bronze → Silver (Delta tables, optimisation avec Z-order ou Vacuum si pertinent).
- Inclure : diagnostic qualité (nulls, confiance transcription), nettoyage (standardisation intent avec règles + fallback LLM), calcul d’un score risque churn simple, contrôles qualité SQL, interprétations métier.
- Ajouter astuces, pièges courants, bonnes pratiques (concurrency, coût IA, confidentialité audio).
- Terminer par création d’un rapport Power BI Direct Lake basique (table + slicers + mise en forme conditionnelle) et exercices bonus pour prolonger le temps.
- Fournir tout le code/notebook/Dataflow pas-à-pas avec explications ligne par ligne.

Rendre l’atelier très riche : captures d’écran textuelles, tableaux récapitulatifs, questions de réflexion, et progression pas-à-pas comme dans l’atelier Warehouse.

---

### **Partie 2 – Prompt suggéré**

**(Pipeline automatisé déclenché + alertes sur appels très négatifs)**

Tu es un expert formateur Microsoft Fabric. Crée un atelier complet, détaillé et pédagogique intitulé :

"Atelier 6 – Traitement des données non structurées : Pipeline déclenché par arrivée de fichier + alerte Activator sur appels très négatifs – Partie 2"

L’atelier doit durer environ 3 heures ou plus (ou s’intégrer pour atteindre ce total avec la partie 1). Il corrige les défauts de la version existante (trop courte, manque de profondeur sur les déclencheurs et orchestration).

**Objectif concret de la partie 2 :**  
Créer un pipeline end-to-end automatisé qui se déclenche à l’arrivée d’un nouveau MP3, traite le fichier (transcription + enrichissement), met à jour la table Silver, et déclenche une alerte Teams via Activator pour tout appel « Très négatif » ou score churn élevé.

**Structure détaillée à suivre :**

- Rappel rapide de la partie 1 + lien logique.
- Section "Comment configurer les événements OneLake / Eventstream" avec étapes précises.
- Création d’un **Pipeline Data Factory** avec déclencheur **OneLake file event** (FileCreated sur dossier audio).
- Utiliser **diversité d’outils** :
  - Notebook paramétré (pour traiter un seul fichier dynamique).
  - **Dataflow Gen2** ou **Eventstream** pour routage/transformation légère.
  - **Activator (Real-Time Intelligence)** pour détection de condition (niveau_sentiment = 'Très négatif' ou Score Risque Churn > 70) et action (message Teams avec lien audio + transcription tronquée).
- Paramétrage dynamique du pipeline (passer le chemin du fichier via triggerBody()).
- Ajouter orchestration avancée : branchement conditionnel (If Condition), logging des erreurs, retry policy.
- Tests complets : simuler l’arrivée d’un fichier, vérifier exécution, alerte Teams, mise à jour table.
- Inclure : bonnes pratiques de coût (limiter concurrency), sécurité (RBAC sur Lakehouse), monitoring du pipeline, pièges (fichier incomplet pendant upload).
- Exercices bonus : ajouter une action "lancer un autre Notebook" ou "rafraîchir un Dataflow" via Activator.
- Rendre l’atelier riche : diagrammes d’architecture textuels, tableaux de configuration, interprétation métier (pourquoi alerter immédiatement sur churn), et progression pas-à-pas détaillée.

Style formateur : explications claires, astuces pro, et temps suffisant pour que l’étudiant manipule beaucoup.

---

### **Partie 3 – Prompt suggéré**

**(Visualisation avancée, score churn en temps réel + Copilot)**

Tu es un expert formateur Microsoft Fabric. Crée un atelier complet, détaillé et pédagogique intitulé :

"Atelier 7 – Traitement des données non structurées : Dashboard Power BI avancé + score de risque churn en temps réel avec Copilot – Partie 3"

L’atelier doit durer environ 3 heures ou plus (ou compléter les parties précédentes pour un total > 3h). Il corrige les défauts de la version existante (trop courte, DAX simpliste, peu d’exploitation de Copilot et rafraîchissement temps réel).

**Objectif concret de la partie 3 :**  
Créer un rapport Power BI opérationnel avec score risque churn calculé, visualisations avancées, analyse conversationnelle via Copilot, et mise à jour quasi temps réel via Direct Lake + Activator/Dataflow.

**Structure détaillée à suivre :**

- Rappel des parties 1-2 + architecture globale.
- Création du rapport depuis le Lakehouse (Direct Lake mode).
- **Diversité d’outils** :
  - Mesures DAX avancées (score churn pondéré : négativité 65% + intent critique 35%, YoY, etc.).
  - Power BI Copilot pour générer mesures DAX, pages de rapport, narratives et visuels en langage naturel.
  - Mise en forme conditionnelle, drill-through, bookmarks, visual interactions.
  - Intégration Real-Time Intelligence : rafraîchissement automatique via Activator ou Dataflow Gen2 planifié.
- Pages du rapport détaillées (Vue Globale, Risque Churn & Prioritaires, Analyse Conversationnelle avec Copilot).
- Visuels riches : KPIs, jauge, donut, treemap, scatter (profil appels), tableau avec drill-through sur détail appel.
- Calcul et visualisation du **Score Risque Churn** (expliquer la logique métier : résiliation + SAV + score négatif élevé = churn imminent).
- Tests : poser des questions en langage naturel à Copilot ("montre les 10 appels les plus critiques", "résume les plaintes facturation"), ajouter un nouveau MP3 et voir la mise à jour.
- Section "Comment activer et utiliser Copilot dans Power BI Fabric" + exemples de prompts efficaces.
- Bonne pratiques : thème corporate, navigation boutons, glossaire mesures, page méthodologie.
- Exercices bonus : ajouter un Real-Time Dashboard ou connecter à un Eventhouse pour streaming.

Rendre l’atelier très engageant : exemples de prompts Copilot, mises en forme pas-à-pas, interprétations métier (comment utiliser le dashboard pour réduire le churn), et suffisamment d’étapes pour occuper 3h+.

Style : comme l’atelier Warehouse, avec visuels décrits précisément, astuces, pièges, et progression pédagogique.

Ces trois prompts sont **autonomes**, **complets** et directement exploitables (par exemple dans ChatGPT, Claude ou Grok avec un bon modèle). Ils garantissent une **diversité des outils Fabric**, des explications sur les clés API, et une **durée réaliste** grâce à la richesse des manipulations.

Si vous voulez que j’affine un prompt spécifique, que j’ajoute une partie 4 (ex. : intégration Warehouse + ML scoring), ou que je génère directement un atelier complet à partir de l’un d’eux, dites-le-moi ! Nous pouvons aussi discuter de la séquence globale des ateliers pour maximiser l’engagement des étudiants.
