-- ============================================================
-- SCRIPT PIPELINE — Activité 4.4 : Chargement Warehouse
-- WH_EnergiDistrib ← Silver (LH_EnergiDistrib)
--
-- Ce script est destiné à être collé dans l'activité "Script"
-- du pipeline PL_EnergiDistrib_ETL (après création du Warehouse
-- au Bloc 5). Il suppose que :
--   1. Le Warehouse WH_EnergiDistrib existe avec le schéma étoile
--   2. La Dim_Date est déjà peuplée (script DDL manuel exécuté)
--   3. Le Lakehouse LH_EnergiDistrib est ajouté comme source
--      dans le Warehouse Explorer (cross-database query)
--   4. Les tables Silver existent dans LH_EnergiDistrib
--
-- Pour un test manuel complet (DDL + tout le chargement),
-- utiliser le fichier : WH-Manual-Full-Setup.sql
-- ============================================================


-- ============================================================
-- ETAPE 1 : Vider les tables pour rechargement idempotent
-- (utile si le pipeline est relancé plusieurs fois)
-- ============================================================

TRUNCATE TABLE dbo.Fact_OrderLines;
TRUNCATE TABLE dbo.Dim_Customer;
TRUNCATE TABLE dbo.Dim_Product;
TRUNCATE TABLE dbo.Dim_SalesRep;
TRUNCATE TABLE dbo.Dim_Warehouse;

PRINT '>>> Tables vidées. Début du chargement...';


-- ============================================================
-- ETAPE 2 : Charger Dim_Product
-- Source : silver_products (Lakehouse LH_EnergiDistrib)
-- ============================================================

INSERT INTO dbo.Dim_Product (
    ProductID, ProductName, Category, SubCategory, Brand,
    UnitCostEUR, ListPriceEUR, MarginPct, PriceSegment
)
SELECT
    product_id,
    product_name,
    category,
    sub_category,
    brand,
    unit_cost_eur,
    list_price_eur,
    margin_pct,
    price_segment
FROM [LH_EnergiDistrib].[dbo].[silver_products];

PRINT '>>> Dim_Product chargée : ' + CAST(@@ROWCOUNT AS VARCHAR) + ' lignes.';


-- ============================================================
-- ETAPE 3 : Charger Dim_SalesRep
-- Source : silver_sales_reps (Lakehouse LH_EnergiDistrib)
-- ============================================================

INSERT INTO dbo.Dim_SalesRep (
    RepID, RepName, Region, HireDate, AnnualTargetEUR
)
SELECT
    rep_id,
    rep_name,
    region,
    hire_date,
    annual_target_eur
FROM [LH_EnergiDistrib].[dbo].[silver_sales_reps];

PRINT '>>> Dim_SalesRep chargée : ' + CAST(@@ROWCOUNT AS VARCHAR) + ' lignes.';


-- ============================================================
-- ETAPE 4 : Charger Dim_Warehouse
-- Source : bronze_warehouses (Lakehouse LH_EnergiDistrib)
-- Note : les entrepôts sont stables, on prend la bronze directement
-- ============================================================

INSERT INTO dbo.Dim_Warehouse (
    WarehouseID, WarehouseName, Country, City
)
SELECT
    warehouse_id,
    warehouse_name,
    country,
    city
FROM [LH_EnergiDistrib].[dbo].[bronze_warehouses];

PRINT '>>> Dim_Warehouse chargée : ' + CAST(@@ROWCOUNT AS VARCHAR) + ' lignes.';


-- ============================================================
-- ETAPE 5 : Charger Dim_Customer (chargement initial SCD Type 2)
-- Source : silver_customers + silver_customer_rfm (Lakehouse)
-- Logique : on joint la segmentation RFM calculée par le Notebook.
-- ValidFrom = début historique (2024-01-01)
-- ValidTo = 9999-12-31 (ligne courante)
-- IsCurrent = 1
-- ============================================================

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
    '2024-01-01',
    '9999-12-31',
    1
FROM [LH_EnergiDistrib].[dbo].[silver_customers] c
LEFT JOIN [LH_EnergiDistrib].[dbo].[silver_customer_rfm] r
    ON c.customer_id = r.customer_id;

PRINT '>>> Dim_Customer chargée : ' + CAST(@@ROWCOUNT AS VARCHAR) + ' lignes.';


-- ============================================================
-- ETAPE 6 : Charger Fact_OrderLines
-- Source : silver_order_lines + silver_orders (Lakehouse)
--          + dimensions du Warehouse pour les surrogate keys
-- Logique de jointure :
--   - silver_order_lines (ol) contient le détail produit/quantité
--   - silver_orders (o) contient la tête de commande (date, statut, etc.)
--   - Dim_Customer via customer_id + IsCurrent=1 (toujours la version courante)
--   - Dim_Product, Dim_SalesRep, Dim_Warehouse via leurs business keys
-- DateKey : converti en format YYYYMMDD (entier) pour jointure avec Dim_Date
-- Filtre : on exclut les commandes annulées
-- ============================================================

INSERT INTO dbo.Fact_OrderLines (
    OrderKey, DateKey, CustomerSK, ProductSK, SalesRepSK, WarehouseSK,
    Quantity, UnitPriceEUR, UnitCostEUR, DiscountPct,
    LineTotalEUR, LineCostEUR, LineMarginEUR, LineMarginPct,
    DeliveryPriority, OrderStatus
)
SELECT
    ol.order_id,
    CAST(CONVERT(VARCHAR(8), o.order_date, 112) AS INT),   -- ex: 20250415
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
    -- Recalcul DeliveryPriority basé sur le délai de livraison
    CASE
        WHEN o.delivery_lead_days < 3  THEN 'Express'
        WHEN o.delivery_lead_days < 7  THEN 'Standard'
        WHEN o.delivery_lead_days < 14 THEN 'Lent'
        ELSE 'Critique'
    END,
    o.status
FROM [LH_EnergiDistrib].[dbo].[silver_order_lines] ol
JOIN [LH_EnergiDistrib].[dbo].[silver_orders] o
    ON ol.order_id = o.order_id
JOIN dbo.Dim_Customer dc
    ON o.customer_id = dc.CustomerID AND dc.IsCurrent = 1
JOIN dbo.Dim_Product dp
    ON ol.product_id = dp.ProductID
JOIN dbo.Dim_SalesRep sr
    ON o.rep_id = sr.RepID
JOIN dbo.Dim_Warehouse dw
    ON o.warehouse_id = dw.WarehouseID
WHERE o.status != 'cancelled';

PRINT '>>> Fact_OrderLines chargée : ' + CAST(@@ROWCOUNT AS VARCHAR) + ' lignes.';


-- ============================================================
-- VERIFICATION FINALE
-- ============================================================

SELECT 'Dim_Product'    AS table_name, COUNT(*) AS nb_lignes FROM dbo.Dim_Product    UNION ALL
SELECT 'Dim_SalesRep'   AS table_name, COUNT(*) AS nb_lignes FROM dbo.Dim_SalesRep   UNION ALL
SELECT 'Dim_Warehouse'  AS table_name, COUNT(*) AS nb_lignes FROM dbo.Dim_Warehouse  UNION ALL
SELECT 'Dim_Customer'   AS table_name, COUNT(*) AS nb_lignes FROM dbo.Dim_Customer   UNION ALL
SELECT 'Fact_OrderLines'AS table_name, COUNT(*) AS nb_lignes FROM dbo.Fact_OrderLines;

PRINT '>>> Chargement Warehouse terminé avec succès.';
