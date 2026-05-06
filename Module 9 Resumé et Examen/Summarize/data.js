// data.js — Généré automatiquement
const PRESENTATION = {
  "title": "MS Fabric – Formation Interactive",
  "generated": "2026-05-05",
  "chapters": [
    {
      "id": "ch-0",
      "title": "Module 1 – Dataflows Gen2 : Nettoyage & Harmonisation",
      "file": "0.les dataflows partie 1.md",
      "slideIds": [
        "s-0-0",
        "s-0-1"
      ]
    },
    {
      "id": "ch-1",
      "title": "Module 1 – Dataflows Gen2 : Techniques Avancées",
      "file": "1.les dataflows partie 2.md",
      "slideIds": [
        "s-1-0",
        "s-1-1",
        "s-1-2"
      ]
    },
    {
      "id": "ch-2",
      "title": "Module 2 – Pipelines : Concepts & Activités",
      "file": "2.les pipeline introduction.md",
      "slideIds": [
        "s-2-0",
        "s-2-1"
      ]
    },
    {
      "id": "ch-3",
      "title": "Module 2 – Pipelines : Étude de Cas 1",
      "file": "3. les pipeline partie 1.md",
      "slideIds": [
        "s-3-0",
        "s-3-1",
        "s-3-2",
        "s-3-3"
      ]
    },
    {
      "id": "ch-4",
      "title": "Module 2 – Pipelines : Étude de Cas 2",
      "file": "4.les pipelines partie 2.md",
      "slideIds": [
        "s-4-0",
        "s-4-1",
        "s-4-2"
      ]
    },
    {
      "id": "ch-5",
      "title": "Module 3 – Notebooks & Architecture Medallion",
      "file": "5.Les notebooks.md",
      "slideIds": [
        "s-5-0",
        "s-5-1"
      ]
    },
    {
      "id": "ch-6",
      "title": "Module 4 – Warehouse & Modèle Sémantique",
      "file": "6.Warehouse.md",
      "slideIds": [
        "s-6-0",
        "s-6-1",
        "s-6-2"
      ]
    },
    {
      "id": "ch-7",
      "title": "Module 6 & 8 – Sécurité et Gouvernance",
      "file": "7.Securisation.md",
      "slideIds": [
        "s-7-0",
        "s-7-1",
        "s-7-2"
      ]
    }
  ],
  "slides": [
    {
      "id": "s-0-0",
      "index": 0,
      "chapterId": "ch-0",
      "chapterTitle": "Module 1 – Dataflows Gen2 : Nettoyage & Harmonisation",
      "title": "Module 1 – Dataflows Gen2 : Nettoyage & Harmonisation",
      "content": "<p>Dataflow Gen2 résout les problèmes de qualité de données en automatisant le nettoyage, l'harmonisation et l'enrichissement des données via une interface visuelle et des transformations programmables. Selon les sources, voici comment il traite spécifiquement les anomalies identifiées :</p>\n<ol>\n<li>Nettoyage automatisé des données</li>\n</ol>\n<p>Dataflow Gen2 permet d'éliminer les erreurs qui faussent les calculs de production :</p>\n<ul>\n<li>\n<p><strong>Suppression des valeurs invalides :</strong> Il filtre les codes d'erreur (comme le code \"-888\" dans les données solaires) et supprime les lignes contenant des erreurs ou des valeurs manquantes (NaN). <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n</li>\n<li>\n<p><strong>Élimination des doublons :</strong> Il permet de supprimer les doublons exacts ou basés sur des colonnes spécifiques (par exemple, le couple \"timestamp + parc_id\"), évitant ainsi une surestimation de la production qui pourrait coûter jusqu'à 190 200 € d'erreurs de décision.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span><br />\n2. Harmonisation des formats et des unités</p>\n</li>\n</ul>\n<p>Pour résoudre le problème des silos de données incompatibles, Dataflow Gen2 standardise les informations :</p>\n<ul>\n<li>\n<p><strong>Unification des dates :</strong> Il transforme plusieurs formats (DD/MM/YYYY et YYYY-MM-DD) en un format de date standard unique. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n</li>\n<li>\n<p><strong>Conversion d'unités :</strong> Il harmonise les mesures hétérogènes, par exemple en convertissant les MWh en kWh pour que toutes les sources utilisent la même unité. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></p>\n</li>\n<li>\n<p><strong>Normalisation de la nomenclature :</strong> Il permet de renommer les variables (ex: <code>parc_code</code> ou <code>PlantID</code> deviennent <code>parc_id</code>) et de nettoyer les noms de sites (suppression des suffixes comme \"-var\") pour assurer la cohérence des jointures. 6 <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span><br />\n3. Enrichissement et contexte métier</p>\n</li>\n</ul>\n<p>Au-delà du simple nettoyage, Dataflow Gen2 améliore la qualité en ajoutant du contexte :</p>\n<ul>\n<li><strong>Jointures de données :</strong> Il fusionne les données de production avec des calendriers de maintenance et des données météo, permettant de distinguer une baisse de production normale (maintenance ou manque de vent) d'une véritable anomalie technique. <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span>  <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></li>\n<li><strong>Colonnes calculées :</strong> Il crée des indicateurs fiables comme le \"facteur de charge\" ou la \"production ajustée\" directement durant le flux de données. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span><br />\n4. Automatisation et innovations 2025</li>\n<li>\n<p><strong>Orchestration :</strong> En intégrant le Dataflow dans un pipeline planifié (ex: tous les matins à 6h15), la qualité est maintenue quotidiennement sans intervention manuelle, réduisant le \"time-to-insight\" de plusieurs heures à quelques minutes. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></p>\n</li>\n<li>\n<p><strong>Copilot IA :</strong> Les nouvelles fonctionnalités permettent d'utiliser le langage naturel pour générer des transformations complexes, facilitant la correction des problèmes de qualité par les ingénieurs. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>  <span class=\"ref\" data-ref-id=\"ref-11\">[11]</span></p>\n</li>\n<li>\n<p><strong>Moteur de calcul (Modern Evaluator) :</strong> Ce nouveau moteur accélère le traitement de 20 à 30 %, permettant de valider et de transformer de gros volumes de données plus efficacement. <span class=\"ref\" data-ref-id=\"ref-11\">[11]</span>  <span class=\"ref\" data-ref-id=\"ref-12\">[12]</span></p>\n</li>\n</ul>\n<p>En résumé, Dataflow Gen2 transforme des données brutes hétérogènes et \"médiocres\" en une source de vérité propre (0 doublon, 0 code erreur, dates unifiées) stockée de manière optimisée dans un Lakehouse.  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></p>\n<p>L'élimination des doublons grâce à Dataflow Gen2 génère des gains financiers significatifs en évitant des erreurs de reporting et de pilotage.</p>\n<p>Selon les sources, les gains spécifiques sont les suivants :</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "introduction",
          "excerpt": "Vous êtes data engineer chez GreenEnergy France, un opérateur multi-énergies qui gère : - 4 parcs solaires (Paris, Lyon, Marseille, Bordeaux) - 5 parcs éoliens (Normandie, Bretagne, Picardie, Pays de la Loire, Centre) - 3 centrales hydrauliques (Rhône, Alpes, Pyrénées) Objectif de l'atelier : Créer ",
          "url": "sources/module1-atelier1.html#introduction"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etat-des-lieux",
          "excerpt": "- solaire2025.csv (1,460 lignes) : ❌ Valeurs NaN, ❌ Codes erreur -888, ❌ Nomenclature incohérente. - eolien2025.csv (1,975 lignes) : ❌ 150 doublons exacts, ❌ États \"Duplicate\", ❌ Unités en MWh (vs kWh). - hydro2025.csv (2,190 lignes) : ❌ 2 formats de dates, ❌ Noms variables (HYDRHONE vs HYDRHONE-var",
          "url": "sources/module1-atelier1.html#etat-des-lieux"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "problematique",
          "excerpt": "- Silos de données incompatibles : Schémas différents, formats de dates multiples, unités hétérogènes (kWh vs MWh). Impact : 2-3 heures/jour de préparation manuelle. - Qualité de données médiocre : Doublons causant une surestimation de 1,268 MWh (190,200 € d'erreur potentielle), valeurs manquantes e",
          "url": "sources/module1-atelier1.html#problematique"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "problematique",
          "excerpt": "- Processus manuel : données disponibles à 11h30 alors qu'elles arrivent à 6h00. - Manque d'automatisation : Pas de planification automatique ni de contexte métier (météo, maintenance) intégré initialement.",
          "url": "sources/module1-atelier1.html#problematique"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "solutions-apportees-par-dataflow-gen2",
          "excerpt": "- Unifier : Ingestion multi-sources native. - Nettoyer : Transformations M automatisées. - Enrichir : Jointures avec météo et calendrier. - Automatiser : Pipeline planifié quotidiennement à 6h15. - Stocker : Lakehouse Delta avec mode Append.",
          "url": "sources/module1-atelier1.html#solutions-apportees-par-dataflow-gen2"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "nouveautes-2025-de-dataflow-gen2",
          "excerpt": "- Copilot intégré : Création de transformations en langage naturel. - Modern Evaluator : Exécution 20-30% plus rapide. - Partitioned Compute : Traitement parallèle des fichiers. - Réduction de coût : 25% de réduction sur les 10 premières minutes de pricing.",
          "url": "sources/module1-atelier1.html#nouveautes-2025-de-dataflow-gen2"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-1-creer-le-dataflow-gen2",
          "excerpt": "1. Création via + New → Dataflow Gen2 (Nom : DFHarmonisationProductionRenouvelable). 2. Ingestion via Get data → OneLake data hub. 3. Sélection des 4 fichiers CSV (solaire, eolien, hydro, calendriermeteo) dans le Lakehouse.",
          "url": "sources/module1-atelier1.html#etape-1-creer-le-dataflow-gen2"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-21-nettoyage-solaire",
          "excerpt": "1. Transform → Detect Data Type. 2. Home → Remove Rows → Remove Errors. 3. Home → Filter Rows → productionkwh ≠ -888. 4. Home → Remove Duplicates (timestamp + parcid). 5. Transform → Rename : timestamp → date et changement de type en Date. Résultat : 1,460 → 1,370 lignes.",
          "url": "sources/module1-atelier1.html#etape-21-nettoyage-solaire"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-22-nettoyage-eolien",
          "excerpt": "1. Home → Remove Duplicates (toutes les colonnes). 2. Home → Filter Rows → etat ≠ \"Duplicate\". 3. Transformation de l'unité (MWh vers kWh). 4. Transform → Rename : parccode → parcid. Résultat : 1,975 → 1,770 lignes (-10% de doublons).",
          "url": "sources/module1-atelier1.html#etape-22-nettoyage-eolien"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-23-nettoyage-hydro",
          "excerpt": "1. Transform → Replace Values : supprimer le suffixe \"-var\" dans PlantID. 2. Transform → Data Type → Date pour ReadingDate. 3. Home → Remove Duplicates (ReadingDate + PlantID). 4. Harmonisation des noms : ReadingDate → date, PlantID → parcid. Résultat : 2,190 → 1,095 lignes (fusion des variantes eff",
          "url": "sources/module1-atelier1.html#etape-23-nettoyage-hydro"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-3-fusion-et-enrichissement",
          "excerpt": "1. Append Queries as New : Union des tables solaire, éolien et hydro en une table `productionalltypes`. 2. Merge Queries as New : Jointure (Left Outer) avec la table `calendriermeteomaintenance` basée sur la colonne `date`. 3. Expansion des colonnes : weekend, maintenance, pluiemm, ventmps, jour, mo",
          "url": "sources/module1-atelier1.html#etape-3-fusion-et-enrichissement"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-4-a-7-destination-test-et-orchestration",
          "excerpt": "1. Destination : Lakehouse `LHEnergiesRenouvelables` (Table : `productionenergiesrenouvelables`, mode Append). 2. Test : Refresh manuel (Statut = \"Succeeded\"). 3. Orchestration : Création d'un Data pipeline planifié à 06:15 tous les jours avec notification Outlook et 3 tentatives de retry en cas d'e",
          "url": "sources/module1-atelier1.html#etape-4-a-7-destination-test-et-orchestration"
        }
      }
    },
    {
      "id": "s-0-1",
      "index": 1,
      "chapterId": "ch-0",
      "chapterTitle": "Module 1 – Dataflows Gen2 : Nettoyage & Harmonisation",
      "title": "Module 1 – Dataflows Gen2 : Nettoyage & Harmonisation (2/2)",
      "content": "<ul>\n<li><strong>Évitement d'erreurs de décision :</strong> La suppression des doublons permet d'éviter une surestimation de la production de <strong>1 268 MWh</strong>, ce qui représente un gain de <strong>190 200 € en erreurs potentielles évitées</strong>. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Fiabilité des données éoliennes :</strong> Le processus de nettoyage a permis d'identifier et d'éliminer <strong>150 doublons exacts</strong> provenant spécifiquement des données de production éolienne, qui auraient autrement faussé les indicateurs de performance. <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Optimisation des coûts opérationnels :</strong> En automatisant cette tâche (auparavant effectuée manuellement dans Excel), l'entreprise économise également environ <strong>30 000 € par an</strong> en temps de travail humain, libérant les ingénieurs de 2 heures de préparation manuelle quotidienne. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n</ul>\n<p>En résumé, la correction de la \"qualité de données médiocre\" via l'élimination des doublons sécurise près de <strong>200 000 €</strong> de budget en garantissant que les décisions d'investissement et d'exploitation reposent sur une production réelle et non gonflée artificiellement.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<p>L'orchestration planifiée à <strong>6h15</strong> via Dataflow Gen2 apporte des bénéfices opérationnels et financiers majeurs en automatisant la chaîne de traitement des données dès leur arrivée.</p>\n<p>D'après les sources, voici les principaux avantages de cette planification :</p>\n<ol>\n<li>Amélioration radicale du \"Time-to-insight\"</li>\n</ol>\n<p>L'un des gains les plus visibles concerne la rapidité de mise à disposition de l'information :</p>\n<ul>\n<li>\n<p><strong>Réduction des délais :</strong> Avant l'automatisation, le processus était manuel et les données n'étaient disponibles qu'à <strong>11h30</strong>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n</li>\n<li>\n<p><strong>Disponibilité immédiate :</strong> Les données brutes arrivent à 6h00. En lançant le pipeline à 6h15, le temps d'accès à l'information (time-to-insight) passe de <strong>5h30 à seulement 5 minutes</strong> grâce au rafraîchissement automatique.  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span><br />\n2. Économies de coûts et de temps humain</p>\n</li>\n</ul>\n<p>L'automatisation à heure fixe remplace une préparation manuelle fastidieuse :</p>\n<ul>\n<li>\n<p><strong>Gain de productivité :</strong> Elle élimine <strong>2 à 3 heures par jour</strong> de préparation manuelle sous Excel.    <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></p>\n</li>\n<li>\n<p><strong>Impact financier :</strong> Ce temps économisé représente environ 500 heures par an, soit une économie directe estimée à <strong>30 000 €/an</strong>.    <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span><br />\n3. <strong>Fiabilité et réactivité opérationnelle</strong></p>\n</li>\n</ul>\n<p>Le déclenchement automatique à 6h15 permet de sécuriser le pilotage des parcs énergétiques :</p>\n<ul>\n<li><strong>Alertes précoces :</strong> L'orchestration permet de générer des <strong>alertes automatiques sur anomalies</strong> dès le début de la journée de travail.  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Dashboard à jour :</strong> Elle garantit un <strong>dashboard unifié en temps réel</strong> (ou quasi réel) pour le monitoring des parcs solaires, éoliens et hydrauliques. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Gestion des erreurs :</strong> Le pipeline est configuré pour effectuer jusqu'à <strong>3 tentatives (retries)</strong> en cas d'échec, assurant que les données seront prêtes même en cas de problème technique passager lors de l'ingestion initiale.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n</ul>\n<p>En résumé, cette orchestration transforme un processus manuel lent et coûteux en un flux de données <strong>fiable, rapide et économique</strong>, permettant de prendre des décisions basées sur des données propres dès le début de la matinée.</p>\n<p>En 2025, Dataflow Gen2 intègre plusieurs innovations majeures visant à améliorer la productivité, la performance et à réduire les coûts opérationnels. Voici les principales nouveautés identifiées dans les sources :</p>\n<ol>\n<li><strong>Assistance par Intelligence Artificielle</strong><br />\n- <strong>Copilot intégré :</strong> Il est désormais possible de créer des transformations de données complexes en utilisant simplement le <strong>langage naturel</strong>, ce qui simplifie grandement le travail des ingénieurs. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Améliorations de la Performance</strong><br />\n- <strong>Modern Evaluator :</strong> Ce nouveau moteur d'exécution est <strong>20 à 30 % plus rapide</strong> que l'ancien moteur. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n</ol>\n<ul>\n<li><strong>Partitioned Compute :</strong> Cette fonctionnalité permet le <strong>traitement parallèle</strong> des fichiers stockés dans ADLS Gen2 ou le Lakehouse, optimisant ainsi les temps de chargement.<br />\n3. <strong>Optimisation des Coûts</strong></li>\n<li>\n<p><strong>Pricing 2-tier :</strong> Une nouvelle structure tarifaire offre une <strong>réduction de 25 % sur les 10 premières minutes</strong> d'exécution. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n</li>\n<li>\n<p><strong>Économie de Capacity Units (CU) :</strong> Grâce à l'efficacité du <em>Modern Evaluator</em>, les entreprises peuvent réaliser jusqu'à <strong>30 % d'économie</strong> sur leur consommation de ressources Fabric. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span><br />\n4. Gouvernance et Découverte</p>\n</li>\n<li><strong>OneLake Catalog :</strong> Cette nouveauté permet une <strong>découverte simplifiée des sources de données</strong> au sein de l'écosystème Fabric, facilitant l'accès aux informations nécessaires pour les flux de données. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n</ul>\n<p>Voici les références extraites de la source pour les contenus demandés, présentées selon le format souhaité :</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "introduction",
          "excerpt": "Vous êtes data engineer chez GreenEnergy France, un opérateur multi-énergies qui gère : - 4 parcs solaires (Paris, Lyon, Marseille, Bordeaux) - 5 parcs éoliens (Normandie, Bretagne, Picardie, Pays de la Loire, Centre) - 3 centrales hydrauliques (Rhône, Alpes, Pyrénées) Objectif de l'atelier : Créer ",
          "url": "sources/module1-atelier1.html#introduction"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etat-des-lieux",
          "excerpt": "- solaire2025.csv (1,460 lignes) : ❌ Valeurs NaN, ❌ Codes erreur -888, ❌ Nomenclature incohérente. - eolien2025.csv (1,975 lignes) : ❌ 150 doublons exacts, ❌ États \"Duplicate\", ❌ Unités en MWh (vs kWh). - hydro2025.csv (2,190 lignes) : ❌ 2 formats de dates, ❌ Noms variables (HYDRHONE vs HYDRHONE-var",
          "url": "sources/module1-atelier1.html#etat-des-lieux"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "problematique",
          "excerpt": "- Silos de données incompatibles : Schémas différents, formats de dates multiples, unités hétérogènes (kWh vs MWh). Impact : 2-3 heures/jour de préparation manuelle. - Qualité de données médiocre : Doublons causant une surestimation de 1,268 MWh (190,200 € d'erreur potentielle), valeurs manquantes e",
          "url": "sources/module1-atelier1.html#problematique"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "problematique",
          "excerpt": "- Processus manuel : données disponibles à 11h30 alors qu'elles arrivent à 6h00. - Manque d'automatisation : Pas de planification automatique ni de contexte métier (météo, maintenance) intégré initialement.",
          "url": "sources/module1-atelier1.html#problematique"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "solutions-apportees-par-dataflow-gen2",
          "excerpt": "- Unifier : Ingestion multi-sources native. - Nettoyer : Transformations M automatisées. - Enrichir : Jointures avec météo et calendrier. - Automatiser : Pipeline planifié quotidiennement à 6h15. - Stocker : Lakehouse Delta avec mode Append.",
          "url": "sources/module1-atelier1.html#solutions-apportees-par-dataflow-gen2"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "nouveautes-2025-de-dataflow-gen2",
          "excerpt": "- Copilot intégré : Création de transformations en langage naturel. - Modern Evaluator : Exécution 20-30% plus rapide. - Partitioned Compute : Traitement parallèle des fichiers. - Réduction de coût : 25% de réduction sur les 10 premières minutes de pricing.",
          "url": "sources/module1-atelier1.html#nouveautes-2025-de-dataflow-gen2"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-1-creer-le-dataflow-gen2",
          "excerpt": "1. Création via + New → Dataflow Gen2 (Nom : DFHarmonisationProductionRenouvelable). 2. Ingestion via Get data → OneLake data hub. 3. Sélection des 4 fichiers CSV (solaire, eolien, hydro, calendriermeteo) dans le Lakehouse.",
          "url": "sources/module1-atelier1.html#etape-1-creer-le-dataflow-gen2"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-21-nettoyage-solaire",
          "excerpt": "1. Transform → Detect Data Type. 2. Home → Remove Rows → Remove Errors. 3. Home → Filter Rows → productionkwh ≠ -888. 4. Home → Remove Duplicates (timestamp + parcid). 5. Transform → Rename : timestamp → date et changement de type en Date. Résultat : 1,460 → 1,370 lignes.",
          "url": "sources/module1-atelier1.html#etape-21-nettoyage-solaire"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-22-nettoyage-eolien",
          "excerpt": "1. Home → Remove Duplicates (toutes les colonnes). 2. Home → Filter Rows → etat ≠ \"Duplicate\". 3. Transformation de l'unité (MWh vers kWh). 4. Transform → Rename : parccode → parcid. Résultat : 1,975 → 1,770 lignes (-10% de doublons).",
          "url": "sources/module1-atelier1.html#etape-22-nettoyage-eolien"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-23-nettoyage-hydro",
          "excerpt": "1. Transform → Replace Values : supprimer le suffixe \"-var\" dans PlantID. 2. Transform → Data Type → Date pour ReadingDate. 3. Home → Remove Duplicates (ReadingDate + PlantID). 4. Harmonisation des noms : ReadingDate → date, PlantID → parcid. Résultat : 2,190 → 1,095 lignes (fusion des variantes eff",
          "url": "sources/module1-atelier1.html#etape-23-nettoyage-hydro"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-3-fusion-et-enrichissement",
          "excerpt": "1. Append Queries as New : Union des tables solaire, éolien et hydro en une table `productionalltypes`. 2. Merge Queries as New : Jointure (Left Outer) avec la table `calendriermeteomaintenance` basée sur la colonne `date`. 3. Expansion des colonnes : weekend, maintenance, pluiemm, ventmps, jour, mo",
          "url": "sources/module1-atelier1.html#etape-3-fusion-et-enrichissement"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier 1 – Harmonisation des Données d'Énergies Renouvelables",
          "sourceFile": "sources/module1-atelier1.html",
          "slug": "module1-atelier1",
          "anchor": "etape-4-a-7-destination-test-et-orchestration",
          "excerpt": "1. Destination : Lakehouse `LHEnergiesRenouvelables` (Table : `productionenergiesrenouvelables`, mode Append). 2. Test : Refresh manuel (Statut = \"Succeeded\"). 3. Orchestration : Création d'un Data pipeline planifié à 06:15 tous les jours avec notification Outlook et 3 tentatives de retry en cas d'e",
          "url": "sources/module1-atelier1.html#etape-4-a-7-destination-test-et-orchestration"
        }
      }
    },
    {
      "id": "s-1-0",
      "index": 2,
      "chapterId": "ch-1",
      "chapterTitle": "Module 1 – Dataflows Gen2 : Techniques Avancées",
      "title": "Module 1 – Dataflows Gen2 : Techniques Avancées",
      "content": "<p>Voici une synthèse des <strong>outils et techniques Microsoft Fabric</strong> mis en œuvre, en se concentrant sur les fonctionnalités avancées et les architectures techniques qui n'ont pas été détaillées dans le premier atelier.</p>\n<h3>1. Dataflow Gen2 : Transformations et Logique Avancée</h3>\n<p>Alors que le premier atelier se concentrait sur le nettoyage, le second exploite des capacités de transformation plus complexes :</p>\n<ul>\n<li><strong>Jointures Multi-niveaux (Merge Queries) :</strong> Utilisation de la fonction <strong>\"Merge Queries as New\"</strong> avec des jointures de type <strong>\"Left Outer\"</strong> pour croiser des tables de faits (production) avec des tables de référence (facteurs d'émission, prix CO2, météo).</li>\n<li><strong>Agrégations Dynamiques (Group By) :</strong> Mise en œuvre de la fonction <strong>\"Group By\"</strong> pour transformer des données granulaires en indicateurs quotidiens (production totale, émissions totales par catégorie), optimisant ainsi la table finale pour le reporting.</li>\n<li><strong>Gestion intelligente des formats :</strong> Power Query dans Dataflow Gen2 est utilisé pour unifier automatiquement des formats de dates hétérogènes (DD/MM/YYYY et YYYY-MM-DD) sans script manuel.</li>\n</ul>\n<h3>2. Stratégies de Destination de Données (Data Destinations)</h3>\n<p>L'une des techniques clés de Fabric est la gestion fine de la persistance dans le Lakehouse :</p>\n<ul>\n<li><strong>Mode Append (Ajout) :</strong> Utilisé pour les tables de détails (historique complet des émissions) afin de conserver l'intégralité des données dans le temps.</li>\n<li><strong>Mode Replace (Remplacement) :</strong> Appliqué aux tables de KPIs agrégées. Cette technique permet de garantir que les rapports consomment toujours la version la plus à jour et calculée sans doublons de calculs antérieurs.</li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "introduction",
          "excerpt": "Vous êtes data analyst chez GreenCorp Energy. L'objectif technique est de créer un pipeline automatisé pour calculer l'empreinte carbone et générer des rapports ESG réglementaires. Cela introduit une dimension de conformité au EU Green Deal et la gestion de certificats CO2 (EU ETS).",
          "url": "sources/module1-atelier2.html#introduction"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etat-des-lieux",
          "excerpt": "Le projet nécessite l'ingestion de 6 sources hétérogènes : - `productionsourcesenergie.csv` (~2,300 lignes, données sales). - `consommationsecteurs.csv` (Données de demande). - Tables de référence : facteurs d'émission, prix CO2, objectifs ESG 2025-2030 et météo.",
          "url": "sources/module1-atelier2.html#etat-des-lieux"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "solutions-techniques-dataflow-gen2",
          "excerpt": "- Jointures complexes : Croisement production × facteursemission. - Unification de dates temporelles : Transformation automatique DD/MM/YYYY vers YYYY-MM-DD. - Pilotage par KPIs : Création de colonnes pour les écarts vs cibles et les coûts carbone.",
          "url": "sources/module1-atelier2.html#solutions-techniques-dataflow-gen2"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-1-ingestion-multi-sources-dans-fabric",
          "excerpt": "1. Utilisation du OneLake data hub pour naviguer dans `Files/dataesg/`. 2. Ingestion simultanée des 6 fichiers CSV pour centralisation dans le Power Query Editor.",
          "url": "sources/module1-atelier2.html#etape-1-ingestion-multi-sources-dans-fabric"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-2-techniques-de-nettoyage-specifiques",
          "excerpt": "- Filtrage métier : Suppression des codes erreur spécifiques (-999) sur la production. - Gestion intelligente des types : Power Query gère les formats de date mixtes sur la consommation. - Validation des schémas : Vérification des types pour les tables de référence (CO2, Objectifs).",
          "url": "sources/module1-atelier2.html#etape-2-techniques-de-nettoyage-specifiques"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-3-technique-de-jointure-merge-queries-as-new",
          "excerpt": "- Réalisation d'un Left Outer Join entre la production et les facteurs d'émission. - Expansion de colonnes : Extraction sélective du facteur kgCO2/kWh et de la catégorie d'énergie.",
          "url": "sources/module1-atelier2.html#etape-3-technique-de-jointure-merge-queries-as-new"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-4-calculs-avances-par-colonnes-personnalisees",
          "excerpt": "- Calcul des émissions CO2 tonnes (Production × Facteur / 1000). - Calcul du coût carbone en croisant les émissions avec le prix du certificat CO2.",
          "url": "sources/module1-atelier2.html#etape-4-calculs-avances-par-colonnes-personnalisees"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-5-technique-dagregation-group-by",
          "excerpt": "- Transformation de la donnée granulaire en vue quotidienne. - Agrégations multiples : Somme de la production, des émissions et du coût carbone total par date et catégorie.",
          "url": "sources/module1-atelier2.html#etape-5-technique-dagregation-group-by"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-6-analyse-decart-gap-analysis",
          "excerpt": "- Extraction de l'année pour la jointure avec les objectifs annuels ESG. - Calcul technique de l'écart vs cible en pourcentage pour le pilotage de la conformité.",
          "url": "sources/module1-atelier2.html#etape-6-analyse-decart-gap-analysis"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-8-strategies-de-destination-append-vs-replace",
          "excerpt": "Dataflow Gen2 permet des méthodes de mise à jour différenciées : - Append : Pour la table de détail `emissionscarbonedetaillees`. - Replace : Pour la table KPI `emissionsquotidienneskpi`, assurant une vue agrégée toujours propre.",
          "url": "sources/module1-atelier2.html#etape-8-strategies-de-destination-append-vs-replace"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-10-orchestration-de-pipeline-et-notifications",
          "excerpt": "- Configuration d'un pipeline avec des activités de Send Email (Office 365 Outlook). - Logique conditionnelle : Emails distincts selon le succès (\"Rapport mis à jour\") ou l'échec (\"Échec calcul ESG\"). - Résilience : 3 tentatives (Retry) avec intervalle de 60 secondes.",
          "url": "sources/module1-atelier2.html#etape-10-orchestration-de-pipeline-et-notifications"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "0.Atelier 1 & 1.Atelier 2",
          "sourceFile": null,
          "slug": null,
          "anchor": null,
          "excerpt": "Application des nouveautés techniques pour les calculs ESG : - Modern Evaluator : Gain de 20-30% sur les calculs d'agrégation complexes. - Partitioned Compute : Optimisation du traitement parallèle pour les volumes de production. - Réduction de coût : Économie de 30% sur les Capacity Units (CU) de F",
          "url": null
        }
      }
    },
    {
      "id": "s-1-1",
      "index": 3,
      "chapterId": "ch-1",
      "chapterTitle": "Module 1 – Dataflows Gen2 : Techniques Avancées",
      "title": "3. Orchestration et Résilience via Data Pipelines",
      "content": "<p>Le pipeline Fabric ne se limite pas à l'exécution ; il gère la logique de flux et la fiabilité :</p>\n<ul>\n<li><strong>Activités Multi-sources :</strong> Enchaînement d'activités Dataflow avec des notifications <strong>Office 365 Outlook</strong> déclenchées par des conditions de réussite (<strong>On Success</strong>) ou d'échec (<strong>On Failure</strong>).</li>\n<li><strong>Mécanismes de \"Retry\" :</strong> Configuration avancée pour effectuer jusqu'à <strong>3 tentatives</strong> automatiques avec un intervalle de 60 secondes, palliant les éventuelles micro-coupures de services tiers ou d'ingestion.</li>\n</ul>\n<h3>4. Validation Technique via SQL Analytics Endpoint</h3>\n<p>Fabric permet une validation post-chargement via des outils de base de données classiques :</p>\n<ul>\n<li><strong>Requêtes SQL de validation :</strong> Utilisation du <strong>\"SQL analytics endpoint\"</strong> directement sur le Lakehouse pour exécuter des requêtes de vérification d'absence de doublons ou de cohérence des jointures immédiatement après le refresh du Dataflow.</li>\n</ul>\n<h3>5. Optimisations de Performance \"2025\"</h3>\n<p>Le moteur de calcul a été optimisé avec des fonctionnalités spécifiques :</p>\n<ul>\n<li><strong>Modern Evaluator :</strong> Activation de l'option de mise à l'échelle pour obtenir un gain de vitesse de <strong>20 à 30 %</strong> lors de l'évaluation des requêtes.</li>\n<li><strong>Partitioned Compute :</strong> Activation du traitement parallèle pour accélérer les calculs sur les fichiers volumineux stockés dans OneLake.</li>\n<li><strong>Économie de Capacity Units (CU) :</strong> Ces optimisations techniques permettent de réduire de <strong>30 % la consommation des ressources</strong> Fabric, optimisant ainsi les coûts opérationnels.</li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "introduction",
          "excerpt": "Vous êtes data analyst chez GreenCorp Energy. L'objectif technique est de créer un pipeline automatisé pour calculer l'empreinte carbone et générer des rapports ESG réglementaires. Cela introduit une dimension de conformité au EU Green Deal et la gestion de certificats CO2 (EU ETS).",
          "url": "sources/module1-atelier2.html#introduction"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etat-des-lieux",
          "excerpt": "Le projet nécessite l'ingestion de 6 sources hétérogènes : - `productionsourcesenergie.csv` (~2,300 lignes, données sales). - `consommationsecteurs.csv` (Données de demande). - Tables de référence : facteurs d'émission, prix CO2, objectifs ESG 2025-2030 et météo.",
          "url": "sources/module1-atelier2.html#etat-des-lieux"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "solutions-techniques-dataflow-gen2",
          "excerpt": "- Jointures complexes : Croisement production × facteursemission. - Unification de dates temporelles : Transformation automatique DD/MM/YYYY vers YYYY-MM-DD. - Pilotage par KPIs : Création de colonnes pour les écarts vs cibles et les coûts carbone.",
          "url": "sources/module1-atelier2.html#solutions-techniques-dataflow-gen2"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-1-ingestion-multi-sources-dans-fabric",
          "excerpt": "1. Utilisation du OneLake data hub pour naviguer dans `Files/dataesg/`. 2. Ingestion simultanée des 6 fichiers CSV pour centralisation dans le Power Query Editor.",
          "url": "sources/module1-atelier2.html#etape-1-ingestion-multi-sources-dans-fabric"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-2-techniques-de-nettoyage-specifiques",
          "excerpt": "- Filtrage métier : Suppression des codes erreur spécifiques (-999) sur la production. - Gestion intelligente des types : Power Query gère les formats de date mixtes sur la consommation. - Validation des schémas : Vérification des types pour les tables de référence (CO2, Objectifs).",
          "url": "sources/module1-atelier2.html#etape-2-techniques-de-nettoyage-specifiques"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-3-technique-de-jointure-merge-queries-as-new",
          "excerpt": "- Réalisation d'un Left Outer Join entre la production et les facteurs d'émission. - Expansion de colonnes : Extraction sélective du facteur kgCO2/kWh et de la catégorie d'énergie.",
          "url": "sources/module1-atelier2.html#etape-3-technique-de-jointure-merge-queries-as-new"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-4-calculs-avances-par-colonnes-personnalisees",
          "excerpt": "- Calcul des émissions CO2 tonnes (Production × Facteur / 1000). - Calcul du coût carbone en croisant les émissions avec le prix du certificat CO2.",
          "url": "sources/module1-atelier2.html#etape-4-calculs-avances-par-colonnes-personnalisees"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-5-technique-dagregation-group-by",
          "excerpt": "- Transformation de la donnée granulaire en vue quotidienne. - Agrégations multiples : Somme de la production, des émissions et du coût carbone total par date et catégorie.",
          "url": "sources/module1-atelier2.html#etape-5-technique-dagregation-group-by"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-6-analyse-decart-gap-analysis",
          "excerpt": "- Extraction de l'année pour la jointure avec les objectifs annuels ESG. - Calcul technique de l'écart vs cible en pourcentage pour le pilotage de la conformité.",
          "url": "sources/module1-atelier2.html#etape-6-analyse-decart-gap-analysis"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-8-strategies-de-destination-append-vs-replace",
          "excerpt": "Dataflow Gen2 permet des méthodes de mise à jour différenciées : - Append : Pour la table de détail `emissionscarbonedetaillees`. - Replace : Pour la table KPI `emissionsquotidienneskpi`, assurant une vue agrégée toujours propre.",
          "url": "sources/module1-atelier2.html#etape-8-strategies-de-destination-append-vs-replace"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-10-orchestration-de-pipeline-et-notifications",
          "excerpt": "- Configuration d'un pipeline avec des activités de Send Email (Office 365 Outlook). - Logique conditionnelle : Emails distincts selon le succès (\"Rapport mis à jour\") ou l'échec (\"Échec calcul ESG\"). - Résilience : 3 tentatives (Retry) avec intervalle de 60 secondes.",
          "url": "sources/module1-atelier2.html#etape-10-orchestration-de-pipeline-et-notifications"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "0.Atelier 1 & 1.Atelier 2",
          "sourceFile": null,
          "slug": null,
          "anchor": null,
          "excerpt": "Application des nouveautés techniques pour les calculs ESG : - Modern Evaluator : Gain de 20-30% sur les calculs d'agrégation complexes. - Partitioned Compute : Optimisation du traitement parallèle pour les volumes de production. - Réduction de coût : Économie de 30% sur les Capacity Units (CU) de F",
          "url": null
        }
      }
    },
    {
      "id": "s-1-2",
      "index": 4,
      "chapterId": "ch-1",
      "chapterTitle": "Module 1 – Dataflows Gen2 : Techniques Avancées",
      "title": "6. Architecture OneLake",
      "content": "<p>L'utilisation du <strong>OneLake Data Hub</strong> permet une découverte simplifiée des sources. Les données transitent d'un état \"brut\" dans le dossier <code>/Files</code> vers un état \"structuré et optimisé\" (Delta Lake) dans la section <code>Tables</code> du Lakehouse, rendant les données immédiatement prêtes pour l'analyse décisionnelle ou le Machine Learning.</p>\n<p>Voici les références extraites pour l'<strong>Atelier 2 : Calcul d'Empreinte Carbone et Reporting ESG</strong>, en mettant l'accent sur les outils et techniques Microsoft Fabric utilisés :</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "introduction",
          "excerpt": "Vous êtes data analyst chez GreenCorp Energy. L'objectif technique est de créer un pipeline automatisé pour calculer l'empreinte carbone et générer des rapports ESG réglementaires. Cela introduit une dimension de conformité au EU Green Deal et la gestion de certificats CO2 (EU ETS).",
          "url": "sources/module1-atelier2.html#introduction"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etat-des-lieux",
          "excerpt": "Le projet nécessite l'ingestion de 6 sources hétérogènes : - `productionsourcesenergie.csv` (~2,300 lignes, données sales). - `consommationsecteurs.csv` (Données de demande). - Tables de référence : facteurs d'émission, prix CO2, objectifs ESG 2025-2030 et météo.",
          "url": "sources/module1-atelier2.html#etat-des-lieux"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "solutions-techniques-dataflow-gen2",
          "excerpt": "- Jointures complexes : Croisement production × facteursemission. - Unification de dates temporelles : Transformation automatique DD/MM/YYYY vers YYYY-MM-DD. - Pilotage par KPIs : Création de colonnes pour les écarts vs cibles et les coûts carbone.",
          "url": "sources/module1-atelier2.html#solutions-techniques-dataflow-gen2"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-1-ingestion-multi-sources-dans-fabric",
          "excerpt": "1. Utilisation du OneLake data hub pour naviguer dans `Files/dataesg/`. 2. Ingestion simultanée des 6 fichiers CSV pour centralisation dans le Power Query Editor.",
          "url": "sources/module1-atelier2.html#etape-1-ingestion-multi-sources-dans-fabric"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-2-techniques-de-nettoyage-specifiques",
          "excerpt": "- Filtrage métier : Suppression des codes erreur spécifiques (-999) sur la production. - Gestion intelligente des types : Power Query gère les formats de date mixtes sur la consommation. - Validation des schémas : Vérification des types pour les tables de référence (CO2, Objectifs).",
          "url": "sources/module1-atelier2.html#etape-2-techniques-de-nettoyage-specifiques"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-3-technique-de-jointure-merge-queries-as-new",
          "excerpt": "- Réalisation d'un Left Outer Join entre la production et les facteurs d'émission. - Expansion de colonnes : Extraction sélective du facteur kgCO2/kWh et de la catégorie d'énergie.",
          "url": "sources/module1-atelier2.html#etape-3-technique-de-jointure-merge-queries-as-new"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-4-calculs-avances-par-colonnes-personnalisees",
          "excerpt": "- Calcul des émissions CO2 tonnes (Production × Facteur / 1000). - Calcul du coût carbone en croisant les émissions avec le prix du certificat CO2.",
          "url": "sources/module1-atelier2.html#etape-4-calculs-avances-par-colonnes-personnalisees"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-5-technique-dagregation-group-by",
          "excerpt": "- Transformation de la donnée granulaire en vue quotidienne. - Agrégations multiples : Somme de la production, des émissions et du coût carbone total par date et catégorie.",
          "url": "sources/module1-atelier2.html#etape-5-technique-dagregation-group-by"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-6-analyse-decart-gap-analysis",
          "excerpt": "- Extraction de l'année pour la jointure avec les objectifs annuels ESG. - Calcul technique de l'écart vs cible en pourcentage pour le pilotage de la conformité.",
          "url": "sources/module1-atelier2.html#etape-6-analyse-decart-gap-analysis"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-8-strategies-de-destination-append-vs-replace",
          "excerpt": "Dataflow Gen2 permet des méthodes de mise à jour différenciées : - Append : Pour la table de détail `emissionscarbonedetaillees`. - Replace : Pour la table KPI `emissionsquotidienneskpi`, assurant une vue agrégée toujours propre.",
          "url": "sources/module1-atelier2.html#etape-8-strategies-de-destination-append-vs-replace"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier 2 – Calcul d'Empreinte Carbone et Reporting ESG",
          "sourceFile": "sources/module1-atelier2.html",
          "slug": "module1-atelier2",
          "anchor": "etape-10-orchestration-de-pipeline-et-notifications",
          "excerpt": "- Configuration d'un pipeline avec des activités de Send Email (Office 365 Outlook). - Logique conditionnelle : Emails distincts selon le succès (\"Rapport mis à jour\") ou l'échec (\"Échec calcul ESG\"). - Résilience : 3 tentatives (Retry) avec intervalle de 60 secondes.",
          "url": "sources/module1-atelier2.html#etape-10-orchestration-de-pipeline-et-notifications"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "0.Atelier 1 & 1.Atelier 2",
          "sourceFile": null,
          "slug": null,
          "anchor": null,
          "excerpt": "Application des nouveautés techniques pour les calculs ESG : - Modern Evaluator : Gain de 20-30% sur les calculs d'agrégation complexes. - Partitioned Compute : Optimisation du traitement parallèle pour les volumes de production. - Réduction de coût : Économie de 30% sur les Capacity Units (CU) de F",
          "url": null
        }
      }
    },
    {
      "id": "s-2-0",
      "index": 5,
      "chapterId": "ch-2",
      "chapterTitle": "Module 2 – Pipelines : Concepts & Activités",
      "title": "Introduction des pipelines",
      "content": "<p>Quelles sont les trois grandes catégories d'activités dans les pipelines ?</p>\n<p>Dans les pipelines de données Microsoft Fabric, les activités sont généralement regroupées en <strong>trois grandes catégories</strong> :  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<ol>\n<li><strong>Activités de mouvement de données (Data Movement) :</strong> Cette catégorie inclut principalement l'activité <strong>Copy</strong>, qui permet de copier des données et supporte plus de 200 connecteurs, ainsi que le <strong>Copy Job</strong>, une version optimisée introduite fin 2025.</li>\n<li><strong>Activités de transformation de données (Data Transformation) :</strong> Elles permettent de transformer les données via différents outils tels que <strong>Dataflow Gen2</strong> (low-code), des <strong>Notebooks</strong> (Spark, PySpark, etc.), ou des définitions de jobs Spark (<strong>Spark Job Definition</strong>).  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Activités de contrôle de flux (Control Flow) :</strong> Ces activités servent à orchestrer la logique du pipeline. Elles comprennent des structures de boucle (<strong>ForEach</strong>, <strong>Until</strong>), des branchements conditionnels (<strong>If Condition</strong>), des pauses (<strong>Wait</strong>), la gestion de variables (<strong>Set Variable</strong>, <strong>Append Variable</strong>) et des appels externes ou de sous-pipelines (<strong>Web</strong>, <strong>Invoke Pipeline</strong>).  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n</ol>\n<p>Quelle est la différence entre une variable et un paramètre ?</p>\n<p>La principale différence entre une variable et un paramètre réside dans leur usage au sein de la logique du pipeline et le moment où leurs valeurs sont définies :</p>\n<ul>\n<li><strong>Les Variables</strong> sont utilisées pour gérer la <strong>logique de flux</strong> interne. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n</ul>\n<p>Elles servent à stocker des informations qui peuvent évoluer pendant l'exécution, comme dans le cas de boucles, de conditions ou de calculs dynamiques. On peut modifier leur valeur en cours de route via les activités <strong>Set Variable</strong> ou <strong>Append Variable</strong>.  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span><br />\n- <strong>Les Paramètres</strong> sont destinés à la <strong>personnalisation de l'exécution</strong> sans avoir à modifier la structure même du pipeline. Ils rendent le pipeline réutilisable et configurable en permettant de définir des valeurs à l'extérieur (comme une cible de déploiement ou des chemins de données) avant le lancement. 1   4 Contrairement aux variables, ils sont généralement définis au début et ne changent pas par une activité interne de modification pendant que le pipeline tourne. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></p>\n<p>En résumé, les <strong>paramètres</strong> configurent le pipeline \"de l'extérieur\" pour le rendre flexible, tandis que les <strong>variables</strong> sont des outils de stockage \"internes\" permettant au pipeline de prendre des décisions ou de manipuler des données dynamiquement pendant son exécution. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></p>\n<p>Peux-tu donner des exemples de variables système ?</p>\n<p>Peux-tu donner des exemples de variables système ?</p>\n<p>Les <strong>variables système</strong> dans Microsoft Fabric sont des informations d'exécution (runtime) fournies automatiquement par la plateforme en <strong>lecture seule</strong>.</p>\n<p>Voici les exemples de variables système cités dans les sources :</p>\n<ul>\n<li><strong><code>@pipeline().RunId</code></strong> : L'identifiant unique de l'exécution en cours du pipeline.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong><code>@pipeline().TriggerTime</code></strong> : L'heure à laquelle le pipeline a été déclenché. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong><code>@pipeline().TriggerName</code></strong> : Le nom du déclencheur (trigger) qui a lancé l'exécution. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n</ul>\n<p>Comment utiliser l'activité Lookup pour récupérer des données ?</p>\n<p>L'activité <strong>Lookup</strong> est un outil essentiel de <strong>contrôle de flux</strong> utilisé pour extraire des informations d'une source de données afin de les utiliser plus loin dans la logique de votre pipeline.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<p>Voici comment elle fonctionne et comment l'utiliser selon les sources :</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Les trois grandes catégories d'activités",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Il s'agit de la segmentation principale des outils disponibles dans un pipeline, : 1. Activités de mouvement de données (Data Movement) : comme l'activité Copy. 2. Activités de transformation de données (Data Transformation) : comme Dataflow Gen2 ou Notebook,. 3. Activités de contrôle de flux (Contr",
          "url": "sources/module2-atelier1.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Le \"Top 10\" des activités les plus courantes",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Les sources listent les activités les plus utilisées en pratique dans Microsoft Fabric : 1. Copy 2. ForEach 3. Lookup 4. Dataflow Gen2 5. Notebook 6. If Condition 7. Set Variable 8. Get Metadata 9. Wait 10. Semantic Model Refresh",
          "url": "sources/module2-atelier1.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Les paramètres généraux des activités",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Presque toutes les activités partagent une liste de paramètres de configuration (visibles dans l'interface) : - Name : Nom unique de l'activité. - Description : Texte optionnel. - Timeout : Durée maximale d'exécution. - Retry : Nombre de tentatives en cas d'échec. - Retry interval (sec) : Délai entr",
          "url": "sources/module2-atelier1.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Les composants du \"Pipeline expression builder\"",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Cette interface permet de construire des expressions dynamiques en utilisant cinq types d'éléments, : 1. Parameters (Paramètres) : Valeurs définies pour rendre le pipeline configurable. 2. System variables (Variables système) : Infos d'exécution comme `RunId` ou `TriggerTime`. 3. Trigger parameters ",
          "url": "sources/module2-atelier1.html"
        }
      }
    },
    {
      "id": "s-2-1",
      "index": 6,
      "chapterId": "ch-2",
      "chapterTitle": "Module 2 – Pipelines : Concepts & Activités",
      "title": "Introduction des pipelines (2/2)",
      "content": "<ul>\n<li><strong>Rôle principal :</strong> Elle permet de <strong>récupérer un résultat</strong> depuis une source, qu'il s'agisse d'une <strong>ligne unique</strong> (pour obtenir une valeur spécifique comme une date de dernier chargement) ou d'une <strong>petite liste</strong> d'éléments. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Utilisation des résultats :</strong> Le résultat obtenu par un Lookup est souvent utilisé pour alimenter une boucle <strong>ForEach</strong>. Par exemple, vous pouvez récupérer une liste de noms de tables via un Lookup, puis boucler sur cette liste pour traiter chaque table individuellement. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Configuration générale :</strong> Comme la plupart des activités dans Microsoft Fabric, vous devrez configurer des paramètres communs tels que le <strong>nom unique</strong> de l'activité, une description, le délai d'expiration (<strong>Timeout</strong>) et le nombre de tentatives en cas d'échec (<strong>Retry</strong>).  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Sécurité :</strong> Si les données récupérées sont sensibles, vous pouvez utiliser les options <strong>Secure Input</strong> ou <strong>Secure Output</strong> pour masquer ces informations dans les journaux d'exécution (logs).</li>\n</ul>\n<p>En résumé, le Lookup sert de \"pont\" pour lire une information dynamique au début ou au milieu d'un processus afin d'orienter la suite des opérations.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>    <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></p>\n<p>Comment fonctionne l'activité Get Metadata pour les fichiers ?</p>\n<p>L'activité <strong>Get Metadata</strong> est une activité de <strong>contrôle de flux</strong> utilisée pour obtenir des informations spécifiques sur les données stockées dans une source.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<p>Voici comment elle fonctionne pour les fichiers et les dossiers :</p>\n<ul>\n<li><strong>Récupération d'informations :</strong> Elle permet de vérifier et de récupérer diverses métadonnées, notamment l'<strong>existence</strong> d'un fichier ou d'un dossier, sa <strong>taille</strong>, ou encore sa date de <strong>dernière modification</strong>. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Usage dans le flux :</strong> Étant l'une des 10 activités les plus utilisées, elle sert souvent de point de contrôle avant d'exécuter d'autres actions (par exemple, vérifier si un fichier est présent avant de tenter de le copier).  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Configuration et Sécurité :</strong></li>\n<li>Comme les autres activités, elle nécessite un <strong>nom unique</strong>, et vous pouvez configurer un délai d'expiration (<strong>Timeout</strong>) ainsi que des tentatives de répétition (<strong>Retry</strong>) en cas d'échec.   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n<li>Elle offre des options de <strong>Secure Input</strong> et <strong>Secure Output</strong> pour éviter que les informations récupérées ne s'affichent en clair dans les journaux d'exécution si elles sont sensibles.   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n</ul>\n<p>Peut-on combiner Get Metadata avec une boucle ForEach ?</p>\n<p>Oui, il est tout à fait possible de combiner l'activité <strong>Get Metadata</strong> avec une boucle <strong>ForEach</strong>.</p>\n<p>Voici comment cette combinaison s'inscrit dans la logique des pipelines :</p>\n<ul>\n<li><strong>La boucle ForEach</strong> est conçue pour itérer sur une <strong>collection</strong> (tableaux, listes ou résultats d'autres activités). <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>L'activité Get Metadata</strong> sert à récupérer des informations sur des fichiers ou des dossiers, comme leur existence ou leur taille.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li>Bien que les sources citent explicitement l'activité <strong>Lookup</strong> comme exemple de source pour alimenter un ForEach, le rôle du ForEach est de traiter n'importe quelle liste d'éléments.   <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n</ul>\n<p><strong>Information complémentaire (hors sources) :</strong> Pour être plus précis, l'activité <strong>Get Metadata</strong> possède une option appelée \"Child Items\" (non mentionnée explicitement dans vos documents) qui permet de lister tous les fichiers contenus dans un dossier. Cette liste est alors transmise à la boucle <strong>ForEach</strong>, qui peut ensuite exécuter une action (comme une copie ou le lancement d'un Notebook) pour chaque fichier trouvé.</p>\n<p>Peut-on utiliser des fonctions comme utcnow dans une expression ?</p>\n<p>Oui, il est tout à fait possible d'utiliser des fonctions comme <strong>utcnow()</strong> dans une expression au sein d'un pipeline Microsoft Fabric.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<p>Voici les détails sur l'utilisation des fonctions dans les expressions :</p>\n<ul>\n<li><strong>Rôle des fonctions :</strong> Elles servent d'outils pour manipuler ou combiner des valeurs dynamiques. Outre <code>utcnow()</code>, les sources citent également d'autres fonctions courantes comme <code>concat()</code>, <code>formatDateTime()</code> et <code>adddays()</code>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Outil de création :</strong> Vous utilisez le <strong>Pipeline expression builder</strong> pour construire ces expressions. Cet outil permet de combiner dynamiquement des fonctions, des paramètres, des variables système et des paramètres de déclencheur,. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>   <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Exemple d'utilisation :</strong> Une expression classique combinant plusieurs éléments pourrait ressembler à ceci : <code>@concat('bronze/', pipeline().parameters.schema, '/', formatDateTime(utcnow(), 'yyyy/MM/dd'))</code>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Application :</strong> Ces expressions sont souvent définies à travers des activités de contrôle de flux comme l'activité <strong>Set Variable</strong> pour créer des valeurs de manière dynamique pendant l'exécution du pipeline. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Les trois grandes catégories d'activités",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Il s'agit de la segmentation principale des outils disponibles dans un pipeline, : 1. Activités de mouvement de données (Data Movement) : comme l'activité Copy. 2. Activités de transformation de données (Data Transformation) : comme Dataflow Gen2 ou Notebook,. 3. Activités de contrôle de flux (Contr",
          "url": "sources/module2-atelier1.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Le \"Top 10\" des activités les plus courantes",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Les sources listent les activités les plus utilisées en pratique dans Microsoft Fabric : 1. Copy 2. ForEach 3. Lookup 4. Dataflow Gen2 5. Notebook 6. If Condition 7. Set Variable 8. Get Metadata 9. Wait 10. Semantic Model Refresh",
          "url": "sources/module2-atelier1.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Les paramètres généraux des activités",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Presque toutes les activités partagent une liste de paramètres de configuration (visibles dans l'interface) : - Name : Nom unique de l'activité. - Description : Texte optionnel. - Timeout : Durée maximale d'exécution. - Retry : Nombre de tentatives en cas d'échec. - Retry interval (sec) : Délai entr",
          "url": "sources/module2-atelier1.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Les composants du \"Pipeline expression builder\"",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": null,
          "excerpt": "Cette interface permet de construire des expressions dynamiques en utilisant cinq types d'éléments, : 1. Parameters (Paramètres) : Valeurs définies pour rendre le pipeline configurable. 2. System variables (Variables système) : Infos d'exécution comme `RunId` ou `TriggerTime`. 3. Trigger parameters ",
          "url": "sources/module2-atelier1.html"
        }
      }
    },
    {
      "id": "s-3-0",
      "index": 7,
      "chapterId": "ch-3",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 1",
      "title": "Module 2 – Pipelines : Étude de Cas 1",
      "content": "<p>Ce document détaille l'utilisation de <strong>Microsoft Fabric</strong> pour construire un pipeline d'ingestion de données automatisé et validé, en s'appuyant sur plusieurs outils et techniques spécifiques à la plateforme.</p>\n<h3>1. Environnement et Stockage</h3>\n<p>Le socle de la solution repose sur deux éléments fondamentaux de Microsoft Fabric :</p>\n<ul>\n<li><strong>Workspace (Espace de travail) :</strong> Utilisé comme conteneur principal pour organiser tous les éléments du projet (données, pipelines, rapports).   <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Lakehouse (Bronze) :</strong> Sert de zone de stockage. Il est structuré en deux sections :</li>\n<li><strong>Files (Fichiers) :</strong> Pour le stockage non structuré des fichiers sources (dossier <code>landing</code>).   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Tables :</strong> Pour le stockage structuré des données ingérées au format Delta, permettant des analyses ultérieures.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "1-creer-le-workspace",
          "excerpt": "1. Ouvrez Microsoft Fabric : https://app.fabric.microsoft.com 2. Barre latérale gauche → cliquez sur Workspaces 3. Cliquez + New workspace 4. Remplissez : - Name : WSEnergieRenouvelable - Description : Workspace pour optimisation chaîne approvisionnement énergie - Advanced → License mode : sélection",
          "url": "sources/module2-atelier1.html#1-creer-le-workspace"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "2-creer-le-lakehouse-bronze",
          "excerpt": "1. Dans le workspace WSEnergieRenouvelable, cliquez + New item. 2. Sélectionnez Lakehouse. 3. Name : LHEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#2-creer-le-lakehouse-bronze"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "3-creer-le-dossier-landing-et-uploader-les-fichiers",
          "excerpt": "1. Dans LHEnergieBronze, section Explorer, cliquez sur Files → New subfolder. 2. Folder name : landing. 3. Cliquez sur le dossier landing, puis sur Upload → Upload files. 4. Sélectionnez les 3 fichiers CSV : besoinsenergetiques.csv, productionsolaire.csv, productioneolienne.csv.",
          "url": "sources/module2-atelier1.html#3-creer-le-dossier-landing-et-uploader-les-fichiers"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "4-creer-le-pipeline",
          "excerpt": "1. Cliquez sur le workspace WSEnergieRenouvelable. 2. Cliquez + New item → Data pipeline. 3. Name : PLIngestionEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#4-creer-le-pipeline"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "5-ajouter-lactivite-get-metadata",
          "excerpt": "1. Panneau Activities → section General → Glissez Get Metadata. 2. Onglet General : Name : ScanLanding. 3. Onglet Settings : Sélectionnez le Lakehouse LHEnergieBronze, Root folder : Files, File path : landing. 4. Field list : Cliquez + New et cochez Child items.",
          "url": "sources/module2-atelier1.html#5-ajouter-lactivite-get-metadata"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "6-creer-les-variables-du-pipeline",
          "excerpt": "1. Cliquez sur l'onglet Variables du canvas. 2. Créez 4 variables : - FichiersTraites (Array) - FichierActuel (String) - NombreFichiers (Integer) - FichiersTemp (Array) : sert de variable tampon pour éviter l'erreur d'auto-référencement.",
          "url": "sources/module2-atelier1.html#6-creer-les-variables-du-pipeline"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "7-ajouter-lactivite-foreach",
          "excerpt": "1. Activities → Iteration & Conditionals → Glissez ForEach (Nom : BouclerFichiers). 2. Reliez ScanLanding à ForEach (flèche verte). 3. Onglet Settings : Items → Add dynamic content : `@activity('ScanLanding').output.childItems`.",
          "url": "sources/module2-atelier1.html#7-ajouter-lactivite-foreach"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "8-ajouter-lactivite-if-condition-dans-foreach",
          "excerpt": "1. Double-cliquez sur BouclerFichiers. 2. Glissez If Condition (Nom : EstCSV). 3. Onglet Activities → Expression : `@endsWith(item().name, '.csv')`.",
          "url": "sources/module2-atelier1.html#8-ajouter-lactivite-if-condition-dans-foreach"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "9-configurer-la-branche-true-copy-data",
          "excerpt": "1. Sur EstCSV, cliquez sur l'icône crayon (True). 2. Glissez Copy data (Nom : CopierVersBronze). 3. Source : Lakehouse LHEnergieBronze, Root folder : Files, File name : `@item().name`. 4. Destination : Lakehouse LHEnergieBronze, Root folder : Tables, Table action : Append, Table name : `@replace(ite",
          "url": "sources/module2-atelier1.html#9-configurer-la-branche-true-copy-data"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "10-ajouter-les-activites-de-tracabilite-dans-la-branche-true",
          "excerpt": "1. Append Variable (TracerFichier) : Reliez à Copy Data. Variable : FichiersTemp, Value : `@item().name`. 2. Set Variable (RecupererTracage) : Reliez à TracerFichier. Variable : FichiersTraites, Value : `@variables('FichiersTemp')`.",
          "url": "sources/module2-atelier1.html#10-ajouter-les-activites-de-tracabilite-dans-la-branche-true"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "sauvegarder-et-tester-le-pipeline",
          "excerpt": "1. Cliquez sur Save, puis sur Run. 2. Vérifiez dans l'onglet Output que chaque étape (ScanLanding, BouclerFichiers, CopierVersBronze, etc.) affiche l'état \"Succeeded\".",
          "url": "sources/module2-atelier1.html#sauvegarder-et-tester-le-pipeline"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "valider-les-resultats",
          "excerpt": "1. Retournez dans le Lakehouse LHEnergieBronze. 2. Dans la section Tables, vérifiez la présence et le nombre de lignes des tables : besoinsenergetiques (168 lignes), productionsolaire (175 lignes) et productioneolienne (840 lignes).",
          "url": "sources/module2-atelier1.html#valider-les-resultats"
        }
      }
    },
    {
      "id": "s-3-1",
      "index": 8,
      "chapterId": "ch-3",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 1",
      "title": "2. Orchestration avec Data Pipeline",
      "content": "<p>Le <strong>Data Pipeline</strong> (<code>PL_Ingestion_Energie_Bronze</code>) orchestre le flux de données à l'aide de diverses activités :  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span>   <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span></p>\n<ul>\n<li><strong>Get Metadata :</strong> Technique utilisée pour scanner dynamiquement le dossier <code>landing</code> et récupérer la liste des fichiers via la propriété <strong>Child items</strong>. <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span>   <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span></li>\n<li><strong>ForEach :</strong> Permet d'itérer sur chaque fichier détecté par l'activité précédente.  <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></li>\n<li><strong>If Condition :</strong> Introduit une logique de filtrage pour s'assurer que seuls les fichiers <strong>.csv</strong> sont traités, ignorant ainsi les logs techniques ou images.  <span class=\"ref\" data-ref-id=\"ref-11\">[11]</span></li>\n</ul>\n<h3>3. Techniques de Manipulation de Données</h3>\n<p>Le pipeline utilise des techniques avancées pour assurer une ingestion fluide :</p>\n<ul>\n<li><strong>Copy Data :</strong> Déplace les données de la section \"Files\" vers la section \"Tables\" du Lakehouse. <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>  <span class=\"ref\" data-ref-id=\"ref-12\">[12]</span></li>\n<li><strong>Contenu Dynamique (Expressions) :</strong></li>\n<li>Utilisation de <code>@item().name</code> pour identifier le fichier actuel.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n<li>Utilisation de la fonction <code>@replace(item().name, '.csv', '')</code> pour nommer automatiquement les tables de destination en supprimant l'extension du fichier.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>   <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Action de table \"Append\" :</strong> Permet d'ajouter les nouvelles données aux tables existantes sans écraser l'historique.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "1-creer-le-workspace",
          "excerpt": "1. Ouvrez Microsoft Fabric : https://app.fabric.microsoft.com 2. Barre latérale gauche → cliquez sur Workspaces 3. Cliquez + New workspace 4. Remplissez : - Name : WSEnergieRenouvelable - Description : Workspace pour optimisation chaîne approvisionnement énergie - Advanced → License mode : sélection",
          "url": "sources/module2-atelier1.html#1-creer-le-workspace"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "2-creer-le-lakehouse-bronze",
          "excerpt": "1. Dans le workspace WSEnergieRenouvelable, cliquez + New item. 2. Sélectionnez Lakehouse. 3. Name : LHEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#2-creer-le-lakehouse-bronze"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "3-creer-le-dossier-landing-et-uploader-les-fichiers",
          "excerpt": "1. Dans LHEnergieBronze, section Explorer, cliquez sur Files → New subfolder. 2. Folder name : landing. 3. Cliquez sur le dossier landing, puis sur Upload → Upload files. 4. Sélectionnez les 3 fichiers CSV : besoinsenergetiques.csv, productionsolaire.csv, productioneolienne.csv.",
          "url": "sources/module2-atelier1.html#3-creer-le-dossier-landing-et-uploader-les-fichiers"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "4-creer-le-pipeline",
          "excerpt": "1. Cliquez sur le workspace WSEnergieRenouvelable. 2. Cliquez + New item → Data pipeline. 3. Name : PLIngestionEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#4-creer-le-pipeline"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "5-ajouter-lactivite-get-metadata",
          "excerpt": "1. Panneau Activities → section General → Glissez Get Metadata. 2. Onglet General : Name : ScanLanding. 3. Onglet Settings : Sélectionnez le Lakehouse LHEnergieBronze, Root folder : Files, File path : landing. 4. Field list : Cliquez + New et cochez Child items.",
          "url": "sources/module2-atelier1.html#5-ajouter-lactivite-get-metadata"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "6-creer-les-variables-du-pipeline",
          "excerpt": "1. Cliquez sur l'onglet Variables du canvas. 2. Créez 4 variables : - FichiersTraites (Array) - FichierActuel (String) - NombreFichiers (Integer) - FichiersTemp (Array) : sert de variable tampon pour éviter l'erreur d'auto-référencement.",
          "url": "sources/module2-atelier1.html#6-creer-les-variables-du-pipeline"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "7-ajouter-lactivite-foreach",
          "excerpt": "1. Activities → Iteration & Conditionals → Glissez ForEach (Nom : BouclerFichiers). 2. Reliez ScanLanding à ForEach (flèche verte). 3. Onglet Settings : Items → Add dynamic content : `@activity('ScanLanding').output.childItems`.",
          "url": "sources/module2-atelier1.html#7-ajouter-lactivite-foreach"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "8-ajouter-lactivite-if-condition-dans-foreach",
          "excerpt": "1. Double-cliquez sur BouclerFichiers. 2. Glissez If Condition (Nom : EstCSV). 3. Onglet Activities → Expression : `@endsWith(item().name, '.csv')`.",
          "url": "sources/module2-atelier1.html#8-ajouter-lactivite-if-condition-dans-foreach"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "9-configurer-la-branche-true-copy-data",
          "excerpt": "1. Sur EstCSV, cliquez sur l'icône crayon (True). 2. Glissez Copy data (Nom : CopierVersBronze). 3. Source : Lakehouse LHEnergieBronze, Root folder : Files, File name : `@item().name`. 4. Destination : Lakehouse LHEnergieBronze, Root folder : Tables, Table action : Append, Table name : `@replace(ite",
          "url": "sources/module2-atelier1.html#9-configurer-la-branche-true-copy-data"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "10-ajouter-les-activites-de-tracabilite-dans-la-branche-true",
          "excerpt": "1. Append Variable (TracerFichier) : Reliez à Copy Data. Variable : FichiersTemp, Value : `@item().name`. 2. Set Variable (RecupererTracage) : Reliez à TracerFichier. Variable : FichiersTraites, Value : `@variables('FichiersTemp')`.",
          "url": "sources/module2-atelier1.html#10-ajouter-les-activites-de-tracabilite-dans-la-branche-true"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "sauvegarder-et-tester-le-pipeline",
          "excerpt": "1. Cliquez sur Save, puis sur Run. 2. Vérifiez dans l'onglet Output que chaque étape (ScanLanding, BouclerFichiers, CopierVersBronze, etc.) affiche l'état \"Succeeded\".",
          "url": "sources/module2-atelier1.html#sauvegarder-et-tester-le-pipeline"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "valider-les-resultats",
          "excerpt": "1. Retournez dans le Lakehouse LHEnergieBronze. 2. Dans la section Tables, vérifiez la présence et le nombre de lignes des tables : besoinsenergetiques (168 lignes), productionsolaire (175 lignes) et productioneolienne (840 lignes).",
          "url": "sources/module2-atelier1.html#valider-les-resultats"
        }
      }
    },
    {
      "id": "s-3-2",
      "index": 9,
      "chapterId": "ch-3",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 1",
      "title": "4. Gestion des Variables et Traçabilité",
      "content": "<p>Pour contourner les limitations techniques et assurer l'audit, des variables sont utilisées :  <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span>  <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></p>\n<ul>\n<li><strong>Pattern de variable tampon :</strong> Microsoft Fabric interdit à une variable de se référencer elle-même (erreur de <em>self-referencing</em>). La technique consiste à accumuler les noms de fichiers dans une variable <code>FichiersTemp</code> (<strong>Append Variable</strong>) avant de copier le résultat final dans <code>FichiersTraites</code> (<strong>Set Variable</strong>).  14</li>\n<li><strong>Validation de la complétude :</strong> En fin de processus, ces variables permettent de confirmer que les trois sources attendues (besoins, solaire, éolien) ont bien été ingérées. 13   17</li>\n</ul>\n<h3>5. Résultats et Optimisation Technique</h3>\n<ul>\n<li><strong>V-Order :</strong> Le document mentionne cette propriété d'optimisation du stockage, bien qu'elle soit désactivée dans cet atelier spécifique.  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Gains techniques :</strong> L'automatisation réduit le temps d'ingestion de 2 heures par jour à moins de 45 secondes, tout en éliminant les erreurs humaines de saisie manuelle.  18   19</li>\n</ul>\n<p>Quels sont les avantages d'utiliser un Lakehouse Bronze ?</p>\n<p>offre plusieurs avantages stratégiques et techniques pour la gestion des données de l'entreprise :</p>\n<ol>\n<li>Centralisation et Structuration des Données</li>\n</ol>\n<p>Le Lakehouse Bronze permet de passer d'un dépôt de fichiers hétérogènes et non structurés à un environnement organisé.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<ul>\n<li>\n<p><strong>Double structure de stockage :</strong> Il combine une section <strong>Files</strong> pour le stockage des fichiers bruts (comme le dossier <code>landing</code>) et une section <strong>Tables</strong> pour les données structurées au format Delta.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></p>\n</li>\n<li>\n<p><strong>Données requêtables :</strong> L'ingestion transforme des fichiers plats (CSV) en tables structurées qui deviennent immédiatement prêtes pour l'analyse et les requêtes SQL.  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span><br />\n2. Automatisation et Efficacité Opérationnelle</p>\n</li>\n</ul>\n<p>L'implémentation d'un pipeline vers le Lakehouse Bronze remplace les processus manuels fastidieux :</p>\n<ul>\n<li>\n<p><strong>Gain de temps massif :</strong> Le passage d'une gestion manuelle (environ 2 heures par jour) à une ingestion automatisée réduit le temps de traitement à <strong>moins de 45 secondes</strong>.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>   <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></p>\n</li>\n<li>\n<p><strong>Évolutivité :</strong> Le système est capable de détecter et d'ingérer dynamiquement un nombre variable de sources (que ce soit 3, 10 ou 100 fichiers) sans intervention humaine. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span><br />\n3. Fiabilité et Qualité des Données</p>\n</li>\n</ul>\n<p>Le Lakehouse Bronze sécurise la chaîne de données :</p>\n<ul>\n<li>\n<p><strong>Élimination des erreurs :</strong> L'automatisation supprime les erreurs de saisie humaine (fréquentes dans Excel), garantissant une fiabilité des données de <strong>100%</strong>. <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>   <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></p>\n</li>\n<li>\n<p><strong>Validation de la complétude :</strong> Grâce aux variables de suivi (comme <code>FichiersTraites</code>), il est possible de vérifier instantanément si toutes les sources attendues ont été reçues et d'émettre une alerte en cas de manque. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>   <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span><br />\n4. Traçabilité et Audit</p>\n</li>\n</ul>\n<p>L'utilisation de techniques de traçabilité lors de l'ingestion vers le Bronze permet :</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "1-creer-le-workspace",
          "excerpt": "1. Ouvrez Microsoft Fabric : https://app.fabric.microsoft.com 2. Barre latérale gauche → cliquez sur Workspaces 3. Cliquez + New workspace 4. Remplissez : - Name : WSEnergieRenouvelable - Description : Workspace pour optimisation chaîne approvisionnement énergie - Advanced → License mode : sélection",
          "url": "sources/module2-atelier1.html#1-creer-le-workspace"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "2-creer-le-lakehouse-bronze",
          "excerpt": "1. Dans le workspace WSEnergieRenouvelable, cliquez + New item. 2. Sélectionnez Lakehouse. 3. Name : LHEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#2-creer-le-lakehouse-bronze"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "3-creer-le-dossier-landing-et-uploader-les-fichiers",
          "excerpt": "1. Dans LHEnergieBronze, section Explorer, cliquez sur Files → New subfolder. 2. Folder name : landing. 3. Cliquez sur le dossier landing, puis sur Upload → Upload files. 4. Sélectionnez les 3 fichiers CSV : besoinsenergetiques.csv, productionsolaire.csv, productioneolienne.csv.",
          "url": "sources/module2-atelier1.html#3-creer-le-dossier-landing-et-uploader-les-fichiers"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "4-creer-le-pipeline",
          "excerpt": "1. Cliquez sur le workspace WSEnergieRenouvelable. 2. Cliquez + New item → Data pipeline. 3. Name : PLIngestionEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#4-creer-le-pipeline"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "5-ajouter-lactivite-get-metadata",
          "excerpt": "1. Panneau Activities → section General → Glissez Get Metadata. 2. Onglet General : Name : ScanLanding. 3. Onglet Settings : Sélectionnez le Lakehouse LHEnergieBronze, Root folder : Files, File path : landing. 4. Field list : Cliquez + New et cochez Child items.",
          "url": "sources/module2-atelier1.html#5-ajouter-lactivite-get-metadata"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "6-creer-les-variables-du-pipeline",
          "excerpt": "1. Cliquez sur l'onglet Variables du canvas. 2. Créez 4 variables : - FichiersTraites (Array) - FichierActuel (String) - NombreFichiers (Integer) - FichiersTemp (Array) : sert de variable tampon pour éviter l'erreur d'auto-référencement.",
          "url": "sources/module2-atelier1.html#6-creer-les-variables-du-pipeline"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "7-ajouter-lactivite-foreach",
          "excerpt": "1. Activities → Iteration & Conditionals → Glissez ForEach (Nom : BouclerFichiers). 2. Reliez ScanLanding à ForEach (flèche verte). 3. Onglet Settings : Items → Add dynamic content : `@activity('ScanLanding').output.childItems`.",
          "url": "sources/module2-atelier1.html#7-ajouter-lactivite-foreach"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "8-ajouter-lactivite-if-condition-dans-foreach",
          "excerpt": "1. Double-cliquez sur BouclerFichiers. 2. Glissez If Condition (Nom : EstCSV). 3. Onglet Activities → Expression : `@endsWith(item().name, '.csv')`.",
          "url": "sources/module2-atelier1.html#8-ajouter-lactivite-if-condition-dans-foreach"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "9-configurer-la-branche-true-copy-data",
          "excerpt": "1. Sur EstCSV, cliquez sur l'icône crayon (True). 2. Glissez Copy data (Nom : CopierVersBronze). 3. Source : Lakehouse LHEnergieBronze, Root folder : Files, File name : `@item().name`. 4. Destination : Lakehouse LHEnergieBronze, Root folder : Tables, Table action : Append, Table name : `@replace(ite",
          "url": "sources/module2-atelier1.html#9-configurer-la-branche-true-copy-data"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "10-ajouter-les-activites-de-tracabilite-dans-la-branche-true",
          "excerpt": "1. Append Variable (TracerFichier) : Reliez à Copy Data. Variable : FichiersTemp, Value : `@item().name`. 2. Set Variable (RecupererTracage) : Reliez à TracerFichier. Variable : FichiersTraites, Value : `@variables('FichiersTemp')`.",
          "url": "sources/module2-atelier1.html#10-ajouter-les-activites-de-tracabilite-dans-la-branche-true"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "sauvegarder-et-tester-le-pipeline",
          "excerpt": "1. Cliquez sur Save, puis sur Run. 2. Vérifiez dans l'onglet Output que chaque étape (ScanLanding, BouclerFichiers, CopierVersBronze, etc.) affiche l'état \"Succeeded\".",
          "url": "sources/module2-atelier1.html#sauvegarder-et-tester-le-pipeline"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "valider-les-resultats",
          "excerpt": "1. Retournez dans le Lakehouse LHEnergieBronze. 2. Dans la section Tables, vérifiez la présence et le nombre de lignes des tables : besoinsenergetiques (168 lignes), productionsolaire (175 lignes) et productioneolienne (840 lignes).",
          "url": "sources/module2-atelier1.html#valider-les-resultats"
        }
      }
    },
    {
      "id": "s-3-3",
      "index": 10,
      "chapterId": "ch-3",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 1",
      "title": "4. Gestion des Variables et Traçabilité (2/2)",
      "content": "<ul>\n<li><strong>Historisation :</strong> On garde une trace précise de chaque fichier traité, ce qui est essentiel pour l'audit et la conformité (ex: RGPD).  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n<li><strong>Filtrage intelligent :</strong> Le pipeline peut être configuré pour n'ingérer que les types de fichiers pertinents (ex: <code>.csv</code>), ignorant les fichiers techniques ou les images inutiles.   <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>   <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span><br />\n5. Avantages Économiques et Décisionnels</li>\n<li><strong>Réduction drastique des coûts :</strong> Le coût opérationnel passe d'environ 400 €/mois (salaire technicien) à environ <strong>5 €/mois</strong> en frais de calcul.  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n<li><strong>Réactivité accrue :</strong> Les décisions ne sont plus prises sur les données de la veille (J+1), mais sur des données actualisées en quasi <strong>temps réel</strong> (délai de décision réduit de 24h à 1h).  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>   <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n</ul>\n<p>En résumé, le Lakehouse Bronze sert de fondation solide et automatisée qui transforme des données brutes \"en vrac\" en actifs numériques fiables, structurés et exploitables pour les analyses de haut niveau. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>   <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span></p>\n<p>Pourquoi utiliser une variable tampon pour la traçabilité ?</p>\n<p>L'utilisation d'une variable tampon (nommée <code>FichiersTemp</code> dans l'exercice) est une technique essentielle pour contourner une limitation technique spécifique de Microsoft Fabric lors de la mise en œuvre de la traçabilité. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<p>Voici les raisons précises de son utilisation :</p>\n<ul>\n<li><strong>Contourner l'erreur d'auto-référencement (</strong><strong>self-referencing</strong><strong>) :</strong> Dans Microsoft Fabric, il est interdit à une variable de se référencer elle-même dans une activité <strong>Set Variable</strong>.   1  2  Par exemple, on ne peut pas utiliser une expression du type <code>@union(variables('FichiersTraites'), array(item().name))</code> pour mettre à jour la variable <code>FichiersTraites</code> avec son propre contenu précédent plus un nouvel élément.  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Accumulation dynamique :</strong> Pour construire la liste des fichiers ingérés au fil de la boucle <strong>ForEach</strong>, on utilise d'abord l'activité <strong>Append Variable</strong> avec la variable tampon <code>FichiersTemp</code>. Cette activité permet d'ajouter (accumuler) le nom de chaque fichier traité à un tableau sans provoquer d'erreur de logique circulaire.</li>\n<li><strong>Mise à jour de l'état final :</strong> Après l'accumulation dans la variable tampon, l'activité <strong>Set Variable</strong> (<code>RecupererTracage</code>) est utilisée pour recopier l'état actuel de <code>FichiersTemp</code> vers la variable finale <code>FichiersTraites</code> à chaque itération. <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Objectif de traçabilité et d'audit :</strong> À la fin du processus, cette méthode permet d'obtenir un tableau complet (<code>FichiersTraites</code>) contenant la liste de tous les fichiers effectivement ingérés. Cela est crucial pour :</li>\n<li><strong>L'audit et la conformité :</strong> Garder un historique fiable pour des besoins réglementaires comme le RGPD.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n<li><strong>La validation de la complétude :</strong> Vérifier que les trois sources attendues (besoins, solaire, éolien) ont bien été traitées et déclencher une alerte automatique si l'une d'elles manque   <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "1-creer-le-workspace",
          "excerpt": "1. Ouvrez Microsoft Fabric : https://app.fabric.microsoft.com 2. Barre latérale gauche → cliquez sur Workspaces 3. Cliquez + New workspace 4. Remplissez : - Name : WSEnergieRenouvelable - Description : Workspace pour optimisation chaîne approvisionnement énergie - Advanced → License mode : sélection",
          "url": "sources/module2-atelier1.html#1-creer-le-workspace"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "2-creer-le-lakehouse-bronze",
          "excerpt": "1. Dans le workspace WSEnergieRenouvelable, cliquez + New item. 2. Sélectionnez Lakehouse. 3. Name : LHEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#2-creer-le-lakehouse-bronze"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "3-creer-le-dossier-landing-et-uploader-les-fichiers",
          "excerpt": "1. Dans LHEnergieBronze, section Explorer, cliquez sur Files → New subfolder. 2. Folder name : landing. 3. Cliquez sur le dossier landing, puis sur Upload → Upload files. 4. Sélectionnez les 3 fichiers CSV : besoinsenergetiques.csv, productionsolaire.csv, productioneolienne.csv.",
          "url": "sources/module2-atelier1.html#3-creer-le-dossier-landing-et-uploader-les-fichiers"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "4-creer-le-pipeline",
          "excerpt": "1. Cliquez sur le workspace WSEnergieRenouvelable. 2. Cliquez + New item → Data pipeline. 3. Name : PLIngestionEnergieBronze. 4. Cliquez Create.",
          "url": "sources/module2-atelier1.html#4-creer-le-pipeline"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "5-ajouter-lactivite-get-metadata",
          "excerpt": "1. Panneau Activities → section General → Glissez Get Metadata. 2. Onglet General : Name : ScanLanding. 3. Onglet Settings : Sélectionnez le Lakehouse LHEnergieBronze, Root folder : Files, File path : landing. 4. Field list : Cliquez + New et cochez Child items.",
          "url": "sources/module2-atelier1.html#5-ajouter-lactivite-get-metadata"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "6-creer-les-variables-du-pipeline",
          "excerpt": "1. Cliquez sur l'onglet Variables du canvas. 2. Créez 4 variables : - FichiersTraites (Array) - FichierActuel (String) - NombreFichiers (Integer) - FichiersTemp (Array) : sert de variable tampon pour éviter l'erreur d'auto-référencement.",
          "url": "sources/module2-atelier1.html#6-creer-les-variables-du-pipeline"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "7-ajouter-lactivite-foreach",
          "excerpt": "1. Activities → Iteration & Conditionals → Glissez ForEach (Nom : BouclerFichiers). 2. Reliez ScanLanding à ForEach (flèche verte). 3. Onglet Settings : Items → Add dynamic content : `@activity('ScanLanding').output.childItems`.",
          "url": "sources/module2-atelier1.html#7-ajouter-lactivite-foreach"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "8-ajouter-lactivite-if-condition-dans-foreach",
          "excerpt": "1. Double-cliquez sur BouclerFichiers. 2. Glissez If Condition (Nom : EstCSV). 3. Onglet Activities → Expression : `@endsWith(item().name, '.csv')`.",
          "url": "sources/module2-atelier1.html#8-ajouter-lactivite-if-condition-dans-foreach"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "9-configurer-la-branche-true-copy-data",
          "excerpt": "1. Sur EstCSV, cliquez sur l'icône crayon (True). 2. Glissez Copy data (Nom : CopierVersBronze). 3. Source : Lakehouse LHEnergieBronze, Root folder : Files, File name : `@item().name`. 4. Destination : Lakehouse LHEnergieBronze, Root folder : Tables, Table action : Append, Table name : `@replace(ite",
          "url": "sources/module2-atelier1.html#9-configurer-la-branche-true-copy-data"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "10-ajouter-les-activites-de-tracabilite-dans-la-branche-true",
          "excerpt": "1. Append Variable (TracerFichier) : Reliez à Copy Data. Variable : FichiersTemp, Value : `@item().name`. 2. Set Variable (RecupererTracage) : Reliez à TracerFichier. Variable : FichiersTraites, Value : `@variables('FichiersTemp')`.",
          "url": "sources/module2-atelier1.html#10-ajouter-les-activites-de-tracabilite-dans-la-branche-true"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "sauvegarder-et-tester-le-pipeline",
          "excerpt": "1. Cliquez sur Save, puis sur Run. 2. Vérifiez dans l'onglet Output que chaque étape (ScanLanding, BouclerFichiers, CopierVersBronze, etc.) affiche l'état \"Succeeded\".",
          "url": "sources/module2-atelier1.html#sauvegarder-et-tester-le-pipeline"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "Atelier Pipeline – Étude de cas 1",
          "sourceFile": "sources/module2-atelier1.html",
          "slug": "module2-atelier1",
          "anchor": "valider-les-resultats",
          "excerpt": "1. Retournez dans le Lakehouse LHEnergieBronze. 2. Dans la section Tables, vérifiez la présence et le nombre de lignes des tables : besoinsenergetiques (168 lignes), productionsolaire (175 lignes) et productioneolienne (840 lignes).",
          "url": "sources/module2-atelier1.html#valider-les-resultats"
        }
      }
    },
    {
      "id": "s-4-0",
      "index": 11,
      "chapterId": "ch-4",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 2",
      "title": "Module 2 – Pipelines : Étude de Cas 2",
      "content": "<p>Voici une série de questions d'analyse et de réflexion technique basées sur l'implémentation de <strong>Microsoft Fabric</strong> dans cet atelier, afin d'évaluer la maîtrise des outils et des concepts :</p>\n<h3>1. Sur l'Architecture et l'Ingestion</h3>\n<ul>\n<li><strong>Architecture Medallion</strong> : Pourquoi est-il recommandé de séparer physiquement les données dans des Lakehouses distincts (<strong>LH_Energie_Bronze</strong> et <strong>LH_Energie_Silver</strong>) plutôt que d'utiliser de simples dossiers ?  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>    <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></li>\n<li><strong>Contraintes de nommage</strong> : Quelle est la règle critique concernant le nommage des tables Delta dans Fabric lors de l'utilisation de l'activité <em>Copy Data</em>, et quelle erreur cela évite-t-il ?  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n</ul>\n<h3>2. Sur les Activités de Pipeline</h3>\n<ul>\n<li><strong>Activité Lookup</strong> : Quel est l'impact de l'option <strong>\"First row only\"</strong> sur le format du JSON de sortie et pourquoi doit-on la décocher pour lire la table des seuils ?  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>   <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n<li><strong>Activité Until</strong> : Comment la variable <strong>NombreIterations</strong> est-elle utilisée pour éviter que le pipeline ne boucle indéfiniment en cas d'incidents persistants ?   <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span>   <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></li>\n<li><strong>If Condition</strong> : Dans le pipeline de transformation, quelle métrique spécifique de l'activité de copie précédente est vérifiée pour valider le passage à la branche \"True\" ?  <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>  <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span></li>\n</ul>\n<h3>3. Sur les Techniques de Transformation</h3>\n<ul>\n<li><strong>T-SQL Query</strong> : Comment l'utilisation de requêtes SQL directement dans la source d'une activité <em>Copy Data</em> permet-elle d'optimiser le volume de données transférées vers la couche <strong>Silver</strong> ?  <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></li>\n<li><strong>Agrégation Gold</strong> : Quelles sont les trois tables agrégées produites pour la couche <strong>Gold</strong> et quel est l'avantage de les stocker au format Delta pour Power BI ?  13 14</li>\n</ul>\n<h3>4. Sur l'Orchestration et la Gestion d'État</h3>\n<ul>\n<li><strong>Execute Pipeline</strong> : Pourquoi l'option <strong>\"Wait on completion\"</strong> est-elle indispensable dans le pipeline orchestrateur maître ?  <span class=\"ref\" data-ref-id=\"ref-15\">[15]</span>  <span class=\"ref\" data-ref-id=\"ref-16\">[16]</span></li>\n<li><strong>Variables de Pipeline</strong> : Quelle est la différence d'usage entre une activité <strong>Set Variable</strong> (utilisée pour les compteurs) et <strong>Append Variable</strong> (utilisée pour le traçage des anomalies) ? <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></li>\n</ul>",
      "refs": {
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 6 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 1 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 8 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 5 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 10 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 4 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 7 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 9 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "15": {
          "id": "ref-15",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 15 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "19": {
          "id": "ref-19",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 19 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 16 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 3 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 2 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        }
      }
    },
    {
      "id": "s-4-1",
      "index": 12,
      "chapterId": "ch-4",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 2",
      "title": "5. Analyse de la Qualité des Données",
      "content": "<ul>\n<li><strong>Indicateurs (KPI)</strong> : Si l'analyse dans le <strong>SQL Analytics Endpoint</strong> révèle que 45% des relevés de monitoring ont été éliminés entre Bronze et Silver, comment cela valide-t-il la logique métier appliquée ?  <span class=\"ref\" data-ref-id=\"ref-19\">[19]</span></li>\n</ul>\n<p>Souhaitez-vous que je génère un <strong>quiz interactif</strong> ou un <strong>rapport détaillé</strong> sur l'un de ces aspects techniques spécifiques ?</p>\n<p>Expliquez le rôle du SQL Analytics Endpoint dans la validation Gold</p>\n<p>Dans le cadre de cet atelier, le <strong>SQL Analytics Endpoint</strong> est l'outil privilégié pour interroger, valider et interpréter les données de la couche <strong>Gold</strong>. Son rôle se décline en plusieurs points clés :</p>\n<h3>1. Calcul et suivi des indicateurs clés (KPI)</h3>\n<p>Le SQL Analytics Endpoint permet d'exécuter des requêtes sur les tables Gold pour extraire des mesures de performance essentielles au réseau électrique. 1   2 Il sert notamment à valider :</p>\n<ul>\n<li><strong>Le taux de résolution des incidents</strong> : Vérifier que tous les incidents détectés ont bien été traités (cible de 100 %).  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>   <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>La disponibilité du réseau</strong> : Identifier les quartiers où la disponibilité est inférieure à 95 %, ce qui est considéré comme critique.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n<li><strong>La vélocité de traitement</strong> : Mesurer le temps moyen nécessaire pour résoudre un incident.  <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n</ul>\n<h3>2. Analyse et interprétation métier</h3>\n<p>Il est utilisé pour transformer les données agrégées en <strong>insights exploitables</strong> par la ville intelligente :</p>\n<ul>\n<li><strong>Profils de consommation</strong> : En interrogeant la table <code>goldconsoparquartier</code>, les analystes peuvent identifier les zones géographiques prioritaires pour l'optimisation énergétique.  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n<li><strong>Criticité des incidents</strong> : L'analyse de <code>goldincidents</code> via l'endpoint permet d'orienter les investissements vers la maintenance préventive en identifiant les types d'incidents critiques les plus fréquents. <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n</ul>\n<h3>3. Validation de la qualité et réduction des données</h3>\n<p>Le SQL Analytics Endpoint permet d'effectuer des <strong>analyses croisées entre les couches</strong> Medallion.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<ul>\n<li>Par exemple, pour calculer le <strong>taux de réduction des données</strong>, on utilise l'endpoint pour comparer les volumes bruts de la couche Bronze (7200 relevés) aux volumes filtrés de la couche Gold/Silver (~3960 relevés), confirmant ainsi une réduction cohérente de 45 % due à l'exclusion des capteurs défectueux.  <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span>  <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></li>\n</ul>\n<h3>4. Préparation à la consommation Power BI</h3>\n<p>Bien que les tables Gold soient destinées à Power BI via <strong>DirectLake</strong>, le SQL Analytics Endpoint sert d'étape de vérification ultime pour s'assurer que le schéma et les données des 3 tables Gold (<code>goldconsoparquartier</code>, <code>goldincidents</code>, <code>goldmetriques</code>) sont corrects et fidèles aux attentes avant leur publication finale.  <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span>  <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></p>\n<p>Comment configurer l'activité Until pour traiter les incidents ?</p>\n<p>Pour configurer l'activité <strong>Until</strong> afin de traiter les incidents dans Microsoft Fabric, vous devez suivre une procédure spécifique qui combine des paramètres de boucle et une séquence d'activités internes. Cette activité est conçue pour boucler sur les incidents non résolus jusqu'à ce qu'une condition d'arrêt soit remplie.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<p>Voici les étapes de configuration détaillées dans les sources :</p>",
      "refs": {
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 6 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 1 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 8 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 5 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 10 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 4 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 7 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 9 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "15": {
          "id": "ref-15",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 15 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "19": {
          "id": "ref-19",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 19 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 16 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 3 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 2 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        }
      }
    },
    {
      "id": "s-4-2",
      "index": 13,
      "chapterId": "ch-4",
      "chapterTitle": "Module 2 – Pipelines : Étude de Cas 2",
      "title": "1. Configuration initiale et emplacement",
      "content": "<ul>\n<li><strong>Emplacement</strong> : L'activité <strong>Until</strong> (nommée <em>BouclerJusquaResolution</em>) doit être placée sur le canvas principal du pipeline de transformation, après l'activité <strong>If Condition</strong>. <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n<li><strong>Paramètres (Settings)</strong> :</li>\n<li><strong>Expression</strong> : Vous devez définir une expression qui arrête la boucle soit quand il n'y a plus d'incidents, soit quand un nombre maximum d'itérations (par exemple 5) est atteint. <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>    <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span></li>\n<li><strong>Timeout</strong> : Il est recommandé de configurer un délai d'expiration, par exemple <strong>01:00:00</strong> (1 heure), pour éviter les boucles infinies.  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n</ul>\n<h3>2. Activités à l'intérieur de la boucle</h3>\n<p>Pour configurer le traitement proprement dit, vous devez double-cliquer sur l'activité <strong>Until</strong> et y ajouter la séquence suivante :  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span>  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></p>\n<ol>\n<li><strong>Lookup (CompterIncidentsNonResolus)</strong> : Utilisez cette activité pour interroger la table <code>incidents</code> dans le Lakehouse <strong>Bronze</strong> via une requête T-SQL afin de compter les lignes où le statut est \"Resolu = 'False'\".  4  6  L'option <strong>First row only</strong> doit être cochée pour récupérer un résultat unique.  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n<li><strong>Set Variable (MettreAJourCompteurIncidents)</strong> : Cette étape met à jour la variable de pipeline <code>IncidentsNonResolus</code> avec la valeur retournée par le Lookup précédent.  <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n<li><strong>Wait (SimulerTraitement)</strong> : Ajoutez une activité Wait (par exemple de <strong>3 secondes</strong>) pour simuler le temps nécessaire au traitement technique de l'incident.</li>\n<li><strong>Append Variable (TracerIteration)</strong> : Utilisez cette activité pour ajouter les détails de l'itération actuelle dans une variable de type tableau (<code>AnomaliesDetectees</code>), ce qui assure la traçabilité du traitement. <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span>  <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span></li>\n<li><strong>Set Variable (MettreAJourNombreIterations)</strong> : Enfin, incrémentez le compteur <code>NombreIterations</code> pour suivre l'avancement de la boucle.  <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span></li>\n</ol>\n<h3>3. Variables requises</h3>\n<p>Pour que cette configuration fonctionne, vous devez préalablement déclarer trois variables dans l'onglet <strong>Variables</strong> du pipeline :  <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span></p>\n<ul>\n<li><strong>AnomaliesDetectees</strong> (Type : Array)</li>\n<li><strong>IncidentsNonResolus</strong> (Type : Integer, valeur par défaut : 50)</li>\n<li><strong>NombreIterations</strong> (Type : Integer, valeur par défaut : 0)</li>\n</ul>\n<p>Cette technique permet de traiter environ <strong>17 incidents par cycle</strong>, permettant de résoudre l'intégralité des 50 incidents de l'étude de cas en 3 itérations environ.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>  <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></p>",
      "refs": {
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 6 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 1 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 8 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 5 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 10 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 4 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 7 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 9 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "15": {
          "id": "ref-15",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 15 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "19": {
          "id": "ref-19",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 19 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 16 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 3 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Pipeline – Étude de cas 2",
          "sourceFile": "sources/module2-atelier2.html",
          "slug": "module2-atelier2",
          "anchor": null,
          "excerpt": "Référence 2 – voir Atelier Pipeline – Étude de cas 2",
          "url": "sources/module2-atelier2.html"
        }
      }
    },
    {
      "id": "s-5-0",
      "index": 14,
      "chapterId": "ch-5",
      "chapterTitle": "Module 3 – Notebooks & Architecture Medallion",
      "title": "Module 3 – Notebooks & Architecture Medallion",
      "content": "<p>La notation <strong>cross-lakehouse</strong> est une méthode syntaxique spécifique dans Microsoft Fabric qui permet à un Notebook d'accéder aux données d'un Lakehouse autre que celui défini par défaut.</p>\n<p>Voici comment elle fonctionne et pourquoi elle est utilisée selon les sources :</p>\n<h3>1. La syntaxe obligatoire</h3>\n<p>Pour interroger une table située dans un Lakehouse secondaire, vous devez utiliser la structure suivante : <strong><code>Lakehouse_name.schema.table</code></strong>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<ul>\n<li><strong>Lakehouse_name</strong> : Le nom du Lakehouse source (par exemple, <code>Lakehouse_bronze</code>).</li>\n<li><strong>schema</strong> : Le nom du schéma logique (par exemple, <code>bronze</code>).</li>\n<li><strong>table</strong> : Le nom de la table Delta ciblée (par exemple, <code>consumption_raw</code>).</li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "ATELIER 2 : SILVER - NETTOYAGE (Spark SQL) Objectif : Nettoyer les données et identifier les limites de SQL --- 🎯 Objectif de l'atelier Nettoyer les données Bronze en supprimant les doublons, valeurs NULL et codes erreur. Normaliser les formats de dates et créer des agrégations horaires. Cette étape",
          "url": "sources/module3-silver.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Validation métier : Aucune donnée valide n'a été perdue. Le nettoyage est conservateur et fiable. --- 📝 Cellule 5 : Normalisation des dates 🔍 Avant d'exécuter Objectif : Unifier les 3 formats de dates détectés en Bronze en un seul format timestamp SQL standard. Formats détectés : • ISO 8601 : `2025-",
          "url": "sources/module3-silver.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "💡 Interprétation Cette inspection révèle immédiatement plusieurs défauts dans les données brutes. ⚠️ Les timestamps ne sont pas cohérents : certains en ISO 8601 (2025-12-01T00:15:00Z), d'autres en format français (01/12/2025 01:15), d'autres encore en format mixte (2025-12-01/12/01 00:15). Ce manque",
          "url": "sources/module3-bronze.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 💡 Interprétation ✅ 100% des dates normalisées : Aucune perte de ligne (16,426 conservées). Fonction COALESCE : Retourne la première valeur non-NULL trouvée. • Essaie d'abord le format standard (ISO 8601) • Si échec, essaie format français • Si échec, essaie format américain Avantage : Robuste",
          "url": "sources/module3-silver.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "📝 Cellule 2 : Import consumptionraw.csv → Table Delta 🔍 Avant d'exécuter Vous charger le premier fichier source, `consumptionraw.csv`, qui contient les données de consommation d'électricité capturées toutes les 15 minutes. PySpark offre une API `spark.read.format(\"csv\")` idéale pour charger des CSV.",
          "url": "sources/module3-bronze.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "Points clés techniques Architecture Delta Lake : Vous avez utilisé le format Delta, l'évolution de Parquet pour le data lakehouse. Delta offre garanties ACID (Atomicité, Cohérence, Isolation, Durabilité), versioning, et optimisation des performances. `SaveAsTable()` persiste les données en table gér",
          "url": "sources/module3-bronze.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "Les valeurs positives (2.34, 0.95, 4.67 MW) sont cohérentes avec les capacités déclarées des sites (entre 0.6 et 5 MW). Cependant, quelques valeurs semblent inhabituellement élevées ou basses, potentiellement des outliers métier. Cette vue confirme que la couche Bronze a bien préservé la brute réali",
          "url": "sources/module3-bronze.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "💻 Code 📤 Résultat 💡 Interprétation Ce diagnostic quantifie les anomalies et guide les priorités de nettoyage. ✅ Total de 18 144 lignes, mais seulement 17 280 combinaisons uniques (timestamp, siteid), révélant 864 doublons (4,8 % des données). Typiquement, ces doublons proviennent de retransmissions ",
          "url": "sources/module3-bronze.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "ATELIER 2 : SILVER - NETTOYAGE (Spark SQL) Objectif : Nettoyer les données et identifier les limites de SQL -------------------------------------------------------------------------------- 🎯 Objectif de l'atelier Nettoyer les données Bronze en supprimant les doublons, valeurs NULL et codes erreur. N",
          "url": "sources/module3-silver.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "📊 Contexte métier Les 18,144 lignes Bronze Objectif : obtenir un dataset propre de ~16,400 lignes < 18,144 prêt pour enrichissement PySpark. -------------------------------------------------------------------------------- 📝 Cellule 1 : Chargement depuis Bronze 🔍 Avant d'exécuter Objectif : Commencer",
          "url": "sources/module3-silver.html"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Cellule 0 : Exploration des données dans le Lakhousebronze En résumé : c’est une cellule de vérification / découverte pour visualiser un échantillon et connaître la taille du jeu de données brut. 📤 Résultat Aperçu des 10 premières lignes montrant mélange de données propres et erreurs. 💡 Interprétati",
          "url": "sources/module3-silver.html"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "-------------------------------------------------------------------------------- Cellule 1 : Creation du sechéma silver dans Lakehousesilver -------------------------------------------------------------------------------- 📝 Cellule 2 : Suppression des doublons 🔍 Avant d'exécuter Objectif : Supprimer",
          "url": "sources/module3-silver.html"
        },
        "13": {
          "id": "ref-13",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 📤 Résultat 💡 Interprétation ✅ 864 doublons supprimés (4.8%) : Retransmissions réseau typiques des capteurs IoT. Calcul de cohérence : • Théorique : 6 sites × 4 mesures/h × 24h × 30j = 17,280 lignes • Obtenu : 17,280 lignes ✅ Leçon technique : `DISTINCT` en SQL est optimal pour les doublons si",
          "url": "sources/module3-silver.html"
        },
        "14": {
          "id": "ref-14",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Validation métier : Aucune donnée valide n'a été perdue. Le nettoyage est conservateur et fiable. -------------------------------------------------------------------------------- 📝 Cellule 5 : Normalisation des dates 🔍 Avant d'exécuter Objectif : Unifier les 3 formats de dates détectés en Bronze en ",
          "url": "sources/module3-silver.html"
        },
        "15": {
          "id": "ref-15",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 💡 Interprétation ✅ 100% des dates normalisées : Aucune perte de ligne (16,426 conservées). Fonction COALESCE : Retourne la première valeur non-NULL trouvée. • Essaie d'abord le format standard (ISO 8601) • Si échec, essaie format français • Si échec, essaie format américain Avantage : Robuste",
          "url": "sources/module3-silver.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Filtres appliqués : • `consumptionmw IS NOT NULL` : Élimine 554 NULL • `consumptionmw >= 0` : Élimine 319 codes erreur (-999, -888, -777) • `consumptionmw < 10` : Élimine 27 outliers Total supprimé : 900 lignes problématiques 💻 Code 💡 Interprétation ✅ 854 lignes supprimées (5.0% du dédupliqué) : • 5",
          "url": "sources/module3-silver.html"
        },
        "17": {
          "id": "ref-17",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Transformation : • Avant : 16,426 mesures quart-horaires • Après : ~4,100 mesures horaires (par site) Métriques calculées : • Moyenne horaire (`avg`) • Maximum horaire (`max`) • Minimum horaire (`min`) • Nombre de mesures par heure (`count`) 💻 Code 📤 Résultat *(Résultat approximatif basé sur 30 jour",
          "url": "sources/module3-silver.html"
        },
        "18": {
          "id": "ref-18",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Pourquoi agréger ? • Réduit le bruit des mesures quart-horaires • Simplifie l'analyse (1 point/heure au lieu de 4) • Conserve l'information via min/max/avg -------------------------------------------------------------------------------- 📝 Cellule 7 : Jointure avec prix spot 🔍 Avant d'exécuter Object",
          "url": "sources/module3-silver.html"
        },
        "19": {
          "id": "ref-19",
          "sourceTitle": "Atelier Notebooks – Couche Gold",
          "sourceFile": "sources/module3-gold.html",
          "slug": "module3-gold",
          "anchor": null,
          "excerpt": "ATELIER 3 : COUCHE GOLD — TABLES ANALYTIQUES ET KPIs Lakehouse : `Lakehousegold` Notebook : `NB03Gold` Objectif : Construire les tables analytiques finales pour la prise de décision -------------------------------------------------------------------------------- 🎯 Objectif À la fin de cet atelier, v",
          "url": "sources/module3-gold.html"
        }
      }
    },
    {
      "id": "s-5-1",
      "index": 15,
      "chapterId": "ch-5",
      "chapterTitle": "Module 3 – Notebooks & Architecture Medallion",
      "title": "2. Pourquoi l'utiliser ?",
      "content": "<p>Dans l'architecture Microsoft Fabric, un Notebook est généralement attaché à un Lakehouse par défaut. Si vous écrivez une requête Spark ou SQL simple sans préciser le nom du Lakehouse, <strong>Spark cherchera uniquement dans le lakehouse par défaut</strong>. La notation complète est donc <strong>obligatoire</strong> dès que vous devez manipuler des données provenant de plusieurs sources ou couches différentes (comme passer de Bronze à Silver).  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span></p>\n<h3>3. Application concrète dans le projet</h3>\n<p>Dans le cadre de l'atelier Silver, cette technique est utilisée de la manière suivante :</p>\n<ul>\n<li><strong>Contexte</strong> : Le Notebook (<code>NB_02_Bronze_Silver</code>) est attaché au <code>Lakehouse_silver</code>.   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n<li><strong>Action</strong> : Pour importer les 18 144 lignes de données brutes stockées dans la couche précédente, le Notebook utilise la notation cross-lakehouse pour \"pointer\" vers le <code>Lakehouse_bronze</code>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></li>\n<li><strong>Résultat</strong> : Cela permet de réaliser des jointures ou des transferts de données entre les différentes couches de l'architecture Medallion tout en maintenant une séparation physique des données dans des Lakehouses distincts.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>  <span class=\"ref\" data-ref-id=\"ref-4\">[4]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "ATELIER 2 : SILVER - NETTOYAGE (Spark SQL) Objectif : Nettoyer les données et identifier les limites de SQL --- 🎯 Objectif de l'atelier Nettoyer les données Bronze en supprimant les doublons, valeurs NULL et codes erreur. Normaliser les formats de dates et créer des agrégations horaires. Cette étape",
          "url": "sources/module3-silver.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Validation métier : Aucune donnée valide n'a été perdue. Le nettoyage est conservateur et fiable. --- 📝 Cellule 5 : Normalisation des dates 🔍 Avant d'exécuter Objectif : Unifier les 3 formats de dates détectés en Bronze en un seul format timestamp SQL standard. Formats détectés : • ISO 8601 : `2025-",
          "url": "sources/module3-silver.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "💡 Interprétation Cette inspection révèle immédiatement plusieurs défauts dans les données brutes. ⚠️ Les timestamps ne sont pas cohérents : certains en ISO 8601 (2025-12-01T00:15:00Z), d'autres en format français (01/12/2025 01:15), d'autres encore en format mixte (2025-12-01/12/01 00:15). Ce manque",
          "url": "sources/module3-bronze.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 💡 Interprétation ✅ 100% des dates normalisées : Aucune perte de ligne (16,426 conservées). Fonction COALESCE : Retourne la première valeur non-NULL trouvée. • Essaie d'abord le format standard (ISO 8601) • Si échec, essaie format français • Si échec, essaie format américain Avantage : Robuste",
          "url": "sources/module3-silver.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "📝 Cellule 2 : Import consumptionraw.csv → Table Delta 🔍 Avant d'exécuter Vous charger le premier fichier source, `consumptionraw.csv`, qui contient les données de consommation d'électricité capturées toutes les 15 minutes. PySpark offre une API `spark.read.format(\"csv\")` idéale pour charger des CSV.",
          "url": "sources/module3-bronze.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "Points clés techniques Architecture Delta Lake : Vous avez utilisé le format Delta, l'évolution de Parquet pour le data lakehouse. Delta offre garanties ACID (Atomicité, Cohérence, Isolation, Durabilité), versioning, et optimisation des performances. `SaveAsTable()` persiste les données en table gér",
          "url": "sources/module3-bronze.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "Les valeurs positives (2.34, 0.95, 4.67 MW) sont cohérentes avec les capacités déclarées des sites (entre 0.6 et 5 MW). Cependant, quelques valeurs semblent inhabituellement élevées ou basses, potentiellement des outliers métier. Cette vue confirme que la couche Bronze a bien préservé la brute réali",
          "url": "sources/module3-bronze.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Notebooks – Couche Bronze",
          "sourceFile": "sources/module3-bronze.html",
          "slug": "module3-bronze",
          "anchor": null,
          "excerpt": "💻 Code 📤 Résultat 💡 Interprétation Ce diagnostic quantifie les anomalies et guide les priorités de nettoyage. ✅ Total de 18 144 lignes, mais seulement 17 280 combinaisons uniques (timestamp, siteid), révélant 864 doublons (4,8 % des données). Typiquement, ces doublons proviennent de retransmissions ",
          "url": "sources/module3-bronze.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "ATELIER 2 : SILVER - NETTOYAGE (Spark SQL) Objectif : Nettoyer les données et identifier les limites de SQL -------------------------------------------------------------------------------- 🎯 Objectif de l'atelier Nettoyer les données Bronze en supprimant les doublons, valeurs NULL et codes erreur. N",
          "url": "sources/module3-silver.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "📊 Contexte métier Les 18,144 lignes Bronze Objectif : obtenir un dataset propre de ~16,400 lignes < 18,144 prêt pour enrichissement PySpark. -------------------------------------------------------------------------------- 📝 Cellule 1 : Chargement depuis Bronze 🔍 Avant d'exécuter Objectif : Commencer",
          "url": "sources/module3-silver.html"
        },
        "11": {
          "id": "ref-11",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Cellule 0 : Exploration des données dans le Lakhousebronze En résumé : c’est une cellule de vérification / découverte pour visualiser un échantillon et connaître la taille du jeu de données brut. 📤 Résultat Aperçu des 10 premières lignes montrant mélange de données propres et erreurs. 💡 Interprétati",
          "url": "sources/module3-silver.html"
        },
        "12": {
          "id": "ref-12",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "-------------------------------------------------------------------------------- Cellule 1 : Creation du sechéma silver dans Lakehousesilver -------------------------------------------------------------------------------- 📝 Cellule 2 : Suppression des doublons 🔍 Avant d'exécuter Objectif : Supprimer",
          "url": "sources/module3-silver.html"
        },
        "13": {
          "id": "ref-13",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 📤 Résultat 💡 Interprétation ✅ 864 doublons supprimés (4.8%) : Retransmissions réseau typiques des capteurs IoT. Calcul de cohérence : • Théorique : 6 sites × 4 mesures/h × 24h × 30j = 17,280 lignes • Obtenu : 17,280 lignes ✅ Leçon technique : `DISTINCT` en SQL est optimal pour les doublons si",
          "url": "sources/module3-silver.html"
        },
        "14": {
          "id": "ref-14",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Validation métier : Aucune donnée valide n'a été perdue. Le nettoyage est conservateur et fiable. -------------------------------------------------------------------------------- 📝 Cellule 5 : Normalisation des dates 🔍 Avant d'exécuter Objectif : Unifier les 3 formats de dates détectés en Bronze en ",
          "url": "sources/module3-silver.html"
        },
        "15": {
          "id": "ref-15",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "💻 Code 💡 Interprétation ✅ 100% des dates normalisées : Aucune perte de ligne (16,426 conservées). Fonction COALESCE : Retourne la première valeur non-NULL trouvée. • Essaie d'abord le format standard (ISO 8601) • Si échec, essaie format français • Si échec, essaie format américain Avantage : Robuste",
          "url": "sources/module3-silver.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Filtres appliqués : • `consumptionmw IS NOT NULL` : Élimine 554 NULL • `consumptionmw >= 0` : Élimine 319 codes erreur (-999, -888, -777) • `consumptionmw < 10` : Élimine 27 outliers Total supprimé : 900 lignes problématiques 💻 Code 💡 Interprétation ✅ 854 lignes supprimées (5.0% du dédupliqué) : • 5",
          "url": "sources/module3-silver.html"
        },
        "17": {
          "id": "ref-17",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Transformation : • Avant : 16,426 mesures quart-horaires • Après : ~4,100 mesures horaires (par site) Métriques calculées : • Moyenne horaire (`avg`) • Maximum horaire (`max`) • Minimum horaire (`min`) • Nombre de mesures par heure (`count`) 💻 Code 📤 Résultat *(Résultat approximatif basé sur 30 jour",
          "url": "sources/module3-silver.html"
        },
        "18": {
          "id": "ref-18",
          "sourceTitle": "2.Atelier silver.md",
          "sourceFile": "sources/module3-silver.html",
          "slug": "module3-silver",
          "anchor": null,
          "excerpt": "Pourquoi agréger ? • Réduit le bruit des mesures quart-horaires • Simplifie l'analyse (1 point/heure au lieu de 4) • Conserve l'information via min/max/avg -------------------------------------------------------------------------------- 📝 Cellule 7 : Jointure avec prix spot 🔍 Avant d'exécuter Object",
          "url": "sources/module3-silver.html"
        },
        "19": {
          "id": "ref-19",
          "sourceTitle": "Atelier Notebooks – Couche Gold",
          "sourceFile": "sources/module3-gold.html",
          "slug": "module3-gold",
          "anchor": null,
          "excerpt": "ATELIER 3 : COUCHE GOLD — TABLES ANALYTIQUES ET KPIs Lakehouse : `Lakehousegold` Notebook : `NB03Gold` Objectif : Construire les tables analytiques finales pour la prise de décision -------------------------------------------------------------------------------- 🎯 Objectif À la fin de cet atelier, v",
          "url": "sources/module3-gold.html"
        }
      }
    },
    {
      "id": "s-6-0",
      "index": 16,
      "chapterId": "ch-6",
      "chapterTitle": "Module 4 – Warehouse & Modèle Sémantique",
      "title": "Module 4 – Warehouse & Modèle Sémantique",
      "content": "<p>Comment est structuré le schéma en étoile du Warehouse ?</p>\n<p>Le schéma en étoile du Warehouse (<strong>WH_EnergiDistrib</strong>) est structuré autour d'une table de faits centrale et de cinq dimensions périphériques, conçues pour optimiser les analyses décisionnelles.</p>\n<p>Voici le détail de sa structure :</p>\n<h3>1. La Table de Faits Centrale</h3>\n<ul>\n<li><strong><code>Fact_OrderLines</code></strong> : C'est le cœur du schéma. Elle regroupe les données transactionnelles détaillées, correspondant aux lignes de commande. Elle contient les mesures quantitatives (quantités, revenus, marges) ainsi que les clés étrangères permettant de se lier aux dimensions.</li>\n</ul>\n<h3>2. Les Cinq Dimensions</h3>\n<p>Les dimensions fournissent le contexte (qui, quoi, où, quand) pour analyser les faits :</p>\n<ul>\n<li><strong><code>Dim_Customer</code></strong> : Contient les informations sur les 2 500 clients professionnels. Elle est particulière car elle implémente le <strong>SCD Type 2</strong>, permettant de conserver l'historique des changements (comme le segment client) via des versions de lignes marquées par les colonnes <code>IsCurrent</code>, <code>ValidFrom</code> et <code>ValidTo</code>.</li>\n<li><strong><code>Dim_Product</code></strong> : Regroupe le catalogue des 800 produits, organisés par catégories et sous-catégories.</li>\n<li><strong><code>Dim_Date</code></strong> : Essentielle pour toutes les analyses temporelles (YTD, YoY, comparaisons mensuelles).</li>\n<li><strong><code>Dim_SalesRep</code></strong> : Contient les données sur les 60 vendeurs, incluant leur région et leurs objectifs annuels de vente.</li>\n<li><strong><code>Dim_Warehouse</code></strong> : Détaille les 12 entrepôts de distribution répartis dans les différents pays.</li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.3 — Mesures DAX (14 mesures) 🎯 Objectif : créer un socle de mesures réutilisables (CA, marge, volumes, temps, objectifs) sans dépendre de colonnes calculées (qui peuvent être limitées selon le mode / l’UI Fabric). Dans le modèle sémantique : cliquer sur FactOrderLines → New measure, puis créer les",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "⚠️ Interface ciblée : l'éditeur de rapport intégré à Fabric (`app.fabric.microsoft.com`), lancé depuis le modèle sémantique. Cet éditeur n'est pas Power BI Desktop — les panneaux et options portent des noms différents. 📋 Plan : Tableau de bord exécutif / Analyse des ventes / Analyse clients / Perfor",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Format : `Margin %` retourne une fraction décimale (ex : 0.253 = 25.3%). Dans Power BI, appliquez le format `0.0%`. Ne pas multiplier par 100 dans la mesure. Nb Orders — nombre de commandes (distinct). Fonctions : [DISTINCTCOUNT](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fdistinct",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Total Cost — coût total. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Total Margin — marge en valeur. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Margin % — taux de marge (= marge / CA). Fonctions : [DIVIDE](https:/",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Revenue PY — CA N‑1 sur la même période. Fonctions : [CALCULATE](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fcalculate%2F), [SAMEPERIODLASTYEAR](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsameperiodlastyear%2F). Revenue YoY % — évolution du CA vs N‑1. Fonctions : [DI",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "-------------------------------------------------------------------------------- Sauvegarder le rapport 1. Barre d'outils → Save (icône disquette ou bouton Save) 2. Saisir le nom : `RapportEnergiDistrib` 3. Choisir le workspace : votre workspace Fabric 4. Save ✅ Le rapport est désormais visible dans",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Dans l'éditeur Fabric web, le format des nombres affiché sur les visuels est piloté par la chaîne de format de la mesure définie dans le modèle sémantique. Il n'existe pas d'option \"Display units\" au niveau du visuel comme dans Desktop. À faire avant de créer le rapport — dans `SMEnergiDistrib`, cli",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Comment définir le format d'une mesure : dans le modèle sémantique → cliquer sur le nom de la mesure dans le panneau Data → dans le panneau de propriétés qui s'ouvre en bas → champ Format → saisir la chaîne de format → Entrée. La chaîne `#,0.0,,\" M€\"` signifie : séparateur de milliers (`#,0`), 1 d",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Vous pouvez aussi cliquer sur le bouton Create report visible sur la page du modèle sémantique. Les deux chemins aboutissent au même éditeur web. 3. L'éditeur s'ouvre dans un nouvel onglet avec une page vierge nommée `Page 1` 4. Dans le panneau Data (droite) → vérifier que vous voyez les 6 tables ",
          "url": "sources/module4-warehouse.html"
        }
      }
    },
    {
      "id": "s-6-1",
      "index": 17,
      "chapterId": "ch-6",
      "chapterTitle": "Module 4 – Warehouse & Modèle Sémantique",
      "title": "3. Relations et Clés",
      "content": "<p>Le modèle utilise des relations de type <strong>plusieurs-à-un (Many-to-One)</strong> de la table de faits vers les dimensions. Les jointures se font principalement via des clés de substitution (Surrogate Keys) pour garantir l'intégrité, notamment pour la gestion de l'historique :</p>\n<ul>\n<li><code>CustomerSK</code>, <code>ProductSK</code>, <code>SalesRepSK</code>, <code>WarehouseSK</code>, et <code>DateKey</code>.</li>\n</ul>\n<h3>4. Couche de Vues Analytiques</h3>\n<p>En complément des tables physiques, le Warehouse expose des <strong>vues T-SQL</strong> qui simplifient l'accès aux indicateurs clés (KPIs) pour Power BI :</p>\n<ul>\n<li><strong><code>vw_MonthlySalesByCountry</code></strong> : Pour le pilotage par zone géographique.</li>\n<li><strong><code>vw_SalesRepPerformance</code></strong> : Pour mesurer l'atteinte des objectifs des vendeurs.</li>\n<li><strong><code>vw_ProductMarginAnalysis</code></strong> : Pour analyser la rentabilité du catalogue.</li>\n</ul>\n<p>Quel rôle joue le model semantique?</p>\n<p>Le <strong>modèle sémantique</strong> (nommé <code>SM_EnergiDistrib</code> dans cet atelier) joue un rôle de <strong>pont indispensable</strong> entre les données techniques stockées dans le Warehouse et les rapports visuels destinés aux utilisateurs finaux.</p>\n<p>Voici ses rôles principaux tels que décrits dans les sources :</p>\n<ul>\n<li><strong>Structuration des données (Schéma en étoile) :</strong> Il définit l'architecture logique du projet en créant des <strong>relations</strong> (type \"plusieurs-à-un\") entre la table de faits (<code>Fact_OrderLines</code>) et les différentes dimensions (Clients, Produits, Dates, etc.). Cela garantit que les filtres appliqués dans un rapport (ex: filtrer par pays) se propagent correctement à toutes les données transactionnelles.</li>\n<li><strong>Centralisation de la logique métier (DAX) :</strong> C'est le réceptacle des <strong>14 mesures DAX</strong> créées pour l'atelier (Chiffre d'affaires, Marge, évolution YoY, taux d'atteinte des objectifs). En définissant ces calculs une seule fois dans le modèle, on s'assure que tous les rapports utilisent les mêmes indicateurs, garantissant ainsi une <strong>source de vérité unique</strong>.</li>\n<li><strong>Optimisation des performances (DirectLake) :</strong> Le modèle utilise la technologie <strong>DirectLake</strong>, qui permet à Power BI de lire directement les fichiers de données dans OneLake. Cela élimine le besoin d'importer les données ou de configurer des rafraîchissements manuels : si le Pipeline met à jour le Warehouse, le rapport est automatiquement à jour.</li>\n<li><strong>Standardisation de l'affichage :</strong> Le modèle gère les <strong>chaînes de formatage</strong> (ex: afficher les millions en \"M€\" ou les pourcentages avec une décimale). Ce paramétrage centralisé permet de maintenir une cohérence visuelle sur toutes les pages du rapport Power BI sans avoir à reformater chaque visuel individuellement.</li>\n</ul>\n<p>En résumé, le modèle sémantique transforme des tables SQL brutes en une <strong>interface analytique intelligente</strong> prête à être explorée par les décideurs.</p>\n<p>C'est quoi une mesure dans le model semantique</p>\n<p>Dans le cadre de cet atelier, une <strong>mesure</strong> est une formule de calcul réutilisable, définie au sein du modèle sémantique (<code>SM_EnergiDistrib</code>) à l'aide du langage <strong>DAX</strong> (Data Analysis Expressions).</p>\n<p>Voici les caractéristiques et rôles essentiels d'une mesure tels que décrits dans les sources :</p>\n<h3>1. Un socle de calcul centralisé</h3>\n<p>Contrairement aux colonnes de données brutes, une mesure ne stocke pas de valeurs de manière statique. Elle constitue un <strong>socle de calculs</strong> (comme le chiffre d'affaires, la marge ou le nombre de commandes) qui s'exécutent dynamiquement en fonction des filtres appliqués dans un rapport. Dans cet atelier, <strong>14 mesures clés</strong> ont été créées pour assurer une logique métier cohérente.</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.3 — Mesures DAX (14 mesures) 🎯 Objectif : créer un socle de mesures réutilisables (CA, marge, volumes, temps, objectifs) sans dépendre de colonnes calculées (qui peuvent être limitées selon le mode / l’UI Fabric). Dans le modèle sémantique : cliquer sur FactOrderLines → New measure, puis créer les",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "⚠️ Interface ciblée : l'éditeur de rapport intégré à Fabric (`app.fabric.microsoft.com`), lancé depuis le modèle sémantique. Cet éditeur n'est pas Power BI Desktop — les panneaux et options portent des noms différents. 📋 Plan : Tableau de bord exécutif / Analyse des ventes / Analyse clients / Perfor",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Format : `Margin %` retourne une fraction décimale (ex : 0.253 = 25.3%). Dans Power BI, appliquez le format `0.0%`. Ne pas multiplier par 100 dans la mesure. Nb Orders — nombre de commandes (distinct). Fonctions : [DISTINCTCOUNT](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fdistinct",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Total Cost — coût total. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Total Margin — marge en valeur. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Margin % — taux de marge (= marge / CA). Fonctions : [DIVIDE](https:/",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Revenue PY — CA N‑1 sur la même période. Fonctions : [CALCULATE](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fcalculate%2F), [SAMEPERIODLASTYEAR](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsameperiodlastyear%2F). Revenue YoY % — évolution du CA vs N‑1. Fonctions : [DI",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "-------------------------------------------------------------------------------- Sauvegarder le rapport 1. Barre d'outils → Save (icône disquette ou bouton Save) 2. Saisir le nom : `RapportEnergiDistrib` 3. Choisir le workspace : votre workspace Fabric 4. Save ✅ Le rapport est désormais visible dans",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Dans l'éditeur Fabric web, le format des nombres affiché sur les visuels est piloté par la chaîne de format de la mesure définie dans le modèle sémantique. Il n'existe pas d'option \"Display units\" au niveau du visuel comme dans Desktop. À faire avant de créer le rapport — dans `SMEnergiDistrib`, cli",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Comment définir le format d'une mesure : dans le modèle sémantique → cliquer sur le nom de la mesure dans le panneau Data → dans le panneau de propriétés qui s'ouvre en bas → champ Format → saisir la chaîne de format → Entrée. La chaîne `#,0.0,,\" M€\"` signifie : séparateur de milliers (`#,0`), 1 d",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Vous pouvez aussi cliquer sur le bouton Create report visible sur la page du modèle sémantique. Les deux chemins aboutissent au même éditeur web. 3. L'éditeur s'ouvre dans un nouvel onglet avec une page vierge nommée `Page 1` 4. Dans le panneau Data (droite) → vérifier que vous voyez les 6 tables ",
          "url": "sources/module4-warehouse.html"
        }
      }
    },
    {
      "id": "s-6-2",
      "index": 18,
      "chapterId": "ch-6",
      "chapterTitle": "Module 4 – Warehouse & Modèle Sémantique",
      "title": "2. Le moteur de l'intelligence d'affaires (DAX)",
      "content": "<p>Les mesures utilisent des fonctions spécifiques pour transformer les données en indicateurs exploitables :</p>\n<ul>\n<li><strong>Agrégations simples :</strong> Utilisation de <code>SUM</code> pour le revenu total ou <code>DISTINCTCOUNT</code> pour le nombre de clients.</li>\n<li><strong>Calculs de ratios :</strong> Utilisation de <code>DIVIDE</code> pour calculer le taux de marge ou le panier moyen.</li>\n<li><strong>Intelligence temporelle :</strong> Utilisation de fonctions comme <code>SAMEPERIODLASTYEAR</code> ou <code>TOTALYTD</code> pour comparer les performances actuelles à celles de l'année précédente.</li>\n</ul>\n<h3>3. Contrôle du formatage</h3>\n<p>C'est la mesure qui pilote la manière dont les chiffres s'affichent dans les visuels Power BI. Par exemple, une chaîne de formatage définie au niveau de la mesure permet d'afficher automatiquement \"188.8 M€\" au lieu d'un nombre brut illisible, ou d'appliquer un symbole \"%\" avec une décimale précise.</p>\n<h3>4. Support indispensable des visuels (KPI et Gauges)</h3>\n<p>Pour certains visuels comme la <strong>Jauge</strong> (Gauge) ou les <strong>KPI</strong>, il est obligatoire d'utiliser des mesures, même pour définir une valeur cible constante (ex: un objectif de 100%). Power BI n'accepte pas de valeurs constantes saisies directement dans ces zones de champs ; elles doivent être encapsulées dans une mesure.</p>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.3 — Mesures DAX (14 mesures) 🎯 Objectif : créer un socle de mesures réutilisables (CA, marge, volumes, temps, objectifs) sans dépendre de colonnes calculées (qui peuvent être limitées selon le mode / l’UI Fabric). Dans le modèle sémantique : cliquer sur FactOrderLines → New measure, puis créer les",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "⚠️ Interface ciblée : l'éditeur de rapport intégré à Fabric (`app.fabric.microsoft.com`), lancé depuis le modèle sémantique. Cet éditeur n'est pas Power BI Desktop — les panneaux et options portent des noms différents. 📋 Plan : Tableau de bord exécutif / Analyse des ventes / Analyse clients / Perfor",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Format : `Margin %` retourne une fraction décimale (ex : 0.253 = 25.3%). Dans Power BI, appliquez le format `0.0%`. Ne pas multiplier par 100 dans la mesure. Nb Orders — nombre de commandes (distinct). Fonctions : [DISTINCTCOUNT](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fdistinct",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Total Cost — coût total. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Total Margin — marge en valeur. Fonctions : [SUM](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsum%2F). Margin % — taux de marge (= marge / CA). Fonctions : [DIVIDE](https:/",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Revenue PY — CA N‑1 sur la même période. Fonctions : [CALCULATE](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fcalculate%2F), [SAMEPERIODLASTYEAR](https://www.google.com/url?sa=E&q=https%3A%2F%2Fdax.guide%2Fsameperiodlastyear%2F). Revenue YoY % — évolution du CA vs N‑1. Fonctions : [DI",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "-------------------------------------------------------------------------------- Sauvegarder le rapport 1. Barre d'outils → Save (icône disquette ou bouton Save) 2. Saisir le nom : `RapportEnergiDistrib` 3. Choisir le workspace : votre workspace Fabric 4. Save ✅ Le rapport est désormais visible dans",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Dans l'éditeur Fabric web, le format des nombres affiché sur les visuels est piloté par la chaîne de format de la mesure définie dans le modèle sémantique. Il n'existe pas d'option \"Display units\" au niveau du visuel comme dans Desktop. À faire avant de créer le rapport — dans `SMEnergiDistrib`, cli",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Comment définir le format d'une mesure : dans le modèle sémantique → cliquer sur le nom de la mesure dans le panneau Data → dans le panneau de propriétés qui s'ouvre en bas → champ Format → saisir la chaîne de format → Entrée. La chaîne `#,0.0,,\" M€\"` signifie : séparateur de milliers (`#,0`), 1 d",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "Atelier Warehouse",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "💡 Vous pouvez aussi cliquer sur le bouton Create report visible sur la page du modèle sémantique. Les deux chemins aboutissent au même éditeur web. 3. L'éditeur s'ouvre dans un nouvel onglet avec une page vierge nommée `Page 1` 4. Dans le panneau Data (droite) → vérifier que vous voyez les 6 tables ",
          "url": "sources/module4-warehouse.html"
        }
      }
    },
    {
      "id": "s-7-0",
      "index": 19,
      "chapterId": "ch-7",
      "chapterTitle": "Module 6 & 8 – Sécurité et Gouvernance",
      "title": "Module 6 & 8 – Sécurité et Gouvernance",
      "content": "<p>Cet atelier sur la sécurisation de <strong>Microsoft Fabric</strong> se divise en deux parties principales : une mise en contexte sur le <strong>Lakehouse</strong> pour comprendre les bases des rôles et des permissions d'item, et une immersion dans le <strong>Warehouse</strong> pour maîtriser la sécurité SQL avancée (RLS, CLS, OLS).</p>\n<p>Voici les points clés et les concepts fondamentaux extraits des sources :</p>\n<h3>1. Rôles de Workspace et Permissions d'Item</h3>\n<p>Dans Fabric, la sécurité s'articule d'abord autour de quatre rôles de workspace : <strong>Admin, Member, Contributor, et Viewer</strong>.  <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span></p>\n<ul>\n<li><strong>Domination du rôle Workspace</strong> : Les sources soulignent que le rôle de workspace est le facteur dominant. Par exemple, un utilisateur ayant le rôle <strong>Viewer</strong> ne pourra pas exécuter un Notebook, même si on lui accorde explicitement les permissions d'item \"Execute\" ou \"Run\". <span class=\"ref\" data-ref-id=\"ref-2\">[2]</span>   <span class=\"ref\" data-ref-id=\"ref-3\">[3]</span></li>\n<li><strong>Permissions d'item</strong> : Via le menu <strong>Manage permissions</strong>, il est possible d'attribuer des droits plus fins tels que <em>Read, Write, Reshare, Execute, et ReadAll</em>. 4  Cependant, ces permissions ne peuvent pas surclasser les limites imposées par le rôle de workspace.</li>\n<li><strong>Le rôle Contributor</strong> : Il est identifié comme le rôle le plus stable et équilibré pour les démonstrations techniques, permettant l'accès aux Notebooks et au SQL sans les droits d'administration.  <span class=\"ref\" data-ref-id=\"ref-5\">[5]</span>   <span class=\"ref\" data-ref-id=\"ref-6\">[6]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Atelier : Sécurisation Microsoft Fabric - rôles Workspace, permissions d'item, limites Lakehouse et implémentation complète avec Warehouse Vous allez construire un atelier de sécurité Microsoft Fabric en deux temps : 1. une mise en contexte Lakehouse, uniquement pour montrer : • les rôles Admin / Me",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les règles à mémoriser 1 — Le rôle Workspace est le facteur dominant. Même avec `ReadAll`, `Execute`, `Run` et `Edit` accordés au niveau item, le rôle `Viewer` empêche l'exécution du Run. Les permissions d'item ne peuvent pas surclasser la limite imposée par le rôle. 2 — Changer de rôle peut réiniti",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Configuration testée : • Rôle Workspace : Viewer • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Share + Run Résultat observé : • Malgré tous les droits accordés sur le Notebook, le bouton Run reste invisible ou n",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1. Dans Manage permissions, repérer les permissions visibles dans votre environnement 2. Read ne veut pas dire automatiquement modifier 3. Write ne veut pas dire automatiquement repartager",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "4 — Le comportement Member est contre-intuitif. `Member` semble supérieur à `Contributor`, mais les tests montrent une perte du Run et du SQL Endpoint, alors que l'interface Lakehouse devient paradoxalement plus visible. À présenter comme une caractéristique réelle de Fabric, non comme un bug. 5 — C",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1.7.5 Scénario 5 – Passage en Contributor Configuration testée : • Rôle Workspace : Contributor • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Run Résultat observé : • Le bouton Run du Notebook devient visible (p",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les comptes pédagogiques utilisés dans l'atelier sont : • `participant@contactemeraudeit.onmicrosoft.com` : utilisateur métier restreint • `test@contactemeraudeit.onmicrosoft.com` : second utilisateur de test Le compte `dev@contactemeraudeit.onmicrosoft.com` n'est mentionné que comme compte d'admini",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Lecture : `—` signifie que la permission n’est pas applicable ou pas configurée explicitement (le comportement dépend des droits hérités). 4.4 - Appliquer les permissions SQL (exécuté par dev)",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Batterie de tests DDL 2. Toujours avec `test`, exécuter dans le sandbox : Résultats attendus — Contributor View s",
          "url": "sources/module4-warehouse.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "2. Vérifier l’état complet : Ce que vous devez voir à l’écran : • Aucune ligne dans le premier résultat (aucune appartenance à un rôle DB) • Aucune ligne dans le second résultat (aucune permission SQL directe) Résultat attendu : environnement neutre. `test` et `participant` n’ont que les droits issu",
          "url": "sources/module4-warehouse.html"
        },
        "13": {
          "id": "ref-13",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.1 - Configurer et appliquer le CLS Principe : `DENY SELECT ON OBJECT::table (colonne) TO [compte]` bloque une colonne précise. Le `DENY` est toujours prioritaire sur tout `GRANT`, y compris les permissions implicites du rôle Workspace — à condition que le compte ne soit pas dbowner. ⚠️ Pourquoi ut",
          "url": "sources/module4-warehouse.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Règle clé à retenir : dans Fabric Warehouse, le rôle Workspace agit comme un plancher de permissions, pas comme un plafond. Un DB role ne peut pas restreindre ce que le rôle Workspace accorde — seul un `DENY` SQL explicite le peut. 3. Nettoyer la ligne de test insérée : Phase A2 — Isoler dbdatareade",
          "url": "sources/module4-warehouse.html"
        },
        "21": {
          "id": "ref-21",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Ce que vous devez voir à l'écran : • Un partage ciblé au niveau de l'item Warehouse, indépendant du rôle Workspace global Résultat attendu : la comparaison finale entre rôle Workspace, permission d'item et permission SQL devient concrète. 💡 Astuce : cette dernière étape ferme parfaitement la boucle ",
          "url": "sources/module4-warehouse.html"
        }
      }
    },
    {
      "id": "s-7-1",
      "index": 20,
      "chapterId": "ch-7",
      "chapterTitle": "Module 6 & 8 – Sécurité et Gouvernance",
      "title": "2. Sécurisation Granulaire dans le Warehouse",
      "content": "<p>Le <strong>Warehouse</strong> est présenté comme le moteur le plus adapté aux démonstrations de sécurité SQL avancées. <span class=\"ref\" data-ref-id=\"ref-1\">[1]</span>   <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span></p>\n<ul>\n<li><strong>Object-Level Security (OLS)</strong> : Elle permet de contrôler l'accès aux schémas et aux tables via les commandes <strong>GRANT</strong> et <strong>DENY</strong>. Par exemple, on peut interdire l'accès au schéma \"bronze\" (données brutes) tout en autorisant le schéma \"silver\".  <span class=\"ref\" data-ref-id=\"ref-8\">[8]</span>   <span class=\"ref\" data-ref-id=\"ref-9\">[9]</span></li>\n<li><strong>Row-Level Security (RLS)</strong> : Ce mécanisme filtre les données au niveau des lignes. Une <strong>fonction de prédicat</strong> est créée pour vérifier l'identité de l'utilisateur (USER_NAME()) par rapport à une table de mapping de sécurité (ex: un vendeur ne voit que les ventes de sa région). <span class=\"ref\" data-ref-id=\"ref-10\">[10]</span></li>\n<li><strong>Column-Level Security (CLS)</strong> : Elle permet de restreindre l'accès à des colonnes spécifiques, comme des emails clients ou des marges financières, en utilisant la commande <code>DENY SELECT</code> sur l'objet concerné.  <span class=\"ref\" data-ref-id=\"ref-13\">[13]</span></li>\n</ul>\n<h3>3. Interactions entre Rôles Workspace et SQL</h3>\n<p>Un concept crucial révélé par les sources est que dans le Warehouse, le rôle Workspace agit comme un <strong>\"plancher\" de permissions</strong>, et non comme un plafond.  <span class=\"ref\" data-ref-id=\"ref-16\">[16]</span></p>\n<ul>\n<li>Un <strong>Contributor</strong> possède déjà des droits d'écriture (DML) implicites dans le Warehouse. Lui ajouter un rôle SQL comme <code>db_datareader</code> ne restreindra pas ses droits d'écriture.  <span class=\"ref\" data-ref-id=\"ref-16\">[16]</span></li>\n<li><strong>La force du DENY</strong> : Seul un <strong>DENY SQL explicite</strong> peut bloquer un utilisateur ayant un rôle de workspace élevé (comme Contributor). Le DENY l'emporte toujours sur les permissions héritées, sauf pour le rôle Admin (db_owner) qui contourne ces restrictions.  <span class=\"ref\" data-ref-id=\"ref-13\">[13]</span></li>\n</ul>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Atelier : Sécurisation Microsoft Fabric - rôles Workspace, permissions d'item, limites Lakehouse et implémentation complète avec Warehouse Vous allez construire un atelier de sécurité Microsoft Fabric en deux temps : 1. une mise en contexte Lakehouse, uniquement pour montrer : • les rôles Admin / Me",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les règles à mémoriser 1 — Le rôle Workspace est le facteur dominant. Même avec `ReadAll`, `Execute`, `Run` et `Edit` accordés au niveau item, le rôle `Viewer` empêche l'exécution du Run. Les permissions d'item ne peuvent pas surclasser la limite imposée par le rôle. 2 — Changer de rôle peut réiniti",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Configuration testée : • Rôle Workspace : Viewer • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Share + Run Résultat observé : • Malgré tous les droits accordés sur le Notebook, le bouton Run reste invisible ou n",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1. Dans Manage permissions, repérer les permissions visibles dans votre environnement 2. Read ne veut pas dire automatiquement modifier 3. Write ne veut pas dire automatiquement repartager",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "4 — Le comportement Member est contre-intuitif. `Member` semble supérieur à `Contributor`, mais les tests montrent une perte du Run et du SQL Endpoint, alors que l'interface Lakehouse devient paradoxalement plus visible. À présenter comme une caractéristique réelle de Fabric, non comme un bug. 5 — C",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1.7.5 Scénario 5 – Passage en Contributor Configuration testée : • Rôle Workspace : Contributor • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Run Résultat observé : • Le bouton Run du Notebook devient visible (p",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les comptes pédagogiques utilisés dans l'atelier sont : • `participant@contactemeraudeit.onmicrosoft.com` : utilisateur métier restreint • `test@contactemeraudeit.onmicrosoft.com` : second utilisateur de test Le compte `dev@contactemeraudeit.onmicrosoft.com` n'est mentionné que comme compte d'admini",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Lecture : `—` signifie que la permission n’est pas applicable ou pas configurée explicitement (le comportement dépend des droits hérités). 4.4 - Appliquer les permissions SQL (exécuté par dev)",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Batterie de tests DDL 2. Toujours avec `test`, exécuter dans le sandbox : Résultats attendus — Contributor View s",
          "url": "sources/module4-warehouse.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "2. Vérifier l’état complet : Ce que vous devez voir à l’écran : • Aucune ligne dans le premier résultat (aucune appartenance à un rôle DB) • Aucune ligne dans le second résultat (aucune permission SQL directe) Résultat attendu : environnement neutre. `test` et `participant` n’ont que les droits issu",
          "url": "sources/module4-warehouse.html"
        },
        "13": {
          "id": "ref-13",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.1 - Configurer et appliquer le CLS Principe : `DENY SELECT ON OBJECT::table (colonne) TO [compte]` bloque une colonne précise. Le `DENY` est toujours prioritaire sur tout `GRANT`, y compris les permissions implicites du rôle Workspace — à condition que le compte ne soit pas dbowner. ⚠️ Pourquoi ut",
          "url": "sources/module4-warehouse.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Règle clé à retenir : dans Fabric Warehouse, le rôle Workspace agit comme un plancher de permissions, pas comme un plafond. Un DB role ne peut pas restreindre ce que le rôle Workspace accorde — seul un `DENY` SQL explicite le peut. 3. Nettoyer la ligne de test insérée : Phase A2 — Isoler dbdatareade",
          "url": "sources/module4-warehouse.html"
        },
        "21": {
          "id": "ref-21",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Ce que vous devez voir à l'écran : • Un partage ciblé au niveau de l'item Warehouse, indépendant du rôle Workspace global Résultat attendu : la comparaison finale entre rôle Workspace, permission d'item et permission SQL devient concrète. 💡 Astuce : cette dernière étape ferme parfaitement la boucle ",
          "url": "sources/module4-warehouse.html"
        }
      }
    },
    {
      "id": "s-7-2",
      "index": 21,
      "chapterId": "ch-7",
      "chapterTitle": "Module 6 & 8 – Sécurité et Gouvernance",
      "title": "Synthèse des niveaux de sécurité",
      "content": "<table>\n<thead>\n<tr>\n<th>Niveau de sécurité</th>\n<th>Contrôle</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n<td><strong>Rôle Workspace</strong></td>\n<td>L'accès global au conteneur de travail (Workspace)</td>\n</tr>\n<tr>\n<td><strong>Permission d'item</strong></td>\n<td>L'accès à un objet spécifique (un Lakehouse, un Warehouse)</td>\n</tr>\n<tr>\n<td><strong>Permission SQL</strong></td>\n<td>L'accès fin aux schémas, tables, colonnes et lignes</td>\n</tr>\n</tbody>\n</table>\n<p>En résumé, le <strong>Lakehouse</strong> sert à illustrer les limites du T-SQL granulaire et le fonctionnement des permissions d'item, tandis que le <strong>Warehouse</strong> offre une plateforme stable pour implémenter une gouvernance de données rigoureuse via le moteur SQL.  <span class=\"ref\" data-ref-id=\"ref-7\">[7]</span>  22</p>\n<h4>Popups:</h4>",
      "refs": {
        "1": {
          "id": "ref-1",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Atelier : Sécurisation Microsoft Fabric - rôles Workspace, permissions d'item, limites Lakehouse et implémentation complète avec Warehouse Vous allez construire un atelier de sécurité Microsoft Fabric en deux temps : 1. une mise en contexte Lakehouse, uniquement pour montrer : • les rôles Admin / Me",
          "url": "sources/module4-warehouse.html"
        },
        "2": {
          "id": "ref-2",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les règles à mémoriser 1 — Le rôle Workspace est le facteur dominant. Même avec `ReadAll`, `Execute`, `Run` et `Edit` accordés au niveau item, le rôle `Viewer` empêche l'exécution du Run. Les permissions d'item ne peuvent pas surclasser la limite imposée par le rôle. 2 — Changer de rôle peut réiniti",
          "url": "sources/module4-warehouse.html"
        },
        "3": {
          "id": "ref-3",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Configuration testée : • Rôle Workspace : Viewer • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Share + Run Résultat observé : • Malgré tous les droits accordés sur le Notebook, le bouton Run reste invisible ou n",
          "url": "sources/module4-warehouse.html"
        },
        "4": {
          "id": "ref-4",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1. Dans Manage permissions, repérer les permissions visibles dans votre environnement 2. Read ne veut pas dire automatiquement modifier 3. Write ne veut pas dire automatiquement repartager",
          "url": "sources/module4-warehouse.html"
        },
        "5": {
          "id": "ref-5",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "4 — Le comportement Member est contre-intuitif. `Member` semble supérieur à `Contributor`, mais les tests montrent une perte du Run et du SQL Endpoint, alors que l'interface Lakehouse devient paradoxalement plus visible. À présenter comme une caractéristique réelle de Fabric, non comme un bug. 5 — C",
          "url": "sources/module4-warehouse.html"
        },
        "6": {
          "id": "ref-6",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "1.7.5 Scénario 5 – Passage en Contributor Configuration testée : • Rôle Workspace : Contributor • Permissions sur le Lakehouse : Read + Write + Reshare + Execute + ReadAll + ViewOutput • Permissions sur le Notebook : Read + Edit + Run Résultat observé : • Le bouton Run du Notebook devient visible (p",
          "url": "sources/module4-warehouse.html"
        },
        "7": {
          "id": "ref-7",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Les comptes pédagogiques utilisés dans l'atelier sont : • `participant@contactemeraudeit.onmicrosoft.com` : utilisateur métier restreint • `test@contactemeraudeit.onmicrosoft.com` : second utilisateur de test Le compte `dev@contactemeraudeit.onmicrosoft.com` n'est mentionné que comme compte d'admini",
          "url": "sources/module4-warehouse.html"
        },
        "8": {
          "id": "ref-8",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Lecture : `—` signifie que la permission n’est pas applicable ou pas configurée explicitement (le comportement dépend des droits hérités). 4.4 - Appliquer les permissions SQL (exécuté par dev)",
          "url": "sources/module4-warehouse.html"
        },
        "9": {
          "id": "ref-9",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Batterie de tests DDL 2. Toujours avec `test`, exécuter dans le sandbox : Résultats attendus — Contributor View s",
          "url": "sources/module4-warehouse.html"
        },
        "10": {
          "id": "ref-10",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "2. Vérifier l’état complet : Ce que vous devez voir à l’écran : • Aucune ligne dans le premier résultat (aucune appartenance à un rôle DB) • Aucune ligne dans le second résultat (aucune permission SQL directe) Résultat attendu : environnement neutre. `test` et `participant` n’ont que les droits issu",
          "url": "sources/module4-warehouse.html"
        },
        "13": {
          "id": "ref-13",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "7.1 - Configurer et appliquer le CLS Principe : `DENY SELECT ON OBJECT::table (colonne) TO [compte]` bloque une colonne précise. Le `DENY` est toujours prioritaire sur tout `GRANT`, y compris les permissions implicites du rôle Workspace — à condition que le compte ne soit pas dbowner. ⚠️ Pourquoi ut",
          "url": "sources/module4-warehouse.html"
        },
        "16": {
          "id": "ref-16",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Règle clé à retenir : dans Fabric Warehouse, le rôle Workspace agit comme un plancher de permissions, pas comme un plafond. Un DB role ne peut pas restreindre ce que le rôle Workspace accorde — seul un `DENY` SQL explicite le peut. 3. Nettoyer la ligne de test insérée : Phase A2 — Isoler dbdatareade",
          "url": "sources/module4-warehouse.html"
        },
        "21": {
          "id": "ref-21",
          "sourceTitle": "2.Etude de cas 2 Securisation lakehouse et warehouse.md",
          "sourceFile": "sources/module4-warehouse.html",
          "slug": "module4-warehouse",
          "anchor": null,
          "excerpt": "Ce que vous devez voir à l'écran : • Un partage ciblé au niveau de l'item Warehouse, indépendant du rôle Workspace global Résultat attendu : la comparaison finale entre rôle Workspace, permission d'item et permission SQL devient concrète. 💡 Astuce : cette dernière étape ferme parfaitement la boucle ",
          "url": "sources/module4-warehouse.html"
        }
      }
    }
  ]
};
