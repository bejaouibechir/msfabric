import json
import time
import random
from datetime import datetime, timezone
from azure.eventhub import EventHubProducerClient, EventData

# --- CONFIGURATION (coller vos valeurs depuis l'Eventstream) ---
CONNECTION_STR = "Endpoint=sb://esehparjk1eba92b8ijb5b7.servicebus.windows.net/;SharedAccessKeyName=key_62e03d6e-ee7f-456f-9462-22ecbb5451b7;SharedAccessKey=A+Jhl2bKXX6de45+OeZumS7YVo6V8bahe+AEhCJfWvU=;EntityPath=es_cf791d0f-835d-46ae-b953-bb11c21ee638"
EVENTHUB_NAME = "es_cf791d0f-835d-46ae-b953-bb11c21ee638"

TURBINES = ["WT-001", "WT-002", "WT-003", "WT-004", "WT-005"]
PARK_NAME = "Parc Eolien Bizerte"  # Tunisie, zone à fort potentiel éolien

def generate_turbine_event(turbine_id):
    wind_speed = random.uniform(3.0, 25.0)
    
    # Courbe de puissance simplifiée
    if wind_speed < 3.5:
        power = 0  # en dessous du seuil de démarrage
    elif wind_speed > 22:
        power = 0  # arrêt pour protection
    else:
        power = min(3000, (wind_speed - 3.5) ** 2 * 18)
    
    rotor_rpm = wind_speed * 1.2 + random.uniform(-1, 1)
    gen_temp = 55 + (power / 3000) * 35 + random.uniform(-3, 3)
    vibration = 2.0 + random.uniform(0, 1.5)
    
    # Injection d'anomalies (10% du temps)
    if random.random() < 0.10:
        anomaly_type = random.choice(["overheat", "vibration", "underperform"])
        if anomaly_type == "overheat":
            gen_temp += random.uniform(25, 45)  # surchauffe
        elif anomaly_type == "vibration":
            vibration += random.uniform(5, 12)  # vibrations excessives
        elif anomaly_type == "underperform":
            power *= random.uniform(0.2, 0.5)  # sous-performance
    
    return {
        "TurbineId": turbine_id,
        "Timestamp": datetime.now(timezone.utc).isoformat(),
        "WindSpeedMs": round(wind_speed, 2),
        "RotorRPM": round(rotor_rpm, 2),
        "PowerOutputKW": round(power, 2),
        "GeneratorTempC": round(gen_temp, 2),
        "VibrationMmS": round(vibration, 2),
        "NacelleOrientation": round(random.uniform(0, 360), 1),
        "AmbientTempC": round(random.uniform(15, 35), 1),
        "ParkName": PARK_NAME
    }

def main():
    producer = EventHubProducerClient.from_connection_string(
        conn_str=CONNECTION_STR,
        eventhub_name=EVENTHUB_NAME
    )
    print(f"Envoi d'événements vers Fabric Eventstream...")
    
    try:
        while True:
            batch = producer.create_batch()
            for turbine_id in TURBINES:
                event = generate_turbine_event(turbine_id)
                batch.add(EventData(json.dumps(event)))
                print(f"  [{event['Timestamp'][:19]}] {turbine_id} | "
                      f"Vent: {event['WindSpeedMs']}m/s | "
                      f"Puissance: {event['PowerOutputKW']}kW | "
                      f"Temp: {event['GeneratorTempC']}°C | "
                      f"Vibration: {event['VibrationMmS']}mm/s")
            producer.send_batch(batch)
            print(f"  → Batch de {len(TURBINES)} événements envoyé\n")
            time.sleep(5)  # un batch toutes les 5 secondes
    except KeyboardInterrupt:
        print("Arrêt du simulateur.")
    finally:
        producer.close()

if __name__ == "__main__":
    main()