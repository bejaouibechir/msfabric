# Atelier Warehouse — Gestion des Ventes d'un Distributeur d'Équipements Énergétiques

## Contexte:

**EnergiDistrib** Europe distribue des équipements énergétiques (panneaux solaires, onduleurs, batteries, câbles) à **2 500 clients professionnels dans 6 pays de l'UE**. Le directeur commercial veut un tableau de bord hebdomadaire <u>qui lui prend aujourd'hui 2 jours à construire manuellement.</u>

## Problematique:

 Les ruptures de stock coûtent des clients, les marges s'érodent sans explication, et personne n'a de vue consolidée multi-pays.

**Architecture** :

```
CSV (données fournies) → Lakehouse (Bronze)
        ↓
Pipeline Data Factory (Dataflow Gen2 + Notebook)
        ↓
Lakehouse (Silver)
        ↓
Warehouse (schéma étoile Gold) ← MERGE SCD Type 2
        ↓
Modèle sémantique (relations + mesures DAX)
        ↓
Rapport Power BI (3 pages, étape par étape)
```

---

# PARTIE 1

---

## Bloc 1  — Mise en place

### 1.1 — Les fichiers de données

Les fichiers CSV suivants sont fournis (générés par le script en annexe). Téléchargez-les et gardez-les à portée de main.

| Fichier                       | Contenu                               | Lignes  |
| ----------------------------- | ------------------------------------- | ------- |
| `orders.csv`                  | Commandes clients (fait principal)    | 113 215 |
| `order_lines.csv`             | Lignes de commande (détail produit)   | 283 097 |
| `customers.csv`               | Clients professionnels                | 2 500   |
| `products.csv`                | Catalogue produits                    | 800     |
| `warehouses.csv`              | Entrepôts                             | 12      |
| `sales_reps.csv`              | Vendeurs                              | 60      |
| `stock_levels.csv`            | Niveaux de stock quotidiens           | 128 800 |
| `customers_update_batch2.csv` | Mise à jour clients (pour SCD Type 2) | 150     |

### 1.2 — Créer le Lakehouse

1. **app.fabric.microsoft.com** → votre workspace
2. **+ New item** → **Lakehouse**
3. Nom : **`LH_EnergiDistrib`**
4. Cliquer **Create**

### 1.3 — Charger les CSV

1. Dans **LH_EnergiDistrib** → **Files** → **Upload** → **Upload folder**
2. Sélectionner le dossier contenant tous les CSV
3. Vérifier que les 8 fichiers apparaissent dans **Files/**

> 💡 **Astuce** : Pas besoin de créer des sous-dossiers. Tous les CSV vont dans Files/ directement. Le Notebook les lira depuis là.

---

## Bloc 2  — Notebook : Bronze → Silver

### 2.1 — Créer le Notebook

1. Workspace → **+ New item** → **Notebook**
2. Nommer : **`NB_Bronze_to_Silver`**
3. Dans le panneau **Lakehouses** à gauche → **Add** → sélectionner **LH_EnergiDistrib**

### 2.2 — Cellule 1 : Charger les CSV en tables Bronze

```python
# === CELLULE 1 : Chargement Bronze ===
#
# OBJECTIF : Lire les 7 fichiers CSV depuis le stockage du Lakehouse (Files/)
#            et les écrire en tables Delta — c'est la couche Bronze.
#
# Principe Bronze : on ne touche pas aux données. On ingère brut.
# Le format Delta (Parquet + transaction log) permet les lectures SQL
# ultérieures depuis le Warehouse via cross-database query.
#
# "header=True"      → la 1ère ligne du CSV est l'en-tête de colonne
# "inferSchema=True" → Spark détecte automatiquement les types (INT, DATE, etc.)
#                      Attention : peut être lent sur de gros fichiers ; en prod
#                      on préfère un schéma explicite avec StructType.
# "mode=overwrite"   → remplace la table si elle existe déjà (idempotent)

tables_csv = {
    "bronze_orders":       "Files/orders.csv",        # 113 215 commandes
    "bronze_order_lines":  "Files/order_lines.csv",   # 283 097 lignes de commande
    "bronze_customers":    "Files/customers.csv",     # 2 500 clients
    "bronze_products":     "Files/products.csv",      # 800 produits
    "bronze_warehouses":   "Files/warehouses.csv",    # 12 entrepôts
    "bronze_sales_reps":   "Files/sales_reps.csv",    # 60 vendeurs
    "bronze_stock_levels": "Files/stock_levels.csv",  # 128 800 niveaux de stock
}

for table_name, path in tables_csv.items():
    df = (spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv(path))
    # saveAsTable écrit dans le Lakehouse en format Delta
    # La table est accessible via SQL (SELECT * FROM bronze_orders)
    df.write.mode("overwrite").format("delta").saveAsTable(table_name)
    print(f"{table_name}: {df.count():,} lignes, {len(df.columns)} colonnes")

print("\nToutes les tables Bronze sont chargees.")
```

### 2.3 — Cellule 2 : Diagnostic qualité des données

**Problème terrain** : Les données viennent de 6 filiales avec des conventions différentes. Il faut identifier les problèmes avant de nettoyer.

```python
# === CELLULE 2 : Diagnostic qualite ===
#
# OBJECTIF : Scanner les tables Bronze pour identifier deux types de problèmes
#            avant de commencer le nettoyage :
#            1. Valeurs NULL dans des colonnes qui ne devraient pas en avoir
#            2. Doublons sur les clés primaires (signe de données corrompues ou dupliquées)
#
# Bonne pratique : toujours diagnostiquer AVANT de nettoyer.
# On ne peut pas corriger ce qu'on n'a pas mesuré.
#
# Note : spark.table("nom") charge une table Delta enregistrée dans le Lakehouse.
#        C'est équivalent à spark.read.format("delta").load("chemin/vers/table")
#        mais plus simple car le Lakehouse gère les chemins.

from pyspark.sql import functions as F

# Redéclaration des noms de tables (indépendance vis-à-vis de la Cellule 1)
# → permet d'exécuter cette cellule seule sans avoir à réexécuter la Cellule 1
tables_bronze = [
    "bronze_orders", "bronze_order_lines", "bronze_customers",
    "bronze_products", "bronze_warehouses", "bronze_sales_reps", "bronze_stock_levels"
]

# --- Vérification 1 : Valeurs NULL colonne par colonne ---
# Pour chaque table, on compte les nulls dans chaque colonne.
# df.filter(F.col(col_name).isNull()).count() = nombre de lignes où la colonne est null
for table_name in tables_bronze:
    df = spark.table(table_name)
    null_counts = []
    for col_name in df.columns:
        null_count = df.filter(F.col(col_name).isNull()).count()
        if null_count > 0:
            null_counts.append(f"  {col_name}: {null_count} nulls")
    if null_counts:
        print(f"\n{table_name} — colonnes avec nulls:")
        for nc in null_counts:
            print(nc)
    else:
        print(f"{table_name} — OK (aucun null)")

# --- Vérification 2 : Doublons sur les clés primaires ---
# Logique : si total_lignes != lignes_distinctes sur la PK → il y a des doublons
# On vérifie uniquement les tables avec une clé primaire connue.
print("\n--- Doublons ---")
for table_name, pk in [
    ("bronze_orders",    "order_id"),
    ("bronze_customers", "customer_id"),
    ("bronze_products",  "product_id"),
    ("bronze_sales_reps","rep_id")
]:
    df = spark.table(table_name)
    total    = df.count()
    distinct = df.select(pk).distinct().count()
    dupes    = total - distinct
    print(f"{table_name}.{pk}: {dupes} doublons" + (" ⚠️" if dupes > 0 else " ✅"))
```

**Interprétation** : Ce diagnostic révèle les problèmes typiques d'un ERP multi-filiales : des champs nulls sur `address` (114), `city` (82) et `contact_email` (80) dans la table clients. Les clés primaires sont propres — aucun doublon détecté. Le nettoyage qui suit corrige les valeurs manquantes et standardise les codes pays.

### 2.4 — Cellule 3 : Nettoyage et standardisation

```python
# === CELLULE 3 : Nettoyage donnees ===
#
# OBJECTIF : Transformer les tables Bronze en tables Silver.
#            La couche Silver = données propres, standardisées, enrichies.
#            On ne supprime pas de lignes (sauf erreurs graves) — on corrige
#            et on enrichit avec des colonnes calculées.
#
# Pattern PySpark utilisé : transformation en chaîne avec .withColumn()
# Chaque .withColumn(nom, expression) ajoute ou remplace une colonne.
# Le résultat est un nouveau DataFrame (immutabilité PySpark).

# -------------------------------------------------------
# CLIENTS : Standardisation pays + nettoyage noms + nulls
# -------------------------------------------------------
df_customers = spark.table("bronze_customers")

df_customers_clean = (df_customers

    # Problème : la colonne "country" contient des valeurs hétérogènes
    # selon les filiales (ex: "France", "FR", "FRANCE", "france")
    # Solution : normaliser vers un code ISO 2 lettres via F.when / .isin()
    # F.upper() rend la comparaison insensible à la casse
    .withColumn("country_code",
        F.when(F.upper(F.col("country")).isin(["FRANCE", "FR"]),             "FR")
        .when(F.upper(F.col("country")).isin(["GERMANY", "ALLEMAGNE", "DE"]), "DE")
        .when(F.upper(F.col("country")).isin(["SPAIN", "ESPAGNE", "ES"]),     "ES")
        .when(F.upper(F.col("country")).isin(["ITALY", "ITALIE", "IT"]),      "IT")
        .when(F.upper(F.col("country")).isin(["BELGIUM", "BELGIQUE", "BE"]),  "BE")
        .when(F.upper(F.col("country")).isin(["NETHERLANDS", "PAYS-BAS", "NL"]), "NL")
        .otherwise(F.upper(F.col("country"))))   # Fallback : garder en majuscules

    # F.trim() supprime les espaces en début/fin de chaîne
    # F.initcap() met en Title Case (1ère lettre de chaque mot en majuscule)
    # Exemple : "  solartech europe " → "Solartech Europe"
    .withColumn("company_name", F.initcap(F.trim(F.col("company_name"))))

    # F.coalesce(a, b) retourne a si a n'est pas NULL, sinon b
    # Remplace les NULLs par une valeur par défaut lisible
    .withColumn("address", F.coalesce(F.col("address"), F.lit("Adresse non renseignee")))
    .withColumn("city",    F.coalesce(F.col("city"),    F.lit("Ville non renseignee")))
)

df_customers_clean.write.mode("overwrite").format("delta").saveAsTable("silver_customers")
print(f"silver_customers: {df_customers_clean.count():,} lignes")


# -------------------------------------------------------
# PRODUITS : Validation des prix + marge calculée + segment
# -------------------------------------------------------
df_products = spark.table("bronze_products")

df_products_clean = (df_products

    # Invalider les prix négatifs ou nuls (erreurs de saisie)
    # → remplacés par NULL pour ne pas fausser les calculs de marge
    .withColumn("unit_cost_eur",
        F.when(F.col("unit_cost_eur") <= 0, None).otherwise(F.col("unit_cost_eur")))
    .withColumn("list_price_eur",
        F.when(F.col("list_price_eur") <= 0, None).otherwise(F.col("list_price_eur")))

    # Calculer le % de marge : (prix_vente - coût) / prix_vente * 100
    # F.round(..., 1) arrondit à 1 décimale
    # NULL si le prix de vente est 0 ou NULL (évite la division par zéro)
    .withColumn("margin_pct",
        F.when(F.col("list_price_eur") > 0,
               F.round((F.col("list_price_eur") - F.col("unit_cost_eur"))
                       / F.col("list_price_eur") * 100, 1))
        .otherwise(None))

    # Segmentation tarifaire pour le rapport Power BI (axe de filtrage)
    # Seuils définis métier : > 5000€ = Premium, > 1000€ = Mid-range, etc.
    .withColumn("price_segment",
        F.when(F.col("list_price_eur") > 5000, "Premium")
        .when(F.col("list_price_eur") > 1000,  "Mid-range")
        .when(F.col("list_price_eur") > 100,   "Standard")
        .otherwise("Accessoire"))
)

df_products_clean.write.mode("overwrite").format("delta").saveAsTable("silver_products")
print(f"silver_products: {df_products_clean.count():,} lignes")
```

### 2.5 — Cellule 4 : Nettoyage des commandes et lignes

```python
# === CELLULE 4 : Nettoyage commandes et lignes ===
#
# OBJECTIF : Enrichir les deux tables transactionnelles principales :
#   - bronze_orders → silver_orders  (en-tête de commande)
#   - bronze_order_lines → silver_order_lines  (détail produit/montants)
#
# Pour les commandes : on calcule des colonnes temporelles utiles au rapport
# Pour les lignes : on calcule les montants dérivés (CA, coût, marge)
# Ces montants précalculés évitent des calculs répétés dans DAX (performance).

# -------------------------------------------------------
# COMMANDES : Conversion dates + colonnes temporelles
# -------------------------------------------------------
df_orders = spark.table("bronze_orders")

df_orders_clean = (df_orders

    # F.to_date() convertit une chaîne "2025-04-15" en type Date Spark
    # Sans cette conversion, les fonctions date (year, month...) ne fonctionnent pas
    .withColumn("order_date", F.to_date("order_date"))
    .withColumn("ship_date",  F.to_date("ship_date"))

    # Délai de livraison en jours : ship_date - order_date
    # F.datediff(fin, debut) retourne un entier (peut être négatif si ship < order → erreur données)
    .withColumn("delivery_lead_days",
        F.datediff(F.col("ship_date"), F.col("order_date")))

    # Colonnes temporelles extraites de order_date
    # Utiles pour les agrégations dans le Dataflow Gen2 et le rapport Power BI
    .withColumn("order_year",    F.year("order_date"))
    .withColumn("order_month",   F.month("order_date"))       # 1 à 12
    .withColumn("order_quarter", F.quarter("order_date"))     # 1 à 4

    # Flag de retard : livraison > 7 jours = considérée comme tardive
    # BooleanType dans Spark → s'affiche comme true/false en Delta
    .withColumn("is_late",
        F.when(F.col("delivery_lead_days") > 7, True).otherwise(False))
)

df_orders_clean.write.mode("overwrite").format("delta").saveAsTable("silver_orders")
print(f"silver_orders: {df_orders_clean.count():,} lignes")


# -------------------------------------------------------
# LIGNES DE COMMANDE : Calcul des montants
# -------------------------------------------------------
df_lines = spark.table("bronze_order_lines")

df_lines_clean = (df_lines

    # CA de la ligne = quantité × prix unitaire de vente
    # F.round(..., 2) arrondit à 2 décimales (centimes)
    .withColumn("line_total_eur",
        F.round(F.col("quantity") * F.col("unit_price_eur"), 2))

    # Coût de la ligne = quantité × coût unitaire d'achat
    .withColumn("line_cost_eur",
        F.round(F.col("quantity") * F.col("unit_cost_eur"), 2))

    # Marge absolue = CA - Coût (peut être négative si vente à perte)
    .withColumn("line_margin_eur",
        F.round(F.col("line_total_eur") - F.col("line_cost_eur"), 2))

    # Taux de marge = marge / CA × 100
    # NULL si CA = 0 (évite la division par zéro)
    # Valeur négative = vente en dessous du prix de revient
    .withColumn("line_margin_pct",
        F.when(F.col("line_total_eur") > 0,
               F.round(F.col("line_margin_eur") / F.col("line_total_eur") * 100, 1))
        .otherwise(None))

    # Flag remise : True si un % de remise a été accordé (> 0)
    # Permet de filtrer rapidement les lignes avec remise dans Power BI
    .withColumn("is_discount",
        F.when(F.col("discount_pct") > 0, True).otherwise(False))
)

df_lines_clean.write.mode("overwrite").format("delta").saveAsTable("silver_order_lines")
print(f"silver_order_lines: {df_lines_clean.count():,} lignes")
```

### 2.6 — Cellule 5 : Détection des anomalies de prix

**Problème terrain** : Certains vendeurs bradent les prix en dessous du coût de revient. Le directeur commercial veut savoir qui et sur quels produits.

```python
# === CELLULE 5 : Detection anomalies de prix ===
#
# OBJECTIF : Identifier les lignes de commande vendues en dessous du coût
#            de revient (marge négative). C'est un indicateur de "guerre des prix"
#            ou d'erreur de saisie.
#
# Technique : spark.sql() permet d'écrire du SQL standard sur les tables Delta
#             du Lakehouse. C'est plus lisible qu'enchaîner des transformations
#             PySpark pour des requêtes analytiques complexes.
#
# Jointures utilisées :
#   silver_order_lines (ol) → silver_orders (o) : relier la ligne à sa commande
#   silver_orders → silver_products (p)           : retrouver le produit concerné
#   silver_orders → bronze_sales_reps (sr)        : retrouver le vendeur responsable
#
# Filtre : line_margin_pct < 0 → prix de vente < coût de revient

df_anomalies = spark.sql("""
    SELECT
        ol.order_id,
        ol.product_id,
        p.product_name,
        p.category,
        ol.unit_price_eur  AS prix_vente,
        ol.unit_cost_eur   AS cout_revient,
        ol.line_margin_pct,          -- Négatif = vente à perte
        o.rep_id,
        sr.rep_name,
        o.customer_id,
        o.order_date
    FROM silver_order_lines ol
    JOIN silver_orders      o  ON ol.order_id  = o.order_id
    JOIN silver_products    p  ON ol.product_id = p.product_id
    JOIN bronze_sales_reps  sr ON o.rep_id      = sr.rep_id
    WHERE ol.line_margin_pct < 0          -- Filtre : uniquement les ventes à perte
    ORDER BY ol.line_margin_eur ASC       -- Trié du pire au moins pire
""")

print(f"Lignes vendues a perte: {df_anomalies.count()}")

# Grouper par vendeur : qui accorde le plus de remises sous le coût ?
# F.desc("count") → tri décroissant pour voir les plus problématiques en premier
df_anomalies.groupBy("rep_name").count().orderBy(F.desc("count")).show(10, truncate=False)

# Grouper par catégorie : quelles familles de produits sont les plus touchées ?
df_anomalies.groupBy("category").count().orderBy(F.desc("count")).show(10, truncate=False)
```

**Interprétation** : Les ventes à perte se concentrent sur 2-3 vendeurs et sur la catégorie « Onduleurs » — confirmation de la guerre des prix sur ce segment. Ces informations remonteront dans le rapport Power BI final.

### 2.7 — Cellule 6 : Segmentation clients (RFM simplifié)

```python
# === CELLULE 6 : Segmentation clients RFM ===
#
# OBJECTIF : Segmenter les 2 500 clients selon 3 dimensions comportementales :
#   R (Recency)   → Nombre de jours depuis la dernière commande
#                   (petit = bon → client récemment actif)
#   F (Frequency) → Nombre de commandes distinctes
#                   (grand = bon → client régulier)
#   M (Monetary)  → CA total généré
#                   (grand = bon → client à fort enjeu financier)
#
# La segmentation RFM est une technique marketing standard pour prioriser
# les actions commerciales (fidélisation, réactivation, up-sell, etc.)
#
# Technique : Window Functions (F.ntile) pour découper chaque dimension
#             en 4 quartiles (rang 1 = meilleur, rang 4 = moins bon)

from pyspark.sql.window import Window
from pyspark.sql import functions as F

# --- Étape 1 : Calculer les 3 métriques R, F, M par client ---
# Référence temporelle fixe au 31/12/2025 (fin de période des données)
# DATEDIFF('2025-12-31', MAX(order_date)) = jours depuis la dernière commande
df_rfm = spark.sql("""
    SELECT
        o.customer_id,
        DATEDIFF('2025-12-31', MAX(o.order_date)) AS recency_days,   -- R : récence en jours
        COUNT(DISTINCT o.order_id)                 AS frequency,      -- F : nb commandes
        ROUND(SUM(ol.line_total_eur), 2)            AS monetary_eur   -- M : CA total
    FROM silver_orders o
    JOIN silver_order_lines ol ON o.order_id = ol.order_id
    GROUP BY o.customer_id
""")

# --- Étape 2 : Scorer chaque dimension par quartile (1 à 4) ---
# F.ntile(4) divise les clients en 4 groupes de taille égale.
# Pour R (recency_days) : trier ASC car moins de jours = plus récent = meilleur (rang 1)
# Pour F et M : trier DESC car plus grand = meilleur (rang 1)
for metric in ["recency_days", "frequency", "monetary_eur"]:
    ascending = metric == "recency_days"   # True pour Recency, False pour F et M
    w = Window.orderBy(F.col(metric).asc() if ascending else F.col(metric).desc())
    df_rfm = df_rfm.withColumn(
        f"{metric}_rank",
        F.ntile(4).over(w)   # Rang 1 = meilleur quartile, Rang 4 = pire
    )

# --- Étape 3 : Score global et segment ---
# Score RFM = somme des 3 rangs (min=3 → triple VIP, max=12 → triple Dormant)
# Les seuils de segmentation sont définis métier :
#   ≤ 4 = VIP (top 25% sur les 3 dimensions)
#   ≤ 7 = Fidèle
#   ≤ 9 = Occasionnel
#   > 9 = Dormant (à réactiver)
df_rfm = (df_rfm
    .withColumn("rfm_score",
        F.col("recency_days_rank") + F.col("frequency_rank") + F.col("monetary_eur_rank"))
    .withColumn("customer_segment",
        F.when(F.col("rfm_score") <= 4,  "VIP")
        .when(F.col("rfm_score") <= 7,   "Fidele")
        .when(F.col("rfm_score") <= 9,   "Occasionnel")
        .otherwise("Dormant"))
)

df_rfm.write.mode("overwrite").format("delta").saveAsTable("silver_customer_rfm")

# Résumé des 4 segments : nb clients, CA moyen, fréquence, score
# F.count("*") = compter toutes les lignes du groupe (équivalent COUNT(*) en SQL)
# F.avg() = moyenne arithmétique
df_rfm.groupBy("customer_segment").agg(
    F.count("*").alias("nb_clients"),
    F.round(F.avg("monetary_eur"), 0).alias("ca_moyen_eur"),
    F.round(F.avg("frequency"),    1).alias("freq_moyenne"),
    F.round(F.avg("rfm_score"),    2).alias("rfm_score_moyen")
).orderBy("rfm_score_moyen").show(truncate=False)
```

**Interprétation** : La segmentation RFM donne 4 groupes actionnables. Les VIP (top 25%) génèrent ~60% du CA — ce sont les clients à protéger. Les Dormants n'ont pas commandé depuis longtemps → campagne de réactivation. Ce segment sera intégré à la dimension client dans le Warehouse.

### 2.8 — Cellule 7 : Agrégation des stocks

```python
# === CELLULE 7 : Analyse stock ===
#
# OBJECTIF : Transformer les niveaux de stock bruts en indicateurs d'alerte
#            exploitables par la direction logistique.
#
# Source : bronze_stock_levels (128 800 lignes = 1 ligne par produit, entrepôt et date)
# Destination : silver_stock_levels
#
# Colonnes calculées ajoutées :
#   stock_value_eur  : valorisation du stock en euros (immobilisation de capital)
#   stock_status     : catégorie d'alerte (4 niveaux)
#   days_of_stock    : autonomie en jours avant rupture (à demande constante)
#
# Règles métier pour stock_status :
#   RUPTURE_IMMINENTE : stock ≤ reorder_point  (seuil bas de réapprovisionnement)
#   BAS               : stock ≤ reorder_point × 1.5  (zone de vigilance)
#   SURSTOCK          : stock ≥ max_stock × 90%  (capital immobilisé)
#   NORMAL            : tous les autres cas

df_stock = spark.table("bronze_stock_levels")

df_stock_analysis = (df_stock

    # Conversion de la colonne stock_date (string → Date)
    .withColumn("stock_date", F.to_date("stock_date"))

    # Valorisation : quantité en stock × coût unitaire
    # Donne une vision financière du stock (capital immobilisé)
    .withColumn("stock_value_eur",
        F.round(F.col("quantity_on_hand") * F.col("unit_cost_eur"), 2))

    # Classification du statut de stock (ordre des conditions important !)
    # On teste les cas critiques en premier (rupture avant bas avant surstock)
    .withColumn("stock_status",
        F.when(F.col("quantity_on_hand") <= F.col("reorder_point"),         "RUPTURE_IMMINENTE")
        .when(F.col("quantity_on_hand") <= F.col("reorder_point") * 1.5,    "BAS")
        .when(F.col("quantity_on_hand") >= F.col("max_stock") * 0.9,        "SURSTOCK")
        .otherwise("NORMAL"))

    # Autonomie en jours : combien de jours avant rupture à la demande actuelle ?
    # NULL si avg_daily_demand = 0 (évite la division par zéro)
    # F.round(..., 0) → nombre entier de jours
    .withColumn("days_of_stock",
        F.when(F.col("avg_daily_demand") > 0,
               F.round(F.col("quantity_on_hand") / F.col("avg_daily_demand"), 0))
        .otherwise(None))
)

df_stock_analysis.write.mode("overwrite").format("delta").saveAsTable("silver_stock_levels")

# Résumé au 31/12/2025 : vue snapshot de fin d'année pour le rapport
# filter() = équivalent d'un WHERE en SQL
# Affiche le nombre de lignes et la valeur financière par statut
(df_stock_analysis
    .filter(F.col("stock_date") == "2025-12-31")
    .groupBy("stock_status")
    .agg(
        F.count("*").alias("nb_lignes"),
        F.round(F.sum("stock_value_eur"), 0).alias("valeur_stock_eur"))
    .orderBy("stock_status")
    .show(truncate=False))
```

**Interprétation** : Ce résumé donne une vue “pilotage” des stocks au **31/12/2025** :

- `RUPTURE_IMMINENTE` = articles à risque de rupture (à prioriser en réappro / arbitrage inter-entrepôts). Dans le scénario injecté, ce statut remontera surtout sur certains **onduleurs** en décembre.
- `BAS` = stock faible (surveillance + commandes fournisseurs).
- `SURSTOCK` = surstock (capital immobilisé → actions promo / transferts / ajustement des min-max).
- `NORMAL` = situation saine.

Cette table `silver_stock_levels` pourra alimenter une page “Stocks” optionnelle du rapport (non couverte dans la version “sans colonnes calculées”).

### 2.9 — Cellule 8 : Vendeurs — table Silver enrichie

```python
# === CELLULE 8 : Table Silver vendeurs enrichie ===
#
# OBJECTIF : Créer une table Silver des vendeurs qui agrège leurs performances
#            sur toute la période. Cette table servira à la fois :
#            - Dans la Dim_SalesRep du Warehouse (attributs statiques)
#            - Dans les vues analytiques (KPIs de performance)
#
# Pattern : on part de bronze_sales_reps (référentiel des vendeurs)
#           et on y rattache les commandes + lignes via LEFT JOIN.
#           LEFT JOIN garantit que tous les vendeurs apparaissent,
#           même ceux qui n'ont aucune commande (cas possible avec un nouveau vendeur).
#
# Colonnes calculées :
#   total_orders     : nb commandes distinctes traitées par le vendeur
#   total_clients    : nb clients distincts servis
#   total_revenue_eur: CA total généré
#   total_margin_eur : marge totale générée
#   margin_pct       : taux de marge moyen (NULLIF évite la div/0)
#   avg_discount_pct : remise moyenne accordée (indicateur de politique tarifaire)
#   nb_loss_lines    : nb de lignes vendues à perte (CASE WHEN simulant un COUNT FILTER)

df_reps_enriched = spark.sql("""
    SELECT
        sr.*,                                          -- Tous les attributs du référentiel vendeur
        COUNT(DISTINCT o.order_id)                                       AS total_orders,
        COUNT(DISTINCT o.customer_id)                                    AS total_clients,
        ROUND(SUM(ol.line_total_eur), 0)                                 AS total_revenue_eur,
        ROUND(SUM(ol.line_margin_eur), 0)                                AS total_margin_eur,
        -- NULLIF(SUM(CA), 0) → retourne NULL si CA=0 pour éviter la division par zéro
        ROUND(SUM(ol.line_margin_eur) / NULLIF(SUM(ol.line_total_eur), 0) * 100, 1) AS margin_pct,
        ROUND(AVG(ol.discount_pct), 1)                                   AS avg_discount_pct,
        -- CASE WHEN dans un SUM : compte 1 si vente à perte, 0 sinon → somme = nb de lignes à perte
        SUM(CASE WHEN ol.line_margin_pct < 0 THEN 1 ELSE 0 END)         AS nb_loss_lines
    FROM bronze_sales_reps sr
    LEFT JOIN silver_orders      o  ON sr.rep_id   = o.rep_id
    LEFT JOIN silver_order_lines ol ON o.order_id  = ol.order_id
    GROUP BY sr.rep_id, sr.rep_name, sr.region, sr.hire_date, sr.annual_target_eur
""")

df_reps_enriched.write.mode("overwrite").format("delta").saveAsTable("silver_sales_reps")

# Afficher les 10 meilleurs vendeurs par CA décroissant
# F.desc("total_revenue_eur") = ORDER BY total_revenue_eur DESC
df_reps_enriched.orderBy(F.desc("total_revenue_eur")).show(10, truncate=False)
```

**Interprétation** : Les 3 premiers vendeurs font ~30% du CA. La colonne `nb_loss_lines` révèle les vendeurs qui bradent le plus — le vendeur « DUBOIS » a 45 lignes à perte, presque toutes sur les onduleurs. C'est une information concrète pour le directeur commercial.

---

## Bloc 3  — Dataflow Gen2

Le Notebook a créé les tables Silver. Maintenant on va créer un Dataflow Gen2 pour montrer l'approche **no-code** sur la table `silver_orders`. L'objectif est d'enrichir les commandes avec des colonnes calculées en Power Query.

### 3.1 — Créer le Dataflow

1. Workspace → **+ New item** → **Dataflow Gen2**
2. Nommer : **DF_EnrichOrders**

### 3.2 — Connecter la source Lakehouse

1. Dans l'éditeur Power Query → **Get data** → **More...**
2. Chercher **OneLake** → **Lakehouse (LH_EnergiDistrib)** → sélectionner
3. Connexion → signer avec votre compte organisationnel
4. Naviguer → votre workspace → **LH_EnergiDistrib** → **silver_orders**
5. Cliquer **Create**

### 3.3 — Transformation 1 : Supprimer les colonnes inutiles

Dans ce Dataflow, la source est la table **`silver_orders`** produite par le Notebook. Les colonnes visibles correspondent aux colonnes métier/enrichies (pas de colonnes “techniques” type `__delta_log`).

1. Onglet **Home** → **Choose columns**
2. **Conserver** (à minima) :
   - `order_id`, `customer_id`, `rep_id`, `warehouse_id`
   - `order_date`, `ship_date`, `status`, `delivery_lead_days`
   - `order_year`, `order_month` (nécessaires pour l’agrégation mensuelle plus loin)
3. **Optionnel** : décocher `order_quarter` et `is_late` (non utilisés dans ce Dataflow)
4. Cliquer **OK**

> 💡 **Note** : Si vous préférez, vous pouvez aussi **tout garder** (aucun impact fonctionnel). L’objectif ici est juste d’illustrer une étape “Choose columns” et de ne pas casser l’agrégation mensuelle.

### 3.4 — Transformation 2 : Renommer les colonnes pour le Warehouse

1. Double-cliquer sur l'en-tête **order_date** → renommer en **OrderDate**
2. Idem : **ship_date** → **ShipDate**
3. **customer_id** → **CustomerKey**
4. **rep_id** → **SalesRepKey**
5. **order_id** → **OrderKey**

### 3.5 — Transformation 3 : Colonne conditionnelle — Priorité livraison

1. Onglet **Add column** → **Conditional column**
2. Configurer :
   - **New column name** : `DeliveryPriority`
   - **If** `delivery_lead_days` **is less than** `3` **then** `Express`
   - **Else if** `delivery_lead_days` **is less than** `7` **then** `Standard`
   - **Else if** `delivery_lead_days` **is less than** `14` **then** `Lent`
   - **Else** `Critique`
3. Cliquer **OK**

### 3.6 — Transformation 4 : Colonne personnalisée — Trimestre formaté

1. Onglet **Add column** → **Custom column**

2. **New column name** : `QuarterLabel`

3. **Formula** :
   
   ```
   "Q" & Text.From(Date.QuarterOfYear([OrderDate])) & " " & Text.From(Date.Year([OrderDate]))
   ```

4. Cliquer **OK**

### 3.7 — Transformation 5 : Filtrer les commandes annulées

1. Cliquer sur le filtre (flèche) de la colonne **status**
2. Décocher **cancelled** (ne garder que `completed`, `shipped`, `processing`)
3. Cliquer **OK**

### 3.8 — Transformation 6 : Changer les types de données

1. Sélectionner la colonne **OrderDate** → onglet **Transform** → **Data type** → **Date**
2. Sélectionner **ShipDate** → **Data type** → **Date**
3. Sélectionner **delivery_lead_days** → **Data type** → **Whole number**

### 3.9 — Transformation 7 : Grouper par mois (nouvelle requête)

1. Clic droit sur la requête **silver_orders** dans le panneau gauche → **Duplicate**
2. Renommer la nouvelle requête : **`MonthlyOrderSummary`**
3. Onglet **Transform** → **Group By** → **Advanced**
4. Dans **Group by** : garder **uniquement** `order_year` et `order_month`
   - Si `CustomerKey` apparaît aussi dans la liste “Group by” (ça arrive si vous l’aviez sélectionné avant d’ouvrir Group By) → cliquez sur la ligne `CustomerKey` puis **Remove grouping**
5. Agrégations :
   - **NbOrders** : Operation = **Count rows** (normal que la zone **Column** soit désactivée)
   - **NbCustomers** : Operation = **Count distinct values**, Column = **CustomerKey**
6. Cliquer **OK**

> 💡 **Pourquoi ne pas grouper par CustomerKey ?** On veut un résumé **mensuel** (année/mois). Si on groupe aussi par `CustomerKey`, on obtient une ligne *par client et par mois* et le “nb customers” devient trivial (souvent 1).
> 
> 💡 **Si la zone Column reste grisée** : vérifiez que l’opération choisie est bien **Count distinct values** (et pas **Count distinct rows**). “Count distinct rows” n’a pas besoin de colonne, donc Power Query désactive la zone.

### 3.10 — Transformation 8 : Tri et index

1. Sur la requête **MonthlyOrderSummary** → cliquer sur l'en-tête **order_year** → **Sort ascending**
2. Puis **order_month** → **Sort ascending**
3. Onglet **Add column** → **Index column** → **From 1**

> 💡 **Note** : Le tri appliqué ici dans Power Query garantit que la colonne **Index** sera numérotée dans l'ordre chronologique (Jan 2024 = 1, Fév 2024 = 2, etc.). En revanche, le tri physique des lignes dans la table Delta de destination n'est pas garanti — Fabric optimise le stockage indépendamment. Pour ordonner les résultats dans un rapport, utilisez toujours un **Sort** côté Power BI ou DAX.

### 3.11 — Configurer la destination

**Pour la requête silver_orders enrichie** :

1. En bas du panneau **Query settings** → cliquer **Choose data destination**
2. Sélectionner **Lakehouse**
3. Naviguer → votre workspace → **LH_EnergiDistrib**
4. **New table** : `silver_orders_enriched`
5. **Next** → désactiver **Use automatic settings** → choisir **Replace** → **Save settings**

> 💡 **Note (options Destination)** :
> 
> - **Use automatic settings** : Fabric choisit automatiquement la méthode de mise à jour et les options de schéma. Pour un atelier, on le désactive pour garder un comportement prévisible.
> - **Update method** :
>   - **Append** = ajoute les nouvelles lignes à la table existante (risque de doublons si vous republiez plusieurs fois).
>   - **Replace** = remplace entièrement la table à chaque Publish (idempotent, idéal pour itérer pendant l’atelier).
> - **Schema options on publish** :
>   - **Dynamic schema** = adapte le schéma de la table cible si la requête change (pratique en prototypage).
>   - **Fixed schema** = conserve le schéma existant et échoue si de nouvelles colonnes apparaissent (plus “production”). Dans cet atelier, les deux conviennent car le schéma est stable.

**Pour la requête MonthlyOrderSummary** :

1. Cliquer sur la requête **MonthlyOrderSummary** dans le panneau gauche
2. En bas → **Choose data destination** → **Lakehouse** → **LH_EnergiDistrib**
3. **New table** : `silver_monthly_summary`
4. **Replace** → **Save settings**

### 3.12 — Sauvegarder le Dataflow

1. En bas à droite → **Publish**
   cliquez **Home**  → **Save**
---

## Bloc 4  — Pipeline Data Factory

Le Pipeline orchestre tout le flux : Dataflow Gen2 → Notebook → validation.

### 4.1 — Créer le Pipeline

1. Workspace → **+ New item** → **Data pipeline**
2. Nommer : **`PL_EnergiDistrib_ETL`**
3. Cliquer **Create**

### 4.2 — Activité 1 : Dataflow Gen2

1. Dans le canevas du pipeline → onglet **Activities** → **Dataflow**
2. Glisser sur le canevas
3. En bas → onglet **General** → Nom : **`Enrichissement_Orders`**
4. Onglet **Settings** → **Dataflow** → sélectionner **DF_EnrichOrders**

### 4.3 — Activité 2 : Notebook

1. Onglet **Activities** → **Notebook**
2. Glisser sur le canevas, **à droite** du Dataflow
3. **Relier** : cliquer sur la **coche verte** (✓ On success) du Dataflow → glisser vers le Notebook
4. En bas → onglet **General** → Nom : **`Transformation_Silver`**
5. Onglet **Settings** → **Notebook** → sélectionner **NB_Bronze_to_Silver**
6. **Lakehouse** → sélectionner **LH_EnergiDistrib**

### 4.4 — Activité 3 : Script (chargement Warehouse)

> 💡 **Note** : Cette activité sera configurée après la création du Warehouse dans le Bloc 5. Pour l'instant, on la **prépare** en tant que placeholder.
> 
> ⚠️ **Important (UI Fabric)** : Dans Fabric, une activité **Script** est considérée **invalide** tant qu’une **Connection** n’est pas renseignée. Donc si le Warehouse n’existe pas encore, vous ne pourrez pas *Validate/Save* le pipeline avec cette activité active. Solution : **désactiver temporairement** l’activité `Chargement_Warehouse` (voir Bloc 4.8), puis la réactiver et la configurer après le Bloc 5.

> ⚠️ **Attention** : Dans Fabric Data Factory, il n'existe pas d'activité **Stored Procedure** pour un Warehouse Fabric. Utilisez exclusivement l'activité **Script** qui permet d'exécuter du T-SQL directement sur un Warehouse. L'activité "Stored Procedure" est réservée aux sources externes (Azure SQL Database, SQL Server...).

1. Onglet **Activities** → **Script** (sous la section **General**)
2. Glisser à droite du Notebook → relier avec la **coche verte**
3. Nom : **`Chargement_Warehouse`**
4. On configurera le script T-SQL dans le Bloc 5

### 4.5 — Activité 4 : Validation — Set Variable

1. Onglet **Activities** → **Set variable**
2. Glisser à droite du Script → relier avec la **coche verte**
3. Nom : **`Flag_Succes`**
4. Onglet **Settings** → **Variable type** : **Pipeline variable**
5. Dans la section **Variables** du pipeline (en bas), cliquer **+ New** :
   - **Name** : `etl_status`
   - **Type** : **String**
   - **Default value** : `pending`
6. Revenir sur l'activité **Flag_Succes** (Set variable) :
   - **Name** : `etl_status`
   - **Value** : `success`

> 💡 **Clarification** :
> 
> - Le **Default value = `pending`** est la valeur **au démarrage du run** (avant exécution des activités). Ce n’est pas une “valeur à choisir” à la fin : c’est juste un état initial lisible.
> - L’activité **Flag_Succes** sert à **écraser** cette valeur en `success` uniquement si tout le flux arrive jusqu’ici (chemin ✓).
> - En cas d’échec (chemin ✗), on mettra `failed` dans une activité séparée (Bloc 4.6).
> - Cette variable est surtout utile pour le suivi/diagnostic ; elle ne remplace pas le statut natif “Succeeded/Failed” du pipeline.

### 4.6 — Activité 5 : Gestion d'erreur

1. Glisser vers une **nouvelle activité Set Variable**, cliquer sur la **croix rouge** (✗ On failure) du Notebook →
2. Nom : **`Flag_Echec`**
3. **Name** : `etl_status` → **Value** : `failed`

> 💡 **Note** : Dans cet atelier, la gestion d'erreur est configurée uniquement sur le Notebook (l'activité la plus critique). Dans un pipeline de production, vous ajouteriez également des branches d'erreur sur le Dataflow et le Script pour couvrir l'ensemble des points de défaillance.

### 4.7 — Vue d'ensemble du Pipeline

Le pipeline doit ressembler à ceci :

```
[Enrichissement_Orders] --✓--> [Transformation_Silver] --✓--> [Chargement_Warehouse] --✓--> [Flag_Succes]
         (Dataflow)                  (Notebook)                    (Script)                (Set Variable)
                                       |
                                       ✗
                                       |
                                 [Flag_Echec]
                                (Set Variable)
```

### 4.8 — Valider et sauvegarder

1. Onglet **Home** → **Validate**
2. Si la validation échoue avec : `Script activity ... Connection is required` sur `Chargement_Warehouse` :
   - Dans le panneau de validation, cliquer **Deactivate activities**
   - Sélectionner/désactiver **Chargement_Warehouse** (et uniquement celle-ci)
   - Relancer **Validate**
3. **Save**

> 💡 Après le Bloc 5 (Warehouse créé), revenez sur le pipeline, **réactivez** `Chargement_Warehouse`, renseignez la **Connection** vers `WH_EnergiDistrib` et collez le T‑SQL de chargement, puis revalidez et sauvegardez.

> ⚠️ **Piège** : Ne pas cliquer **Run** maintenant. Le Script du Warehouse n'est pas encore configuré. On le fera après le Bloc 5.

> 💡 **Astuce Pipeline** : L'activité **Script** dans un Pipeline permet d'exécuter du T-SQL directement sur un Warehouse Fabric. C'est l'équivalent du `Stored Procedure activity` mais plus flexible — vous pouvez y mettre n'importe quel script T-SQL.

---

 Le Lakehouse contient les tables Bronze et Silver. Le Dataflow Gen2 enrichit les commandes. Le Pipeline orchestre le flux.**

On crée le Warehouse avec le schéma étoile, on implémente le SCD Type 2, puis on construit le modèle sémantique et le rapport Power BI.

---

# PARTIE 2

---

## Bloc 5  — Warehouse : Schéma étoile + Vues analytiques

### 5.1 — Créer le Warehouse

1. Workspace → **+ New item** → **Warehouse**
2. Nom : **`WH_EnergiDistrib`**
3. Cliquer **Create**

### 5.2 — Créer le schéma étoile (dimensions + fait)

1. Dans **WH_EnergiDistrib** → **New SQL query**
2. Copier-coller et exécuter :

```sql
-- ============================================================
-- DIMENSIONS
-- ============================================================

CREATE TABLE dbo.Dim_Customer (
    CustomerSK          BIGINT IDENTITY NOT NULL,  -- Surrogate key
    CustomerID          VARCHAR(50)   NOT NULL,       -- Business key
    CompanyName         VARCHAR(500)  NOT NULL,
    Country             VARCHAR(10)   NOT NULL,
    City                VARCHAR(200),
    CustomerSegment     VARCHAR(50),
    ContactEmail        VARCHAR(500),
    -- SCD Type 2 columns
    ValidFrom           DATE          NOT NULL,
    ValidTo             DATE          NOT NULL,
    IsCurrent           BIT           NOT NULL,
);

CREATE TABLE dbo.Dim_Product (
    ProductSK           BIGINT IDENTITY NOT NULL,
    ProductID           VARCHAR(20)   NOT NULL,
    ProductName         VARCHAR(200)  NOT NULL,
    Category            VARCHAR(50)   NOT NULL,
    SubCategory         VARCHAR(50),
    Brand               VARCHAR(50),
    UnitCostEUR         DECIMAL(10,2),
    ListPriceEUR        DECIMAL(10,2),
    MarginPct           DECIMAL(5,1),
    PriceSegment        VARCHAR(20),
);

CREATE TABLE dbo.Dim_SalesRep (
    SalesRepSK          BIGINT IDENTITY NOT NULL,
    RepID               VARCHAR(20)   NOT NULL,
    RepName             VARCHAR(100)  NOT NULL,
    Region              VARCHAR(50),
    HireDate            DATE,
    AnnualTargetEUR     DECIMAL(12,2),
);

CREATE TABLE dbo.Dim_Warehouse (
    WarehouseSK         BIGINT IDENTITY NOT NULL,
    WarehouseID         VARCHAR(20)   NOT NULL,
    WarehouseName       VARCHAR(100)  NOT NULL,
    Country             VARCHAR(5),
    City                VARCHAR(100),
);

CREATE TABLE dbo.Dim_Date (
    DateKey             INT           NOT NULL,  -- YYYYMMDD
    FullDate            DATE          NOT NULL,
    Year                INT           NOT NULL,
    Quarter             INT           NOT NULL,
    Month               INT           NOT NULL,
    MonthName           VARCHAR(20)   NOT NULL,
    WeekOfYear          INT           NOT NULL,
    DayOfWeek           INT           NOT NULL,
    DayName             VARCHAR(20)   NOT NULL,
    IsWeekend           BIT           NOT NULL,
    QuarterLabel        VARCHAR(10)   NOT NULL,
);

-- ============================================================
-- TABLE DE FAITS
-- ============================================================

CREATE TABLE dbo.Fact_OrderLines (
    OrderLineSK         BIGINT IDENTITY NOT NULL,
    OrderKey            VARCHAR(20)   NOT NULL,
    DateKey             INT           NOT NULL,
    CustomerSK          BIGINT        NOT NULL,
    ProductSK           BIGINT        NOT NULL,
    SalesRepSK          BIGINT        NOT NULL,
    WarehouseSK         BIGINT        NOT NULL,
    Quantity            INT           NOT NULL,
    UnitPriceEUR        DECIMAL(10,2) NOT NULL,
    UnitCostEUR         DECIMAL(10,2) NOT NULL,
    DiscountPct         DECIMAL(5,2)  NOT NULL,
    LineTotalEUR        DECIMAL(12,2) NOT NULL,
    LineCostEUR         DECIMAL(12,2) NOT NULL,
    LineMarginEUR       DECIMAL(12,2) NOT NULL,
    LineMarginPct       DECIMAL(5,1),
    DeliveryPriority    VARCHAR(20),
    OrderStatus         VARCHAR(20),
);

PRINT 'Schema etoile cree avec succes.';
```

### 5.3 — Peupler la dimension Date

```sql
-- === Dimension Date : generer 2024-2025 ===

DECLARE @start DATE = '2024-01-01';
DECLARE @end DATE = '2025-12-31';
DECLARE @current DATE = @start;

WHILE @current <= @end
BEGIN
    INSERT INTO dbo.Dim_Date (
        DateKey, FullDate, Year, Quarter, Month, MonthName,
        WeekOfYear, DayOfWeek, DayName, IsWeekend, QuarterLabel
    )
    VALUES (
        CAST(FORMAT(@current, 'yyyyMMdd') AS INT),
        @current,
        YEAR(@current),
        DATEPART(QUARTER, @current),
        MONTH(@current),
        DATENAME(MONTH, @current),
        DATEPART(WEEK, @current),
        DATEPART(WEEKDAY, @current),
        DATENAME(WEEKDAY, @current),
        CASE WHEN DATEPART(WEEKDAY, @current) IN (1, 7) THEN 1 ELSE 0 END,
        'Q' + CAST(DATEPART(QUARTER, @current) AS VARCHAR) + ' ' + CAST(YEAR(@current) AS VARCHAR)
    );
    SET @current = DATEADD(DAY, 1, @current);
END;

SELECT COUNT(*) AS nb_dates FROM dbo.Dim_Date;
```

### 5.4 — Charger les dimensions depuis le Lakehouse (cross-database query)

**Problème terrain** : Les données Silver sont dans le Lakehouse. Le Warehouse doit les consommer sans les dupliquer manuellement.

**Solution** : Les **cross-database queries** de Fabric permettent de lire les tables du Lakehouse directement depuis le Warehouse via le three-part naming.

1. Dans le **WH_EnergiDistrib** → panneau gauche **Explorer** → cliquer **+ Warehouses**
2. Dans le catalogue OneLake → sélectionner **LH_EnergiDistrib** (SQL analytics endpoint)
3. Cliquer **Confirm**
4. Le Lakehouse apparaît maintenant dans l'Explorer

```sql
-- === Charger Dim_Product depuis le Lakehouse ===

INSERT INTO dbo.Dim_Product (
    ProductID, ProductName, Category, SubCategory, Brand,
    UnitCostEUR, ListPriceEUR, MarginPct, PriceSegment
)
SELECT
    product_id, product_name, category, sub_category, brand,
    unit_cost_eur, list_price_eur, margin_pct, price_segment
FROM [LH_EnergiDistrib].[dbo].[silver_products];

SELECT COUNT(*) AS nb_products FROM dbo.Dim_Product;
```

```sql
-- === Charger Dim_SalesRep ===

INSERT INTO dbo.Dim_SalesRep (
    RepID, RepName, Region, HireDate, AnnualTargetEUR
)
SELECT
    rep_id, rep_name, region, hire_date, annual_target_eur
FROM [LH_EnergiDistrib].[dbo].[silver_sales_reps];
```

```sql
-- === Charger Dim_Warehouse ===

INSERT INTO dbo.Dim_Warehouse (
    WarehouseID, WarehouseName, Country, City
)
SELECT
    warehouse_id, warehouse_name, country, city
FROM [LH_EnergiDistrib].[dbo].[bronze_warehouses];
```

```sql
-- === Charger Dim_Customer (chargement initial — SCD Type 2) ===

INSERT INTO dbo.Dim_Customer (
    CustomerID, CompanyName, Country, City, CustomerSegment,
    ContactEmail, ValidFrom, ValidTo, IsCurrent
)
SELECT
    c.customer_id,
    c.company_name,
    c.country_code,
    c.city,
    COALESCE(r.customer_segment, 'Non classe'),
    c.contact_email,
    '2024-01-01',      -- ValidFrom = debut historique
    '9999-12-31',       -- ValidTo = toujours courant
    1                   -- IsCurrent = oui
FROM [LH_EnergiDistrib].[dbo].[silver_customers] c
LEFT JOIN [LH_EnergiDistrib].[dbo].[silver_customer_rfm] r
    ON c.customer_id = r.customer_id;

SELECT COUNT(*) AS nb_customers FROM dbo.Dim_Customer;
```

### 5.5 — Charger la table de faits

```sql
-- === Charger Fact_OrderLines ===

INSERT INTO dbo.Fact_OrderLines (
    OrderKey, DateKey, CustomerSK, ProductSK, SalesRepSK, WarehouseSK,
    Quantity, UnitPriceEUR, UnitCostEUR, DiscountPct,
    LineTotalEUR, LineCostEUR, LineMarginEUR, LineMarginPct,
    DeliveryPriority, OrderStatus
)
SELECT
    ol.order_id,
    CAST(CONVERT(VARCHAR(8), o.order_date, 112) AS INT),
    dc.CustomerSK,
    dp.ProductSK,
    sr.SalesRepSK,
    dw.WarehouseSK,
    ol.quantity,
    ol.unit_price_eur,
    ol.unit_cost_eur,
    COALESCE(ol.discount_pct, 0),
    ol.line_total_eur,
    ol.line_cost_eur,
    ol.line_margin_eur,
    ol.line_margin_pct,
    CASE
        WHEN o.delivery_lead_days < 3 THEN 'Express'
        WHEN o.delivery_lead_days < 7 THEN 'Standard'
        WHEN o.delivery_lead_days < 14 THEN 'Lent'
        ELSE 'Critique'
    END,
    o.status
FROM [LH_EnergiDistrib].[dbo].[silver_order_lines] ol
JOIN [LH_EnergiDistrib].[dbo].[silver_orders] o ON ol.order_id = o.order_id
JOIN dbo.Dim_Customer dc ON o.customer_id = dc.CustomerID AND dc.IsCurrent = 1
JOIN dbo.Dim_Product dp ON ol.product_id = dp.ProductID
JOIN dbo.Dim_SalesRep sr ON o.rep_id = sr.RepID
JOIN dbo.Dim_Warehouse dw ON o.warehouse_id = dw.WarehouseID
WHERE o.status != 'cancelled';

SELECT COUNT(*) AS nb_order_lines FROM dbo.Fact_OrderLines;
```

### 5.6 — Vues analytiques T-SQL

```sql
-- === Vue 1 : Ventes mensuelles par pays ===

CREATE VIEW dbo.vw_MonthlySalesByCountry AS
SELECT
    dd.Year, dd.Month, dd.MonthName, dd.QuarterLabel,
    dc.Country,
    COUNT(DISTINCT f.OrderKey) AS NbOrders,
    SUM(f.Quantity) AS TotalQuantity,
    SUM(f.LineTotalEUR) AS Revenue,
    SUM(f.LineMarginEUR) AS Margin,
    CAST(SUM(f.LineMarginEUR) * 100.0 / NULLIF(SUM(f.LineTotalEUR), 0) AS DECIMAL(5,1)) AS MarginPct
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_Date dd ON f.DateKey = dd.DateKey
JOIN dbo.Dim_Customer dc ON f.CustomerSK = dc.CustomerSK
GROUP BY dd.Year, dd.Month, dd.MonthName, dd.QuarterLabel, dc.Country;
```

**Interprétation (vw_MonthlySalesByCountry)** : Cette vue résume le business au bon grain pour un comité de pilotage :

- Une ligne par **pays** et par **mois** (avec trimestre).
- `Revenue` et `Margin` permettent d’identifier les marchés qui tirent le CA vs ceux qui érodent la marge.
- `MarginPct` permet de comparer les pays indépendamment du volume (mix produit / politique de remise).

➡️ Dans Power BI, cette vue alimente typiquement une courbe de CA mensuel + un slicer Pays/Trimestre.

```sql
-- === Vue 2 : Performance vendeurs vs objectif ===

CREATE VIEW dbo.vw_SalesRepPerformance AS
SELECT
    sr.RepName,
    sr.Region,
    sr.AnnualTargetEUR,
    SUM(f.LineTotalEUR) AS ActualRevenue,
    CAST(SUM(f.LineTotalEUR) * 100.0 / NULLIF(sr.AnnualTargetEUR, 0) AS DECIMAL(5,1)) AS AttainmentPct,
    SUM(f.LineMarginEUR) AS TotalMargin,
    COUNT(DISTINCT f.OrderKey) AS NbOrders,
    SUM(CASE WHEN f.LineMarginPct < 0 THEN 1 ELSE 0 END) AS NbLossLines,
    AVG(f.DiscountPct) AS AvgDiscountPct
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_SalesRep sr ON f.SalesRepSK = sr.SalesRepSK
JOIN dbo.Dim_Date dd ON f.DateKey = dd.DateKey
WHERE dd.Year = 2025  -- Filtre sur l'annee en cours des donnees (2025)
GROUP BY sr.RepName, sr.Region, sr.AnnualTargetEUR;
```

**Interprétation (vw_SalesRepPerformance)** : Cette vue transforme la fact en KPIs “management” par vendeur :

- `AttainmentPct` mesure l’atteinte de l’objectif annuel (dans l’atelier, filtré sur **2025**).
- `NbLossLines` et `AvgDiscountPct` révèlent des comportements de remise (ex: ventes à perte).
- `TotalMargin` complète la lecture : un vendeur peut faire du CA mais dégrader la rentabilité.

➡️ Dans Power BI, elle sert à un tableau “Top/Flop vendeurs” et à cibler des actions (coaching, politique de prix).

```sql
-- === Vue 3 : Top produits par marge ===

CREATE VIEW dbo.vw_ProductMarginAnalysis AS
SELECT
    dp.Category,
    dp.ProductName,
    dp.PriceSegment,
    SUM(f.Quantity) AS TotalQtySold,
    SUM(f.LineTotalEUR) AS Revenue,
    SUM(f.LineMarginEUR) AS Margin,
    CAST(SUM(f.LineMarginEUR) * 100.0 / NULLIF(SUM(f.LineTotalEUR), 0) AS DECIMAL(5,1)) AS MarginPct,
    AVG(f.DiscountPct) AS AvgDiscount
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_Product dp ON f.ProductSK = dp.ProductSK
GROUP BY dp.Category, dp.ProductName, dp.PriceSegment;
```

**Interprétation (vw_ProductMarginAnalysis)** : Cette vue aide à piloter le catalogue :

- Elle met en évidence les **produits** et **catégories** qui font la marge (ou la détruisent).
- `AvgDiscount` permet de repérer les produits “aspirateurs à remise”.
- Le couple `Revenue` / `MarginPct` met en évidence les arbitrages volume vs rentabilité.

➡️ Dans Power BI, elle alimente un Top N produits (par marge) et une matrice Catégorie × Segment de prix.

> 💡 **Note sur vw_SalesRepPerformance** : Le filtre `WHERE dd.Year = 2025` est intentionnel pour cet atelier — l'objectif annuel (`AnnualTargetEUR`) des vendeurs est défini pour 2025. En production, ce filtre serait rendu dynamique avec `YEAR(GETDATE())` ou piloté par un paramètre de rapport Power BI.

---

## Bloc 6 — SCD Type 2 avec MERGE

### 6.1 — Comprendre le problème

**Situation** : Le client `CLI-00073` (« ThermEurope 52 ») vient de passer du segment **Fidele** à **VIP** car il a passé 3 grosses commandes ce trimestre. Si on fait un simple `UPDATE`, les rapports du Q1 qui comptaient ce client comme Fidele deviennent faux rétroactivement.

**SCD Type 1** (mention rapide) : On écrase simplement la valeur. Adapté quand l'historique n'a pas d'importance (correction d'une faute de frappe dans un nom).

**SCD Type 2** (focus principal) : On **ferme** l'ancienne ligne (IsCurrent = 0, ValidTo = hier) et on **crée** une nouvelle ligne (IsCurrent = 1, ValidFrom = aujourd'hui). L'ancienne version reste dans la table pour l'analyse historique.

### 6.2 — Charger le batch de mise à jour

D'abord, charger le fichier `customers_update_batch2.csv` dans le Lakehouse :

1. Dans **LH_EnergiDistrib** → **Files/** → **Upload** → `customers_update_batch2.csv`
2. Dans le Notebook **NB_Bronze_to_Silver** → ajouter une cellule :

```python
# === CELLULE 9 : Charger batch mise a jour clients ===
#
# OBJECTIF : Préparer la table de staging pour le SCD Type 2 (Bloc 6).
#            Le fichier customers_update_batch2.csv contient 150 clients
#            dont le segment commercial a changé ce trimestre.
#
# Pourquoi une table "staging" ?
#   Le Warehouse ne peut pas lire un fichier CSV directement.
#   En passant par une table Delta dans le Lakehouse, on peut utiliser
#   les cross-database queries depuis le Warehouse pour exécuter le MERGE SCD.
#
# Colonnes attendues dans le batch :
#   customer_id     → clé métier pour faire la correspondance avec Dim_Customer
#   company_name    → nouveau nom (si mis à jour, SCD Type 1)
#   country_code    → code pays ISO
#   city            → ville
#   new_segment     → NOUVEAU segment (c'est ce qui déclenche le SCD Type 2)
#   contact_email   → nouvel email (si mis à jour, SCD Type 1)
#
# mode="overwrite" : si on relance la cellule, on repart d'un staging propre

df_update = (spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("Files/customers_update_batch2.csv")
)

# Écrire en table Delta dans le Lakehouse (accessible depuis le Warehouse)
df_update.write.mode("overwrite").format("delta").saveAsTable("staging_customer_updates")

print(f"Batch mise a jour: {df_update.count()} clients modifies")

# Aperçu des 5 premières lignes pour vérification visuelle
# truncate=False → affiche les valeurs complètes sans troncature
df_update.show(5, truncate=False)
```

**Interprétation (Cellule 9)** : Cette cellule transforme le CSV “batch” en une table **staging** (`staging_customer_updates`) dans le Lakehouse. Elle joue 3 rôles :

- **Découpler** la source de mise à jour (fichier) des traitements : le Warehouse pourra lire la staging via une cross-database query sans manipuler de fichiers.
- **Standardiser** le format d’entrée pour le SCD : on aligne le batch sur les clés métier (`customer_id`) et les attributs à mettre à jour (`new_segment`, email, nom…).
- **Tracer/valider** : le `count()` et le `show()` permettent de vérifier immédiatement qu’on a bien ~150 lignes et le contenu attendu avant d’exécuter l’historisation.

### 6.3 — Vérifier l'état AVANT le MERGE

Revenir dans le **WH_EnergiDistrib** → **New SQL query** :

```sql
-- === Etat AVANT : clients qui vont changer ===

SELECT
    dc.CustomerSK, dc.CustomerID, dc.CompanyName,
    dc.CustomerSegment, dc.Country,
    dc.ValidFrom, dc.ValidTo, dc.IsCurrent
FROM dbo.Dim_Customer dc
WHERE dc.CustomerID IN (
    SELECT customer_id
    FROM [LH_EnergiDistrib].[dbo].[staging_customer_updates]
)
ORDER BY dc.CustomerID, dc.ValidFrom;
```

**Interprétation** : Vous voyez les 150 clients avec une seule ligne chacun (IsCurrent = 1, ValidTo = 9999-12-31). Après le MERGE, les clients dont le segment a changé auront **deux lignes** : l'ancienne (fermée) et la nouvelle (courante).

### 6.4 — Exécuter le MERGE SCD Type 2

```sql
-- ============================================================
-- SCD TYPE 2 : MERGE avec historisation
-- ============================================================

-- Etape 1 : Fermer les lignes courantes dont le segment a change
UPDATE dc
SET
    dc.ValidTo = DATEADD(DAY, -1, CAST(GETDATE() AS DATE)),
    dc.IsCurrent = 0
FROM dbo.Dim_Customer dc
INNER JOIN [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
    ON dc.CustomerID = upd.customer_id
    AND dc.IsCurrent = 1
WHERE dc.CustomerSegment != upd.new_segment;

-- Etape 2 : Inserer les nouvelles versions
INSERT INTO dbo.Dim_Customer (
    CustomerID, CompanyName, Country, City, CustomerSegment,
    ContactEmail, ValidFrom, ValidTo, IsCurrent
)
SELECT
    upd.customer_id,
    upd.company_name,
    upd.country_code,
    upd.city,
    upd.new_segment,
    upd.contact_email,
    CAST(GETDATE() AS DATE),  -- ValidFrom = aujourd'hui
    '9999-12-31',              -- ValidTo = toujours courant
    1                          -- IsCurrent = oui
FROM [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
WHERE upd.new_segment != (
    SELECT TOP 1 dc2.CustomerSegment
    FROM dbo.Dim_Customer dc2
    WHERE dc2.CustomerID = upd.customer_id
      AND dc2.IsCurrent = 0
    ORDER BY dc2.ValidTo DESC
);

-- SCD Type 1 : Mise a jour simple (nom, email — pas d'historique)
UPDATE dc
SET
    dc.CompanyName = upd.company_name,
    dc.ContactEmail = upd.contact_email
FROM dbo.Dim_Customer dc
INNER JOIN [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
    ON dc.CustomerID = upd.customer_id
    AND dc.IsCurrent = 1;

PRINT 'SCD Type 2 + Type 1 appliques.';
```

> 💡 **Note** : Le SCD Type 1 (UPDATE du nom et email) s'applique en même temps que le Type 2 (historisation du segment). C'est la pratique standard : certains attributs sont historisés, d'autres non.

### 6.5 — Vérifier l'état APRÈS le MERGE

```sql
-- === Etat APRES : clients avec historique (ceux qui ont change de segment) ===

SELECT
    dc.CustomerSK, dc.CustomerID, dc.CompanyName,
    dc.CustomerSegment, dc.Country,
    dc.ValidFrom, dc.ValidTo, dc.IsCurrent
FROM dbo.Dim_Customer dc
WHERE dc.CustomerID IN (
    SELECT CustomerID
    FROM dbo.Dim_Customer
    WHERE IsCurrent = 0  -- Clients ayant au moins une version fermee = segment change
)
ORDER BY dc.CustomerID, dc.ValidFrom;
```

**Interprétation** : Les clients dont le segment a changé ont maintenant **deux lignes**. Exemple :

- `CLI-00073` | ThermEurope 52 | **Fidele** | 2024-01-01 → *hier* | IsCurrent = **0**
- `CLI-00073` | ThermEurope 52 | **VIP** | *aujourd'hui* → 9999-12-31 | IsCurrent = **1**

> 💡 Les dates *hier* et *aujourd'hui* correspondent à la date d'exécution réelle du MERGE (`GETDATE()`). L'historique est préservé : les rapports antérieurs retrouveront ce client en segment **Fidele**, les rapports à partir d'aujourd'hui le verront en **VIP**.

Les rapports du Q1 qui utilisent la date de commande retrouveront l'ancien segment (Fidele). Les rapports à partir d'aujourd'hui montrent le nouveau segment (VIP). **L'historique est préservé.**

## Bloc 7 — Modèle sémantique (Service) + mesures (sans colonnes calculées)

> 🎯 **Objectif** : éviter de perdre du temps sur les limitations DirectLake (colonnes calculées, tri “Sort by column”, etc.).  
> On crée un modèle simple (schéma étoile + mesures), puis on construit le rapport dans **Power BI Desktop** via une connexion au modèle (thin report).

### 7.1 — Créer le modèle sémantique dans Fabric (DirectLake)

1. Workspace → **New item** → **Semantic model**
2. **OneLake catalog** → votre workspace → `WH_EnergiDistrib`
3. Sélectionner uniquement :
   - `Dim_Customer`, `Dim_Date`, `Dim_Product`, `Dim_SalesRep`, `Dim_Warehouse`
   - `Fact_OrderLines`
4. Nom : **`SM_EnergiDistrib`** → **Create/Confirm**

> ⚠️ Si le modèle s’ouvre en **Viewing mode** (tout grisé), recréez-le en `SM_EnergiDistrib_v2` et utilisez celui qui vous permet au minimum de créer des **mesures**.

### 7.2 — Relations (schéma étoile)

1. Ouvrir le modèle → vue **Model**
2. Vérifier / créer (Many-to-One, filtre **Single** Dim → Fact) :
   - `Fact_OrderLines[CustomerSK]` → `Dim_Customer[CustomerSK]`
   - `Fact_OrderLines[ProductSK]` → `Dim_Product[ProductSK]`
   - `Fact_OrderLines[SalesRepSK]` → `Dim_SalesRep[SalesRepSK]`
   - `Fact_OrderLines[WarehouseSK]` → `Dim_Warehouse[WarehouseSK]`
   - `Fact_OrderLines[DateKey]` → `Dim_Date[DateKey]`

### 7.3 — Mesures DAX (14 mesures)

> 🎯 **Objectif** : créer un socle de mesures réutilisables (CA, marge, volumes, temps, objectifs) sans dépendre de colonnes calculées (qui peuvent être limitées selon le mode / l’UI Fabric).

Dans le modèle sémantique : cliquer sur **Fact_OrderLines** → **New measure**, puis créer les 14 mesures ci‑dessous.  
Chaque mesure est accompagnée de son but et des fonctions DAX utilisées (avec liens).

**Mesures de base (CA / coûts / marge / volumes)** :

**Total Revenue** — chiffre d’affaires total. Fonctions : [SUM](https://dax.guide/sum/).

```dax
Total Revenue = SUM(Fact_OrderLines[LineTotalEUR])
```

**Total Cost** — coût total. Fonctions : [SUM](https://dax.guide/sum/).

```dax
Total Cost = SUM(Fact_OrderLines[LineCostEUR])
```

**Total Margin** — marge en valeur. Fonctions : [SUM](https://dax.guide/sum/).

```dax
Total Margin = SUM(Fact_OrderLines[LineMarginEUR])
```

**Margin %** — taux de marge (= marge / CA). Fonctions : [DIVIDE](https://dax.guide/divide/).

```dax
Margin % = DIVIDE([Total Margin], [Total Revenue], 0)
```

> 🧩 **Dépannage (circular dependency)** : si `Margin %` affiche une dépendance circulaire, c’est presque toujours que **Total Margin** a été créée avec une formule auto‑référente (ex : `Total Margin = [Total Margin]`) ou qu’un autre objet porte le même nom.  
> ✅ Corriger **Total Margin** pour qu’elle soit exactement : `SUM(Fact_OrderLines[LineMarginEUR])`, puis recréer `Margin %`.

> 💡 **Format** : `Margin %` retourne une fraction décimale (ex : 0.253 = 25.3%). Dans Power BI, appliquez le format `0.0%`. Ne pas multiplier par 100 dans la mesure.

**Nb Orders** — nombre de commandes (distinct). Fonctions : [DISTINCTCOUNT](https://dax.guide/distinctcount/).

```dax
Nb Orders = DISTINCTCOUNT(Fact_OrderLines[OrderKey])
```

**Nb Customers** — nombre de clients (distinct). Fonctions : [DISTINCTCOUNT](https://dax.guide/distinctcount/).

```dax
Nb Customers = DISTINCTCOUNT(Fact_OrderLines[CustomerSK])
```

**Avg Order Value** — panier moyen (= CA / nb commandes). Fonctions : [DIVIDE](https://dax.guide/divide/).

```dax
Avg Order Value = DIVIDE([Total Revenue], [Nb Orders], 0)
```

**Mesures temporelles (comparaisons / cumul)** :

> ✅ Pré‑requis : relation `Fact_OrderLines[DateKey]` → `Dim_Date[DateKey]` (Bloc 7.2) et `Dim_Date[FullDate]` au type **Date**.

**Revenue PY** — CA N‑1 sur la même période. Fonctions : [CALCULATE](https://dax.guide/calculate/), [SAMEPERIODLASTYEAR](https://dax.guide/sameperiodlastyear/).

```dax
Revenue PY = CALCULATE([Total Revenue], SAMEPERIODLASTYEAR(Dim_Date[FullDate]))
```

**Revenue YoY %** — évolution du CA vs N‑1. Fonctions : [DIVIDE](https://dax.guide/divide/) (+ variables `VAR` / `RETURN`).

```dax
Revenue YoY % =
VAR CurrentRevenue = [Total Revenue]
VAR PriorRevenue = [Revenue PY]
RETURN DIVIDE(CurrentRevenue - PriorRevenue, PriorRevenue, 0)
```

**Revenue YTD** — cumul CA depuis le début de l’année. Fonctions : [TOTALYTD](https://dax.guide/totalytd/).

```dax
Revenue YTD = TOTALYTD([Total Revenue], Dim_Date[FullDate])
```

**Revenue QTD** — cumul CA depuis le début du trimestre. Fonctions : [TOTALQTD](https://dax.guide/totalqtd/).

```dax
Revenue QTD = TOTALQTD([Total Revenue], Dim_Date[FullDate])
```

**Mesures d’objectifs (vendeurs)** :

**Target Revenue** — objectif annuel (somme des objectifs). Fonctions : [SUM](https://dax.guide/sum/).

```dax
Target Revenue = SUM(Dim_SalesRep[AnnualTargetEUR])
```

**Target Attainment %** — taux d’atteinte (= CA / objectif). Fonctions : [DIVIDE](https://dax.guide/divide/).

```dax
Target Attainment % = DIVIDE([Total Revenue], [Target Revenue]*100, 0)
```

**Mesure qualité (ventes à perte)** :

**Nb Loss Lines** — nombre de lignes de vente à marge négative. Fonctions : [CALCULATE](https://dax.guide/calculate/), [COUNTROWS](https://dax.guide/countrows/).

```dax
Nb Loss Lines =
CALCULATE(
    COUNTROWS(Fact_OrderLines),
    Fact_OrderLines[LineMarginPct] < 0
)
```

**Ressources** :

- [Référence DAX (Microsoft Learn)](https://learn.microsoft.com/dax/)
- [Glossaire + exemples (DAX Guide)](https://dax.guide/)

### 7.4 — KPI

> ⚠️ **Note Fabric actuel** : Dans Power BI / Fabric moderne, il n'existe pas d'"Enable KPI" au niveau d'une mesure dans le modèle sémantique. Le KPI se configure directement dans le **visuel KPI** du rapport (Bloc 8). La mesure `Target Attainment %` est prête à être utilisée telle quelle.

Pour utiliser le KPI dans le rapport :

1. Insérer un visuel **KPI** sur la page du rapport
2. **Value** → glisser `Target Attainment %`
3. **Target** → saisir la valeur fixe `1` (= 100% en fraction décimale)
4. Les seuils de couleur se configurent dans le panneau **Format** du visuel KPI

---

## Bloc 8 — Rapport Power BI (depuis le modèle sémantique Fabric)

> 🎯 **Objectif** : Construire un rapport professionnel à 5 pages directement dans l'éditeur web Fabric, sans Power BI Desktop, en exploitant les 14 mesures DAX créées au Bloc 7.
> 
> ⚠️ **Interface ciblée** : l'éditeur de rapport intégré à Fabric (`app.fabric.microsoft.com`), lancé depuis le modèle sémantique. Cet éditeur n'est **pas** Power BI Desktop — les panneaux et options portent des noms différents.
> 
> 📋 **Plan** : Tableau de bord exécutif / Analyse des ventes / Analyse clients / Performance vendeurs / Produits & Entrepôts / Page cachée Détail Client (drill-through)

---

### 8.0 — Avant de démarrer : formater les mesures dans le modèle

Dans l'éditeur Fabric web, le format des nombres affiché sur les visuels est **piloté par la chaîne de format de la mesure** définie dans le modèle sémantique. Il n'existe pas d'option "Display units" au niveau du visuel comme dans Desktop.

**À faire avant de créer le rapport** — dans `SM_EnergiDistrib`, cliquer sur chaque mesure et renseigner le champ **Format** :

| Mesure              | Format string      |
| ------------------- | ------------------ |
| Total Revenue       | `#,0.0,," M€"`     |
| Total Margin        | `#,0.0,," M€"`     |
| Total Cost          | `#,0.0,," M€"`     |
| Margin %            | `0.0%`             |
| Nb Orders           | `#,0`              |
| Nb Customers        | `#,0`              |
| Avg Order Value     | `#,0 €`            |
| Revenue PY          | `#,0.0,," M€"`     |
| Revenue YoY %       | `+0.0%;-0.0%;0.0%` |
| Revenue YTD         | `#,0.0,," M€"`     |
| Revenue QTD         | `#,0.0,," M€"`     |
| Target Revenue      | `#,0.0,," M€"`     |
| Target Attainment % | `0%`               |
| Nb Loss Lines       | `#,0`              |

> 💡 **Comment définir le format d'une mesure** : dans le modèle sémantique → cliquer sur le nom de la mesure dans le panneau Data → dans le panneau de propriétés qui s'ouvre en bas → champ **Format** → saisir la chaîne de format → Entrée.
> 
> La chaîne `#,0.0,," M€"` signifie : séparateur de milliers (`#,0`), 1 décimale (`.0`), divisé par 1 million (`,,`), suivi du texte ` M€`. Résultat : `188.8 M€`.

---

### 8.1 — Ouvrir l'éditeur de rapport

1. Dans votre workspace Fabric → ouvrir `SM_EnergiDistrib`

2. Dans la barre du haut → **File** → **New report**
   
   > 💡 Vous pouvez aussi cliquer sur le bouton **Create report** visible sur la page du modèle sémantique. Les deux chemins aboutissent au même éditeur web.

3. L'éditeur s'ouvre dans un nouvel onglet avec une page vierge nommée `Page 1`

4. Dans le panneau **Data** (droite) → vérifier que vous voyez les 6 tables et les mesures sous `Fact_OrderLines`

**Présentation de l'interface** (à retenir pour toute la suite) :

```
┌─ Barre d'outils ─────────────────────────────────────────────────────────┐
│  File | View | Reading view | Text box | Shapes | Buttons |              │
│  Visual interactions | Refresh | Save                                    │
└──────────────────────────────────────────────────────────────────────────┘
┌─ Canvas (zone de conception) ──────────┬─ Panneau droit ─────────────────┐
│                                        │  [Visualizations] [Data]        │
│                                        │                                 │
│                                        │  Visualizations : icônes des   │
│                                        │  types de visuels               │
│                                        │                                 │
│                                        │  Format (pinceau 🖌) : options  │
│                                        │  de mise en forme du visuel     │
│                                        │  sélectionné (onglets Visual /  │
│                                        │  General)                       │
│                                        │                                 │
│                                        │  Data : liste des tables et     │
│                                        │  mesures à glisser sur canvas   │
└────────────────────────────────────────┴─────────────────────────────────┘
┌─ Bas de page ─────────────────────────────────────────────────────────────┐
│  [+ Nouvelle page]  [Page 1]  [Page 2] ...                               │
└──────────────────────────────────────────────────────────────────────────┘
```

**Comment ajouter un visuel** :

1. Cliquer sur l'icône du type de visuel souhaité dans le panneau Visualizations → un visuel vide apparaît sur le canvas
2. Glisser un champ depuis le panneau Data vers le visuel **ou** vers les zones de champs (X-axis, Y-axis, Values...) qui apparaissent dans le panneau Visualizations quand le visuel est sélectionné
3. Cliquer sur l'icône **pinceau 🖌** dans le panneau Visualizations pour accéder aux options de format

**Comment renommer une page** : double-cliquer sur l'onglet de la page en bas → saisir le nouveau nom → Entrée

---

### 8.2 — Page 1 : Tableau de bord exécutif

> 🎯 **Question** : Comment se porte le business en un coup d'œil ? Sommes-nous dans les objectifs ?
> 
> **Mesures utilisées** : `Total Revenue`, `Total Margin`, `Margin %`, `Nb Orders`, `Revenue YoY %`, `Revenue YTD`, `Revenue PY`, `Target Attainment %`

**Renommer la page** : double-cliquer sur `Page 1` → saisir `🏠 Tableau de bord`

---

**Titre de page**

1. Barre d'outils → **Text box** → cliquer sur le canvas
2. Saisir : `EnergiDistrib — Tableau de bord Commercial 2025`
3. Sélectionner le texte → dans la barre de formatage intégrée à la text box : taille `18`, gras
4. Cliquer sur la bordure de la text box → panneau Format (pinceau) → **General** → **Effects** → **Background** → activer → couleur `#1B4F72` → **Font color** → blanc
5. Étirer pour occuper toute la largeur en haut (~60px de hauteur)

---

**5 Card visuels (rangée de KPIs)**

> 💡 **Le visuel Card dans Fabric web** : c'est le "Card (new)" — il affiche une valeur principale (Callout) et une étiquette (Label). Le format du nombre est celui défini sur la mesure dans le modèle (voir 8.0).

**Card 1 — CA Total**

1. Cliquer l'icône **Card** dans Visualizations (rectangle avec grand chiffre)
2. Glisser `Total Revenue` dans la zone **Fields** du visuel
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Callout** → **Value** → activé (toggle ON) → aucune autre modification nécessaire (le format est déjà défini sur la mesure)
   - Section **Callout** → **Label** → activé → cliquer sur le champ texte → saisir `CA Total`
4. Onglet **General** → **Effects** → **Background** → activer, couleur blanche → **Border** → activer, couleur `#1B4F72`

**Cards 2 à 5** — dupliquer la Card 1 (Ctrl+D) et changer uniquement la mesure et le label :

| Card | Mesure          | Label               |
| ---- | --------------- | ------------------- |
| 2    | `Total Margin`  | `Marge totale`      |
| 3    | `Margin %`      | `Taux de marge`     |
| 4    | `Nb Orders`     | `Nb Commandes`      |
| 5    | `Revenue YoY %` | `Évolution vs 2024` |

---

**Line Chart — Évolution CA mensuel vs N-1**

1. Cliquer l'icône **Line chart** dans Visualizations
2. Champs :
   - Zone **X-axis** : glisser `Dim_Date` → `FullDate`
   - Zone **Y-axis** : glisser `Total Revenue` PUIS `Revenue PY` (glisser les deux mesures)

---

**Gauge — Atteinte de l'objectif annuel**

1. Cliquer l'icône **Gauge** (demi-cercle) dans Visualizations
2. Champs :
   - Zone **Value** : glisser `Target Attainment %`
   - Zone **Target value** : saisir directement `1` dans le champ (pas de mesure, valeur fixe)
   - Zone **Minimum value** : saisir `0`
   - Zone **Maximum value** : saisir `1.5`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Colors** → **Fill** : couleur `#27AE60` (vert)
   - Section **General**  → **Title** → `Atteinte Objectif 2025`

---

**Clustered Bar Chart — CA par pays**

1. Cliquer l'icône **Clustered bar chart** dans Visualizations
2. Champs :
   - Zone **Y-axis** : glisser `Dim_Date` → `Year`
   - Zone **X-axis** : glisser `Total Revenue`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Bars** → **Color** → `#1B4F72`
   - Section **Data labels** → activé
   - Section **Title** → `CA par pays`
4. Trier : cliquer sur les `...` (trois points) en haut du visuel → **Sort axis** → `Total Revenue` → **Sort descending**
5. Positionner : quart inférieur droit

---

**Slicer — Trimestre**

1. Cliquer l'icône **Slicer** dans Visualizations
2. Glisser `Dim_Date` → `QuarterLabel` dans la zone **Field**
3. Pinceau 🖌 → onglet **Visual** → section **Slicer settings** → **Options** → **Style** → choisir **Dropdown**
4. Section **Title** → `Filtrer par trimestre`
5. Positionner : au-dessus du Bar chart

---

### 8.3 — Page 2 : Analyse des ventes

**Créer la page** : clic **+** en bas → double-clic sur l'onglet → `📈 Analyse des ventes`

---

**2 Cards résumé en haut**

- Card `Revenue YTD` → label `CA cumulé YTD`
- Card `Revenue QTD` → label `CA ce trimestre`
- Positionner côte à côte, haut gauche

---

**Clustered Column Chart — CA et Marge par mois**

1. Icône **Clustered column chart** → glisser sur canvas
2. Champs :
   - **X-axis** : `Dim_Date` → `MonthName`
   - **Y-axis** : `Total Revenue`
   - **Secondary y-axis** : `Margin %`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Columns** → `Total Revenue` → couleur `#1B4F72`
   - Section **Line** (si disponible pour l'axe secondaire) → `Margin %` → couleur `#27AE60`
   - Section **Y-axis** → activer **Secondary y-axis**
   - Section **Title** → `CA et Marge par mois`

> 💡 Si l'axe secondaire n'est pas disponible dans cette version de l'éditeur web, créer deux visuels séparés côte à côte : un bar chart pour le CA et un line chart pour la Marge %.

---

**Stacked Bar Chart — Top 10 produits**

1. Icône **Stacked bar chart** → glisser sur canvas
2. Champs :
   - **Y-axis** : `Dim_Product` → `ProductName`
   - **X-axis** : `Total Revenue`
   - **Legend** : `Dim_Product` → `Category`
3. Filtre Top N : dans le panneau **Filters** (gauche, icône entonnoir) → sous **Filters on this visual** → glisser `Total Revenue` → **Filter type** = `Top N` → **Show items** = `Top 10` → **By value** = `Total Revenue` → **Apply filter**
4. Pinceau 🖌 → **Title** → `Top 10 Produits par CA`

---

**Matrix — CA par segment client (avec drill-down)**

1. Icône **Matrix** (tableau avec sous-totaux) → glisser sur canvas
2. Champs :
   - **Rows** : `Dim_Customer` → `CustomerSegment` PUIS `CompanyName` (dans cet ordre)
   - **Columns** : `Dim_Date` → `Year`
   - **Values** : `Total Revenue`, `Margin %`, `Nb Orders`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Row headers** → activer **+/- icons** (permet le drill Segment → Clients)
   - Section **Values** → format de `Margin %` : affiché via le format de mesure (déjà défini)
   - Section **Subtotals** → **Row subtotals** → activé
4. **Mise en forme conditionnelle sur Margin %** :
   - Clic droit sur `Margin %` dans la zone Values du visuel → **Conditional formatting** → **Background color**
   - Choisir **Rules** : si valeur ≤ 0 → rouge `#E74C3C` / si valeur entre 0 et 0.15 → orange `#F39C12` / si valeur > 0.15 → vert `#27AE60`
   - **Apply**
5. Titre → `CA par Segment Client`
6. Positionner : bas de la page, pleine largeur

> 💡 **Drill-down sur la Matrix** : cliquer sur l'icône **↓** (flèche vers le bas) qui apparaît en haut du visuel pour passer du niveau Segment au niveau Client individuel.

---

**Slicers de la page**

- Slicer `Dim_Date` → `Year` → Style **Buttons** (affiche les années comme boutons cliquables)
- Slicer `Dim_Product` → `Category` → Style **Dropdown**

---

### 8.4 — Page 3 : Analyse clients

> 🎯 **Question** : Qui sont nos meilleurs clients ? Comment se segmente le portefeuille ?
> 
> **Mesures utilisées** : `Total Revenue`, `Nb Orders`, `Avg Order Value`, `Nb Customers`, `Margin %`

**Créer la page** : clic **+** → `👥 Analyse clients`

---

**3 Cards en haut** :

- `Nb Customers` → label `Clients actifs`
- `Avg Order Value` → label `Panier moyen`
- `Total Revenue` → label `CA Total`

---

**Donut Chart — Répartition CA par segment**

1. Icône **Donut chart** → canvas
2. Champs :
   - **Legend** : `Dim_Customer` → `CustomerSegment`
   - **Values** : `Total Revenue`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Slices** → attribuer des couleurs distinctes par segment : VIP = `#1B4F72`, Fidele = `#27AE60`, Occasionnel = `#F39C12`, Dormant = `#E74C3C`
   - Section **Detail labels** → activé → **Label contents** : choisir **Category, percent of total**
   - Section **Legend** → activé → Position = **Bottom**
   - Section **Title** → `Répartition du CA par segment client`
4. Positionner : quart gauche

---

**Scatter Chart — Profil clients**

> 📊 Révèle 4 profils : clients fréquents à gros panier (VIP), fréquents à petit panier (fidèles), rares à gros panier (comptes stratégiques), rares à petit panier (dormants).

1. Icône **Scatter chart** → canvas
2. Champs :
   - **X-axis** : `Nb Orders`
   - **Y-axis** : `Avg Order Value`
   - **Size** : `Total Revenue`
   - **Details** : `Dim_Customer` → `CompanyName`
   - **Legend** : `Dim_Customer` → `CustomerSegment`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Legend** → activé → Position = **Right**
   - Section **Title** → `Profil clients : fréquence vs panier moyen`
4. Positionner : moitié droite

---

**Table — Liste clients (avec drill-through à configurer en 8.7)**

1. Icône **Table** → canvas
2. Champs (dans cet ordre) :
   - `Dim_Customer` → `CustomerSegment`
   - `Dim_Customer` → `CompanyName`
   - `Dim_Customer` → `Country`
   - `Total Revenue`
   - `Nb Orders`
   - `Avg Order Value`
   - `Margin %`
3. Pinceau 🖌 → onglet **Visual** :
   - **Conditional formatting** sur `Total Revenue` : clic droit sur la colonne dans la zone Values → **Conditional formatting** → **Data bars** → couleur `#1B4F72`
   - **Title** → `Clients (clic droit → Drill-through)`
4. Cliquer sur l'en-tête `Total Revenue` pour trier décroissant
5. Positionner : bas de la page, pleine largeur

---

### 8.5 — Page 4 : Performance vendeurs

> 🎯 **Question** : Qui atteint ses objectifs ? Qui vend à perte ? Quelles régions sous-performent ?
> 
> **Mesures utilisées** : `Total Revenue`, `Target Revenue`, `Target Attainment %`, `Margin %`, `Nb Orders`, `Avg Order Value`, `Nb Loss Lines`

**Créer la page** : clic **+** → `🏆 Performance vendeurs`

---

**Slicer Région (filtre principal de la page)**

1. Icône **Slicer** → glisser `Dim_SalesRep` → `Region`
2. Pinceau 🖌 → **Slicer settings** → Style = **Buttons**
3. Positionner en haut à droite

---

**KPI visual — Atteinte globale équipe**

1. Icône **KPI** (flèche trend + valeur) → canvas
2. Champs :
   - **Value** : `Target Attainment %`
   - **Trend axis** : `Dim_Date` → `MonthName`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Callout value** → format affiché via le format de mesure (`0%`)
   - Section **Goals** → **Direction** = **High is good**
   - Section **Title** → `Atteinte Objectif Équipe 2025`
4. Positionner : coin supérieur gauche

---

**Clustered Bar Chart — CA vs Objectif par vendeur**

> 📊 Le visuel clé de la page : visualise en un coup d'œil qui dépasse ses objectifs.

1. Icône **Clustered bar chart** → canvas
2. Champs :
   - **Y-axis** : `Dim_SalesRep` → `RepName`
   - **X-axis** : `Total Revenue` ET `Target Revenue`
3. Pinceau 🖌 → onglet **Visual** :
   - Section **Bars** → sélectionner `Total Revenue` → couleur `#1B4F72`
   - Section **Bars** → sélectionner `Target Revenue` → couleur `#BDC3C7`
   - Section **Data labels** → activé
   - Section **Legend** → activé
   - Section **Title** → `CA 2025 vs Objectif par vendeur`
4. Trier : `...` → Sort → `Total Revenue` → descending
5. Positionner : moitié gauche, zone centrale

---

**Top 5 / Bottom 5 vendeurs (deux petits bar charts)**

**Top 5** :

1. Copier le bar chart précédent (Ctrl+C → Ctrl+V) → réduire la taille
2. Panneau **Filters** → **Filters on this visual** → glisser `Total Revenue` → **Top N** → Top → `5`
3. Titre → `🏆 Top 5`

**Bottom 5** :

1. Dupliquer → **Filters** → **Top N** → Bottom → `5`
2. Titre → `⚠️ Bottom 5`
3. Positionner côte à côte, moitié droite

---

**Table de détail vendeur**

1. Icône **Table** → canvas
2. Champs :
   - `Dim_SalesRep` → `RepName`
   - `Dim_SalesRep` → `Region`
   - `Total Revenue`
   - `Target Revenue`
   - `Target Attainment %`
   - `Margin %`
   - `Nb Orders`
   - `Avg Order Value`
   - `Nb Loss Lines`
3. **Mise en forme conditionnelle** :
   - Clic droit sur `Target Attainment %` dans la zone Values → **Conditional formatting** → **Icons** → Style = **Traffic light** → Rules :
     - < `0.7` : icône rouge
     - entre `0.7` et `0.9` : icône orange
     - ≥ `0.9` : icône verte
   - Clic droit sur `Nb Loss Lines` → **Conditional formatting** → **Background color** → gradient blanc → rouge `#E74C3C`
4. Titre → `Détail performance vendeurs`
5. Positionner : bas de page, pleine largeur

---

### 8.6 — Page 5 : Produits & Entrepôts

> 🎯 **Question** : Quelles catégories et produits sont les plus rentables ?
> 
> **Mesures utilisées** : `Total Revenue`, `Total Margin`, `Total Cost`, `Margin %`, `Nb Orders`

**Créer la page** : clic **+** → `📦 Produits & Entrepôts`

---

**Clustered Column Chart — CA et Marge par catégorie**

1. Icône **Clustered column chart** → canvas
2. Champs :
   - **X-axis** : `Dim_Product` → `Category`
   - **Y-axis** : `Total Revenue` ET `Total Margin`
3. Pinceau 🖌 :
   - `Total Revenue` → couleur `#1B4F72`
   - `Total Margin` → couleur `#27AE60`
   - **Data labels** → activé
   - **Title** → `CA et Marge absolue par catégorie`
4. Positionner : moitié gauche, haut

---

**Treemap — Répartition du CA par sous-catégorie**

1. Icône **Treemap** (rectangles imbriqués) → canvas
2. Champs :
   - **Category** : `Dim_Product` → `Category`
   - **Details** : `Dim_Product` → `SubCategory`
   - **Values** : `Total Revenue`
3. Pinceau 🖌 :
   - **Data labels** → activé → **Label contents** : `Category`
   - **Title** → `Répartition du CA par sous-catégorie`
4. Positionner : moitié droite, haut

---

**Scatter Chart — Matrice Volume / Marge par catégorie**

> 📊 Inspiration "matrice BCG" : identifier les catégories Stars (volume + marge élevés) vs les catégories à risque.

1. Icône **Scatter chart** → canvas
2. Champs :
   - **X-axis** : `Total Revenue`
   - **Y-axis** : `Margin %`
   - **Size** : `Nb Orders`
   - **Details** : `Dim_Product` → `Category`
3. Pinceau 🖌 → **Title** → `Matrice Volume / Marge par catégorie de produit`
4. Positionner : moitié gauche, bas

---

**Clustered Bar Chart — CA par entrepôt**

1. Icône **Clustered bar chart** → canvas
2. Champs :
   - **Y-axis** : `Dim_Warehouse` → `WarehouseName`
   - **X-axis** : `Total Revenue`
   - **Legend** : `Dim_Warehouse` → `Country`
3. Pinceau 🖌 → **Title** → `CA par entrepôt de distribution`
4. Trier : `Total Revenue` descending
5. Positionner : moitié droite, bas

---

### 8.7 — Page cachée : Détail Client (Drill-through)

> 💡 **Drill-through** : l'utilisateur fait **clic droit** sur un nom de client dans n'importe quelle page → **Drill through** → **Détail Client** → voit la fiche complète de ce client. C'est une fonctionnalité clé pour l'exploration.

**Créer la page** :

1. Clic **+** → renommer `🔍 Détail Client`

2. Clic droit sur l'onglet de la page → **Hide page**
   
   > La page reste accessible par drill-through mais n'apparaît pas dans la navigation normale.

---

**Configurer le drill-through sur cette page**

1. Cliquer dans une zone vide du canvas de la page **Détail Client**

2. Dans le panneau **Filters** (gauche) → chercher la section **Drillthrough**

3. Glisser `Dim_Customer` → `CompanyName` dans la zone **Add drill-through fields here**
   
   > ✅ Une flèche de retour automatique (`← Back`) apparaît en haut à gauche du canvas — **ne pas la supprimer**.

---

**Visuels de la fiche client**

**Titre** :

1. **Text box** → saisir `Fiche client`
2. Taille 16, gras, fond `#1B4F72`, texte blanc

**4 Cards KPIs du client** :

- `Total Revenue` → `CA Total`
- `Nb Orders` → `Nb Commandes`
- `Avg Order Value` → `Panier moyen`
- `Margin %` → `Taux de marge`

**Line Chart — Évolution mensuelle du client** :

1. Icône **Line chart**
2. **X-axis** : `Dim_Date` → `FullDate` (niveau Month)
3. **Y-axis** : `Total Revenue` ET `Revenue PY`
4. **Title** → `Évolution mensuelle du CA`

**Table — Historique commandes du client** :

1. Icône **Table**
2. Champs : `Dim_Date` → `FullDate`, `Fact_OrderLines` → `OrderKey`, `Dim_Product` → `Category`, `Total Revenue`, `Margin %`, `Fact_OrderLines` → `DeliveryPriority`, `Fact_OrderLines` → `OrderStatus`
3. **Title** → `Historique des commandes`

---

**Tester le drill-through**

1. Aller sur la page **Analyse clients**
2. Sur la table de clients → **clic droit** sur un nom de client
3. Dans le menu contextuel → **Drill through** → **Détail Client**
4. La page Détail Client s'ouvre filtrée sur ce client uniquement
5. Cliquer la flèche `← Back` pour revenir

---

### 8.8 — Visual interactions (interactions entre visuels)

> 💡 Par défaut, cliquer sur un visuel filtre ou met en surbrillance tous les autres. Vous pouvez personnaliser ce comportement.

**Comment configurer les interactions** :

1. **Sélectionner** le visuel source (ex: Bar chart pays sur Page 1)
2. Barre d'outils → **Visual interactions** (bouton dans la barre du haut)
3. Des icônes apparaissent sur chaque autre visuel de la page :
   - 🔲 **Filtre** : le clic sur le visuel source filtre ce visuel
   - 🔆 **Surbrillance** : le clic met en surbrillance les valeurs correspondantes
   - ⊘ **Aucun** : le clic n'affecte pas ce visuel
4. Recommandations pour la Page 1 :
   - Bar chart pays → Line chart CA mensuel : **Filtre** (voir la courbe du pays sélectionné)
   - Bar chart pays → Gauge objectif : **Aucun** (la gauge reste globale)
   - Donut catégorie → Bar chart pays : **Surbrillance**
5. Cliquer à nouveau sur **Visual interactions** dans la barre d'outils pour quitter ce mode

---

### 8.9 — Bookmarks et navigation entre pages

**Ajouter des boutons de navigation entre pages**

1. Aller sur une page (ex: Page 1)

2. Barre d'outils → **Buttons** → **Navigator** → **Page navigator**
   
   > Le Page navigator génère automatiquement des boutons pour toutes les pages visibles. C'est la façon la plus simple d'ajouter une navigation claire.

3. Positionner en bas ou en haut de la page

4. Pinceau 🖌 → **Buttons** → ajuster le style (couleur, taille de texte)

5. Répéter sur chaque page (ou copier-coller le navigator)

---

**Créer des Bookmarks (vue mensuelle / trimestrielle)**

1. Barre d'outils → **View** → **Bookmarks** (si disponible dans votre version)
   
   > 💡 Dans certaines versions de l'éditeur Fabric web, les bookmarks sont sous **View** → **Bookmarks pane** ou via **Insert** → **Bookmark**.

2. Configurer le slicer Year sur `2025` uniquement → **Add** → nommer `Vue 2025`

3. Configurer le slicer Year sur `2024` et `2025` → **Add** → nommer `Comparaison 2024-2025`

4. Créer deux boutons (barre d'outils → **Buttons** → **Blank**) :
   
   - Label `2025 seulement` → Format → **Action** → activé → **Type** = **Bookmark** → sélectionner `Vue 2025`
   - Label `2024 vs 2025` → Action → Bookmark → `Comparaison 2024-2025`

---

### 8.10 — Finalisation et sauvegarde

**Page Méthodologie (optionnelle mais recommandée)**

1. Clic **+** → renommer `📖 Méthodologie`
2. **Text box** pleine page → saisir :

```
GLOSSAIRE DES MESURES

Total Revenue       : Somme des CA de toutes les lignes de commande (format : M€)
Total Margin        : CA − Coût total (marge absolue)
Margin %            : Total Margin / Total Revenue
Nb Orders           : Nombre de commandes distinctes
Nb Customers        : Nombre de clients distincts ayant commandé
Avg Order Value     : Panier moyen = CA / Nb commandes
Revenue PY          : CA sur la même période de l'année N-1
Revenue YoY %       : Évolution CA vs N-1 (+ = croissance)
Revenue YTD         : CA cumulé depuis le 1er janvier de l'année filtrée
Revenue QTD         : CA cumulé depuis le début du trimestre filtré
Target Revenue      : Objectifs annuels cumulés des vendeurs
Target Attainment % : CA réel / Objectif (100% = objectif atteint)
Nb Loss Lines       : Lignes vendues en dessous du prix de revient (marge < 0)

SOURCE : Warehouse WH_EnergiDistrib — schéma étoile Gold
PÉRIODE : 2024-01-01 au 2025-12-31
```

---

**Vérification finale en mode Lecture**

1. Barre d'outils → **Reading view** (bouton en haut)
2. Tester sur chaque page :
   - Les slicers filtrent-ils correctement les visuels ?
   - Le drill-through fonctionne-t-il (clic droit sur un client) ?
   - Les boutons de navigation changent-ils bien de page ?
   - La page **Détail Client** n'apparaît-elle pas dans le Page navigator ?
   - Les bookmarks basculent-ils correctement ?
3. Si tout est correct → repasser en mode Édition pour corriger les éventuels problèmes

---

**Sauvegarder le rapport**

1. Barre d'outils → **Save** (icône disquette ou bouton Save)

2. Saisir le nom : `Rapport_EnergiDistrib`

3. Choisir le workspace : votre workspace Fabric

4. **Save**
   
   > ✅ Le rapport est désormais visible dans votre workspace Fabric, directement connecté au modèle sémantique `SM_EnergiDistrib`. Si le pipeline est relancé et rechargé le Warehouse, le rapport se met à jour automatiquement — sans aucune action manuelle.

---

**🎉 L'atelier est terminé !**

Le participant a construit une chaîne complète :

```
CSV (données brutes)
    ↓ Notebook NB_Bronze_to_Silver
Tables Bronze + Silver (LH_EnergiDistrib)
    ↓ Dataflow Gen2 + Pipeline PL_EnergiDistrib_ETL
Warehouse WH_EnergiDistrib (schéma étoile Gold + SCD Type 2)
    ↓ Modèle sémantique SM_EnergiDistrib (14 mesures DAX)
    ↓
Rapport Power BI Fabric (5 pages interactives)
    → Drill-through Détail Client
    → Bookmarks Vue mensuelle / Comparaison
    → Visual interactions personnalisées
    → Page navigator entre les pages
    → Page Méthodologie / Glossaire
```
