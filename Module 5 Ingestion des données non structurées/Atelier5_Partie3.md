# Atelier 5 — Traitement des données non structurées

## Partie 3 : Rapport Power BI Fabric — KPIs & Analyse Churn

**Thème : Modèle sémantique Direct Lake + Table Date + Mesures DAX analytiques + 5 pages de rapport**

---

## Rappel et contexte

Les Parties 1 et 2 ont produit la table `silver_appels_enrichis` avec les colonnes suivantes :

| Colonne | Type | Description |
| --- | --- | --- |
| call_id | Text | Identifiant unique de l'appel |
| client_nom | Text | Nom du client |
| ville | Text | Ville du client |
| produit | Text | Produit concerné par l'appel |
| date_appel | DateTime | Date et heure de l'appel |
| duree_minutes | Decimal | Durée de l'appel en minutes |
| tranche_horaire | Text | Matin / Après-midi / Fin de journée |
| jour_semaine | Integer | Numéro du jour (1=Lundi … 7=Dimanche) |
| sentiment_ia | Text | Sentiment prédit par le modèle IA |
| score_sentiment | Decimal | Confiance de la prédiction IA (0 à 1) |
| intent_detecte | Text | Intention détectée automatiquement |
| score_risque_churn | Integer | Score de risque churn (0 à 100) |
| alerte_critique | Boolean | TRUE si score ≥ 50 |
| sentiment_reel | Text | Sentiment réel (vérité terrain pour audit qualité IA) |
| intention_reelle | Text | Intention réelle déclarée par le client |

**Objectif de la Partie 3 :**

1. **Table Date DimDate** — exploiter pleinement la dimension temporelle
2. **Mesures DAX analytiques** — comparaisons, écarts, précision IA, ratios
3. **Rapport 5 pages** — chaque page répond à une question analytique précise :
  - Page 1 : Vue d'ensemble & KPIs comparatifs
  - Page 2 : Analyse risque churn (jauges, scatter, seuils)
  - Page 3 : Analyse géographique (ville)
  - Page 4 : Qualité IA & intentions réelles
  - Page 5 : Détail par appel (drill-through)
4. **Vues T-SQL** — exploration SQL des sentiments sur le Lakehouse
5. **Visualisations Python** — analyse approfondie des sentiments

---

## Bloc 1 — Création du modèle sémantique

### 1.1 — Créer le modèle depuis le Lakehouse

1. Dans `WS_SolarVoix` → ouvrir `LH_SolarVoix`
2. Dans l'explorateur Tables → cocher `silver_appels_enrichis`
3. Cliquer **New semantic model** (barre du haut)
4. Nommer : `SM_SolarVoix_Appels`
5. Cliquer **Confirm**

### 1.2 — Vérifier la connexion Direct Lake

1. Modèle sémantique → onglet **Model view**
2. Badge **Direct Lake** visible sur la table
3. Vérifier colonnes dans le panneau droit

###

## Bloc 2 — Table Date DimDate

> 💡 **Pourquoi une table Date ?** Sans table Date dédiée, Power BI ne peut pas faire de comparaisons temporelles (semaine précédente, même mois l'an dernier), ni trier correctement les mois par nom. Une DimDate est **indispensable** pour exploiter la dimension temporelle.

### 2.1 — Créer la table DimDate dans LH_SolarVoix (Notebook)

> ⚠️ **Pourquoi dans le Lakehouse ?** Le modèle sémantique `SM_SolarVoix_Appels` fonctionne en mode **Direct Lake** : il lit les données de `LH_SolarVoix` mais **n'a pas de droits d'écriture**. Il est impossible d'y créer une table calculée DAX. La table `DimDate` doit donc être créée directement dans le Lakehouse, puis référencée par le modèle.

**Étape 1 — Ouvrir un Notebook dans LH_SolarVoix**

1. Dans `WS_SolarVoix` → ouvrir `LH_SolarVoix`
2. Barre du haut → **Open notebook** → **New notebook**
3. Nommer le notebook : `NB_Create_DimDate`
4. Vérifier que le Lakehouse `LH_SolarVoix` est bien attaché (panneau gauche)

**Étape 2 — Générer DimDate avec les dates de silver_appels_enrichis**

La plage de dates est calculée directement depuis `silver_appels_enrichis[date_appel]` pour garantir la cohérence.

```python
from pyspark.sql import functions as F
from pyspark.sql.types import DateType

# Lire la plage de dates depuis silver_appels_enrichis
df_appels = spark.table("silver_appels_enrichis")
date_range = df_appels.agg(
    F.min(F.col("date_appel").cast(DateType())).alias("date_min"),
    F.max(F.col("date_appel").cast(DateType())).alias("date_max")
).collect()[0]

date_min = date_range["date_min"]
date_max = date_range["date_max"]
print(f"Plage de dates : {date_min} → {date_max}")

# Générer la séquence de dates
df_dim = spark.sql(f"""
    SELECT sequence(
        TO_DATE('{date_min}'),
        TO_DATE('{date_max}'),
        INTERVAL 1 DAY
    ) AS date_array
""").select(F.explode("date_array").alias("Date"))

# Ajouter toutes les colonnes de dimension temporelle
df_dimdate = df_dim.select(
    F.col("Date"),
    F.year("Date").alias("Année"),
    F.concat(F.lit("T"), F.ceil(F.month("Date") / 3).cast("string")).alias("Trimestre"),
    F.month("Date").alias("Mois_Num"),
    F.date_format("Date", "MMMM").alias("Nom_Mois"),
    F.date_format("Date", "yyyy-MM").alias("Année_Mois"),
    F.weekofyear("Date").alias("Semaine"),
    F.dayofweek("Date").alias("Jour_Semaine"),   # 1=Dim ... 7=Sam (Spark)
    F.date_format("Date", "EEEE").alias("Nom_Jour"),
    F.when(F.dayofweek("Date").isin([1, 7]), True).otherwise(False).alias("Est_Weekend")
)

# Écrire dans le Lakehouse en mode overwrite
df_dimdate.write.format("delta").mode("overwrite").saveAsTable("DimDate")

print(f"Table DimDate créée : {df_dimdate.count()} lignes")
df_dimdate.show(5)
```

**Étape 3 — Ajouter une colonne date_appel_date à silver_appels_enrichis**

> ⚠️ **Pourquoi cette étape est indispensable ?** `silver_appels_enrichis[date_appel]` est de type **TimestampType** (date + heure), tandis que `DimDate[Date]` est de type **DateType** (date seule). En mode Direct Lake, une relation entre deux colonnes de types différents est silencieusement inactive — les visuels affichent `(Blank)`. Il faut donc ajouter une colonne de type `DateType` dans `silver_appels_enrichis` pour servir de clé de relation.

Dans le même notebook `NB_Create_DimDate`, ajouter une deuxième cellule :

```python
# Ajouter la colonne à la structure Delta (sans réécrire la table)
spark.sql("ALTER TABLE silver_appels_enrichis ADD COLUMN date_appel_date DATE")

# Remplir la colonne avec le cast Timestamp → Date
spark.sql("UPDATE silver_appels_enrichis SET date_appel_date = CAST(date_appel AS DATE)")

# Vérifier sur une lecture fraîche
spark.sql("SELECT date_appel, date_appel_date FROM silver_appels_enrichis LIMIT 3").show()
```

> 💡 `ALTER TABLE` + `UPDATE` Delta modifie la table chirurgicalement sans réécrire tous les fichiers Parquet — c'est plus rapide et sans risque de conflit de lecture.

La table `silver_appels_enrichis` contient maintenant une colonne `date_appel_date` de type **DateType**, compatible avec `DimDate[Date]`.

**Étape 4 — Vérifier les deux tables dans LH_SolarVoix**

1. Dans le panneau gauche du Notebook → **Tables** → actualiser (icône ↻)
2. `DimDate` et `silver_appels_enrichis` (mise à jour) doivent apparaître
3. Clic droit sur chacune → **Load data** → vérifier les premières lignes

**Étape 5 — Ajouter DimDate au modèle sémantique**

1. Dans `WS_SolarVoix` → ouvrir `SM_SolarVoix_Appels`
2. Barre du haut → **Edit data model** → onglet **Model view**
3. Barre du haut → **Add data** (ou **Edit tables**)
4. Cocher `DimDate` → **Confirm**
5. Les deux tables apparaissent dans le modèle avec le badge **Direct Lake**

### 2.2 — Créer la relation DimDate ↔ silver_appels_enrichis

La relation s'appuie sur `date_appel_date` (DateType) côté faits — pas sur `date_appel` (TimestampType).

1. Dans **Model view** → glisser `DimDate[Date]` vers `silver_appels_enrichis[date_appel_date]`
2. Relation créée : DimDate (1) → silver_appels_enrichis (*)
3. Vérifier : Cardinality = **One to many**, Cross filter = **Single**

### 2.3 — Marquer DimDate comme table Date officielle

1. Clic droit sur `DimDate` → **Mark as date table**
2. Sélectionner la colonne `Date`
3. Cliquer **OK**

> 💡 Ce marquage active les fonctions Time Intelligence DAX (`DATEADD`, `SAMEPERIODLASTYEAR`, etc.) sur cette table.

---

## Bloc 3 — Mesures DAX

> **Convention :** Toutes les mesures sont créées dans la table `silver_appels_enrichis`. Clic droit sur la table → **New measure**.

---

### Groupe A — Mesures constantes (obligatoires pour les Jauges)

> ⚠️ Dans Power BI Fabric, les champs **Minimum value** et **Maximum value** des jauges n'acceptent pas de valeurs saisies manuellement. Il faut impérativement des **mesures DAX** retournant une constante.

**Mesure C1 — Score Minimum**

```dax
Score Min =
0
```

**Mesure C2 — Score Maximum**

```dax
Score Max =
100
```

**Mesure C3 — Seuil Alerte**

```dax
Seuil Alerte =
40
```

**Mesure C4 — Objectif Taux Alertes**

```dax
Objectif Taux Alertes =
0.10
```

**Mesure C5 — Max Taux Alertes**

```dax
Max Taux Alertes =
0.30
```

**Mesure C6 — Objectif Détection Résiliation**

```dax
Objectif Détection Résiliation =
0.80
```

*Ces 6 mesures servent uniquement à alimenter les champs Min / Max / Target des jauges et des visuels Goals.*

---

### Groupe B — Mesures de base

**Mesure B1 — Score Churn Moyen**

```dax
Score Churn Moyen =
AVERAGE(silver_appels_enrichis[score_risque_churn])
```

**Mesure B2 — Taux Alertes Critiques**

```dax
Taux Alertes Critiques =
DIVIDE(
    COUNTROWS(FILTER(silver_appels_enrichis, silver_appels_enrichis[alerte_critique] = TRUE())),
    COUNTROWS(silver_appels_enrichis),
    0
)
```

*Format : Pourcentage, 1 décimale*

**Mesure B3 — Nb Appels en Alerte**

```dax
Nb Appels en Alerte =
CALCULATE(COUNTROWS(silver_appels_enrichis), silver_appels_enrichis[alerte_critique] = TRUE())
```

**Mesure B4 — Total Appels**

```dax
Total Appels =
COUNTROWS(silver_appels_enrichis)
```

**Mesure B5 — Seuil Danger P90**

```dax
Seuil Danger P90 =
PERCENTILE.INC(silver_appels_enrichis[score_risque_churn], 0.90)
```

**Mesure B6 — Score Churn Négatifs**

```dax
Score Churn Négatifs =
CALCULATE(
    AVERAGE(silver_appels_enrichis[score_risque_churn]),
    silver_appels_enrichis[sentiment_ia] = "negatif"
)
```

**Mesure B7 — Score Churn Hors Positif**

```dax
Score Churn Hors Positif =
CALCULATE(
    AVERAGE(silver_appels_enrichis[score_risque_churn]),
    silver_appels_enrichis[sentiment_ia] <> "positif"
)
```

**Mesure B8 — Taux Résiliation**

```dax
Taux Résiliation =
DIVIDE(
    CALCULATE(COUNTROWS(silver_appels_enrichis), silver_appels_enrichis[intent_detecte] = "resiliation"),
    COUNTROWS(silver_appels_enrichis),
    0
)
```

*Format : Pourcentage, 1 décimale*

**Mesure B9 — Durée Moy Appels Critiques**

```dax
Durée Moy Appels Critiques =
CALCULATE(
    AVERAGE(silver_appels_enrichis[duree_minutes]),
    silver_appels_enrichis[alerte_critique] = TRUE()
)
```

---

### Groupe C — Mesures de comparaison et d'écart

**Mesure D1 — Écart Score Négatifs vs Moyen**

```dax
Écart Négatifs vs Moyen =
[Score Churn Négatifs] - [Score Churn Moyen]
```

*Format : Nombre décimal, 1 décimale*

> 💡 Si cette mesure vaut +15, les appels négatifs ont un score 15 points au-dessus de la moyenne générale. Cela quantifie l'impact du sentiment négatif sur le risque churn.

**Mesure D2 — Ratio Score Hors Positif vs Négatifs**

```dax
Ratio Hors Positif vs Négatifs =
DIVIDE([Score Churn Hors Positif], [Score Churn Négatifs], 0)
```

*Format : Pourcentage, 1 décimale*

> 💡 Si le ratio est proche de 100%, les appels neutres ont presque le même score que les négatifs — le sentiment neutre est en réalité aussi risqué. Si le ratio est à 60%, les neutres sont nettement moins risqués.

**Mesure D3 — Ratio Résiliation vs Alertes**

```dax
Ratio Résiliation vs Alertes =
DIVIDE([Taux Résiliation], [Taux Alertes Critiques], 0)
```

*Format : Pourcentage, 1 décimale*

> 💡 Si ce ratio est supérieur à 100%, il y a plus d'intentions de résiliation que d'alertes critiques générées — le système sous-alerte : certains clients à risque passent sous le radar.

**Mesure D4 — Durée Critique vs Durée Globale**

```dax
Durée Critique vs Globale =
[Durée Moy Appels Critiques] - AVERAGE(silver_appels_enrichis[duree_minutes])
```

*Format : Nombre décimal, 1 décimale*

> 💡 Quantifie le surcoût opérationnel des appels critiques. Si +3 min, chaque alerte consomme 3 minutes supplémentaires par rapport à un appel normal.

---

### Groupe D — Mesures Qualité IA

**Mesure Q1 — Précision IA**

```dax
Précision IA =
DIVIDE(
    CALCULATE(
        COUNTROWS(silver_appels_enrichis),
        silver_appels_enrichis[sentiment_ia] = silver_appels_enrichis[sentiment_reel]
    ),
    COUNTROWS(silver_appels_enrichis),
    0
)
```

*Format : Pourcentage, 1 décimale*

> 💡 Mesure directe de la fiabilité du modèle IA. Si 80%, le modèle prédit correctement le sentiment dans 80% des cas.

**Mesure Q2 — Taux Intention Réelle Résiliation**

```dax
Taux Intention Réelle Résiliation =
DIVIDE(
    CALCULATE(
        COUNTROWS(silver_appels_enrichis),
        silver_appels_enrichis[intention_reelle] = "resiliation"
    ),
    COUNTROWS(silver_appels_enrichis),
    0
)
```

*Format : Pourcentage, 1 décimale*

> 💡 Comparé au `Taux Résiliation` (basé sur `intent_detecte`), cette mesure utilise la vérité terrain. Si l'écart est grand, le modèle manque des intentions de résiliation réelles.

**Mesure Q3 — Taux Détection Résiliation**

```dax
Taux Détection Résiliation =
DIVIDE([Taux Résiliation], [Taux Intention Réelle Résiliation], 0)
```

*Format : Pourcentage, 1 décimale*

> 💡 Recall du modèle sur la classe résiliation. Un score < 100% signifie que le modèle manque des cas réels de résiliation.

---

## Bloc 4 — Création du rapport dans Fabric

### 4.0 — Lancer l'éditeur de rapport depuis le modèle sémantique

Tout se passe dans le navigateur, directement depuis le workspace Fabric.

1. Dans `WS_SolarVoix` → ouvrir `SM_SolarVoix_Appels`
2. Barre du haut → **Create report**
3. L'éditeur de rapport Fabric s'ouvre dans un nouvel onglet du navigateur
4. **Ctrl+S** → nommer le rapport `RPT_SolarVoix_Appels` → **Save**

> 💡 Le rapport est automatiquement connecté au modèle sémantique `SM_SolarVoix_Appels` en mode Direct Lake. Toutes les tables et mesures créées dans les Blocs 2 et 3 sont immédiatement disponibles dans le panneau **Data** à droite.

### Présentation de l'interface de l'éditeur Fabric

```
┌──────────────────────────────────────────────────────────────────┐
│  Barre du haut : File / Insert / Modeling / View                  │
├──────────┬───────────────────────────────┬───────────────────────┤
│ Filtres  │         CANVAS                │  Panneau droit        │
│ (gauche) │  Zone de construction         │  ① Visualizations     │
│          │  du rapport                   │     ├ Build visual    │
│          │                               │     ├ Format visual   │
│          │                               │     └ Analytics       │
│          │                               │  ② Data (champs)      │
├──────────┴───────────────────────────────┴───────────────────────┤
│  Onglets de pages (bas)                                           │
└──────────────────────────────────────────────────────────────────┘
```

Les trois gestes de base à retenir dans cet éditeur :

- **Ajouter un visuel** → cliquer une icône dans le panneau **Visualizations** (panneau droit, onglet ①) — le visuel apparaît sur le canvas, sélectionné
- **Configurer un visuel** → visuel sélectionné → onglet **Build visual** (icône graphe) → glisser les champs depuis **Data** (panneau ②) vers les zones Value / Axis / Legend etc.
- **Mettre en forme** → visuel sélectionné → onglet **Format visual** (icône pinceau)

### Créer et nommer les 5 pages

1. Cliquer **+** en bas à gauche pour chaque nouvelle page
2. Clic droit sur l'onglet → **Rename page**
3. Nommer dans l'ordre : `Vue d'ensemble`, `Risque Churn`, `Géographie`, `Qualité IA`, `Détail appel`

---

### Page 1 — Vue d'ensemble & KPIs comparatifs

**Objectif :** Le responsable SAV doit répondre en 15 secondes à : "Est-ce que la situation s'améliore ou se dégrade ?"

---

#### Visuel 1 — KPI : Score churn moyen vs seuil

Le visuel **KPI** est différent du visuel **Card** : il affiche la valeur courante, une valeur cible, et un indicateur de tendance (flèche haut/bas colorée).

**Insérer :**

1. Canvas vide → **Visualizations** → icône **KPI** (cercle avec chiffre et flèche — chercher "KPI" dans la liste)

**Build visual :**

- **Value** : `Score Churn Moyen`
- **Target** : `Seuil Alerte` (mesure C3 = 40)
- **Trend axis** : `DimDate[Année_Mois]`

**Résultat :** La flèche est verte si le score est sous 40, rouge si au-dessus. La tendance mensuelle s'affiche en miniature sous la valeur.

---

#### Visuel 2 — Goals : Taux d'alertes critiques vs objectif 10%

Le visuel **Goals** (ou **Gauge** en mode linéaire) montre la progression vers un objectif.

**Insérer :**

1. Canvas vide → **Visualizations** → **Gauge**

**Build visual :**

- **Value** : `Taux Alertes Critiques`
- **Minimum value** : `Score Min` (mesure C1 — retourne 0)
- **Maximum value** : `Max Taux Alertes` (mesure C5 — retourne 0.30)
- **Target value** : `Objectif Taux Alertes` (mesure C4 — retourne 0.10)

> 💡 La jauge s'étend de 0 à 30%. La ligne cible à 10% est clairement visible. Si le taux réel dépasse 10%, l'aiguille franchit la cible sans déborder — le signal de dépassement est immédiat et lisible. Ne jamais utiliser l'objectif comme Maximum : quand la valeur dépasse la cible, la jauge devient incohérente.

---

#### Visuel 3 — Carte KPI : Nb appels en alerte

**Visualizations → Card**

- **Fields** : `Nb Appels en Alerte`
- **Title** : `Appels à risque élevé`

---

#### Visuel 4 — Carte KPI : Taux résiliation vs alertes

**Visualizations → Card**

- **Fields** : `Ratio Résiliation vs Alertes`
- **Title** : `Résiliations / Alertes`

> 💡 Si cette carte affiche > 100%, le système d'alerte est insuffisant — des clients déclarent vouloir résilier sans déclencher d'alerte. C'est le KPI de calibration du seuil d'alerte.

---

#### Visuel 5 — Carte KPI : Ratio Score Hors Positif vs Négatifs

**Visualizations → Card**

- **Fields** : `Ratio Hors Positif vs Négatifs`
- **Title** : `Neutres vs Négatifs (%)`

> 💡 Répond à la question : "Les appels neutres sont-ils aussi risqués que les négatifs ?" Si > 80%, la distinction neutre/négatif n'a pas beaucoup de valeur pour prédire le churn.

---

#### Visuel 6 — Ribbon Chart : Classement des sentiments par produit dans le temps

Le **Ribbon Chart** est un graphique en barres empilées avec des "rubans" qui relient les barres entre périodes, montrant comment les **rangs** changent dans le temps.

**Insérer :**

1. Canvas → **Visualizations** → **Ribbon chart** (chercher "ribbon" dans les icônes)

**Build visual :**

- **X-axis** : `DimDate[Nom Mois]`
- **Y-axis** : `Total Appels`
- **Legend** : `sentiment_ia`

**Analytics → Constant line :**

- Value : `Seuil Alerte` (mesure C3)
- Label : `Seuil 40`

> 💡 Le ribbon chart montre comment le volume d'appels par sentiment évolue mois par mois et si le rang des sentiments change. Si le ruban "negatif" monte progressivement en haut, la situation se dégrade.

---

#### Visuel 7 — Courbe de tendance avec seuil P90 par date

**Insérer :**

1. Canvas → **Visualizations** → **Line chart**

**Build visual :**

- **X-axis** : `DimDate[Année_Mois]`
- **Y-axis** : `Score Churn Moyen`
- **Secondary Y** : `Seuil Danger P90`

**Analytics → Constant line :**

- Value : `Seuil Alerte` (40)
- Color : rouge, Dotted, Label : `Seuil alerte`

> 💡 La courbe du P90 montre l'évolution du score des 10% d'appels les plus risqués. Si P90 monte alors que le Score Moyen reste stable, il y a une concentration de cas extrêmes qui s'aggravent.

---

#### Visuel 8 — Slicer : Filtre tranche horaire

**Visualizations → Slicer**

- **Field** : `tranche_horaire`
- **Style** : Tile

> 💡 Permet d'isoler les appels du matin / après-midi / fin de journée pour détecter si le churn est plus élevé à certaines heures.

---

### Page 2 — Risque Churn

**Objectif :** Comprendre les concentrations de risque, les corrélations et les comparaisons entre produits.

---

#### Visuel 1 — Jauge : Score churn global

**Visualizations → Gauge**

**Build visual :**

- **Value** : `Score Churn Moyen`
- **Minimum value** : `Score Min` (mesure C1)
- **Maximum value** : `Score Max` (mesure C2)
- **Target value** : `Seuil Alerte` (mesure C3)

> ⚠️ **Rappel :** Min / Max / Target doivent impérativement être des **mesures** (C1, C2, C3), pas des valeurs saisies manuellement.

**Format visual → Colors → Fill color → Conditional formatting :**

- 0–25 → `#27AE60` (vert)
- 25–40 → `#F39C12` (orange)
- 40–100 → `#E74C3C` (rouge)

---

#### Visuel 2 — Jauge comparée : Score churn appels négatifs

**Visualizations → Gauge** (deuxième jauge côte à côte)

**Build visual :**

- **Value** : `Score Churn Négatifs`
- **Minimum value** : `Score Min`
- **Maximum value** : `Score Max`
- **Target value** : `Seuil Alerte`

> 💡 Les deux jauges côte à côte permettent de voir l'écart entre le score global et le score des appels négatifs. L'écart visualisé = `Écart Négatifs vs Moyen`.

---

#### Visuel 3 — Carte KPI : Écart Négatifs vs Moyen

**Visualizations → Card**

- **Fields** : `Écart Négatifs vs Moyen`
- **Title** : `Surrisque appels négatifs`

> 💡 Complète les deux jauges en chiffrant l'écart. +20 points signifie que les appels négatifs ont un risque churn 20 points supérieur à la moyenne.

---

#### Visuel 4 — Scatter Chart : Score churn vs Durée d'appel (par produit)

Le **Scatter Chart** montre des concentrations de phénomènes en deux dimensions. Chaque bulle = un produit.

**Insérer :**

1. Canvas → **Visualizations** → **Scatter chart**

**Build visual :**

- **X-axis** : `Durée Moy Appels Critiques` (durée moyenne des appels critiques)
- **Y-axis** : `Score Churn Moyen`
- **Size** : `Nb Appels en Alerte` (taille de la bulle = nombre d'alertes)
- **Legend** : `produit` (une bulle par produit, chaque produit avec sa couleur)
- **Values** : laisser vide

**Analytics → Constant line :**

- Sur axe Y : Value = `Seuil Alerte` (40) — sépare zone sûre / zone rouge
- Sur axe X : créer une mesure `Durée Moy Globale` = `AVERAGE(silver_appels_enrichis[duree_minutes])` et l'utiliser comme référence

> 💡 **Lecture analytique :** Le quadrant haut-droit (score élevé + durée élevée) contient les produits les plus problématiques — ils génèrent à la fois des appels à haut risque ET mobilisent longtemps les agents. Ce sont les priorités d'action.

---

#### Visuel 5 — Scatter Chart : Confiance IA vs Score churn

**Visualizations → Scatter chart**

**Build visual :**

- **X-axis** : `score_sentiment` (Average — confiance du modèle IA)
- **Y-axis** : `Score Churn Moyen`
- **Legend** : `sentiment_ia`
- **Details** : `call_id`

> 💡 Si les points à faible confiance IA (x < 0.6) ont des scores churn très dispersés, cela signifie que le modèle IA est peu fiable sur ces cas — les alertes générées sur des prédictions peu confiantes sont moins fiables.

---

#### Visuel 6 — Pie Chart : Distribution des intentions détectées

**Visualizations → Pie chart**

**Build visual :**

- **Legend** : `intent_detecte`
- **Values** : `Total Appels`

> 💡 Le Pie chart est adapté ici car on veut voir les proportions relatives des intentions. La part des intentions "resiliation" et "menace_juridique" est directement lisible.

---

#### Visuel 7 — Barres horizontales : Taux résiliation vs Taux alertes par produit

**Visualizations → Clustered bar chart**

**Build visual :**

- **Y-axis** : `produit`
- **X-axis** : deux mesures superposées :
  - `Taux Résiliation`
  - `Taux Alertes Critiques`
- **Legend** : automatique (noms des mesures)

> 💡 **Question analytique :** Pour chaque produit, le taux de résiliation dépasse-t-il le taux d'alertes ? Si oui, le seuil d'alerte est trop élevé pour ce produit spécifique. Ce graphique identifie les produits sous-surveillés.

---

#### Visuel 8 — Slicer : Filtre sentiment_ia

**Visualizations → Slicer**

- **Field** : `sentiment_ia`
- **Style** : Tile

---

### Page 3 — Analyse Géographique

**Objectif :** Identifier les villes et régions où le risque churn est concentré pour orienter les actions terrain.

---

#### Visuel 1 — Treemap : Top 10 villes par volume et risque churn

**Visualizations → Treemap**

**Build visual :**

- **Category** : `ville`
- **Values** : `Total Appels` (taille de chaque tuile = volume d'appels)
- **Color saturation** : `Score Churn Moyen`
- **Tooltips** : `Nb Appels en Alerte`, `Taux Alertes Critiques`

**Appliquer deux filtres sur le visuel :**

**Filtre 1 — Exclure les villes nulles :**

1. Visuel sélectionné → panneau **Filters** → section **Filters on this visual**
2. Glisser `ville` dans cette zone
3. Filter type = **Basic filtering** → décocher **(Blank)**
4. Cliquer **Apply filter**

**Filtre 2 — Top 10 villes par score churn :**

1. Dans la même zone **Filters on this visual**, glisser à nouveau `ville`
2. Filter type = **Top N**
3. **Show items** : `Top` `10`
4. **By value** : glisser la mesure **`Score Churn Moyen`**
5. Cliquer **Apply filter**

> 💡 `Score Churn Moyen` comme critère de sélection est cohérent avec la Color saturation du treemap — les 10 villes affichées sont exactement celles avec le risque churn le plus élevé. Ne pas utiliser `Total Appels` (favorise les grandes villes indépendamment du risque) ni `Taux Résiliation` (taux biaisé sur les villes avec peu d'appels).

---

#### Visuel 2 — Barres horizontales : Top 10 villes par score churn

**Visualizations → Clustered bar chart**

**Build visual :**

- **Y-axis** : `ville`
- **X-axis** : `Score Churn Moyen`
- **Filters panel** (gauche) → ajouter `ville` → Top N = 10 (par `Score Churn Moyen`)

---

#### Visuel 3 — Matrice : Score churn — Ville × Produit

**Visualizations → Matrix**

**Build visual :**

- **Rows** : `ville`
- **Columns** : `produit`
- **Values** : `Score Churn Moyen`

**Format visual → Cell elements → Background color → Conditional formatting :**

- 0–25 : vert `#D5F5E3`
- 25–40 : orange `#FFF3CD`
- 40–100 : rouge `#FDDEDE`

> 💡 La matrice révèle les combinaisons ville/produit les plus problématiques. Une cellule rouge dans une ville spécifique pour un produit précis = problème localisé (installation, technicien, réseau).

---

#### Visuel 4 — Slicer : Filtre produit

**Visualizations → Slicer** → `produit` → Style : Tile

---

### Page 4 — Qualité IA & Intentions réelles

**Objectif :** Évaluer la fiabilité du modèle IA en comparant ses prédictions (`sentiment_ia`, `intent_detecte`) avec la réalité (`sentiment_reel`, `intention_reelle`). Identifier les cas où le modèle se trompe.

---

#### Visuel 1 — KPI : Précision globale du modèle IA

**Visualizations → KPI**

**Build visual :**

- **Value** : `Précision IA`
- **Target** : créer une mesure `Objectif Précision IA = 0.80` (80% comme seuil minimum acceptable)
- **Trend axis** : `DimDate[Nom Mois]`

> 💡 Si la précision descend sous 80%, le modèle produit trop d'erreurs et les alertes générées sont peu fiables. C'est le signal de re-entraînement du modèle.

---

#### Visuel 2 — Matrice de confusion : sentiment_reel vs sentiment_ia

**Visualizations → Matrix**

**Build visual :**

- **Rows** : `sentiment_reel` (vérité terrain)
- **Columns** : `sentiment_ia` (prédiction IA)
- **Values** : `Total Appels`

**Format visual → Cell elements → Background color → Conditional formatting :**

- Valeurs élevées hors diagonale = erreurs du modèle → rouge
- Valeurs sur la diagonale (bonne prédiction) → vert

> 💡 **Lecture de la matrice :** La diagonale (negatif/negatif, neutre/neutre, positif/positif) contient les prédictions correctes. Les cases hors diagonale contiennent les erreurs. Une case rouge dans (sentiment_reel="neutre", sentiment_ia="negatif") signifie que le modèle sur-prédit le sentiment négatif pour les appels réellement neutres.

---

#### Visuel 3 — Comparaison Cards : Résiliations détectées vs réelles

Deux cards côte à côte — aucune division, aucune instabilité liée à la densité des données.

**Visuel 3a — Card : Taux résiliation détectée par IA**

`Visualizations → Card`

- **Fields** : `Taux Résiliation`
- **Title** : `Résiliations détectées (IA)`
- Format : Pourcentage, 1 décimale

**Visuel 3b — Card : Taux résiliation réelle**

`Visualizations → Card`

- **Fields** : `Taux Intention Réelle Résiliation`
- **Title** : `Résiliations réelles (clients)`
- Format : Pourcentage, 1 décimale

> 💡 L'écart entre les deux valeurs est le signal clé : si l'IA détecte 5% mais que la réalité est 15%, le modèle manque 10 points de résiliations réelles sans déclencher d'alerte. Cette lecture directe est plus fiable qu'un ratio `DIVIDE` qui retourne 0 dès qu'un des termes est absent sur une période.

---

#### Visuel 4 — Scatter : Score sentiment (confiance IA) vs Précision par produit

**Visualizations → Scatter chart**

**Build visual :**

- **X-axis** : `score_sentiment` (Average — confiance IA)
- **Y-axis** : `Précision IA`
- **Details** : `produit`
- **Size** : `Total Appels`
- **Legend** : `produit`

> 💡 Si certains produits ont une faible confiance IA ET une faible précision, le modèle est peu fiable sur ces appels spécifiques. Cela peut justifier un pré-traitement différent pour ces catégories.

---

#### Visuel 5 — Slicer : Filtre produit

**Visualizations → Slicer** → `produit` → Style : Tile

---

#### Visuel 6 — Tableau des appels critiques (point d'entrée drill-through)

> 💡 Ce tableau est indispensable pour tester le drill-through vers la Page 5. Il expose `call_id` au niveau ligne — sans cela, le menu "Drill through" n'apparaît pas au clic droit.

**Visualizations → Table**

**Build visual → Columns :**
`call_id`, `client_nom`, `ville`, `produit`, `score_risque_churn`, `sentiment_ia`, `alerte_critique`

**Filter on this visual :**
Glisser `alerte_critique` → Basic filtering → cocher **TRUE** → **Apply filter**

Cliquer sur l'en-tête `score_risque_churn` pour trier par ordre décroissant.

**Tester le drill-through :**
Clic droit sur n'importe quelle ligne → **Drill through** → **Détail appel** → la Page 5 s'ouvre filtrée sur ce `call_id`.

---

### Page 5 — Détail par appel (Drill-through)

> 💡 **Drill-through :** Depuis n'importe quelle page, l'utilisateur fait un clic droit sur un élément (bulle, barre, ligne) → "Drill through" → "Détail appel". La page 5 s'ouvre filtrée sur cet élément.

**Configurer le drill-through :**

1. S'assurer d'être sur la page `Détail appel`
2. Panneau **Visualizations** → **Build visual** → section **Drill through**
3. Glisser `call_id` dans la zone **Add drill-through fields here**

---

#### Visuel 1 — KPI : Score de l'appel sélectionné

**Visualizations → KPI**

- **Value** : `Score Churn Moyen`
- **Target** : `Seuil Alerte`

---

#### Visuel 2 — Carte : Sentiment IA

**Visualizations → Card** → `sentiment_ia` (First)

- **Title** : `Sentiment IA`

---

#### Visuel 3 — Carte : Sentiment réel

**Visualizations → Card** → `sentiment_reel` (First)

- **Title** : `Sentiment réel (audit)`

> 💡 Placer les deux cartes sentiment côte à côte. Si elles divergent, la prédiction IA était incorrecte pour cet appel.

---

#### Visuel 4 — Carte : Intention détectée vs Intention réelle

**Visualizations → Card** → `intent_detecte` (First) + **Visualizations → Card** → `intention_reelle` (First)

- Placer côte à côte
- Titres : `Intention IA` et `Intention réelle`

---

#### Visuel 5 — Tableau : Données complètes de l'appel

**Visualizations → Table**

**Build visual → Columns :**
`call_id`, `client_nom`, `ville`, `produit`, `date_appel`, `duree_minutes`, `tranche_horaire`, `sentiment_ia`, `sentiment_reel`, `intent_detecte`, `intention_reelle`, `score_risque_churn`, `alerte_critique`

**Format visual → Specific column → `score_risque_churn` → Conditional formatting :**

- 0–25 : `#D5F5E3`, 25–40 : `#FFF3CD`, ≥ 40 : `#FDDEDE`

---

#### Bouton retour

**Insert → Buttons → Back** — positionner en haut à gauche

- Text : `← Retour`

---

## Bloc 5 — Vues T-SQL pour analyser les sentiments clients

> 💡 Accéder au SQL endpoint : dans `LH_SolarVoix` → menu déroulant **Lakehouse** → **SQL analytics endpoint** → **New query**

### Vue 1 — Distribution des sentiments par produit

```sql
CREATE VIEW v_sentiments_par_produit AS
SELECT
    produit,
    sentiment_ia,
    COUNT(*)                                          AS nb_appels,
    ROUND(AVG(CAST(score_risque_churn AS FLOAT)), 1)  AS score_churn_moyen,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY produit), 1) AS pct_dans_produit
FROM silver_appels_enrichis
GROUP BY produit, sentiment_ia;
```

```sql
SELECT * FROM v_sentiments_par_produit ORDER BY produit, sentiment_ia;
```

### Vue 2 — Clients les plus à risque

```sql
CREATE VIEW v_clients_a_risque AS
SELECT
    call_id, client_nom, ville, produit,
    sentiment_ia, intent_detecte, score_risque_churn,
    alerte_critique, date_appel,
    CASE
        WHEN score_risque_churn >= 70 THEN 'CRITIQUE'
        WHEN score_risque_churn >= 40 THEN 'ÉLEVÉ'
        WHEN score_risque_churn >= 25 THEN 'MODÉRÉ'
        ELSE 'FAIBLE'
    END AS niveau_risque
FROM silver_appels_enrichis
WHERE alerte_critique = 1;
```

```sql
SELECT TOP 20 * FROM v_clients_a_risque ORDER BY score_risque_churn DESC;
```

### Vue 3 — Comparaison sentiment_ia vs sentiment_reel (matrice de confusion SQL)

```sql
CREATE VIEW v_precision_ia AS
SELECT
    sentiment_reel,
    sentiment_ia,
    COUNT(*)                                        AS nb_appels,
    ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (PARTITION BY sentiment_reel), 1) AS pct_dans_classe
FROM silver_appels_enrichis
GROUP BY sentiment_reel, sentiment_ia;
```

```sql
-- Matrice de confusion : lignes = réel, colonnes = prédit
SELECT * FROM v_precision_ia ORDER BY sentiment_reel, sentiment_ia;
```

```sql
-- Précision globale
SELECT
    ROUND(100.0 * SUM(CASE WHEN sentiment_ia = sentiment_reel THEN 1 ELSE 0 END) / COUNT(*), 1)
    AS precision_pct
FROM silver_appels_enrichis;
```

### Vue 4 — Intentions réelles vs détectées par produit

```sql
CREATE VIEW v_intention_comparison AS
SELECT
    produit,
    intention_reelle,
    intent_detecte,
    COUNT(*) AS nb_appels,
    ROUND(AVG(CAST(score_risque_churn AS FLOAT)), 1) AS score_moyen,
    CASE WHEN intention_reelle = intent_detecte THEN 'CORRECT' ELSE 'ERREUR' END AS detection_ok
FROM silver_appels_enrichis
GROUP BY produit, intention_reelle, intent_detecte;
```

```sql
-- Taux de détection correcte par produit
SELECT produit,
       COUNT(*) AS nb_total,
       SUM(CASE WHEN detection_ok = 'CORRECT' THEN 1 ELSE 0 END) AS nb_correct,
       ROUND(100.0 * SUM(CASE WHEN detection_ok = 'CORRECT' THEN 1 ELSE 0 END) / COUNT(*), 1) AS precision_pct
FROM v_intention_comparison
GROUP BY produit
ORDER BY precision_pct;
```

### Vue 5 — Tendance hebdomadaire

```sql
CREATE VIEW v_tendance_hebdomadaire AS
SELECT
    DATEPART(YEAR, date_appel)  AS annee,
    DATEPART(WEEK, date_appel)  AS semaine,
    sentiment_ia,
    COUNT(*)                                         AS nb_appels,
    ROUND(AVG(CAST(score_risque_churn AS FLOAT)), 1) AS score_moyen
FROM silver_appels_enrichis
GROUP BY DATEPART(YEAR, date_appel), DATEPART(WEEK, date_appel), sentiment_ia;
```

---

## Bloc 6 — Visualisation Python avec Seaborn et Matplotlib

### Prérequis — Chargement des données

```python
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import seaborn as sns
import warnings
warnings.filterwarnings("ignore")

df = spark.table("silver_appels_enrichis").toPandas()  # Lakehouse attaché = nom simple suffisant, ne pas utiliser LH_SolarVoix.dbo.silver_appels_enrichis
df["date_appel"] = pd.to_datetime(df["date_appel"])

PALETTE = {"negatif": "#E74C3C", "neutre": "#F39C12", "positif": "#27AE60"}
SEUIL_ALERTE = 40

print(f"Données chargées : {len(df)} appels")
print(df[["sentiment_ia", "sentiment_reel", "score_risque_churn", "ville", "produit"]].describe(include="all").T)
```

---

### Graphique 1 — Distribution des scores churn par sentiment

```python
fig, axes = plt.subplots(1, 3, figsize=(15, 5), sharey=True)
fig.suptitle("Distribution du score churn par sentiment", fontsize=14, fontweight="bold")

for ax, sent in zip(axes, ["negatif", "neutre", "positif"]):
    sous = df[df["sentiment_ia"] == sent]["score_risque_churn"]
    ax.hist(sous, bins=15, color=PALETTE[sent], alpha=0.75, edgecolor="white")
    ax.axvline(sous.mean(), color="black", linestyle="--", lw=1.5, label=f"Moy : {sous.mean():.1f}")
    ax.axvline(SEUIL_ALERTE, color="#C0392B", linestyle=":", lw=1.5, label="Seuil 40")
    ax.set_title(sent.capitalize(), fontweight="bold")
    ax.set_xlabel("Score churn")
    ax.legend(fontsize=8)
    ax.set_xlim(0, 100)

plt.tight_layout()
plt.show()
```

---

### Graphique 2 — Boîte à moustaches : Score churn par produit et sentiment

```python
fig, ax = plt.subplots(figsize=(14, 6))

sns.boxplot(data=df, x="produit", y="score_risque_churn", hue="sentiment_ia",
            palette=PALETTE, width=0.6, linewidth=1.2, ax=ax)

ax.axhline(SEUIL_ALERTE, color="#E74C3C", linestyle="--", lw=1.5, label="Seuil alerte (40)")
ax.axhline(25, color="#F39C12", linestyle=":", lw=1.2, label="Seuil vigilance (25)")
ax.set_title("Score churn par produit et sentiment", fontsize=13, fontweight="bold")
ax.set_ylim(0, 105)
ax.legend(bbox_to_anchor=(1.01, 1), loc="upper left")
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.show()
```

---

### Graphique 3 — Heatmap : Score moyen — Produit × Sentiment

```python
pivot = df.pivot_table(values="score_risque_churn", index="produit",
                       columns="sentiment_ia", aggfunc="mean").round(1)
pivot = pivot[[c for c in ["negatif", "neutre", "positif"] if c in pivot.columns]]

fig, ax = plt.subplots(figsize=(8, 5))
sns.heatmap(pivot, annot=True, fmt=".1f", cmap="RdYlGn_r",
            vmin=0, vmax=100, linewidths=0.5, ax=ax,
            cbar_kws={"label": "Score churn moyen"})

ax.set_title("Score churn moyen — Produit × Sentiment", fontsize=13, fontweight="bold")
plt.yticks(rotation=0)
plt.tight_layout()
plt.show()
```

---

### Graphique 4 — Matrice de confusion : sentiment_ia vs sentiment_reel

```python
from sklearn.metrics import confusion_matrix

# Supprimer les lignes nulles sur les deux colonnes simultanément
df_clean = df.dropna(subset=["sentiment_reel", "sentiment_ia"])

labels = sorted(df_clean["sentiment_reel"].unique())
cm = confusion_matrix(df_clean["sentiment_reel"], df_clean["sentiment_ia"], labels=labels)

fig, ax = plt.subplots(figsize=(7, 5))
sns.heatmap(pd.DataFrame(cm, index=labels, columns=labels),
            annot=True, fmt="d", cmap="Blues",
            linewidths=0.5, ax=ax)

ax.set_ylabel("Sentiment réel", fontsize=11)
ax.set_title("Matrice de confusion — Qualité du modèle IA", fontsize=13, fontweight="bold")

precision = cm.diagonal().sum() / cm.sum()
ax.set_xlabel(f"Sentiment prédit (IA)\nPrécision globale : {precision:.1%}", fontsize=11)
plt.tight_layout()
plt.show()
```

---

### Graphique 5 — Courbe de tendance avec zones de seuil colorées

```python
tendance = df.groupby(df["date_appel"].dt.to_period("D"))["score_risque_churn"].mean().reset_index()
tendance["date_appel"] = tendance["date_appel"].dt.to_timestamp()

fig, ax = plt.subplots(figsize=(14, 5))

ax.axhspan(0,  25,  alpha=0.08, color="#27AE60", label="Zone verte (< 25)")
ax.axhspan(25, 40,  alpha=0.08, color="#F39C12", label="Zone orange (25–40)")
ax.axhspan(40, 100, alpha=0.08, color="#E74C3C", label="Zone rouge (> 40)")

ax.plot(tendance["date_appel"], tendance["score_risque_churn"],
        color="#2C3E50", lw=2, marker="o", markersize=4, label="Score moyen journalier")
ax.axhline(SEUIL_ALERTE, color="#E74C3C", linestyle="--", lw=1.5, label="Seuil alerte (40)")

ax.set_title("Évolution quotidienne du score churn avec zones de risque", fontsize=13, fontweight="bold")
ax.set_ylim(0, 100)
ax.legend(loc="upper left", fontsize=9)
plt.xticks(rotation=30, ha="right")
plt.tight_layout()
plt.show()
```

---

### Graphique 6 — Scatter : Durée appels critiques vs Nb appels par produit

```python
# Agrégation par produit
agg = df.groupby("produit").agg(
    score_moyen=("score_risque_churn", "mean"),
    duree_critique=("duree_minutes", lambda x: x[df.loc[x.index, "alerte_critique"] == True].mean()),
    nb_appels=("call_id", "count"),
    nb_alertes=("alerte_critique", "sum")
).reset_index()

fig, ax = plt.subplots(figsize=(10, 6))
scatter = ax.scatter(
    agg["nb_appels"], agg["duree_critique"],
    s=agg["score_moyen"] * 10,       # taille = score churn moyen
    c=agg["nb_alertes"],              # couleur = nb alertes
    cmap="RdYlGn_r", alpha=0.85,
    edgecolors="black", linewidths=0.8
)

for _, row in agg.iterrows():
    ax.annotate(row["produit"], (row["nb_appels"], row["duree_critique"]),
                fontsize=8, ha="center", va="bottom", xytext=(0, 6),
                textcoords="offset points")

ax.set_xlabel("Nombre d'appels total par produit", fontsize=11)
ax.set_ylabel("Durée moyenne des appels critiques (min)", fontsize=11)
ax.set_title("Durée critique vs Volume — Taille = Score churn moyen", fontsize=12, fontweight="bold")
plt.colorbar(scatter, label="Nb alertes")
ax.axhline(df[df["alerte_critique"]==True]["duree_minutes"].mean(),
           color="gray", linestyle=":", label="Durée moy critique globale")
ax.legend(fontsize=9)
plt.tight_layout()
plt.show()
```

> 💡 Ce graphique répond directement à la question : "Quels produits mobilisent le plus les agents sur les appels critiques ET génèrent le plus d'alertes ?" Le produit dans le quadrant droite-haute est à la fois très sollicité ET chaque alerte dure longtemps — priorité maximale pour la formation des agents ou l'amélioration produit.

---

## Récapitulatif de la Partie 3

| Composant | Contenu |
| --- | --- |
| `DimDate` | Table Delta dans LH_SolarVoix — année, mois, semaine, jour, week-end — plage calée sur `date_appel` |
| 21 mesures DAX | Constantes gauges, scores, écarts, qualité IA, intentions |
| Page 1 Vue d'ensemble | KPI vs seuil, Goals, Ribbon chart, tendance P90 |
| Page 2 Risque Churn | 2 jauges comparées, scatter durée/score, Pie intentions, barres |
| Page 3 Géographie | Carte, Top villes, scatter ville, matrice ville×produit |
| Page 4 Qualité IA | Matrice confusion, KPI précision, comparaison intentions |
| Page 5 Détail appel | Drill-through, sentiment_ia vs sentiment_reel, tableau complet |
| 5 vues T-SQL | Distribution, clients à risque, confusion SQL, intentions, tendance |
| 6 graphiques Python | Histos, boxplot, heatmap, confusion, tendance, scatter produit |

---

## Récapitulatif global de l'Atelier 5

| Partie | Durée | Outils | Livrables |
| --- | --- | --- | --- |
| **Partie 1** | ~60 min | Lakehouse, Notebook PySpark, Transformers | Tables Bronze + Silver enrichies |
| **Partie 2** | ~60 min | Pipeline Data Factory, Eventstream, Activator | Pipeline automatisé, alertes, logging |
| **Partie 3** | ~12 |     |     |
