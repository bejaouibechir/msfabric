-- ============================================================
-- SCRIPT MANUEL COMPLET — WH_EnergiDistrib
-- Test manuel de l'atelier Warehouse (Blocs 5 + 6)
--
-- Exécuter dans : WH_EnergiDistrib → New SQL Query
-- Prérequis :
--   1. Lakehouse LH_EnergiDistrib ajouté dans l'Explorer du
--      Warehouse (via "+ Warehouses" → sélectionner LH_EnergiDistrib)
--   2. Tables Silver créées par le Notebook NB_Bronze_to_Silver
--   3. staging_customer_updates créée par la Cellule 9 du Notebook
--
-- Exécuter les blocs dans l'ordre numéroté.
-- Chaque bloc est indépendant et peut être relancé séparément.
-- ============================================================


-- ============================================================
-- BLOC 1 : CREATION DU SCHEMA ETOILE (DDL)
-- Atelier section 5.2
-- ============================================================

-- Nettoyage préalable (si vous relancez le script)
-- Supprime les vues, la fact, puis les dimensions dans le bon ordre
IF OBJECT_ID('dbo.vw_ProductMarginAnalysis', 'V') IS NOT NULL DROP VIEW dbo.vw_ProductMarginAnalysis;
IF OBJECT_ID('dbo.vw_SalesRepPerformance',   'V') IS NOT NULL DROP VIEW dbo.vw_SalesRepPerformance;
IF OBJECT_ID('dbo.vw_MonthlySalesByCountry', 'V') IS NOT NULL DROP VIEW dbo.vw_MonthlySalesByCountry;
IF OBJECT_ID('dbo.Fact_OrderLines', 'U') IS NOT NULL DROP TABLE dbo.Fact_OrderLines;
IF OBJECT_ID('dbo.Dim_Customer',    'U') IS NOT NULL DROP TABLE dbo.Dim_Customer;
IF OBJECT_ID('dbo.Dim_Product',     'U') IS NOT NULL DROP TABLE dbo.Dim_Product;
IF OBJECT_ID('dbo.Dim_SalesRep',    'U') IS NOT NULL DROP TABLE dbo.Dim_SalesRep;
IF OBJECT_ID('dbo.Dim_Warehouse',   'U') IS NOT NULL DROP TABLE dbo.Dim_Warehouse;
IF OBJECT_ID('dbo.Dim_Date',        'U') IS NOT NULL DROP TABLE dbo.Dim_Date;

PRINT '>>> Objets existants supprimés.';

-- ---- DIMENSIONS ----

-- Dimension Client avec SCD Type 2
-- ValidFrom / ValidTo / IsCurrent permettent de conserver l'historique
-- des changements de segment (ex: Fidele → VIP)
CREATE TABLE dbo.Dim_Customer (
    CustomerSK          BIGINT IDENTITY NOT NULL,   -- Surrogate key (auto-increment Fabric)
    CustomerID          VARCHAR(50)   NOT NULL,      -- Business key (ex: CLI-00001)
    CompanyName         VARCHAR(500)  NOT NULL,
    Country             VARCHAR(10)   NOT NULL,      -- Code ISO 2 lettres (FR, DE, ES...)
    City                VARCHAR(200),
    CustomerSegment     VARCHAR(50),                 -- VIP, Fidele, Occasionnel, Dormant
    ContactEmail        VARCHAR(500),
    -- Colonnes SCD Type 2
    ValidFrom           DATE          NOT NULL,      -- Date de début de validité de cette version
    ValidTo             DATE          NOT NULL,      -- Date de fin (9999-12-31 = version courante)
    IsCurrent           BIT           NOT NULL,      -- 1 = version active, 0 = historique
);

-- Dimension Produit (statique — pas de SCD Type 2)
CREATE TABLE dbo.Dim_Product (
    ProductSK           BIGINT IDENTITY NOT NULL,
    ProductID           VARCHAR(20)   NOT NULL,      -- Ex: PRD-0001
    ProductName         VARCHAR(200)  NOT NULL,
    Category            VARCHAR(50)   NOT NULL,      -- Panneaux Solaires, Onduleurs, Batteries...
    SubCategory         VARCHAR(50),
    Brand               VARCHAR(50),
    UnitCostEUR         DECIMAL(10,2),               -- Prix de revient
    ListPriceEUR        DECIMAL(10,2),               -- Prix catalogue
    MarginPct           DECIMAL(5,1),                -- % marge calculé par le Notebook Silver
    PriceSegment        VARCHAR(20),                 -- Premium / Mid-range / Standard / Accessoire
);

-- Dimension Vendeur
CREATE TABLE dbo.Dim_SalesRep (
    SalesRepSK          BIGINT IDENTITY NOT NULL,
    RepID               VARCHAR(20)   NOT NULL,      -- Ex: REP-001
    RepName             VARCHAR(100)  NOT NULL,
    Region              VARCHAR(50),                 -- France Sud, Allemagne, Iberique...
    HireDate            DATE,
    AnnualTargetEUR     DECIMAL(12,2),               -- Objectif annuel en euros
);

-- Dimension Entrepôt
CREATE TABLE dbo.Dim_Warehouse (
    WarehouseSK         BIGINT IDENTITY NOT NULL,
    WarehouseID         VARCHAR(20)   NOT NULL,      -- Ex: WH-001
    WarehouseName       VARCHAR(100)  NOT NULL,
    Country             VARCHAR(5),
    City                VARCHAR(100),
);

-- Dimension Date : table de calendrier complète
-- DateKey en format YYYYMMDD permet la jointure entière (performant)
CREATE TABLE dbo.Dim_Date (
    DateKey             INT           NOT NULL,       -- Ex: 20250415
    FullDate            DATE          NOT NULL,
    Year                INT           NOT NULL,
    Quarter             INT           NOT NULL,       -- 1 à 4
    Month               INT           NOT NULL,       -- 1 à 12
    MonthName           VARCHAR(20)   NOT NULL,       -- 'January', 'February'...
    WeekOfYear          INT           NOT NULL,
    DayOfWeek           INT           NOT NULL,       -- 1=Dimanche, 7=Samedi (SQL Server)
    DayName             VARCHAR(20)   NOT NULL,
    IsWeekend           BIT           NOT NULL,       -- 1 si samedi ou dimanche
    QuarterLabel        VARCHAR(10)   NOT NULL,       -- Ex: 'Q1 2025'
);

-- Table de faits : une ligne par ligne de commande (grain le plus fin)
-- Toutes les mesures métier sont ici (montants, marges, quantités)
CREATE TABLE dbo.Fact_OrderLines (
    OrderLineSK         BIGINT IDENTITY NOT NULL,    -- Surrogate key de la fact
    OrderKey            VARCHAR(20)   NOT NULL,       -- Business key commande (ex: ORD-000001)
    DateKey             INT           NOT NULL,       -- FK vers Dim_Date (YYYYMMDD)
    CustomerSK          BIGINT        NOT NULL,       -- FK vers Dim_Customer
    ProductSK           BIGINT        NOT NULL,       -- FK vers Dim_Product
    SalesRepSK          BIGINT        NOT NULL,       -- FK vers Dim_SalesRep
    WarehouseSK         BIGINT        NOT NULL,       -- FK vers Dim_Warehouse
    -- Métriques (mesures)
    Quantity            INT           NOT NULL,
    UnitPriceEUR        DECIMAL(10,2) NOT NULL,       -- Prix de vente unitaire
    UnitCostEUR         DECIMAL(10,2) NOT NULL,       -- Coût unitaire
    DiscountPct         DECIMAL(5,2)  NOT NULL,       -- % remise accordée
    LineTotalEUR        DECIMAL(12,2) NOT NULL,       -- CA de la ligne (qty * prix * (1 - remise))
    LineCostEUR         DECIMAL(12,2) NOT NULL,       -- Coût total de la ligne
    LineMarginEUR       DECIMAL(12,2) NOT NULL,       -- Marge absolue
    LineMarginPct       DECIMAL(5,1),                 -- % marge (peut être négatif si vente à perte)
    DeliveryPriority    VARCHAR(20),                  -- Express / Standard / Lent / Critique
    OrderStatus         VARCHAR(20),                  -- completed / shipped / processing
);

PRINT '>>> Schéma étoile créé avec succès.';


-- ============================================================
-- BLOC 2 : DIMENSION DATE
-- Atelier section 5.3
-- Génère toutes les dates de 2024-01-01 à 2025-12-31 (730 jours)
-- ============================================================

DECLARE @start   DATE = '2024-01-01';
DECLARE @end     DATE = '2025-12-31';
DECLARE @current DATE = @start;

WHILE @current <= @end
BEGIN
    INSERT INTO dbo.Dim_Date (
        DateKey, FullDate, Year, Quarter, Month, MonthName,
        WeekOfYear, DayOfWeek, DayName, IsWeekend, QuarterLabel
    )
    VALUES (
        CAST(FORMAT(@current, 'yyyyMMdd') AS INT),   -- Ex: 20250415
        @current,
        YEAR(@current),
        DATEPART(QUARTER, @current),
        MONTH(@current),
        DATENAME(MONTH, @current),
        DATEPART(WEEK, @current),
        DATEPART(WEEKDAY, @current),
        DATENAME(WEEKDAY, @current),
        -- IsWeekend : 1 = Dimanche, 7 = Samedi (paramétrage SQL Server par défaut)
        CASE WHEN DATEPART(WEEKDAY, @current) IN (1, 7) THEN 1 ELSE 0 END,
        'Q' + CAST(DATEPART(QUARTER, @current) AS VARCHAR)
            + ' ' + CAST(YEAR(@current) AS VARCHAR)
    );
    SET @current = DATEADD(DAY, 1, @current);
END;

SELECT COUNT(*) AS nb_dates_generees FROM dbo.Dim_Date;   -- Attendu : 730
PRINT '>>> Dim_Date peuplée.';


-- ============================================================
-- BLOC 3 : CHARGEMENT DES DIMENSIONS DEPUIS LE LAKEHOUSE
-- Atelier section 5.4
-- Utilise les cross-database queries (three-part naming)
-- Format : [NomLakehouse].[dbo].[nom_table]
-- ============================================================

-- Dim_Product
INSERT INTO dbo.Dim_Product (
    ProductID, ProductName, Category, SubCategory, Brand,
    UnitCostEUR, ListPriceEUR, MarginPct, PriceSegment
)
SELECT
    product_id, product_name, category, sub_category, brand,
    unit_cost_eur, list_price_eur, margin_pct, price_segment
FROM [LH_EnergiDistrib].[dbo].[silver_products];

SELECT COUNT(*) AS nb_products FROM dbo.Dim_Product;   -- Attendu : ~800

-- Dim_SalesRep
INSERT INTO dbo.Dim_SalesRep (
    RepID, RepName, Region, HireDate, AnnualTargetEUR
)
SELECT
    rep_id, rep_name, region, hire_date, annual_target_eur
FROM [LH_EnergiDistrib].[dbo].[silver_sales_reps];

SELECT COUNT(*) AS nb_sales_reps FROM dbo.Dim_SalesRep;  -- Attendu : 60

-- Dim_Warehouse (depuis bronze — données stables, pas de Silver dédié)
INSERT INTO dbo.Dim_Warehouse (
    WarehouseID, WarehouseName, Country, City
)
SELECT
    warehouse_id, warehouse_name, country, city
FROM [LH_EnergiDistrib].[dbo].[bronze_warehouses];

SELECT COUNT(*) AS nb_warehouses FROM dbo.Dim_Warehouse;  -- Attendu : 12

-- Dim_Customer : chargement initial SCD Type 2
-- On joint silver_customers (nettoyé) avec silver_customer_rfm (segmentation RFM)
-- Tous les clients démarrent avec ValidFrom=2024-01-01, IsCurrent=1
INSERT INTO dbo.Dim_Customer (
    CustomerID, CompanyName, Country, City, CustomerSegment,
    ContactEmail, ValidFrom, ValidTo, IsCurrent
)
SELECT
    c.customer_id,
    c.company_name,
    c.country_code,
    c.city,
    COALESCE(r.customer_segment, 'Non classe'),   -- Fallback si client absent du RFM
    c.contact_email,
    '2024-01-01',   -- Début de l'historique
    '9999-12-31',   -- Toujours courant (convention SCD Type 2)
    1               -- IsCurrent = actif
FROM [LH_EnergiDistrib].[dbo].[silver_customers] c
LEFT JOIN [LH_EnergiDistrib].[dbo].[silver_customer_rfm] r
    ON c.customer_id = r.customer_id;

SELECT COUNT(*) AS nb_customers FROM dbo.Dim_Customer;  -- Attendu : ~2 500

PRINT '>>> Toutes les dimensions chargées.';


-- ============================================================
-- BLOC 4 : CHARGEMENT DE LA TABLE DE FAITS
-- Atelier section 5.5
-- ============================================================

-- La fact est le cœur du modèle étoile.
-- Chaque ligne = une ligne de commande (1 produit dans 1 commande).
-- On résout les FKs en joignant avec chaque dimension.
-- Note : IsCurrent=1 sur Dim_Customer pour prendre la version active.

INSERT INTO dbo.Fact_OrderLines (
    OrderKey, DateKey, CustomerSK, ProductSK, SalesRepSK, WarehouseSK,
    Quantity, UnitPriceEUR, UnitCostEUR, DiscountPct,
    LineTotalEUR, LineCostEUR, LineMarginEUR, LineMarginPct,
    DeliveryPriority, OrderStatus
)
SELECT
    ol.order_id,
    -- DateKey : CONVERT avec le style 112 donne 'YYYYMMDD' en VARCHAR, puis cast en INT
    CAST(CONVERT(VARCHAR(8), o.order_date, 112) AS INT),
    dc.CustomerSK,
    dp.ProductSK,
    sr.SalesRepSK,
    dw.WarehouseSK,
    ol.quantity,
    ol.unit_price_eur,
    ol.unit_cost_eur,
    COALESCE(ol.discount_pct, 0),   -- Remplacer NULL par 0
    ol.line_total_eur,
    ol.line_cost_eur,
    ol.line_margin_eur,
    ol.line_margin_pct,
    -- DeliveryPriority : recalculé ici (cohérent avec le Dataflow Gen2)
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
WHERE o.status != 'cancelled';   -- Exclure les commandes annulées

SELECT COUNT(*) AS nb_order_lines FROM dbo.Fact_OrderLines;  -- Attendu : ~260 000

PRINT '>>> Fact_OrderLines chargée.';


-- ============================================================
-- BLOC 5 : VUES ANALYTIQUES
-- Atelier section 5.6
-- Ces vues sont exposées directement dans Power BI ou utilisées
-- comme source de données pour des analyses SQL.
-- ============================================================

-- Vue 1 : CA et marge par pays et par mois
-- Usage Power BI : courbe de CA mensuel + slicer Pays/Trimestre
CREATE VIEW dbo.vw_MonthlySalesByCountry AS
SELECT
    dd.Year,
    dd.Month,
    dd.MonthName,
    dd.QuarterLabel,
    dc.Country,
    COUNT(DISTINCT f.OrderKey)                                          AS NbOrders,
    SUM(f.Quantity)                                                     AS TotalQuantity,
    SUM(f.LineTotalEUR)                                                 AS Revenue,
    SUM(f.LineMarginEUR)                                                AS Margin,
    -- NULLIF évite la division par zéro quand le CA est 0
    CAST(SUM(f.LineMarginEUR) * 100.0
         / NULLIF(SUM(f.LineTotalEUR), 0) AS DECIMAL(5,1))             AS MarginPct
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_Date     dd ON f.DateKey     = dd.DateKey
JOIN dbo.Dim_Customer dc ON f.CustomerSK  = dc.CustomerSK
GROUP BY dd.Year, dd.Month, dd.MonthName, dd.QuarterLabel, dc.Country;

-- Vue 2 : Performance des vendeurs vs objectif (filtré sur 2025)
-- Usage Power BI : tableau Top/Flop vendeurs + gauge atteinte objectif
CREATE VIEW dbo.vw_SalesRepPerformance AS
SELECT
    sr.RepName,
    sr.Region,
    sr.AnnualTargetEUR,
    SUM(f.LineTotalEUR)                                                 AS ActualRevenue,
    -- AttainmentPct : ratio CA réel / objectif, exprimé en %
    CAST(SUM(f.LineTotalEUR) * 100.0
         / NULLIF(sr.AnnualTargetEUR, 0) AS DECIMAL(5,1))              AS AttainmentPct,
    SUM(f.LineMarginEUR)                                                AS TotalMargin,
    COUNT(DISTINCT f.OrderKey)                                          AS NbOrders,
    -- NbLossLines : nombre de lignes vendues en dessous du coût de revient
    SUM(CASE WHEN f.LineMarginPct < 0 THEN 1 ELSE 0 END)               AS NbLossLines,
    AVG(f.DiscountPct)                                                  AS AvgDiscountPct
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_SalesRep sr ON f.SalesRepSK = sr.SalesRepSK
JOIN dbo.Dim_Date     dd ON f.DateKey    = dd.DateKey
WHERE dd.Year = 2025   -- Filtre sur l'année des données (objectif défini pour 2025)
GROUP BY sr.RepName, sr.Region, sr.AnnualTargetEUR;

-- Vue 3 : Analyse marge par produit et catégorie
-- Usage Power BI : Top N produits par marge + matrice Catégorie × Segment prix
CREATE VIEW dbo.vw_ProductMarginAnalysis AS
SELECT
    dp.Category,
    dp.ProductName,
    dp.PriceSegment,
    SUM(f.Quantity)                                                     AS TotalQtySold,
    SUM(f.LineTotalEUR)                                                 AS Revenue,
    SUM(f.LineMarginEUR)                                                AS Margin,
    CAST(SUM(f.LineMarginEUR) * 100.0
         / NULLIF(SUM(f.LineTotalEUR), 0) AS DECIMAL(5,1))             AS MarginPct,
    AVG(f.DiscountPct)                                                  AS AvgDiscount
FROM dbo.Fact_OrderLines f
JOIN dbo.Dim_Product dp ON f.ProductSK = dp.ProductSK
GROUP BY dp.Category, dp.ProductName, dp.PriceSegment;

PRINT '>>> Vues analytiques créées.';


-- ============================================================
-- BLOC 6 : SCD TYPE 2 — MERGE CLIENTS
-- Atelier section 6.3 à 6.5
-- Prérequis : staging_customer_updates chargée par la Cellule 9
--             du Notebook (customers_update_batch2.csv)
-- ============================================================

-- AVANT le MERGE : état des 150 clients concernés
-- (Pour vérification visuelle avant d'exécuter le MERGE)
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


-- ETAPE 6a : Fermer les lignes courantes dont le segment a changé
-- IsCurrent passe à 0, ValidTo = hier (date d'exécution - 1 jour)
UPDATE dc
SET
    dc.ValidTo    = DATEADD(DAY, -1, CAST(GETDATE() AS DATE)),
    dc.IsCurrent  = 0
FROM dbo.Dim_Customer dc
INNER JOIN [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
    ON dc.CustomerID = upd.customer_id
   AND dc.IsCurrent  = 1
WHERE dc.CustomerSegment != upd.new_segment;  -- Seulement si le segment a réellement changé

PRINT '>>> Lignes fermées (SCD Type 2) : ' + CAST(@@ROWCOUNT AS VARCHAR);


-- ETAPE 6b : Insérer les nouvelles versions pour les clients dont le segment a changé
-- ValidFrom = aujourd'hui, ValidTo = 9999-12-31, IsCurrent = 1
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
    CAST(GETDATE() AS DATE),   -- ValidFrom = date d'aujourd'hui
    '9999-12-31',              -- ValidTo = toujours courant
    1                          -- IsCurrent = 1
FROM [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
WHERE upd.new_segment != (
    -- On compare avec le segment de la version qu'on vient de fermer
    SELECT TOP 1 dc2.CustomerSegment
    FROM dbo.Dim_Customer dc2
    WHERE dc2.CustomerID = upd.customer_id
      AND dc2.IsCurrent  = 0   -- Version qu'on vient de fermer
    ORDER BY dc2.ValidTo DESC
);

PRINT '>>> Nouvelles versions insérées (SCD Type 2) : ' + CAST(@@ROWCOUNT AS VARCHAR);


-- ETAPE 6c : SCD Type 1 — Mise à jour simple (nom et email)
-- Ces attributs n'ont pas besoin d'historique (correction/mise à jour simple)
UPDATE dc
SET
    dc.CompanyName  = upd.company_name,
    dc.ContactEmail = upd.contact_email
FROM dbo.Dim_Customer dc
INNER JOIN [LH_EnergiDistrib].[dbo].[staging_customer_updates] upd
    ON dc.CustomerID = upd.customer_id
   AND dc.IsCurrent  = 1;   -- Appliquer uniquement sur la version courante

PRINT '>>> SCD Type 1 (nom/email) appliqué.';


-- APRES le MERGE : vérifier les clients avec historique
-- Les clients dont le segment a changé doivent avoir 2 lignes
SELECT
    dc.CustomerSK, dc.CustomerID, dc.CompanyName,
    dc.CustomerSegment, dc.Country,
    dc.ValidFrom, dc.ValidTo, dc.IsCurrent
FROM dbo.Dim_Customer dc
WHERE dc.CustomerID IN (
    SELECT CustomerID
    FROM dbo.Dim_Customer
    WHERE IsCurrent = 0   -- Clients ayant au moins une version fermée = segment changé
)
ORDER BY dc.CustomerID, dc.ValidFrom;

PRINT '>>> SCD Type 2 complet. Script terminé.';
