# Dépendances à installer (une seule fois) :
# pip install edge-tts

import asyncio
import edge_tts
import json
import os
from pathlib import Path
import sys

# ────────────────────────────────────────────────
# CONFIGURATION - À ADAPTER À TON CHEMIN EXACT
# ────────────────────────────────────────────────

# Mets ici le chemin COMPLET vers ton dossier data
BASE_DIR = r"C:\Users\DELL\Desktop\msfabric\Module 5 Ingestion des données non structurées\data"

INPUT_JSON = Path(BASE_DIR) / "inputs.json"
OUTPUT_FOLDER = Path(BASE_DIR) / "mock_appels_mp3"

VOICE = "fr-FR-DeniseNeural"  # ou "fr-FR-HenriNeural", etc.

# Limite le nombre de générations simultanées (évite les plantages edge-tts)
MAX_CONCURRENT = 8

# ────────────────────────────────────────────────

async def generate_audio(text: str, output_path: str, voice: str = VOICE, semaphore=None):
    async with semaphore:
        try:
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save(output_path)
            print(f"OK  → {output_path}")
        except Exception as e:
            print(f"KO  → {output_path}  | {type(e).__name__}: {e}")

async def main():
    print("Script démarré")
    print(f"Python version: {sys.version}")
    print(f"Répertoire courant: {os.getcwd()}")
    
    # Vérification fichier entrée
    if not INPUT_JSON.exists():
        print(f"\nERREUR : Le fichier n'existe pas !")
        print(f"Chemin cherché : {INPUT_JSON}")
        print("Vérifiez que inputs.json est bien dans ce dossier.")
        return
    
    print(f"Fichier trouvé : {INPUT_JSON}")
    print(f"Taille fichier : {INPUT_JSON.stat().st_size:,} octets")
    
    # Lecture JSON
    try:
        with open(INPUT_JSON, encoding="utf-8") as f:
            data = json.load(f)
        print(f"Succès : {len(data)} scénarios chargés")
    except json.JSONDecodeError as e:
        print("\nERREUR DE FORMAT JSON :")
        print(e)
        print("Ouvrez le fichier dans VS Code ou Notepad++ et vérifiez qu'il commence par [")
        return
    except Exception as e:
        print(f"Erreur lecture fichier : {type(e).__name__} - {e}")
        return

    # Création dossier sortie
    OUTPUT_FOLDER.mkdir(parents=True, exist_ok=True)
    print(f"Dossier de sortie : {OUTPUT_FOLDER.resolve()}")

    semaphore = asyncio.Semaphore(MAX_CONCURRENT)
    tasks = []

    for item in data:
        try:
            id_str = f"{item['id']:03d}"
            text = item["text"].strip()
            if not text:
                print(f"→ Ignoré id {id_str} : texte vide")
                continue

            filename = f"appel_{id_str}.mp3"
            # Option : filename = f"appel_{id_str}_{item.get('intent','unknown')}_{item.get('sentiment','unknown')}.mp3"
            
            filepath = OUTPUT_FOLDER / filename
            
            task = generate_audio(text, str(filepath), VOICE, semaphore)
            tasks.append(task)
        except KeyError as e:
            print(f"Erreur format ligne id {item.get('id', '?')}: clé manquante {e}")
        except Exception as e:
            print(f"Erreur traitement id {item.get('id', '?')}: {e}")

    if not tasks:
        print("Aucun fichier à générer.")
        return

    print(f"Génération de {len(tasks)} fichiers audio...")
    await asyncio.gather(*tasks, return_exceptions=True)

    print(f"\nTerminé !")
    print(f"Dossier : {OUTPUT_FOLDER.resolve()}")
    print(f"Fichiers créés : {len(list(OUTPUT_FOLDER.glob('*.mp3')))}")

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nArrêt par l'utilisateur.")
    except Exception as e:
        print(f"Erreur fatale : {type(e).__name__} - {e}")