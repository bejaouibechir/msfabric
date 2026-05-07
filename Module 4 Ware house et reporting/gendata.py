"""
Generateur de donnees pour l'atelier Warehouse - EnergiDistrib Europe
Donnees a scenario pilote : les resultats racontent une histoire.
"""

import csv
import random
import os
from datetime import datetime, timedelta, date

random.seed(42)

OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "energidistrib_data")
# Sous Windows, vous pouvez remplacer par : OUTPUT_DIR = r"D:\msfabric\energidistrib_data"
os.makedirs(OUTPUT_DIR, exist_ok=True)

# ============================================================
# REFERENTIELS
# ============================================================

# --- Pays (FR et DE dominent ~60% du CA) ---
COUNTRIES = {
    "FR": {"name": "France", "weight": 0.30, "cities": ["Paris", "Lyon", "Marseille", "Toulouse", "Bordeaux", "Nantes", "Lille", "Strasbourg"]},
    "DE": {"name": "Germany", "weight": 0.28, "cities": ["Berlin", "Munich", "Hamburg", "Frankfurt", "Cologne", "Stuttgart", "Dusseldorf"]},
    "ES": {"name": "Spain", "weight": 0.15, "cities": ["Madrid", "Barcelona", "Valencia", "Sevilla", "Bilbao"]},
    "IT": {"name": "Italy", "weight": 0.13, "cities": ["Milan", "Rome", "Turin", "Bologna", "Naples"]},
    "BE": {"name": "Belgium", "weight": 0.07, "cities": ["Brussels", "Antwerp", "Ghent", "Liege"]},
    "NL": {"name": "Netherlands", "weight": 0.07, "cities": ["Amsterdam", "Rotterdam", "Utrecht", "Eindhoven"]},
}

# --- Categories produits (saisonnalite + marges differenciees) ---
CATEGORIES = {
    "Panneaux Solaires": {
        "sub_categories": ["Monocristallin", "Polycristallin", "Bifacial"],
        "brands": ["LONGi", "Jinko", "Canadian Solar", "Trina", "JA Solar"],
        "price_range": (150, 450),
        "margin_range": (18, 28),
        "seasonality": {1: 0.6, 2: 0.7, 3: 1.0, 4: 1.3, 5: 1.4, 6: 1.2, 7: 0.9, 8: 0.8, 9: 1.1, 10: 1.0, 11: 0.7, 12: 0.5},
    },
    "Onduleurs": {
        "sub_categories": ["String", "Micro", "Hybride", "Central"],
        "brands": ["Huawei", "SMA", "Fronius", "Enphase", "GoodWe"],
        "price_range": (300, 3500),
        "margin_range": (5, 15),  # Marges erosion — guerre des prix
        "seasonality": {1: 0.7, 2: 0.8, 3: 1.0, 4: 1.2, 5: 1.3, 6: 1.1, 7: 0.9, 8: 0.8, 9: 1.0, 10: 1.0, 11: 0.8, 12: 0.6},
    },
    "Batteries": {
        "sub_categories": ["Lithium-ion", "LFP", "Residentiel", "Industriel"],
        "brands": ["BYD", "Tesla", "LG Chem", "Pylontech", "Huawei"],
        "price_range": (2000, 12000),
        "margin_range": (22, 35),  # Marges hautes — marche captif
        "seasonality": {1: 0.8, 2: 0.8, 3: 0.9, 4: 1.0, 5: 1.1, 6: 1.1, 7: 1.0, 8: 1.0, 9: 1.1, 10: 1.2, 11: 1.0, 12: 0.9},
    },
    "Cables et Connectique": {
        "sub_categories": ["Cable DC", "Cable AC", "Connecteur MC4", "Boite de jonction"],
        "brands": ["Nexans", "Prysmian", "Staubli", "Phoenix Contact"],
        "price_range": (5, 200),
        "margin_range": (25, 40),
        "seasonality": {m: 1.0 for m in range(1, 13)},  # Pas de saisonnalite
    },
    "Structures et Fixations": {
        "sub_categories": ["Toiture", "Sol", "Tracker", "Facade"],
        "brands": ["K2 Systems", "Schletter", "Esdec", "Mounting Systems"],
        "price_range": (50, 800),
        "margin_range": (20, 30),
        "seasonality": {1: 0.6, 2: 0.7, 3: 1.1, 4: 1.3, 5: 1.3, 6: 1.0, 7: 0.8, 8: 0.7, 9: 1.0, 10: 1.1, 11: 0.8, 12: 0.5},
    },
    "Monitoring et Smart": {
        "sub_categories": ["Compteur intelligent", "Passerelle IoT", "Logiciel SCADA", "Capteur"],
        "brands": ["Solar-Log", "Meteocontrol", "SolarEdge", "Fronius"],
        "price_range": (100, 2000),
        "margin_range": (30, 50),
        "seasonality": {m: 1.0 for m in range(1, 13)},
    },
}

# ============================================================
# GENERER LES PRODUITS (800)
# ============================================================
products = []
pid = 0
for cat, specs in CATEGORIES.items():
    nb_products = {"Panneaux Solaires": 180, "Onduleurs": 150, "Batteries": 100,
                   "Cables et Connectique": 150, "Structures et Fixations": 120,
                   "Monitoring et Smart": 100}[cat]
    for i in range(nb_products):
        pid += 1
        sub = random.choice(specs["sub_categories"])
        brand = random.choice(specs["brands"])
        list_price = round(random.uniform(*specs["price_range"]), 2)
        margin_pct = random.uniform(*specs["margin_range"])
        unit_cost = round(list_price * (1 - margin_pct / 100), 2)
        products.append({
            "product_id": f"PRD-{pid:04d}",
            "product_name": f"{brand} {sub} {random.randint(100, 999)}",
            "category": cat,
            "sub_category": sub,
            "brand": brand,
            "unit_cost_eur": unit_cost,
            "list_price_eur": list_price,
        })

with open(os.path.join(OUTPUT_DIR, "products.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=products[0].keys())
    w.writeheader()
    w.writerows(products)
print(f"products.csv: {len(products)} produits")

# ============================================================
# GENERER LES ENTREPOTS (12)
# ============================================================
warehouses = []
wh_locations = [
    ("WH-001", "Hub Paris Nord", "FR", "Paris"),
    ("WH-002", "Hub Lyon", "FR", "Lyon"),
    ("WH-003", "Hub Marseille", "FR", "Marseille"),
    ("WH-004", "Hub Berlin", "DE", "Berlin"),
    ("WH-005", "Hub Munich", "DE", "Munich"),
    ("WH-006", "Hub Hamburg", "DE", "Hamburg"),
    ("WH-007", "Hub Madrid", "ES", "Madrid"),
    ("WH-008", "Hub Barcelona", "ES", "Barcelona"),
    ("WH-009", "Hub Milan", "IT", "Milan"),
    ("WH-010", "Hub Rome", "IT", "Rome"),
    ("WH-011", "Hub Brussels", "BE", "Brussels"),
    ("WH-012", "Hub Rotterdam", "NL", "Rotterdam"),
]
for wid, name, country, city in wh_locations:
    warehouses.append({"warehouse_id": wid, "warehouse_name": name, "country": country, "city": city})

with open(os.path.join(OUTPUT_DIR, "warehouses.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=warehouses[0].keys())
    w.writeheader()
    w.writerows(warehouses)
print(f"warehouses.csv: {len(warehouses)} entrepots")

# ============================================================
# GENERER LES VENDEURS (60) — 3-4 stars, 5-6 en difficulte
# ============================================================
sales_reps = []
REGIONS_REP = ["France Nord", "France Sud", "Allemagne", "Iberique", "Italie", "Benelux"]
STAR_REPS = [3, 7, 12]  # indices des stars
WEAK_REPS = [15, 22, 31, 38, 45, 55]  # indices des faibles

for rid in range(1, 61):
    region = REGIONS_REP[rid % len(REGIONS_REP)]
    if rid in STAR_REPS:
        target = random.randint(800_000, 1_200_000)
    elif rid in WEAK_REPS:
        target = random.randint(200_000, 400_000)
    else:
        target = random.randint(400_000, 800_000)

    first_names = ["Martin", "Sophie", "Thomas", "Marie", "Pierre", "Claire", "Lucas", "Emma",
                   "Hans", "Anna", "Carlos", "Elena", "Marco", "Giulia", "Jan", "Lisa"]
    last_names = ["Dubois", "Mueller", "Garcia", "Rossi", "Janssen", "Van der Berg",
                  "Lefebvre", "Schmidt", "Martinez", "Ferrari", "De Vries", "Bernard"]
    name = f"{random.choice(first_names)} {random.choice(last_names)}"
    hire_date = date(random.randint(2018, 2024), random.randint(1, 12), random.randint(1, 28))

    sales_reps.append({
        "rep_id": f"REP-{rid:03d}",
        "rep_name": name,
        "region": region,
        "hire_date": hire_date.isoformat(),
        "annual_target_eur": target,
    })

with open(os.path.join(OUTPUT_DIR, "sales_reps.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=sales_reps[0].keys())
    w.writeheader()
    w.writerows(sales_reps)
print(f"sales_reps.csv: {len(sales_reps)} vendeurs")

# ============================================================
# GENERER LES CLIENTS (2500)
# ============================================================
clients = []
CLIENT_SEGMENTS_INIT = ["VIP"] * 150 + ["Fidele"] * 600 + ["Occasionnel"] * 1000 + ["Dormant"] * 750
random.shuffle(CLIENT_SEGMENTS_INIT)

COMPANY_PREFIXES = ["Solar", "Ener", "Green", "Eco", "Sun", "Wind", "Power", "Volt",
                    "Electra", "Lumi", "Therm", "Renov", "Instal", "Bat"]
COMPANY_SUFFIXES = ["Tech", "Pro", "Solutions", "Services", "Energy", "Systems", "Install",
                    "Group", "Partners", "Europe", "Plus", "Direct"]

for cid in range(1, 2501):
    # Repartition pays selon poids
    r = random.random()
    cumul = 0
    country_code = "FR"
    for code, info in COUNTRIES.items():
        cumul += info["weight"]
        if r < cumul:
            country_code = code
            break
    city = random.choice(COUNTRIES[country_code]["cities"])
    company = f"{random.choice(COMPANY_PREFIXES)}{random.choice(COMPANY_SUFFIXES)} {random.randint(1, 99)}"
    segment = CLIENT_SEGMENTS_INIT[cid - 1] if cid <= len(CLIENT_SEGMENTS_INIT) else "Occasionnel"

    # Variantes de noms de pays (pour tester le nettoyage)
    country_variants = {
        "FR": ["France", "FR", "france", " France "],
        "DE": ["Germany", "DE", "Allemagne", "GERMANY"],
        "ES": ["Spain", "ES", "Espagne"],
        "IT": ["Italy", "IT", "Italie"],
        "BE": ["Belgium", "BE", "Belgique"],
        "NL": ["Netherlands", "NL", "Pays-Bas"],
    }
    country_display = random.choice(country_variants.get(country_code, [country_code]))

    # Quelques adresses nulles (~5%)
    address = f"{random.randint(1, 200)} Rue de l'Energie" if random.random() > 0.05 else None
    email = f"contact@{company.lower().replace(' ', '')}.eu" if random.random() > 0.03 else None

    clients.append({
        "customer_id": f"CLI-{cid:05d}",
        "company_name": company,
        "country": country_display,
        "city": city if random.random() > 0.03 else None,
        "address": address,
        "contact_email": email,
    })

with open(os.path.join(OUTPUT_DIR, "customers.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=clients[0].keys())
    w.writeheader()
    w.writerows(clients)
print(f"customers.csv: {len(clients)} clients")

# ============================================================
# GENERER LES COMMANDES ET LIGNES (180 000 commandes, ~520 000 lignes)
# ============================================================
print("\nGeneration des commandes...")

orders = []
order_lines = []
oid = 0

# Repartition des commandes par segment client
segment_order_freq = {"VIP": 120, "Fidele": 80, "Occasionnel": 40, "Dormant": 10}

for cid in range(1, 2501):
    client = clients[cid - 1]
    segment = CLIENT_SEGMENTS_INIT[cid - 1] if cid <= len(CLIENT_SEGMENTS_INIT) else "Occasionnel"
    nb_orders = int(segment_order_freq[segment] * random.uniform(0.5, 1.5))

    # Assigner un vendeur principal (mais pas toujours le meme)
    main_rep = sales_reps[cid % len(sales_reps)]

    for _ in range(nb_orders):
        oid += 1
        order_month = random.choices(range(1, 13), weights=[0.06, 0.07, 0.09, 0.11, 0.12, 0.10,
                                                             0.08, 0.07, 0.09, 0.08, 0.07, 0.06])[0]
        order_day = random.randint(1, 28)
        order_year = random.choices([2024, 2025], weights=[0.35, 0.65])[0]
        order_date = date(order_year, order_month, order_day)

        # Delai de livraison (la plupart < 7j, quelques lents)
        lead = random.choices([1, 2, 3, 5, 7, 10, 14, 21], weights=[5, 15, 25, 20, 15, 10, 7, 3])[0]
        ship_date = order_date + timedelta(days=lead)

        # 80% vendeur principal, 20% autre
        if random.random() < 0.8:
            rep = main_rep
        else:
            rep = random.choice(sales_reps)

        # Entrepot selon pays client
        country_code_clean = client["country"].strip().upper()
        if country_code_clean in ["FRANCE", "FR"]:
            wh = random.choice([w for w in warehouses if w["country"] == "FR"])
        elif country_code_clean in ["GERMANY", "ALLEMAGNE", "DE"]:
            wh = random.choice([w for w in warehouses if w["country"] == "DE"])
        elif country_code_clean in ["SPAIN", "ESPAGNE", "ES"]:
            wh = random.choice([w for w in warehouses if w["country"] == "ES"])
        elif country_code_clean in ["ITALY", "ITALIE", "IT"]:
            wh = random.choice([w for w in warehouses if w["country"] == "IT"])
        else:
            wh = random.choice(warehouses)

        status = random.choices(["completed", "shipped", "processing", "cancelled"],
                                weights=[70, 15, 10, 5])[0]

        orders.append({
            "order_id": f"ORD-{oid:06d}",
            "customer_id": client["customer_id"],
            "rep_id": rep["rep_id"],
            "warehouse_id": wh["warehouse_id"],
            "order_date": order_date.isoformat(),
            "ship_date": ship_date.isoformat(),
            "status": status,
        })

        # Lignes de commande (1-5 produits par commande)
        nb_lines = random.choices([1, 2, 3, 4, 5], weights=[20, 35, 25, 15, 5])[0]
        selected_products = random.sample(products, nb_lines)

        for prod in selected_products:
            cat = prod["category"]
            specs = CATEGORIES[cat]
            season_mult = specs["seasonality"].get(order_month, 1.0)
            qty = max(1, int(random.gauss(5 * season_mult, 3)))

            # Prix de vente = list_price avec remise eventuelle
            discount = 0
            if segment == "VIP":
                discount = random.choice([0, 0, 5, 8, 10])
            elif segment == "Fidele":
                discount = random.choice([0, 0, 0, 3, 5])
            else:
                discount = random.choice([0, 0, 0, 0, 2])

            # Stars vendeurs = bonne marge, Faibles = bradent
            rep_idx = int(rep["rep_id"].split("-")[1])
            if rep_idx in WEAK_REPS and cat == "Onduleurs":
                # Vendeurs faibles bradent les onduleurs → ventes a perte
                discount = random.randint(20, 40)

            unit_price = round(prod["list_price_eur"] * (1 - discount / 100), 2)
            unit_cost = prod["unit_cost_eur"]

            order_lines.append({
                "order_id": f"ORD-{oid:06d}",
                "product_id": prod["product_id"],
                "quantity": qty,
                "unit_price_eur": unit_price,
                "unit_cost_eur": unit_cost,
                "discount_pct": discount,
            })

    if cid % 500 == 0:
        print(f"  {cid:,} clients traites, {oid:,} commandes, {len(order_lines):,} lignes...")

print(f"\nCommandes: {len(orders):,}")
print(f"Lignes: {len(order_lines):,}")

with open(os.path.join(OUTPUT_DIR, "orders.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=orders[0].keys())
    w.writeheader()
    w.writerows(orders)

with open(os.path.join(OUTPUT_DIR, "order_lines.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=order_lines[0].keys())
    w.writeheader()
    w.writerows(order_lines)

# ============================================================
# NIVEAUX DE STOCK QUOTIDIENS (dernier trimestre 2025)
# ============================================================
print("\nGeneration des stocks...")
stock_rows = []
stock_products = random.sample(products, 350)  # 350 produits en stock

# Produits en rupture ciblee : onduleurs Huawei et Fronius
rupture_products = [p for p in stock_products
                    if p["category"] == "Onduleurs" and p["brand"] in ["Huawei", "Fronius"]]

for d in range(92):  # Oct-Nov-Dec 2025
    current_date = date(2025, 10, 1) + timedelta(days=d)
    for prod in stock_products:
        for wh in random.sample(warehouses, 4):  # 4 entrepots par produit
            base_stock = random.randint(20, 500)
            reorder = int(base_stock * 0.2)
            max_stock = int(base_stock * 1.5)
            daily_demand = max(1, int(base_stock * random.uniform(0.02, 0.08)))

            qty = base_stock + random.randint(-50, 50)

            # Injecter ruptures sur onduleurs Huawei/Fronius en decembre
            if prod in rupture_products and current_date.month == 12:
                qty = max(0, random.randint(0, reorder))

            stock_rows.append({
                "stock_date": current_date.isoformat(),
                "product_id": prod["product_id"],
                "warehouse_id": wh["warehouse_id"],
                "quantity_on_hand": max(0, qty),
                "reorder_point": reorder,
                "max_stock": max_stock,
                "unit_cost_eur": prod["unit_cost_eur"],
                "avg_daily_demand": daily_demand,
            })

with open(os.path.join(OUTPUT_DIR, "stock_levels.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=stock_rows[0].keys())
    w.writeheader()
    w.writerows(stock_rows)
print(f"stock_levels.csv: {len(stock_rows):,} lignes")

# ============================================================
# BATCH 2 : MISE A JOUR CLIENTS (pour SCD Type 2)
# ============================================================
updates = []
# 150 clients qui changent : 50 changent de segment, 100 changent juste email/nom
segment_changers = random.sample(range(1, 2501), 50)
info_changers = random.sample([c for c in range(1, 2501) if c not in segment_changers], 100)

for cid in segment_changers:
    client = clients[cid - 1]
    old_segment = CLIENT_SEGMENTS_INIT[cid - 1] if cid <= len(CLIENT_SEGMENTS_INIT) else "Occasionnel"
    # Monter d'un cran
    new_segment = {"Dormant": "Occasionnel", "Occasionnel": "Fidele", "Fidele": "VIP", "VIP": "VIP"}[old_segment]
    updates.append({
        "customer_id": client["customer_id"],
        "company_name": client["company_name"].strip() if client["company_name"] else "Inconnu",
        "country_code": client["country"].strip().upper()[:2] if client["country"] else "FR",
        "city": client["city"] or "Ville non renseignee",
        "new_segment": new_segment,
        "contact_email": client["contact_email"] or f"contact@updated.eu",
    })

for cid in info_changers:
    client = clients[cid - 1]
    segment = CLIENT_SEGMENTS_INIT[cid - 1] if cid <= len(CLIENT_SEGMENTS_INIT) else "Occasionnel"
    updates.append({
        "customer_id": client["customer_id"],
        "company_name": client["company_name"].strip() if client["company_name"] else "Inconnu",
        "country_code": client["country"].strip().upper()[:2] if client["country"] else "FR",
        "city": client["city"] or "Ville non renseignee",
        "new_segment": segment,  # meme segment = pas de SCD Type 2
        "contact_email": f"nouveau.contact@{random.choice(['updated', 'new', 'migrated'])}.eu",
    })

with open(os.path.join(OUTPUT_DIR, "customers_update_batch2.csv"), "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=updates[0].keys())
    w.writeheader()
    w.writerows(updates)
print(f"customers_update_batch2.csv: {len(updates)} mises a jour")

# ============================================================
# RESUME
# ============================================================
print(f"\n{'='*60}")
print(f"RESUME DES DONNEES GENEREES")
print(f"{'='*60}")
print(f"Produits:         {len(products):>10,}")
print(f"Entrepots:        {len(warehouses):>10,}")
print(f"Vendeurs:         {len(sales_reps):>10,}")
print(f"Clients:          {len(clients):>10,}")
print(f"Commandes:        {len(orders):>10,}")
print(f"Lignes commande:  {len(order_lines):>10,}")
print(f"Lignes stock:     {len(stock_rows):>10,}")
print(f"Mises a jour:     {len(updates):>10,}")
print(f"{'='*60}")
print(f"\nSCENARIOS PILOTES INJECTES:")
print(f"  FR + DE = ~60% du CA (poids dans la repartition clients)")
print(f"  Panneaux solaires : saisonnalite forte (pic printemps)")
print(f"  Onduleurs : marges faibles (5-15%), guerre des prix")
print(f"  Batteries : marges hautes (22-35%), marche captif")
print(f"  3 vendeurs stars : REP-003, REP-007, REP-012")
print(f"  6 vendeurs faibles : REP-015, REP-022, REP-031, REP-038, REP-045, REP-055")
print(f"  Vendeurs faibles bradent les onduleurs (ventes a perte)")
print(f"  Ruptures stock : onduleurs Huawei/Fronius en decembre")
print(f"  50 clients changent de segment (pour SCD Type 2)")
print(f"  VIP = ~6%, Fidele = ~24%, Occasionnel = ~40%, Dormant = ~30%")