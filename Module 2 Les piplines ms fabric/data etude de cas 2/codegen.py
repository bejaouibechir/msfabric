import pandas as pd
import random
from datetime import datetime, timedelta

print("🔄 Génération des données Smart Grid en cours...")

start_date = datetime(2025, 1, 1)

# ====================
# 1. INFRASTRUCTURES EXISTANTES
# ====================
# Capteurs IoT déployés dans la ville
infrastructures = []

quartiers = ['Centre_Ville', 'Zone_Industrielle', 'Quartier_Residentiel', 'Zone_Commerciale']
types_capteurs = ['Compteur_Intelligent', 'Capteur_Tension', 'Capteur_Frequence', 'Passerelle_IoT']
statuts = ['Actif', 'Actif', 'Actif', 'En_Panne', 'En_Maintenance']

for capteur_id in range(1, 101):  # 100 capteurs
    infrastructures.append({
        'CapteurID': f'CAP_{capteur_id:04d}',
        'Quartier': random.choice(quartiers),
        'TypeCapteur': random.choice(types_capteurs),
        'DateInstallation': (start_date - timedelta(days=random.randint(30, 730))).strftime('%Y-%m-%d'),
        'Statut': random.choice(statuts),
        'DerniereMAJ': (start_date - timedelta(hours=random.randint(1, 72))).strftime('%Y-%m-%d %H:%M:%S'),
        'Latitude': round(48.8566 + random.uniform(-0.05, 0.05), 6),
        'Longitude': round(2.3522 + random.uniform(-0.05, 0.05), 6)
    })

df_infra = pd.DataFrame(infrastructures)
df_infra.to_csv('infrastructures_existantes.csv', index=False, encoding='utf-8')
print(f"✅ infrastructures_existantes.csv créé ({len(df_infra)} lignes)")

# ====================
# 2. DONNÉES IoT MONITORING (temps réel)
# ====================
# Relevés des capteurs sur 3 jours
monitoring = []

for capteur_id in range(1, 101):
    for hour in range(72):  # 3 jours de données horaires
        timestamp = start_date + timedelta(hours=hour)
        
        # Simuler des anomalies (pics de consommation, pertes)
        consommation_base = random.uniform(50, 300)
        if random.random() < 0.05:  # 5% d'anomalies
            consommation_base *= random.uniform(1.5, 2.5)
        
        tension = random.uniform(220, 240)
        if random.random() < 0.03:  # 3% de chutes de tension
            tension *= random.uniform(0.7, 0.9)
        
        monitoring.append({
            'CapteurID': f'CAP_{capteur_id:04d}',
            'Timestamp': timestamp.strftime('%Y-%m-%d %H:%M:%S'),
            'Consommation_kWh': round(consommation_base, 2),
            'Tension_V': round(tension, 2),
            'Frequence_Hz': round(random.uniform(49.8, 50.2), 2),
            'FacteurPuissance': round(random.uniform(0.85, 0.98), 2),
            'Temperature_C': round(random.uniform(15, 35), 1),
            'Qualite_Signal': random.choice(['Excellent', 'Bon', 'Moyen', 'Faible'])
        })

df_monitoring = pd.DataFrame(monitoring)
df_monitoring.to_csv('monitoring_iot.csv', index=False, encoding='utf-8')
print(f"✅ monitoring_iot.csv créé ({len(df_monitoring)} lignes)")

# ====================
# 3. INCIDENTS ET ALERTES
# ====================
# Log des incidents détectés par le système
incidents = []

types_incidents = ['Surconsommation', 'Chute_Tension', 'Perte_Signal', 'Surchauffe', 'Anomalie_Frequence']
severites = ['Faible', 'Moyenne', 'Haute', 'Critique']

for incident_id in range(1, 51):  # 50 incidents
    timestamp_incident = start_date + timedelta(hours=random.randint(0, 72))
    
    incidents.append({
        'IncidentID': f'INC_{incident_id:04d}',
        'CapteurID': f'CAP_{random.randint(1, 100):04d}',
        'Timestamp': timestamp_incident.strftime('%Y-%m-%d %H:%M:%S'),
        'TypeIncident': random.choice(types_incidents),
        'Severite': random.choice(severites),
        'Resolu': random.choice([True, True, True, False]),  # 75% résolus
        'TempsResolution_Min': random.randint(5, 180) if random.random() > 0.25 else None,
        'Description': f"Détection automatique via ML - Seuil dépassé"
    })

df_incidents = pd.DataFrame(incidents)
df_incidents.to_csv('incidents_alertes.csv', index=False, encoding='utf-8')
print(f"✅ incidents_alertes.csv créé ({len(df_incidents)} lignes)")

# ====================
# 4. MÉTRIQUES DE PERFORMANCE (agrégées par quartier)
# ====================
# Métriques quotidiennes par quartier
metriques = []

for quartier in quartiers:
    for day in range(7):  # 1 semaine de métriques
        date = start_date + timedelta(days=day)
        
        metriques.append({
            'Date': date.strftime('%Y-%m-%d'),
            'Quartier': quartier,
            'Consommation_Totale_MWh': round(random.uniform(100, 500), 2),
            'Pertes_Energie_Pct': round(random.uniform(2, 12), 2),
            'Nombre_Pannes': random.randint(0, 5),
            'Temps_Reponse_Moyen_Min': round(random.uniform(5, 45), 1),
            'Taux_Disponibilite_Pct': round(random.uniform(95, 99.9), 2),
            'Emissions_CO2_Tonnes': round(random.uniform(10, 50), 2)
        })

df_metriques = pd.DataFrame(metriques)
df_metriques.to_csv('metriques_performance.csv', index=False, encoding='utf-8')
print(f"✅ metriques_performance.csv créé ({len(df_metriques)} lignes)")

# ====================
# 5. TABLE DE RÉFÉRENCE - SEUILS ALERTES
# ====================
# Configuration des seuils par type de capteur (petite table de référence)
seuils = [
    {'TypeCapteur': 'Compteur_Intelligent', 'Seuil_Consommation_kWh': 400, 'Seuil_Tension_Min_V': 210, 'Seuil_Tension_Max_V': 250},
    {'TypeCapteur': 'Capteur_Tension', 'Seuil_Consommation_kWh': None, 'Seuil_Tension_Min_V': 215, 'Seuil_Tension_Max_V': 245},
    {'TypeCapteur': 'Capteur_Frequence', 'Seuil_Consommation_kWh': None, 'Seuil_Tension_Min_V': 220, 'Seuil_Tension_Max_V': 240},
    {'TypeCapteur': 'Passerelle_IoT', 'Seuil_Consommation_kWh': 100, 'Seuil_Tension_Min_V': 220, 'Seuil_Tension_Max_V': 240}
]

df_seuils = pd.DataFrame(seuils)
df_seuils.to_csv('seuils_alertes_ref.csv', index=False, encoding='utf-8')
print(f"✅ seuils_alertes_ref.csv créé ({len(df_seuils)} lignes)")

print("\n🎉 Génération terminée ! Fichiers prêts pour atelier 2.")
print("📂 Fichiers créés :")
print("   - infrastructures_existantes.csv (100 capteurs)")
print("   - monitoring_iot.csv (7200 relevés - 100 capteurs × 72h)")
print("   - incidents_alertes.csv (50 incidents)")
print("   - metriques_performance.csv (28 lignes - 4 quartiers × 7 jours)")
print("   - seuils_alertes_ref.csv (4 lignes - table de référence)")