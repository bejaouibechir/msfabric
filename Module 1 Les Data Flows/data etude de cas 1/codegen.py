# Script corrigé : generate_renewable_production_data_scenario1_fixed.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

# Initialisation des seeds pour reproductibilité
np.random.seed(42)
random.seed(42)

# Création du dossier de sortie
os.makedirs('data_renewable', exist_ok=True)

# Génération des dates pour l'année 2025
base_date = datetime(2025, 1, 1)
dates = [base_date + timedelta(days=x) for x in range(365)]

# 1. Production Solaire
print("Génération des données solaires...")
solaire_timestamps = []
solaire_parc_ids = []
for date in dates:
    for parc in ['SOL_PARIS', 'SOL_LYON', 'SOL_MARSEILLE', 'SOL_BORDEAUX']:
        solaire_timestamps.append(date)
        solaire_parc_ids.append(parc)

n_solaire = len(solaire_timestamps)
production_base = np.random.normal(3800, 1100, n_solaire).clip(0)
anomalies = np.random.choice([0, -888, np.nan], n_solaire, p=[0.94, 0.03, 0.03])
production_finale = production_base + anomalies

solaire = pd.DataFrame({
    'timestamp': solaire_timestamps,
    'parc_id': solaire_parc_ids,
    'type': 'solaire',
    'production_kwh': production_finale,
    'irradiation_kwh_m2': np.random.normal(4.2, 1.6, n_solaire).clip(0.2),
    'temperature_c': np.random.normal(22, 9, n_solaire),
    'status': np.random.choice(
        ['OK', 'LOW_IRR', 'DIRTY', 'INVERTER', 'FAULT'], 
        n_solaire, 
        p=[0.80, 0.06, 0.05, 0.05, 0.04]
    )
})
solaire.to_csv('data_renewable/solaire_2025.csv', index=False, encoding='utf-8-sig')
print(f"✓ Solaire: {len(solaire)} lignes générées")

# 2. Production Éolien
print("Génération des données éoliennes...")
eolien_dates = []
eolien_codes = []
for date in dates:
    for parc in ['EOL_NORMANDIE', 'EOL_BRETAGNE', 'EOL_PICARDIE', 'EOL_PAYS_LOIRE', 'EOL_CENTRE']:
        eolien_dates.append(date.date())
        eolien_codes.append(parc)

n_eolien = len(eolien_dates)
eolien = pd.DataFrame({
    'date': eolien_dates,
    'parc_code': eolien_codes,
    'prod_mwh': np.random.gamma(shape=7.5, scale=1.1, size=n_eolien).round(2),
    'vent_mps': np.random.weibull(2.0, n_eolien).round(1),
    'etat': np.random.choice(
        ['Running', 'Maintenance', 'Brake', 'Fault', 'Duplicate'], 
        n_eolien, 
        p=[0.78, 0.08, 0.06, 0.05, 0.03]
    )
})

# Ajout de doublons intentionnels
doublons = eolien.sample(n=min(150, len(eolien)), random_state=42)
eolien = pd.concat([eolien, doublons], ignore_index=True)
eolien.to_csv('data_renewable/eolien_2025.csv', index=False, encoding='utf-8-sig')
print(f"✓ Éolien: {len(eolien)} lignes générées (incluant {len(doublons)} doublons)")

# 3. Production Hydro
print("Génération des données hydrauliques...")
hydro_dates = []
hydro_plant_ids = []

# Première partie : format DD/MM/YYYY
for date in dates:
    for plant in ['HYD_RHONE', 'HYD_ALPES', 'HYD_PYR']:
        hydro_dates.append(date.strftime('%d/%m/%Y'))
        hydro_plant_ids.append(plant)

# Deuxième partie : format YYYY-MM-DD avec variantes
for date in dates:
    for plant in ['HYD_RHONE-var', 'HYD_ALPES-var', 'HYD_PYR-var']:
        hydro_dates.append(date.strftime('%Y-%m-%d'))
        hydro_plant_ids.append(plant)

n_hydro = len(hydro_dates)
hydro = pd.DataFrame({
    'ReadingDate': hydro_dates,
    'PlantID': hydro_plant_ids,
    'Production_kWh': np.random.normal(16200, 3800, n_hydro).clip(800),
    'Debit_m3_s': np.random.normal(28, 9, n_hydro).clip(1.5),
    'Niveau_m': np.random.normal(72, 6, n_hydro),
    'Alert': np.random.choice(
        ['None', 'LowFlow', 'HighLevel', 'SensorError'], 
        n_hydro, 
        p=[0.86, 0.06, 0.04, 0.04]
    )
})
hydro.to_csv('data_renewable/hydro_2025.csv', index=False, encoding='utf-8-sig')
print(f"✓ Hydro: {len(hydro)} lignes générées")

# 4. Calendrier + Météo + Maintenance
print("Génération du calendrier/météo...")
cal = pd.DataFrame({
    'date': [d.date() for d in dates],
    'jour': [d.strftime('%A') for d in dates],
    'mois': [d.month for d in dates],
    'weekend': [d.weekday() >= 5 for d in dates],
    'maintenance': np.random.choice([0, 1], len(dates), p=[0.95, 0.05]),
    'pluie_mm': np.random.exponential(2.8, len(dates)).clip(0).round(1),
    'vent_mps': np.random.normal(4.8, 2.2, len(dates)).clip(0).round(1)
})
cal.to_csv('data_renewable/calendrier_meteo_maintenance.csv', index=False, encoding='utf-8-sig')
print(f"✓ Calendrier: {len(cal)} lignes générées")

print("\n" + "="*60)
print("✅ Génération terminée avec succès !")
print("="*60)
print(f"📁 Fichiers créés dans le dossier 'data_renewable/':")
print(f"   - solaire_2025.csv ({len(solaire)} lignes)")
print(f"   - eolien_2025.csv ({len(eolien)} lignes)")
print(f"   - hydro_2025.csv ({len(hydro)} lignes)")
print(f"   - calendrier_meteo_maintenance.csv ({len(cal)} lignes)")
print("\n🚀 Vous pouvez maintenant lancer l'atelier Scénario 1.")