# Script : generate_demand_response_data.py
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import os
import random

# Initialisation des seeds pour reproductibilité
np.random.seed(42)
random.seed(42)

# Création du dossier de sortie
os.makedirs('data_demand_response', exist_ok=True)

print("Génération des données Demand Response pour l'atelier Dataflow Gen2...")

# Période : 7 jours avec données toutes les 15 minutes
base_date = datetime(2025, 1, 20, 0, 0, 0)
timestamps = [base_date + timedelta(minutes=15*x) for x in range(7*24*4)]  # 672 timestamps

# Liste des sites
sites = [
    {'id': 'SITE_IND_001', 'type': 'Industrie', 'capacite_mw': 5.0, 'flexible': True},
    {'id': 'SITE_IND_002', 'type': 'Industrie', 'capacite_mw': 3.5, 'flexible': True},
    {'id': 'SITE_COM_001', 'type': 'Commercial', 'capacite_mw': 2.0, 'flexible': False},
    {'id': 'SITE_COM_002', 'type': 'Commercial', 'capacite_mw': 1.5, 'flexible': False},
    {'id': 'SITE_RES_001', 'type': 'Residentiel', 'capacite_mw': 0.8, 'flexible': True},
    {'id': 'SITE_RES_002', 'type': 'Residentiel', 'capacite_mw': 0.6, 'flexible': True},
]

# 1. Consommation en temps quasi-réel (IoT)
print("1. Génération des données de consommation IoT...")
consommation_iot = []

for timestamp in timestamps:
    for site in sites:
        # Profil de consommation selon type et heure
        heure = timestamp.hour
        is_jour_semaine = timestamp.weekday() < 5
        
        # Profils par type de site
        if site['type'] == 'Industrie':
            baseline = site['capacite_mw'] * (0.7 if is_jour_semaine and 6 <= heure < 22 else 0.3)
        elif site['type'] == 'Commercial':
            baseline = site['capacite_mw'] * (0.6 if 8 <= heure < 20 else 0.1)
        else:  # Residentiel
            baseline = site['capacite_mw'] * (0.5 if heure in [7, 8, 18, 19, 20] else 0.2)
        
        # Ajout de variabilité
        conso = baseline + np.random.normal(0, baseline * 0.15)
        conso = max(0, min(conso, site['capacite_mw']))
        
        # Anomalies intentionnelles (1%)
        if random.random() < 0.01:
            conso = np.nan  # Capteur défaillant
        elif random.random() < 0.005:
            conso = -99  # Code erreur
        
        consommation_iot.append({
            'timestamp': timestamp,
            'site_id': site['id'],
            'consommation_mw': round(conso, 3),
            'tension_v': round(np.random.normal(230, 5), 1),
            'frequence_hz': round(np.random.normal(50, 0.1), 2),
            'status_capteur': 'OK' if conso >= 0 else 'ERREUR'
        })

df_conso = pd.DataFrame(consommation_iot)

# Ajout de doublons (transmission réseau)
doublons = df_conso.sample(n=int(len(df_conso) * 0.02), random_state=42)
df_conso = pd.concat([df_conso, doublons], ignore_index=True)

df_conso.to_csv('data_demand_response/consommation_iot_15min.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ consommation_iot_15min.csv : {len(df_conso)} lignes")

# 2. État de charge des batteries
print("2. Génération des données de batteries...")
batteries = [
    {'id': 'BAT_001', 'site_id': 'SITE_IND_001', 'capacite_mwh': 10.0},
    {'id': 'BAT_002', 'site_id': 'SITE_IND_002', 'capacite_mwh': 7.0},
    {'id': 'BAT_003', 'site_id': 'SITE_RES_001', 'capacite_mwh': 2.0},
]

batteries_data = []
soc_precedent = {bat['id']: 50 for bat in batteries}  # État initial 50%

for timestamp in timestamps:
    for bat in batteries:
        # Simulation charge/décharge selon heure
        heure = timestamp.hour
        
        if 22 <= heure or heure < 6:  # Nuit : charge
            delta_soc = random.uniform(0.5, 2.0)
        elif 17 <= heure < 21:  # Pointe soir : décharge
            delta_soc = random.uniform(-3.0, -1.0)
        else:  # Jour : stable
            delta_soc = random.uniform(-0.5, 0.5)
        
        soc = soc_precedent[bat['id']] + delta_soc
        soc = max(5, min(95, soc))  # Limites 5-95%
        soc_precedent[bat['id']] = soc
        
        # Puissance charge/décharge
        puissance = (delta_soc / 100) * bat['capacite_mwh'] * 4  # MW (sur 15 min)
        
        batteries_data.append({
            'timestamp': timestamp,
            'batterie_id': bat['id'],
            'site_id': bat['site_id'],
            'soc_pct': round(soc, 1),
            'puissance_mw': round(puissance, 3),
            'temperature_c': round(np.random.normal(25, 5), 1),
            'cycles_vie': random.randint(1000, 3000)
        })

df_batteries = pd.DataFrame(batteries_data)

# Trous de données (maintenance)
indices_maintenance = random.sample(range(len(df_batteries)), int(len(df_batteries) * 0.03))
for idx in indices_maintenance:
    df_batteries.at[idx, 'soc_pct'] = np.nan
    df_batteries.at[idx, 'puissance_mw'] = np.nan

df_batteries.to_csv('data_demand_response/etat_batteries_15min.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ etat_batteries_15min.csv : {len(df_batteries)} lignes")

# 3. Prix spot du marché électrique
print("3. Génération des prix spot du marché...")
prix_spot = []

for timestamp in timestamps:
    heure = timestamp.hour
    
    # Prix de base selon heure de la journée
    if 6 <= heure < 9 or 17 <= heure < 21:  # Heures de pointe
        prix_base = 150
    elif 22 <= heure or heure < 6:  # Heures creuses
        prix_base = 50
    else:  # Heures normales
        prix_base = 80
    
    # Ajout de variabilité
    prix = prix_base + np.random.normal(0, 20)
    prix = max(30, prix)
    
    # Pics de prix aléatoires (congestion réseau)
    if random.random() < 0.02:
        prix = random.uniform(250, 400)
    
    prix_spot.append({
        'timestamp': timestamp,
        'prix_spot_eur_mwh': round(prix, 2),
        'volume_echange_mwh': random.randint(500, 5000),
        'marche': 'EPEX Spot',
        'zone': 'France'
    })

df_prix = pd.DataFrame(prix_spot)
df_prix.to_csv('data_demand_response/prix_spot_marche_15min.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ prix_spot_marche_15min.csv : {len(df_prix)} lignes")

# 4. Prévisions météo (impact sur consommation)
print("4. Génération des prévisions météo...")
meteo_previsions = []

# Données horaires (pas besoin de 15 min pour météo)
timestamps_horaires = [base_date + timedelta(hours=x) for x in range(7*24)]

for timestamp in timestamps_horaires:
    # Température avec cycle jour/nuit
    heure = timestamp.hour
    temp_base = 10 + 5 * np.sin((heure - 6) * np.pi / 12)  # Cycle sinusoïdal
    temperature = temp_base + np.random.normal(0, 2)
    
    # Autres variables météo
    meteo_previsions.append({
        'timestamp': timestamp,
        'temperature_c': round(temperature, 1),
        'humidite_pct': round(np.random.uniform(40, 80), 0),
        'nebulosite_pct': round(np.random.uniform(0, 100), 0),
        'vitesse_vent_ms': round(max(0, np.random.normal(4, 2)), 1),
        'type_prevision': 'J+0' if timestamp.date() == base_date.date() else 'J+1'
    })

df_meteo = pd.DataFrame(meteo_previsions)
df_meteo.to_csv('data_demand_response/previsions_meteo_horaire.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ previsions_meteo_horaire.csv : {len(df_meteo)} lignes")

# 5. Référentiel des sites (caractéristiques)
print("5. Génération du référentiel des sites...")
sites_ref = []

for site in sites:
    sites_ref.append({
        'site_id': site['id'],
        'type_site': site['type'],
        'capacite_mw': site['capacite_mw'],
        'flexible': site['flexible'],
        'baseline_mw': round(site['capacite_mw'] * 0.5, 2),  # Consommation moyenne
        'prix_effacement_eur_mwh': random.randint(100, 200) if site['flexible'] else None,
        'duree_max_effacement_heures': random.randint(2, 8) if site['flexible'] else None,
        'region': random.choice(['Ile-de-France', 'Auvergne-Rhone-Alpes', 'Provence-Alpes-Cote-Azur'])
    })

df_sites_ref = pd.DataFrame(sites_ref)
df_sites_ref.to_csv('data_demand_response/referentiel_sites.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ referentiel_sites.csv : {len(df_sites_ref)} lignes")

# 6. Événements de maintenance planifiée
print("6. Génération des événements de maintenance...")
maintenance = []

# Quelques périodes de maintenance
for i in range(5):
    debut = base_date + timedelta(hours=random.randint(0, 7*24))
    duree = random.randint(2, 12)  # heures
    fin = debut + timedelta(hours=duree)
    site = random.choice(sites)
    
    maintenance.append({
        'site_id': site['id'],
        'debut_maintenance': debut,
        'fin_maintenance': fin,
        'type_maintenance': random.choice(['Préventive', 'Corrective', 'Réglementaire']),
        'impact_capacite_pct': random.randint(0, 100),
        'statut': 'Planifiée'
    })

df_maintenance = pd.DataFrame(maintenance)
df_maintenance.to_csv('data_demand_response/evenements_maintenance.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ evenements_maintenance.csv : {len(df_maintenance)} lignes")

# 7. Seuils d'alerte (configuration)
print("7. Génération des seuils d'alerte...")
seuils = [
    {'nom_seuil': 'PRIX_ELEVE', 'valeur': 200, 'unite': 'EUR/MWh', 'action': 'Effacement'},
    {'nom_seuil': 'PRIX_TRES_ELEVE', 'valeur': 300, 'unite': 'EUR/MWh', 'action': 'Effacement max + Batteries'},
    {'nom_seuil': 'SOC_BAS', 'valeur': 20, 'unite': '%', 'action': 'Charger batteries'},
    {'nom_seuil': 'SOC_HAUT', 'valeur': 90, 'unite': '%', 'action': 'Décharger batteries'},
    {'nom_seuil': 'CONSO_ANORMALE', 'valeur': 1.5, 'unite': 'ratio vs baseline', 'action': 'Alerte technique'},
]

df_seuils = pd.DataFrame(seuils)
df_seuils.to_csv('data_demand_response/seuils_alerte.csv', index=False, encoding='utf-8-sig')
print(f"   ✓ seuils_alerte.csv : {len(df_seuils)} lignes")

# Résumé
print("\n" + "="*70)
print("✅ Génération terminée avec succès !")
print("="*70)
print("📁 Fichiers créés dans le dossier 'data_demand_response/':")
print(f"   1. consommation_iot_15min.csv ({len(df_conso)} lignes - données quasi-réelles)")
print(f"   2. etat_batteries_15min.csv ({len(df_batteries)} lignes)")
print(f"   3. prix_spot_marche_15min.csv ({len(df_prix)} lignes)")
print(f"   4. previsions_meteo_horaire.csv ({len(df_meteo)} lignes)")
print(f"   5. referentiel_sites.csv ({len(df_sites_ref)} lignes)")
print(f"   6. evenements_maintenance.csv ({len(df_maintenance)} lignes)")
print(f"   7. seuils_alerte.csv ({len(df_seuils)} lignes)")
print(f"\n📊 Total : {len(df_conso) + len(df_batteries) + len(df_prix) + len(df_meteo) + len(df_sites_ref) + len(df_maintenance) + len(df_seuils):,} lignes")
print("\n🚀 Vous pouvez maintenant lancer l'atelier Demand Response Dataflow Gen2.")