# Atelier Warehouse — Gestion des Ventes d'un Distributeur d'Équipements Énergétiques

## Contexte:

EnergiDistrib Europe distribue des équipements énergétiques (panneaux solaires, onduleurs, batteries, câbles) à 2 500 clients professionnels dans 6 pays de l'UE. Le directeur commercial veut un tableau de bord hebdomadaire qui lui prend aujourd'hui 2 jours à construire manuellement.

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

# PARTIE 1 — MATIN (9h00 – 12h00)

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

tables_csv = {
    "bronze_orders": "Files/orders.csv",
    "bronze_order_lines": "Files/order_lines.csv",
    "bronze_customers": "Files/customers.csv",
    "bronze_products": "Files/products.csv",
    "bronze_warehouses": "Files/warehouses.csv",
    "bronze_sales_reps": "Files/sales_reps.csv",
    "bronze_stock_levels": "Files/stock_levels.csv",
}

for table_name, path in tables_csv.items():
    df = (spark.read
        .option("header", True)
        .option("inferSchema", True)
        .csv(path))
    df.write.mode("overwrite").format("delta").saveAsTable(table_name)
    print(f"{table_name}: {df.count():,} lignes, {len(df.columns)} colonnes")

print("\nToutes les tables Bronze sont chargees.")
```

### 2.3 — Cellule 2 : Diagnostic qualité des données

**Problème terrain** : Les données viennent de 6 filiales avec des conventions différentes. Il faut identifier les problèmes avant de nettoyer.

```python
# === CELLULE 2 : Diagnostic qualite ===

from pyspark.sql import functions as F

# Redeclaration des noms de tables (independance vis-a-vis de la Cellule 1)
tables_bronze = [
    "bronze_orders", "bronze_order_lines", "bronze_customers",
    "bronze_products", "bronze_warehouses", "bronze_sales_reps", "bronze_stock_levels"
]

# Verifier les nulls sur chaque table
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

# Verifier les doublons sur les cles primaires
print("\n--- Doublons ---")
for table_name, pk in [("bronze_orders", "order_id"), ("bronze_customers", "customer_id"),
                        ("bronze_products", "product_id"), ("bronze_sales_reps", "rep_id")]:
    df = spark.table(table_name)
    total = df.count()
    distinct = df.select(pk).distinct().count()
    dupes = total - distinct
    print(f"{table_name}.{pk}: {dupes} doublons" + (" ⚠️" if dupes > 0 else " ✅"))
```

**Interprétation** : Ce diagnostic révèle les problèmes typiques d'un ERP multi-filiales : des champs nulls sur `address` (114), `city` (82) et `contact_email` (80) dans la table clients. Les clés primaires sont propres — aucun doublon détecté. Le nettoyage qui suit corrige les valeurs manquantes et standardise les codes pays.

### 2.4 — Cellule 3 : Nettoyage et standardisation

```python
# === CELLULE 3 : Nettoyage donnees ===

# --- Clients : standardiser les pays et nettoyer les noms ---
df_customers = spark.table("bronze_customers")
df_customers_clean = (df_customers
    # Standardiser les codes pays
    .withColumn("country_code",
        F.when(F.upper(F.col("country")).isin(["FRANCE", "FR"]), "FR")
        .when(F.upper(F.col("country")).isin(["GERMANY", "ALLEMAGNE", "DE"]), "DE")
        .when(F.upper(F.col("country")).isin(["SPAIN", "ESPAGNE", "ES"]), "ES")
        .when(F.upper(F.col("country")).isin(["ITALY", "ITALIE", "IT"]), "IT")
        .when(F.upper(F.col("country")).isin(["BELGIUM", "BELGIQUE", "BE"]), "BE")
        .when(F.upper(F.col("country")).isin(["NETHERLANDS", "PAYS-BAS", "NL"]), "NL")
        .otherwise(F.upper(F.col("country"))))
    # Nettoyer les noms (trim + title case)
    .withColumn("company_name", F.initcap(F.trim(F.col("company_name"))))
    # Remplir les adresses nulles
    .withColumn("address", F.coalesce(F.col("address"), F.lit("Adresse non renseignee")))
    .withColumn("city", F.coalesce(F.col("city"), F.lit("Ville non renseignee")))
)
df_customers_clean.write.mode("overwrite").format("delta").saveAsTable("silver_customers")
print(f"silver_customers: {df_customers_clean.count():,} lignes")

# --- Produits : categoriser et valider les prix ---
df_products = spark.table("bronze_products")
df_products_clean = (df_products
    .withColumn("unit_cost_eur",
        F.when(F.col("unit_cost_eur") <= 0, None).otherwise(F.col("unit_cost_eur")))
    .withColumn("list_price_eur",
        F.when(F.col("list_price_eur") <= 0, None).otherwise(F.col("list_price_eur")))
    .withColumn("margin_pct",
        F.when(F.col("list_price_eur") > 0,
               F.round((F.col("list_price_eur") - F.col("unit_cost_eur"))
                       / F.col("list_price_eur") * 100, 1))
        .otherwise(None))
    .withColumn("price_segment",
        F.when(F.col("list_price_eur") > 5000, "Premium")
        .when(F.col("list_price_eur") > 1000, "Mid-range")
        .when(F.col("list_price_eur") > 100, "Standard")
        .otherwise("Accessoire"))
)
df_products_clean.write.mode("overwrite").format("delta").saveAsTable("silver_products")
print(f"silver_products: {df_products_clean.count():,} lignes")
```

### 2.5 — Cellule 4 : Nettoyage des commandes et lignes

```python
# === CELLULE 4 : Nettoyage commandes et lignes ===

# --- Commandes : convertir les dates et enrichir ---
df_orders = spark.table("bronze_orders")
df_orders_clean = (df_orders
    .withColumn("order_date", F.to_date("order_date"))
    .withColumn("ship_date", F.to_date("ship_date"))
    .withColumn("delivery_lead_days",
        F.datediff(F.col("ship_date"), F.col("order_date")))
    .withColumn("order_year", F.year("order_date"))
    .withColumn("order_month", F.month("order_date"))
    .withColumn("order_quarter", F.quarter("order_date"))
    .withColumn("is_late",
        F.when(F.col("delivery_lead_days") > 7, True).otherwise(False))
)
df_orders_clean.write.mode("overwrite").format("delta").saveAsTable("silver_orders")
print(f"silver_orders: {df_orders_clean.count():,} lignes")

# --- Lignes de commande : calculer les montants ---
df_lines = spark.table("bronze_order_lines")
df_lines_clean = (df_lines
    .withColumn("line_total_eur",
        F.round(F.col("quantity") * F.col("unit_price_eur"), 2))
    .withColumn("line_cost_eur",
        F.round(F.col("quantity") * F.col("unit_cost_eur"), 2))
    .withColumn("line_margin_eur",
        F.round(F.col("line_total_eur") - F.col("line_cost_eur"), 2))
    .withColumn("line_margin_pct",
        F.when(F.col("line_total_eur") > 0,
               F.round(F.col("line_margin_eur") / F.col("line_total_eur") * 100, 1))
        .otherwise(None))
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

df_anomalies = spark.sql("""
    SELECT
        ol.order_id,
        ol.product_id,
        p.product_name,
        p.category,
        ol.unit_price_eur AS prix_vente,
        ol.unit_cost_eur AS cout_revient,
        ol.line_margin_pct,
        o.rep_id,
        sr.rep_name,
        o.customer_id,
        o.order_date
    FROM silver_order_lines ol
    JOIN silver_orders o ON ol.order_id = o.order_id
    JOIN silver_products p ON ol.product_id = p.product_id
    JOIN bronze_sales_reps sr ON o.rep_id = sr.rep_id
    WHERE ol.line_margin_pct < 0
    ORDER BY ol.line_margin_eur ASC
""")

print(f"Lignes vendues a perte: {df_anomalies.count()}")
df_anomalies.groupBy("rep_name").count().orderBy(F.desc("count")).show(10, truncate=False)
df_anomalies.groupBy("category").count().orderBy(F.desc("count")).show(10, truncate=False)
```

**Interprétation** : Les ventes à perte se concentrent sur 2-3 vendeurs et sur la catégorie « Onduleurs » — confirmation de la guerre des prix sur ce segment. Ces informations remonteront dans le rapport Power BI final.

### 2.7 — Cellule 6 : Segmentation clients (RFM simplifié)

```python
# === CELLULE 6 : Segmentation clients RFM ===

from pyspark.sql.window import Window
from pyspark.sql import functions as F

df_rfm = spark.sql("""
    SELECT
        o.customer_id,
        DATEDIFF('2025-12-31', MAX(o.order_date)) AS recency_days,
        COUNT(DISTINCT o.order_id) AS frequency,
        ROUND(SUM(ol.line_total_eur), 2) AS monetary_eur
    FROM silver_orders o
    JOIN silver_order_lines ol ON o.order_id = ol.order_id
    GROUP BY o.customer_id
""")

# Scoring par quartiles
for metric in ["recency_days", "frequency", "monetary_eur"]:
    ascending = metric == "recency_days"  # Recency: plus petit = mieux
    w = Window.orderBy(F.col(metric).asc() if ascending else F.col(metric).desc())
    df_rfm = df_rfm.withColumn(f"{metric}_rank",
        F.ntile(4).over(w))

# Score global et segment
df_rfm = (df_rfm
    .withColumn("rfm_score",
        F.col("recency_days_rank") + F.col("frequency_rank") + F.col("monetary_eur_rank"))
    .withColumn("customer_segment",
        F.when(F.col("rfm_score") <= 4, "VIP")
        .when(F.col("rfm_score") <= 7, "Fidele")
        .when(F.col("rfm_score") <= 9, "Occasionnel")
        .otherwise("Dormant"))
)

df_rfm.write.mode("overwrite").format("delta").saveAsTable("silver_customer_rfm")

df_rfm.groupBy("customer_segment").agg(
    F.count("*").alias("nb_clients"),
    F.round(F.avg("monetary_eur"), 0).alias("ca_moyen_eur"),
    F.round(F.avg("frequency"), 1).alias("freq_moyenne"),
    F.round(F.avg("rfm_score"), 2).alias("rfm_score_moyen")
).orderBy("rfm_score_moyen").show(truncate=False)
```

**Interprétation** : La segmentation RFM donne 4 groupes actionnables. Les VIP (top 25%) génèrent ~60% du CA — ce sont les clients à protéger. Les Dormants n'ont pas commandé depuis longtemps → campagne de réactivation. Ce segment sera intégré à la dimension client dans le Warehouse.

### 2.8 — Cellule 7 : Agrégation des stocks

```python
# === CELLULE 7 : Analyse stock ===

df_stock = spark.table("bronze_stock_levels")

df_stock_analysis = (df_stock
    .withColumn("stock_date", F.to_date("stock_date"))
    .withColumn("stock_value_eur",
        F.round(F.col("quantity_on_hand") * F.col("unit_cost_eur"), 2))
    .withColumn("stock_status",
        F.when(F.col("quantity_on_hand") <= F.col("reorder_point"), "RUPTURE_IMMINENTE")
        .when(F.col("quantity_on_hand") <= F.col("reorder_point") * 1.5, "BAS")
        .when(F.col("quantity_on_hand") >= F.col("max_stock") * 0.9, "SURSTOCK")
        .otherwise("NORMAL"))
    .withColumn("days_of_stock",
        F.when(F.col("avg_daily_demand") > 0,
               F.round(F.col("quantity_on_hand") / F.col("avg_daily_demand"), 0))
        .otherwise(None))
)

df_stock_analysis.write.mode("overwrite").format("delta").saveAsTable("silver_stock_levels")

# Resume des alertes stock
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

df_reps_enriched = spark.sql("""
    SELECT
        sr.*,
        COUNT(DISTINCT o.order_id) AS total_orders,
        COUNT(DISTINCT o.customer_id) AS total_clients,
        ROUND(SUM(ol.line_total_eur), 0) AS total_revenue_eur,
        ROUND(SUM(ol.line_margin_eur), 0) AS total_margin_eur,
        ROUND(SUM(ol.line_margin_eur) / NULLIF(SUM(ol.line_total_eur), 0) * 100, 1) AS margin_pct,
        ROUND(AVG(ol.discount_pct), 1) AS avg_discount_pct,
        SUM(CASE WHEN ol.line_margin_pct < 0 THEN 1 ELSE 0 END) AS nb_loss_lines
    FROM bronze_sales_reps sr
    LEFT JOIN silver_orders o ON sr.rep_id = o.rep_id
    LEFT JOIN silver_order_lines ol ON o.order_id = ol.order_id
    GROUP BY sr.rep_id, sr.rep_name, sr.region, sr.hire_date, sr.annual_target_eur
""")

df_reps_enriched.write.mode("overwrite").format("delta").saveAsTable("silver_sales_reps")
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
2. Chercher **Lakehouse** → sélectionner
3. Connexion → signer avec votre compte organisationnel
4. Naviguer → votre workspace → **LH_EnergiDistrib** → **silver_orders**
5. Cliquer **Create**

> ⚠️ **Piège** : Si vous ne voyez pas votre Lakehouse, vérifiez que vous êtes connecté avec le bon compte. L'option « Lakehouse » est dans la catégorie **OneLake** ou **Microsoft Fabric**.

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

> 💡 **Astuce** : La convention PascalCase est standard dans les data warehouses. Les clés se terminent par "Key" pour indiquer qu'elles sont des clés de jointure vers les dimensions.

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

### 3.12 — Publier le Dataflow

1. En bas à droite → **Publish**
2. Attendre que le rafraîchissement se termine (barre de progression dans le workspace)

> ⚠️ **Piège** : Le premier Publish peut prendre 2-3 minutes. Ne pas fermer l'onglet pendant ce temps.

---

*Pause 10h45 – 11h00*

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

1. Cliquer sur la **croix rouge** (✗ On failure) du Notebook → glisser vers une **nouvelle activité Set Variable**
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

**Fin du matin. Le Lakehouse contient les tables Bronze et Silver. Le Dataflow Gen2 enrichit les commandes. Le Pipeline orchestre le flux.**

**Après le déjeuner** → On crée le Warehouse avec le schéma étoile, on implémente le SCD Type 2, puis on construit le modèle sémantique et le rapport Power BI.

---

# PARTIE 2 — APRÈS-MIDI

---

## Bloc 5 (13h00 – 14h00) — Warehouse : Schéma étoile + Vues analytiques

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

> 💡 **Note Fabric Warehouse** : Dans certains tenants/éditions, les contraintes `PRIMARY KEY`/`DEFAULT` ne sont pas supportées dans `CREATE TABLE` (vous verrez une erreur du type *keyword is not supported*). Dans cet atelier, on **n’utilise pas de contraintes** et on s’appuie sur les clés (SK/ID) et les contrôles de qualité côté Notebook/SQL pour garantir la cohérence. Fabric optimise le stockage via Delta/Parquet et le V-Order.
> 
> ⚠️ **Note sur IDENTITY** : Sur Warehouse Fabric, les colonnes `IDENTITY` doivent être en **BIGINT** et ne supportent pas toujours la syntaxe `IDENTITY(seed, increment)`. Utilisez donc `BIGINT IDENTITY` (seed/increment implicites).
> 
> ⚠️ **Note sur les types texte** : Selon l’édition, les types Unicode (`NVARCHAR`) peuvent être refusés. Cet atelier utilise donc `VARCHAR` pour les champs texte (noms, villes, etc.).

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

df_update = (spark.read
    .option("header", True)
    .option("inferSchema", True)
    .csv("Files/customers_update_batch2.csv")
)
df_update.write.mode("overwrite").format("delta").saveAsTable("staging_customer_updates")
print(f"Batch mise a jour: {df_update.count()} clients modifies")
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
Target Attainment % = DIVIDE([Total Revenue], [Target Revenue], 0)
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

## Bloc 8 — Rapport Power BI Desktop (thin report)

### 8.1 — Créer le rapport

1. Ouvrir **Power BI Desktop**
2. **Home** → **Get data** → **Power BI semantic models** (ou **Power BI datasets**)
3. Sélectionner le modèle **`SM_EnergiDistrib`** (celui créé au Bloc 7) → **Connect**
4. Vous êtes en “thin report” : les données restent dans Fabric, le `.pbix` ne contient que le rapport
5. **File** → **Save**
6. **Home** → **Publish** → workspace `WS_EnergiDistrib_Atelier` (publier le rapport)

### 8.2 — Page 1 : Vue d'ensemble commerciale

**Renommer la page** : clic droit sur l'onglet → **Rename** → `Vue d'ensemble`

**Visuel 1 — Cards KPI (ligne du haut)** :

1. Insérer un **Card** → glisser **Total Revenue** dans le champ **Value**
2. Onglet **Format** → **Callout value** → Display units = **Millions**, Decimal places = **1**
3. **Label** → activer → texte = `CA Total`
4. Dupliquer la card (Ctrl+D) × 3 et remplacer par :
   - **Total Margin** → label `Marge totale`
   - **Margin %** → label `Taux de marge`, format `0.0%`
   - **Nb Orders** → label `Commandes`
5. Aligner les 4 cards en haut de la page

**Visuel 2 — Graphique en courbes (CA mensuel)** :

1. Insérer un **Line chart**
2. **X-axis** : `Dim_Date.FullDate` (utiliser la **Date hierarchy** et garder le niveau **Month**)
3. **Y-axis** : `Total Revenue`
4. **Legend** : `Dim_Date.Year`
5. Taille : occuper la moitié gauche sous les cards

**Visuel 3 — Graphique en barres (CA par pays)** :

1. Insérer un **Clustered bar chart**
2. **Y-axis** : `Dim_Customer.Country`
3. **X-axis** : `Total Revenue`
4. Onglet **Format** → **Data labels** → activer → Display units = **Thousands**
5. **Sort** → trier par **Total Revenue** descending
6. Taille : quart supérieur droit

**Visuel 4 — Donut (répartition par catégorie produit)** :

1. Insérer un **Donut chart**
2. **Legend** : `Dim_Product.Category`
3. **Values** : `Total Revenue`
4. Onglet **Format** → **Detail labels** → activer → Label style = **Category, percent of total**
5. Taille : quart inférieur droit

**Slicer** :

1. Insérer un **Slicer** en haut à droite
2. **Field** : `Dim_Date.QuarterLabel`
3. Onglet **Format** → **Slicer settings** → Style = **Dropdown**

### 8.3 — Page 2 : Analyse des marges

**Nouvelle page** → Renommer : `Analyse marges`

**Visuel 1 — Matrice** :

1. Insérer une **Matrix**
2. **Rows** : `Dim_Product.Category`, puis `Dim_Product.ProductName`
3. **Columns** : `Dim_Customer.Country`
4. **Values** : `Total Revenue`, `Margin %`
5. Onglet **Format** → **Conditional formatting** → sélectionner **Margin %** → **Background color** :
   - Minimum = Rouge (#FF6B6B) pour valeur `0`
   - Maximum = Vert (#51CF66) pour valeur `0.30`

> 💡 La mesure `Margin %` retourne une fraction décimale (0.30 = 30%). Les seuils de mise en forme conditionnelle doivent utiliser les mêmes unités.
> 6. **Subtotals** → activer pour les lignes

**Visuel 2 — Scatter plot (marge vs volume)** :

1. Insérer un **Scatter chart**
2. **X-axis** : `Total Revenue`
3. **Y-axis** : `Margin %`
4. **Size** : `Nb Orders`
5. **Details** : `Dim_Product.Category`
6. Onglet **Analytics** → ajouter une **Constant line** → Value = `0.15` → label = `Seuil marge mini (15%)`

**Visuel 3 — Table des ventes à perte** :

1. Insérer une **Table**
2. **Columns** : `Dim_SalesRep.RepName`, `Dim_Product.Category`, `Nb Loss Lines`, `Total Revenue`, `Margin %`
3. **Sort** : `Nb Loss Lines` descending
4. Onglet **Format** → **Conditional formatting** sur **Nb Loss Lines** → **Data bars** → couleur rouge

### 8.4 — Page 3 : Performance vendeurs

**Nouvelle page** → Renommer : `Performance vendeurs`

**Visuel 1 — Gauge (atteinte objectif global)** :

1. Insérer un **Gauge**
2. **Value** : `Target Attainment %`
3. **Target value** : valeur fixe `1` (= 100% en fraction décimale)
4. Onglet **Format** → **Gauge axis** → Min = 0, Max = 1.5 (150%)
5. **Conditional formatting** → color : < 0.7 rouge, 0.7-1.0 jaune, ≥ 1.0 vert

**Visuel 2 — Bar chart (CA par vendeur vs objectif)** :

1. Insérer un **Clustered bar chart**
2. **Y-axis** : `Dim_SalesRep.RepName`
3. **X-axis** : `Total Revenue` ET `Target Revenue`
4. **Sort** : `Total Revenue` descending
5. Onglet **Format** → Couleurs : Revenue en bleu, Target en gris pointillé

**Visuel 3 — Table de détail vendeur** :

1. Insérer une **Table**
2. **Columns** : `RepName`, `Region`, `Seniority`, `Total Revenue`, `Target Attainment %`, `Margin %`, `Nb Orders`, `Avg Order Value`
3. **Conditional formatting** sur `Target Attainment %` :
   - **Icons** → style Traffic light → < 0.7 rouge, 0.7-0.9 jaune, ≥ 0.9 vert

**Slicer** :

1. **Slicer** → **Field** : `Dim_SalesRep.Region` → Style **Buttons**

### 8.6 — Finition du rapport

1. **Onglet View** → **Page background** → couleur légèrement grisée (#F8F9FA) pour toutes les pages
2. Ajouter un **Text box** en haut de chaque page avec le titre de la page
3. **File** → **Save** → nommer : `Rapport EnergiDistrib`

**L'atelier est terminé.** Le participant a construit une chaîne complète : Lakehouse (Bronze) → Notebook + Dataflow Gen2 (Silver) → Pipeline → Warehouse (Gold, schéma étoile, SCD Type 2) → Modèle sémantique (mesures DAX) → Rapport Power BI (3 pages interactives).

```python

```
