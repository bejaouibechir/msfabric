"""
Script de génération de données - Scénario 3 : Gestion de crise énergétique
Contexte : Panne énergétique majeure nécessitant basculement vers énergies alternatives
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random

# Configuration
np.random.seed(42)
random.seed(42)

print("🚨 Génération des données pour Scénario 3 : Gestion de crise énergétique")
print("=" * 80)

# ============================================================================
# 1. DIAGNOSTIC DES DÉFAILLANCES (diagnostic_defaillances.csv)
# ============================================================================
print("\n📊 1/6 - Génération du diagnostic des défaillances...")

# Types d'infrastructures critiques
infrastructures = [
    {"Type": "CentraleGaz", "Zone": "Nord", "CapaciteNominale_MW": 500},
    {"Type": "CentraleGaz", "Zone": "Sud", "CapaciteNominale_MW": 450},
    {"Type": "CentraleGaz", "Zone": "Est", "CapaciteNominale_MW": 400},
    {"Type": "CentraleCharbon", "Zone": "Centre", "CapaciteNominale_MW": 600},
    {"Type": "CentraleNucleaire", "Zone": "Ouest", "CapaciteNominale_MW": 1200},
    {"Type": "LigneHauteT", "Zone": "Nord-Sud", "CapaciteNominale_MW": 800},
    {"Type": "LigneHauteT", "Zone": "Est-Ouest", "CapaciteNominale_MW": 750},
    {"Type": "Transformateur", "Zone": "Nord", "CapaciteNominale_MW": 300},
    {"Type": "Transformateur", "Zone": "Sud", "CapaciteNominale_MW": 350},
    {"Type": "Transformateur", "Zone": "Est", "CapaciteNominale_MW": 280},
]

defaillances = []
defaillance_id = 1

for infra in infrastructures:
    # Créer 1-3 défaillances par infrastructure
    nb_defaillances = random.randint(1, 3)
    
    for _ in range(nb_defaillances):
        severite = random.choice(["Critique", "Majeure", "Mineure"])
        
        # Capacité perdue dépend de la sévérité
        if severite == "Critique":
            perte_pct = random.uniform(70, 100)
        elif severite == "Majeure":
            perte_pct = random.uniform(40, 70)
        else:
            perte_pct = random.uniform(10, 40)
        
        capacite_perdue = infra["CapaciteNominale_MW"] * (perte_pct / 100)
        
        # Temps de réparation (heures)
        if severite == "Critique":
            temps_reparation = random.randint(48, 168)  # 2-7 jours
        elif severite == "Majeure":
            temps_reparation = random.randint(24, 72)   # 1-3 jours
        else:
            temps_reparation = random.randint(4, 24)    # 4-24 heures
        
        cause = random.choice([
            "SurchargeReseau",
            "DefautEquipement",
            "ConditionsMeteo",
            "CyberAttaque",
            "ErreurHumaine",
            "Vieillissement"
        ])
        
        defaillances.append({
            "DefaillanceID": f"DEF{defaillance_id:03d}",
            "Type": infra["Type"],
            "Zone": infra["Zone"],
            "Severite": severite,
            "CapaciteNominale": infra["CapaciteNominale_MW"],
            "CapacitePerdue": round(capacite_perdue, 2),
            "TauxPerte": round(perte_pct, 2),
            "TempsReparation": temps_reparation,
            "Cause": cause,
            "StatutReparation": random.choice(["EnCours", "EnAttente", "Planifie"]),
            "Priorite": random.randint(1, 5),
            "DateDetection": (datetime.now() - timedelta(hours=random.randint(1, 48))).strftime("%Y-%m-%d %H:%M:%S")
        })
        
        defaillance_id += 1

df_defaillances = pd.DataFrame(defaillances)
print(f"   ✅ {len(df_defaillances)} défaillances générées")
print(f"   📊 Capacité totale perdue : {df_defaillances['CapacitePerdue'].sum():.2f} MW")

# ============================================================================
# 2. STOCKAGE BATTERIES (stockage_batteries.csv)
# ============================================================================
print("\n🔋 2/6 - Génération de l'inventaire des batteries...")

batteries = []
battery_id = 1

zones = ["Nord", "Sud", "Est", "Ouest", "Centre"]
for zone in zones:
    # 3-5 sites de batteries par zone
    nb_sites = random.randint(3, 5)
    
    for site in range(1, nb_sites + 1):
        type_batterie = random.choice(["LithiumIon", "SodiumSoufre", "RedoxFlow", "PlombAcide"])
        
        # Capacité selon le type
        if type_batterie == "LithiumIon":
            capacite = random.randint(50, 150)
        elif type_batterie == "SodiumSoufre":
            capacite = random.randint(100, 300)
        elif type_batterie == "RedoxFlow":
            capacite = random.randint(200, 500)
        else:
            capacite = random.randint(30, 100)
        
        charge_actuelle = random.uniform(20, 95)
        etat_sante = random.uniform(75, 100)
        
        batteries.append({
            "BatterieID": f"BAT{battery_id:03d}",
            "Zone": zone,
            "Site": f"Site{site}",
            "Type": type_batterie,
            "CapaciteMax": capacite,
            "ChargeActuelle": round(charge_actuelle, 2),
            "EtatSante": round(etat_sante, 2),
            "TauxDecharge": round(capacite * 0.25, 2),  # 25% de la capacité par heure
            "DureeAutonomie": round((charge_actuelle / 100) * capacite / (capacite * 0.25), 2),
            "Statut": random.choice(["Disponible", "EnCharge", "EnDecharge", "Maintenance"]),
            "DateMaintenance": (datetime.now() - timedelta(days=random.randint(1, 180))).strftime("%Y-%m-%d"),
            "CyclesVie": random.randint(100, 5000)
        })
        
        battery_id += 1

df_batteries = pd.DataFrame(batteries)
print(f"   ✅ {len(df_batteries)} sites de batteries générés")
print(f"   📊 Capacité totale de stockage : {df_batteries['CapaciteMax'].sum():.2f} MWh")

# ============================================================================
# 3. COORDINATION ACTEURS (coordination_acteurs.csv)
# ============================================================================
print("\n🤝 3/6 - Génération des contacts de coordination...")

acteurs = []
acteur_id = 1

# Types d'acteurs
types_acteurs = {
    "Gouvernement": ["MinistereEnergie", "ProtectionCivile", "PrefectureRegionale"],
    "Entreprises": ["FournisseurElectricite", "OperateurReseau", "ProducteurEnergie"],
    "Services": ["PompiersCivils", "HospitalPublic", "TransportPublic"],
    "Technique": ["IngenieurReseaux", "TechnicienMaintenance", "ExpertCrise"]
}

for categorie, sous_types in types_acteurs.items():
    for sous_type in sous_types:
        # 2-4 contacts par sous-type
        nb_contacts = random.randint(2, 4)
        
        for i in range(1, nb_contacts + 1):
            noms = ["Dubois", "Martin", "Bernard", "Petit", "Robert", "Richard", "Durand", "Leroy"]
            prenoms = ["Jean", "Marie", "Pierre", "Sophie", "Luc", "Anne", "Paul", "Claire"]
            
            disponibilite = random.choice(["Disponible", "EnMission", "Repos", "Astreinte"])
            priorite = random.randint(1, 3)
            
            acteurs.append({
                "ActeurID": f"ACT{acteur_id:03d}",
                "Categorie": categorie,
                "SousType": sous_type,
                "Nom": f"{random.choice(prenoms)} {random.choice(noms)}",
                "Telephone": f"+33 {random.randint(600000000, 799999999)}",
                "Email": f"contact{acteur_id}@{sous_type.lower()}.fr",
                "Zone": random.choice(zones),
                "Disponibilite": disponibilite,
                "Priorite": priorite,
                "TempsReponse": random.randint(5, 60),
                "DateActivation": (datetime.now() - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d"),
                "NombreInterventions": random.randint(0, 50)
            })
            
            acteur_id += 1

df_acteurs = pd.DataFrame(acteurs)
print(f"   ✅ {len(df_acteurs)} acteurs répertoriés")
print(f"   📊 {len(df_acteurs[df_acteurs['Disponibilite'] == 'Disponible'])} acteurs disponibles immédiatement")

# ============================================================================
# 4. CONVERSION GAZ-HYDROGÈNE (conversion_gazhydrogene.csv)
# ============================================================================
print("\n⚗️ 4/6 - Génération des capacités de conversion gaz-hydrogène...")

conversions = []
conversion_id = 1

for zone in zones:
    # 1-2 sites de conversion par zone
    nb_sites = random.randint(1, 2)
    
    for site in range(1, nb_sites + 1):
        type_electrolyseur = random.choice(["PEM", "Alcalin", "SOEC"])
        
        # Capacité selon le type
        if type_electrolyseur == "PEM":
            capacite_h2 = random.randint(100, 500)  # kg/jour
        elif type_electrolyseur == "Alcalin":
            capacite_h2 = random.randint(200, 800)
        else:  # SOEC
            capacite_h2 = random.randint(300, 1000)
        
        efficacite = random.uniform(65, 85)
        disponibilite = random.uniform(80, 98)
        
        conversions.append({
            "ConversionID": f"CONV{conversion_id:03d}",
            "Zone": zone,
            "Site": f"SiteH2-{site}",
            "TypeElectrolyseur": type_electrolyseur,
            "CapaciteH2": capacite_h2,
            "Rendement": round(efficacite, 2),
            "Disponibilite": round(disponibilite, 2),
            "ProductionActuelle": round(capacite_h2 * (disponibilite / 100) * random.uniform(0.5, 0.9), 2),
            "ConsommationElec": round(capacite_h2 * 0.055, 2),  # ~55 kWh par kg H2
            "StockageH2": random.randint(500, 5000),
            "CapaciteStockage": random.randint(5000, 20000),
            "Statut": random.choice(["Operationnel", "DegradMode", "ArretUrgence", "Maintenance"]),
            "DateMiseEnService": (datetime.now() - timedelta(days=random.randint(30, 1825))).strftime("%Y-%m-%d")
        })
        
        conversion_id += 1

df_conversions = pd.DataFrame(conversions)
print(f"   ✅ {len(df_conversions)} sites de conversion générés")
print(f"   📊 Production H2 totale : {df_conversions['ProductionActuelle'].sum():.2f} kg/jour")

# ============================================================================
# 5. SOURCES ALTERNATIVES (sources_alternatives.csv)
# ============================================================================
print("\n🌱 5/6 - Génération des sources d'énergie alternatives...")

alternatives = []
alternative_id = 1

types_sources = {
    "Solaire": {"capacite_range": (5, 50), "facteur_charge": 0.20},
    "Eolien": {"capacite_range": (10, 100), "facteur_charge": 0.30},
    "Biomasse": {"capacite_range": (2, 20), "facteur_charge": 0.70},
    "Hydro": {"capacite_range": (20, 200), "facteur_charge": 0.50},
    "Geothermie": {"capacite_range": (5, 50), "facteur_charge": 0.90}
}

for zone in zones:
    for type_source, params in types_sources.items():
        # 2-4 sites par type et par zone
        nb_sites = random.randint(2, 4)
        
        for site in range(1, nb_sites + 1):
            capacite = random.uniform(*params["capacite_range"])
            facteur_charge = params["facteur_charge"] * random.uniform(0.8, 1.0)
            production_actuelle = capacite * facteur_charge * random.uniform(0.7, 1.0)
            
            alternatives.append({
                "SourceID": f"ALT{alternative_id:03d}",
                "Type": type_source,
                "Zone": zone,
                "Site": f"{type_source}{site}",
                "CapaciteInstallee": round(capacite, 2),
                "FacteurCharge": round(facteur_charge * 100, 2),
                "ProductionActuelle": round(production_actuelle, 2),
                "ProductionMax": round(capacite, 2),
                "DisponibiliteRapide": random.choice(["Immediate", "30min", "2h", "6h"]),
                "TempsMontee": random.randint(5, 120),
                "CoutMarginal": round(random.uniform(20, 150), 2),
                "EmissionsCO2": round(random.uniform(0, 50), 2) if type_source != "Biomasse" else round(random.uniform(100, 200), 2),
                "StatutConnexion": random.choice(["Connecte", "Deconnecte", "EnCoursMontee"]),
                "DateInspection": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d")
            })
            
            alternative_id += 1

df_alternatives = pd.DataFrame(alternatives)
print(f"   ✅ {len(df_alternatives)} sources alternatives répertoriées")
print(f"   📊 Capacité alternative totale : {df_alternatives['CapaciteInstallee'].sum():.2f} MW")

# ============================================================================
# 6. PLAN POST-CRISE (plan_postcrise.csv)
# ============================================================================
print("\n📈 6/6 - Génération du plan d'amélioration post-crise...")

ameliorations = []
amelioration_id = 1

categories_amelioration = {
    "Infrastructure": [
        "RenforcementReseau",
        "RedondanceLignes",
        "ModernisationTransformateurs",
        "InstallationDisjoncteurs"
    ],
    "Stockage": [
        "AjoutCapaciteBatteries",
        "DiversificationTechnologies",
        "SystemesStockageDecentralises"
    ],
    "Renouvelable": [
        "AugmentationCapaciteSolaire",
        "DeveloppementEolien",
        "IntegrationBiomasse",
        "MicroGrids"
    ],
    "Coordination": [
        "FormationEquipes",
        "AmeliorationCommunication",
        "SystemeAlertePrecoce",
        "ExercicesSimulation"
    ],
    "Digitalisation": [
        "SmartGrid",
        "PredictionIA",
        "MonitoringTempsReel",
        "AutomationReseaux"
    ]
}

priorites = ["Critique", "Haute", "Moyenne", "Basse"]
statuts = ["Planifie", "EnCours", "Finalise", "Reporte"]

for categorie, actions in categories_amelioration.items():
    for action in actions:
        cout = random.uniform(100000, 5000000)
        duree = random.randint(3, 36)  # mois
        impact_capacite = random.uniform(10, 500)
        
        ameliorations.append({
            "AmeliorationID": f"AMEL{amelioration_id:03d}",
            "Categorie": categorie,
            "Action": action,
            "Description": f"Mise en œuvre de {action}",
            "Priorite": random.choice(priorites),
            "CoutEstime": round(cout, 2),
            "DureeRealistion": duree,
            "ImpactCapacite": round(impact_capacite, 2),
            "ReductionRisque": round(random.uniform(10, 80), 2),
            "ROI": round(random.uniform(2, 15), 2),
            "StatutProjet": random.choice(statuts),
            "Responsable": f"Responsable {categorie}",
            "DateDebut": (datetime.now() + timedelta(days=random.randint(1, 180))).strftime("%Y-%m-%d"),
            "BudgetAlloue": round(cout * random.uniform(0.5, 1.2), 2)
        })
        
        amelioration_id += 1

df_ameliorations = pd.DataFrame(ameliorations)
print(f"   ✅ {len(df_ameliorations)} actions d'amélioration planifiées")
print(f"   📊 Budget total nécessaire : {df_ameliorations['CoutEstime'].sum()/1000000:.2f} M€")

# ============================================================================
# SAUVEGARDE DES FICHIERS CSV
# ============================================================================
print("\n💾 Sauvegarde des fichiers CSV...")

fichiers = {
    "diagnostic_defaillances.csv": df_defaillances,
    "stockage_batteries.csv": df_batteries,
    "coordination_acteurs.csv": df_acteurs,
    "conversion_gazhydrogene.csv": df_conversions,
    "sources_alternatives.csv": df_alternatives,
    "plan_postcrise.csv": df_ameliorations
}

for nom_fichier, df in fichiers.items():
    df.to_csv(nom_fichier, index=False, encoding='utf-8-sig')
    print(f"   ✅ {nom_fichier} ({len(df)} lignes)")

# ============================================================================
# RÉSUMÉ
# ============================================================================
print("\n" + "=" * 80)
print("📋 RÉSUMÉ DES DONNÉES GÉNÉRÉES")
print("=" * 80)

print(f"""
🚨 DIAGNOSTIC DES DÉFAILLANCES
   • {len(df_defaillances)} défaillances détectées
   • Capacité perdue : {df_defaillances['CapacitePerdue'].sum():.2f} MW
   • Défaillances critiques : {len(df_defaillances[df_defaillances['Severite'] == 'Critique'])}

🔋 STOCKAGE BATTERIES
   • {len(df_batteries)} sites de batteries
   • Capacité totale : {df_batteries['CapaciteMax'].sum():.2f} MWh
   • Batteries disponibles : {len(df_batteries[df_batteries['Statut'] == 'Disponible'])}

🤝 COORDINATION ACTEURS
   • {len(df_acteurs)} acteurs répertoriés
   • Acteurs disponibles : {len(df_acteurs[df_acteurs['Disponibilite'] == 'Disponible'])}
   • Catégories : {df_acteurs['Categorie'].nunique()}

⚗️ CONVERSION GAZ-HYDROGÈNE
   • {len(df_conversions)} sites de conversion
   • Production H2 : {df_conversions['ProductionActuelle'].sum():.2f} kg/jour
   • Sites opérationnels : {len(df_conversions[df_conversions['Statut'] == 'Operationnel'])}

🌱 SOURCES ALTERNATIVES
   • {len(df_alternatives)} sources alternatives
   • Capacité totale : {df_alternatives['CapaciteInstallee'].sum():.2f} MW
   • Production actuelle : {df_alternatives['ProductionActuelle'].sum():.2f} MW

📈 PLAN POST-CRISE
   • {len(df_ameliorations)} actions d'amélioration
   • Budget total : {df_ameliorations['CoutEstime'].sum()/1000000:.2f} M€
   • Impact capacité : +{df_ameliorations['ImpactCapacite'].sum():.2f} MW
""")

print("=" * 80)
print("✅ Génération terminée avec succès !")
print("=" * 80)
print("\n📁 Prochaines étapes :")
print("   1. Uploadez ces 6 fichiers CSV dans LH_Energie_Crisis/Files/crise/")
print("   2. Créez les pipelines selon les instructions")
print("   3. Testez l'orchestration de crise")