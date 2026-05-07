Voici les meilleures méthodes selon ton besoin :

### 1. **Supprimer les doublons sur TOUTES les colonnes** (le plus simple)

```python
from pyspark.sql import SparkSession
spark = SparkSession.builder.getOrCreate()

# Lecture de la table
df = spark.read.format("delta").table("silver.ma_table")

# Suppression des doublons complets
df_sans_doublons = df.dropDuplicates()

print(f"Avant : {df.count()} lignes")
print(f"Après : {df_sans_doublons.count()} lignes")
```

### 2. **Supprimer les doublons sur des colonnes spécifiques** (recommandé)

```python
# Exemple : supprimer les doublons sur ID + Date
df_unique = df.dropDuplicates(["ClientID", "SaleDate", "ProductID"])

# Exemple plus courant :
df_unique = df.dropDuplicates(["id", "date", "montant"])
```

### 3. **Exemple complet avec bonne pratique (Fabric Lakehouse)**

```python
from pyspark.sql.functions import col, current_timestamp

# Lecture
df = spark.table("silver.fact_sales")   # ou spark.read.format("delta").load(...)

# Suppression des doublons
df_dedup = df.dropDuplicates(["SaleID", "SaleDate", "CustomerID", "ProductID"])

# Ajout d'une colonne de traçabilité (très utile)
df_dedup = df_dedup.withColumn("load_timestamp", current_timestamp())

# Sauvegarde de la version propre
df_dedup.write.format("delta") \
        .mode("overwrite") \
        .option("overwriteSchema", "true") \
        .saveAsTable("silver.fact_sales_clean")

print("Dédoublonnage terminé !")
```

### 4. **Méthode avec Window (plus avancée)** – Garder la dernière ligne par clé

```python
from pyspark.sql.window import Window
from pyspark.sql.functions import row_number

window_spec = Window.partitionBy("ClientID", "SaleDate").orderBy(col("load_date").desc())

df_clean = df.withColumn("rn", row_number().over(window_spec)) \
             .filter(col("rn") == 1) \
             .drop("rn")
```

