import os
import json
import copy
from datetime import datetime
import threading
from app.models import DEFAULT_APPEARANCE, DEFAULT_STATISTICS

# Folder przechowujący dane meczów
MATCHES_FOLDER = 'matches'

# Blokada dla operacji I/O
file_lock = threading.Lock()

def save_match(match):
    """
    Zapisuje mecz do pliku JSON
    
    Args:
        match: Słownik z danymi meczu
        
    Returns:
        bool: True jeśli operacja się powiedzie, False w przeciwnym razie
    """
    try:
        if not os.path.exists(MATCHES_FOLDER):
            os.makedirs(MATCHES_FOLDER)
        
        # Upewnienie się, że match ma wszystkie potrzebne klucze
        ensure_match_structure(match)
        
        # Użycie blokady do zapobiegania konfliktom
        with file_lock:
            file_path = os.path.join(MATCHES_FOLDER, f"{match['id']}.json")
            with open(file_path, 'w', encoding='utf-8') as file:
                json.dump(match, file, ensure_ascii=False, indent=4)
        
        return True
    except Exception as e:
        print(f"Błąd podczas zapisywania meczu: {e}")
        return False

def load_match(match_id):
    """
    Wczytuje mecz z pliku na podstawie ID
    
    Args:
        match_id: ID meczu do wczytania
        
    Returns:
        dict|None: Słownik z danymi meczu lub None jeśli mecz nie istnieje
    """
    try:
        file_path = os.path.join(MATCHES_FOLDER, f"{match_id}.json")
        
        if not os.path.exists(file_path):
            return None
        
        with file_lock:
            with open(file_path, 'r', encoding='utf-8') as file:
                match = json.load(file)
        
        # Upewnienie się, że mecz ma wszystkie potrzebne klucze
        ensure_match_structure(match)
        
        return match
    except Exception as e:
        print(f"Błąd podczas wczytywania meczu {match_id}: {e}")
        return None

def get_all_matches():
    """
    Pobiera listę wszystkich zapisanych meczów
    
    Returns:
        list: Lista słowników z podstawowymi informacjami o meczach
    """
    matches = []
    
    if not os.path.exists(MATCHES_FOLDER):
        return matches
    
    for filename in os.listdir(MATCHES_FOLDER):
        if filename.endswith('.json'):
            try:
                file_path = os.path.join(MATCHES_FOLDER, filename)
                
                with file_lock:
                    with open(file_path, 'r', encoding='utf-8') as file:
                        match = json.load(file)
                
                # Obliczanie wyniku meczu dla przejrzystości
                p1_sets_won = sum(1 for s in match["score"]["player1"]["sets"] if s > 0)
                p2_sets_won = sum(1 for s in match["score"]["player2"]["sets"] if s > 0)
                
                # Dodanie czasu trwania w czytelnym formacie
                duration_str = ""
                if "time" in match and "duration" in match["time"]:
                    duration_seconds = match["time"]["duration"]
                    minutes = int(duration_seconds // 60)
                    seconds = int(duration_seconds % 60)
                    duration_str = f"{minutes:02d}:{seconds:02d}"
                
                matches.append({
                    "id": match["id"],
                    "date": match["date"],
                    "player1": match["player1"],
                    "player2": match["player2"],
                    "score": f"{p1_sets_won}:{p2_sets_won}",
                    "duration": duration_str,
                    "completed": match.get("winner", 0) > 0
                })
            except (json.JSONDecodeError, KeyError) as e:
                # Pomijamy uszkodzone pliki JSON
                print(f"Błąd przy wczytywaniu pliku {filename}: {e}")
                continue
    
    return sorted(matches, key=lambda x: x["date"], reverse=True)

def ensure_match_structure(match):
    """
    Upewnia się, że mecz ma wszystkie potrzebne klucze
    
    Args:
        match: Słownik z danymi meczu
    
    Returns:
        dict: Zaktualizowany słownik meczu
    """
    # Upewnienie się, że struktura appearance istnieje
    if "appearance" not in match:
        match["appearance"] = copy.deepcopy(DEFAULT_APPEARANCE)
    
    # Upewnienie się, że struktura statistics istnieje
    if "statistics" not in match:
        match["statistics"] = copy.deepcopy(DEFAULT_STATISTICS)
    
    # Upewnienie się, że w strukturze score istnieją pola tiebreak_points
    if "score" in match:
        for player in ["player1", "player2"]:
            if player in match["score"] and "tiebreak_points" not in match["score"][player]:
                match["score"][player]["tiebreak_points"] = 0
    
    return match

def export_match_to_csv(match_id):
    """
    Eksportuje dane meczu do CSV
    
    Args:
        match_id: ID meczu do eksportu
        
    Returns:
        str: Dane CSV lub None jeśli wystąpił błąd
    """
    match = load_match(match_id)
    if not match:
        return None
    
    import csv
    import io
    
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Nagłówek
    writer.writerow(["Mecz", f"{match['player1']} vs {match['player2']}"])
    writer.writerow(["Data", match["date"]])
    writer.writerow(["Status", "Zakończony" if match["winner"] > 0 else "W trakcie"])
    writer.writerow([])
    
    # Wynik końcowy
    writer.writerow(["Wynik końcowy"])
    p1_sets = sum(1 for s in match["score"]["player1"]["sets"] if s > 0)
    p2_sets = sum(1 for s in match["score"]["player2"]["sets"] if s > 0)
    writer.writerow([match["player1"], match["player2"]])
    writer.writerow([p1_sets, p2_sets])
    writer.writerow([])
    
    # Szczegóły setów
    writer.writerow(["Szczegóły setów"])
    writer.writerow(["Set", match["player1"], match["player2"]])
    for i in range(3):
        if match["score"]["player1"]["sets"][i] > 0 or match["score"]["player2"]["sets"][i] > 0:
            writer.writerow([i+1, match["score"]["player1"]["sets"][i], match["score"]["player2"]["sets"][i]])
    writer.writerow([])
    
    # Historia
    writer.writerow(["Historia meczu"])
    writer.writerow(["Czas", "Akcja", "Gracz", "Stan przed"])
    for entry in match["history"]:
        action = entry["action"]
        player = entry.get("player", "")
        player_name = match["player1"] if player == 1 else match["player2"] if player == 2 else ""
        
        state = ""
        if "state_before" in entry:
            state = f"{entry['state_before']['player1_points']}:{entry['state_before']['player2_points']}"
        
        writer.writerow([entry["timestamp"], action, player_name, state])
    
    output.seek(0)
    return output.getvalue()