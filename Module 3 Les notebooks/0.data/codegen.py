# Script : generate_bronze_data_notebooks.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

np.random.seed(42)
random.seed(42)

os.makedirs('data_bronze_notebooks', exist_ok=True)

print("Génération des données BRONZE (très sales) pour atelier Notebooks...")

# Période : 30 jours avec mesures toutes les 15 minutes
base_date = datetime(2025, 1, 1, 0, 0, 0)
timestamps = [base_date + timedelta(minutes=15*x) for x in range(30*24*4)]  # 2,880 timestamps

# Sites (6 sites industriels)
sites = [
    {'id': 'SITE_IND_001', 'type': 'Industrie', 'capacite_mw': 5.0},
    {'id': 'SITE_IND_002', 'type': 'Industrie', 'capacite_mw': 3.5},
    {'id': 'SITE_COM_001', 'type': 'Commercial', 'capacite_mw': 2.0},
    {'id': 'SITE_COM_002', 'type': 'Commercial', 'capacite_mw': 1.5},
    {'id': 'SITE_RES_001', 'type': 'Residentiel', 'capacite_mw': 0.8},
    {'id': 'SITE_RES_002', 'type': 'Residentiel', 'capacite_mw': 0.6},
]

# 1. CONSOMMATION (très sale)
print("1. Génération consommation (très sale)...")
consommation_data = []

for timestamp in timestamps:
    for site in sites:
        heure = timestamp.hour
        is_semaine = timestamp.weekday() < 5
        
        # Profil de consommation
        if site['type'] == 'Industrie':
            baseline = site['capacite_mw'] * (0.7 if is_semaine and 6 <= heure < 22 else 0.3)
        elif site['type'] == 'Commercial':
            baseline = site['capacite_mw'] * (0.6 if 8 <= heure < 20 else 0.1)
        else:
            baseline = site['capacite_mw'] * (0.5 if heure in [7, 8, 18, 19, 20] else 0.2)
        
        conso = baseline + np.random.normal(0, baseline * 0.15)
        conso = max(0, min(conso, site['capacite_mw']))
        
        # PROBLÈMES INTENTIONNELS (très sales)
        if random.random() < 0.03:  # 3% NULL
            conso = np.nan
        elif random.random() < 0.02:  # 2% codes erreur
            conso = random.choice([-999, -888, -777])
        elif random.random() < 0.01:  # 1% valeurs aberrantes
            conso = site['capacite_mw'] * random.uniform(1.5, 3.0)
        
        # Formats de dates MIXTES (volontaire)
        if random.random() < 0.3:
            date_str = timestamp.strftime('%d/%m/%Y %H:%M:%S')  # Format européen
        elif random.random() < 0.3:
            date_str = timestamp.strftime('%Y-%m-%d %H:%M:%S')  # Format ISO
        else:
            date_str = timestamp.isoformat()  # Format ISO avec T
        
        consommation_data.append({
            'timestamp': date_str,
            'site_id': site['id'],
            'consumption_mw': round(conso, 3) if not pd.isna(conso) and conso > 0 else conso,
            'voltage_v': round(np.random.normal(230, 10), 1),
            'frequency_hz': round(np.random.normal(50, 0.2), 2),
            'status': 'OK' if pd.notna(conso) and conso > 0 else 'ERROR'
        })

df_conso = pd.DataFrame(consommation_data)

# Ajouter 5% de DOUBLONS (transmission réseau)
nb_doublons = int(len(df_conso) * 0.05)
doublons = df_conso.sample(n=nb_doublons, random_state=42)
df_conso = pd.concat([df_conso, doublons], ignore_index=True)

# Mélanger pour que les doublons ne soient pas évidents
df_conso = df_conso.sample(frac=1, random_state=42).reset_index(drop=True)

df_conso.to_csv('data_bronze_notebooks/consumption_raw.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ consumption_raw.csv : {len(df_conso)} lignes (dont {nb_doublons} doublons)")

# 2. PRIX SPOT MARCHÉ (propre)
print("2. Génération prix spot marché...")
prix_data = []

for timestamp in timestamps:
    heure = timestamp.hour
    
    # Prix selon heure de pointe
    if 6 <= heure < 9 or 17 <= heure < 21:
        prix_base = 150
    elif 22 <= heure or heure < 6:
        prix_base = 50
    else:
        prix_base = 80
    
    prix = prix_base + np.random.normal(0, 20)
    prix = max(30, prix)
    
    # Pics aléatoires (congestion)
    if random.random() < 0.02:
        prix = random.uniform(250, 400)
    
    prix_data.append({
        'timestamp': timestamp.isoformat(),
        'price_eur_mwh': round(prix, 2),
        'volume_mwh': random.randint(500, 5000),
        'market': 'EPEX Spot'
    })

df_prix = pd.DataFrame(prix_data)
df_prix.to_csv('data_bronze_notebooks/market_prices.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ market_prices.csv : {len(df_prix)} lignes")

# 3. MÉTÉO (propre, horaire)
print("3. Génération météo...")
meteo_data = []
timestamps_horaires = [base_date + timedelta(hours=x) for x in range(30*24)]

for timestamp in timestamps_horaires:
    heure = timestamp.hour
    temp_base = 10 + 5 * np.sin((heure - 6) * np.pi / 12)
    temperature = temp_base + np.random.normal(0, 2)
    
    meteo_data.append({
        'timestamp': timestamp.isoformat(),
        'temperature_c': round(temperature, 1),
        'humidity_pct': round(np.random.uniform(40, 80), 0),
        'wind_speed_ms': round(max(0, np.random.normal(4, 2)), 1),
        'cloud_cover_pct': round(np.random.uniform(0, 100), 0)
    })

df_meteo = pd.DataFrame(meteo_data)
df_meteo.to_csv('data_bronze_notebooks/weather_data.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ weather_data.csv : {len(df_meteo)} lignes")

# 4. RÉFÉRENTIEL SITES (propre)
print("4. Génération référentiel sites...")
sites_ref = []

for site in sites:
    sites_ref.append({
        'site_id': site['id'],
        'site_type': site['type'],
        'capacity_mw': site['capacite_mw'],
        'flexible': site['type'] in ['Industrie', 'Residentiel'],
        'baseline_mw': round(site['capacite_mw'] * 0.5, 2),
        'curtailment_price_eur_mwh': random.randint(100, 200) if site['type'] == 'Industrie' else None,
        'region': random.choice(['Ile-de-France', 'Auvergne-Rhone-Alpes', 'Provence'])
    })

df_sites = pd.DataFrame(sites_ref)
df_sites.to_csv('data_bronze_notebooks/sites_reference.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ sites_reference.csv : {len(df_sites)} lignes")

# 5. ÉVÉNEMENTS MAINTENANCE (quelques-uns)
print("5. Génération événements maintenance...")
maintenance_data = []

for i in range(8):
    debut = base_date + timedelta(hours=random.randint(0, 30*24))
    duree = random.randint(4, 24)
    fin = debut + timedelta(hours=duree)
    site = random.choice(sites)
    
    maintenance_data.append({
        'site_id': site['id'],
        'start_time': debut.isoformat(),
        'end_time': fin.isoformat(),
        'maintenance_type': random.choice(['Preventive', 'Corrective']),
        'impact_pct': random.randint(50, 100)
    })

df_maintenance = pd.DataFrame(maintenance_data)
df_maintenance.to_csv('data_bronze_notebooks/maintenance_events.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ maintenance_events.csv : {len(df_maintenance)} lignes")

# Résumé
print("\n" + "="*70)
print("✅ Génération BRONZE terminée !")
print("="*70)
print("📁 Fichiers créés dans 'data_bronze_notebooks/':")
print(f"   1. consumption_raw.csv ({len(df_conso)} lignes) - TRÈS SALE")
print(f"      - {nb_doublons} doublons (5%)")
print(f"      - 3% NULL, 2% codes erreur (-999, -888, -777)")
print(f"      - 1% valeurs aberrantes")
print(f"      - Formats de dates mixtes (DD/MM/YYYY, YYYY-MM-DD, ISO)")
print(f"   2. market_prices.csv ({len(df_prix)} lignes) - Propre")
print(f"   3. weather_data.csv ({len(df_meteo)} lignes) - Propre")
print(f"   4. sites_reference.csv ({len(df_sites)} lignes) - Propre")
print(f"   5. maintenance_events.csv ({len(df_maintenance)} lignes) - Propre")
print(f"\n📊 Total : {len(df_conso) + len(df_prix) + len(df_meteo) + len(df_sites) + len(df_maintenance):,} lignes")
print("\n🎯 Prêt pour l'atelier Notebooks Bronze → Silver → Gold")