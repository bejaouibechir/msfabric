# Script : generate_esg_carbon_data.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

# Initialisation des seeds pour reproductibilité
np.random.seed(42)
random.seed(42)

# Création du dossier de sortie
os.makedirs('data_esg', exist_ok=True)

# Génération des dates pour l'année 2025
base_date = datetime(2025, 1, 1)
dates = [base_date + timedelta(days=x) for x in range(365)]

print("Génération des données ESG pour l'atelier Dataflow Gen2...")

# 1. Données de production énergétique par source
print("1. Génération des données de production par source...")
production_sources = []
sources_energie = {
    'Solaire': {'capacite': 50000, 'facteur_emission': 0.05, 'cout_kwh': 0.08},  # kgCO2/kWh
    'Eolien': {'capacite': 80000, 'facteur_emission': 0.02, 'cout_kwh': 0.07},
    'Hydro': {'capacite': 120000, 'facteur_emission': 0.01, 'cout_kwh': 0.06},
    'Gaz naturel': {'capacite': 200000, 'facteur_emission': 0.45, 'cout_kwh': 0.10},
    'Charbon': {'capacite': 150000, 'facteur_emission': 0.95, 'cout_kwh': 0.09},
    'Nucleaire': {'capacite': 300000, 'facteur_emission': 0.006, 'cout_kwh': 0.05}
}

for date in dates:
    for source, params in sources_energie.items():
        # Production avec variabilité selon le type
        if source in ['Solaire', 'Eolien']:
            facteur_saisonnier = 1.3 if date.month in [5, 6, 7, 8] else 0.7
            production = np.random.normal(params['capacite'] * 0.3, params['capacite'] * 0.15) * facteur_saisonnier
        else:
            production = np.random.normal(params['capacite'] * 0.7, params['capacite'] * 0.1)
        
        production = max(0, production)
        
        # Ajout de valeurs manquantes aléatoires (2%)
        if random.random() < 0.02:
            production = np.nan
        
        production_sources.append({
            'date': date.date(),
            'source_energie': source,
            'production_kwh': round(production, 2),
            'capacite_installee_kwh': params['capacite'],
            'cout_production_eur': round(production * params['cout_kwh'], 2) if not np.isnan(production) else np.nan
        })

df_production = pd.DataFrame(production_sources)

# Ajout de doublons intentionnels (5%)
doublons = df_production.sample(n=int(len(df_production) * 0.05), random_state=42)
df_production = pd.concat([df_production, doublons], ignore_index=True)

# Ajout de valeurs aberrantes
for i in random.sample(range(len(df_production)), 10):
    df_production.at[i, 'production_kwh'] = -999  # Code erreur

df_production.to_csv('data_esg/production_sources_energie.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ production_sources_energie.csv : {len(df_production)} lignes")

# 2. Données de consommation par secteur
print("2. Génération des données de consommation par secteur...")
secteurs = ['Industrie', 'Residentiel', 'Tertiaire', 'Transport']
consommation_data = []

for date in dates:
    for secteur in secteurs:
        # Consommation avec profils différents par secteur
        base_conso = {
            'Industrie': 180000,
            'Residentiel': 120000,
            'Tertiaire': 90000,
            'Transport': 60000
        }
        
        # Variabilité jour/nuit et weekend
        is_weekend = date.weekday() >= 5
        facteur_weekend = 0.7 if is_weekend else 1.0
        
        conso = np.random.normal(base_conso[secteur], base_conso[secteur] * 0.2) * facteur_weekend
        conso = max(0, conso)
        
        consommation_data.append({
            'date_releve': date.strftime('%d/%m/%Y'),  # Format incohérent volontaire
            'secteur': secteur,
            'consommation_kwh': round(conso, 2),
            'nombre_sites': random.randint(50, 500)
        })

df_consommation = pd.DataFrame(consommation_data)
df_consommation.to_csv('data_esg/consommation_secteurs.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ consommation_secteurs.csv : {len(df_consommation)} lignes")

# 3. Facteurs d'émission (table de référence)
print("3. Génération de la table des facteurs d'émission...")
facteurs_emission = []

for source, params in sources_energie.items():
    facteurs_emission.append({
        'source_energie': source,
        'facteur_emission_kgco2_kwh': params['facteur_emission'],
        'categorie': 'Renouvelable' if source in ['Solaire', 'Eolien', 'Hydro', 'Nucleaire'] else 'Fossile',
        'objectif_2030_pct': 100 if source in ['Solaire', 'Eolien', 'Hydro'] else 0
    })

df_facteurs = pd.DataFrame(facteurs_emission)
df_facteurs.to_csv('data_esg/facteurs_emission_reference.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ facteurs_emission_reference.csv : {len(df_facteurs)} lignes")

# 4. Données météo (impact sur production)
print("4. Génération des données météo...")
meteo_data = []

for date in dates:
    meteo_data.append({
        'date': date.date(),
        'temperature_moy_c': round(np.random.normal(15, 8), 1),
        'ensoleillement_heures': round(max(0, np.random.normal(6, 3)), 1),
        'vitesse_vent_mps': round(max(0, np.random.normal(5, 2.5)), 1),
        'precipitation_mm': round(max(0, np.random.exponential(3)), 1)
    })

df_meteo = pd.DataFrame(meteo_data)
df_meteo.to_csv('data_esg/meteo_quotidienne.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ meteo_quotidienne.csv : {len(df_meteo)} lignes")

# 5. Objectifs ESG réglementaires
print("5. Génération des objectifs ESG...")
objectifs_esg = []

for annee in [2025, 2026, 2027, 2028, 2029, 2030]:
    # Objectifs linéaires de réduction d'émissions
    reduction_cible = (annee - 2025) * 8  # -8% par an jusqu'à -40% en 2030
    part_renouvelable_cible = 40 + (annee - 2025) * 10  # 40% en 2025 → 90% en 2030
    
    objectifs_esg.append({
        'annee': annee,
        'reduction_emissions_pct': reduction_cible,
        'part_renouvelable_cible_pct': part_renouvelable_cible,
        'emissions_max_tonnes_co2': 500000 * (1 - reduction_cible / 100),
        'reglementation': 'EU Green Deal' if annee <= 2027 else 'EU Fit for 55'
    })

df_objectifs = pd.DataFrame(objectifs_esg)
df_objectifs.to_csv('data_esg/objectifs_esg_reglementaires.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ objectifs_esg_reglementaires.csv : {len(df_objectifs)} lignes")

# 6. Coûts des certificats carbone
print("6. Génération des prix des certificats carbone...")
certificats_co2 = []

for date in dates:
    # Prix fluctuant du CO2 (marché EU ETS)
    prix_base = 85  # €/tonne CO2
    variation = np.random.normal(0, 5)
    prix = max(50, prix_base + variation + (date.timetuple().tm_yday / 365) * 10)  # Tendance haussière
    
    certificats_co2.append({
        'date': date.date(),
        'prix_tonne_co2_eur': round(prix, 2),
        'volume_echange_tonnes': random.randint(10000, 50000),
        'marche': 'EU ETS'
    })

df_certificats = pd.DataFrame(certificats_co2)
df_certificats.to_csv('data_esg/prix_certificats_co2.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ prix_certificats_co2.csv : {len(df_certificats)} lignes")

# Résumé
print("\n" + "="*60)
print("✅ Génération terminée avec succès !")
print("="*60)
print("📁 Fichiers créés dans le dossier 'data_esg/':")
print(f"   1. production_sources_energie.csv ({len(df_production)} lignes)")
print(f"   2. consommation_secteurs.csv ({len(df_consommation)} lignes)")
print(f"   3. facteurs_emission_reference.csv ({len(df_facteurs)} lignes)")
print(f"   4. meteo_quotidienne.csv ({len(df_meteo)} lignes)")
print(f"   5. objectifs_esg_reglementaires.csv ({len(df_objectifs)} lignes)")
print(f"   6. prix_certificats_co2.csv ({len(df_certificats)} lignes)")
print("\n🚀 Vous pouvez maintenant lancer l'atelier ESG Dataflow Gen2.")