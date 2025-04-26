import copy
from datetime import datetime
from app.models import DEFAULT_MATCH, DEFAULT_APPEARANCE, DEFAULT_STATISTICS
import uuid
from app.storage import save_match

def reset_match_data(match, close_match=False):
    """
    Resetowanie wszystkich danych meczu do wartości domyślnych
    
    Args:
        match: Słownik meczu
        close_match: Czy zamknąć mecz
        
    Returns:
        dict: Zaktualizowany mecz lub None jeśli mecz zamknięty
    """
    if close_match:
        return None
    
    # Zachowanie ID i pewnych ustawień
    match_id = match.get("id", str(uuid.uuid4()))
    appearance = copy.deepcopy(match.get("appearance", DEFAULT_APPEARANCE.copy()))
    
    # Tworzenie nowego meczu z domyślnymi wartościami
    reset_match = copy.deepcopy(DEFAULT_MATCH)
    reset_match["id"] = match_id
    reset_match["appearance"] = appearance
    
    # Używamy odpowiedniego formatu daty
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_timestamp = datetime.now().strftime("%H:%M:%S")
    
    reset_match["date"] = current_time
    
    # Rozpoczęcie nowego pomiaru czasu
    reset_match["time"]["start"] = current_time
    reset_match["time"]["sets"] = [{
        "start": current_time,
        "end": "",
        "duration": 0
    }]
    reset_match["time"]["current_game_start"] = current_time
    
    # Dodanie wpisu do historii
    reset_match["history"].append({
        "action": "reset_data",
        "timestamp": current_timestamp
    })
    
    # Zapisanie meczu
    save_match(reset_match)
    
    return reset_match

def calculate_match_statistics(match):
    """
    Obliczanie statystyk meczu na podstawie historii
    
    Args:
        match: Słownik meczu
        
    Returns:
        dict: Słownik ze statystykami
    """
    stats = {
        "general": {
            "total_points": 0,
            "total_games": 0,
            "match_duration": format_duration(match["time"].get("duration", 0)) if "duration" in match["time"] else "00:00"
        },
        "player1": {
            "name": match["player1"],
            "points_won": 0,
            "games_won": 0,
            "sets_won": 0,
            "win_percentage": 0
        },
        "player2": {
            "name": match["player2"],
            "points_won": 0,
            "games_won": 0,
            "sets_won": 0,
            "win_percentage": 0
        },
        "game_durations": {
            "average": 0,
            "shortest": 0,
            "longest": 0
        }
    }
    
    # Zliczanie punktów z historii
    points_p1 = 0
    points_p2 = 0
    for entry in match["history"]:
        if entry["action"] == "add_point":
            if entry["player"] == 1:
                points_p1 += 1
            else:
                points_p2 += 1
    
    # Zliczanie wygranych gemów i setów
    games_p1 = 0
    games_p2 = 0
    for i in range(3):  # 3 możliwe sety
        if "score" in match and "player1" in match["score"] and "sets" in match["score"]["player1"]:
            p1_games = match["score"]["player1"]["sets"][i]
            p2_games = match["score"]["player2"]["sets"][i]
            
            if p1_games > p2_games:
                stats["player1"]["sets_won"] += 1
            elif p2_games > p1_games:
                stats["player2"]["sets_won"] += 1
            
            games_p1 += p1_games
            games_p2 += p2_games
    
    stats["player1"]["games_won"] = games_p1
    stats["player2"]["games_won"] = games_p2
    
    # Analiza czasów gemów
    game_durations = []
    for entry in match["history"]:
        if entry["action"] == "game_completed" and "game_info" in entry and "duration" in entry["game_info"]:
            game_durations.append(entry["game_info"]["duration"])
    
    # Aktualizacja statystyk
    stats["general"]["total_points"] = points_p1 + points_p2
    stats["player1"]["points_won"] = points_p1
    stats["player2"]["points_won"] = points_p2
    
    # Procent wygranych punktów
    total_points = points_p1 + points_p2
    if total_points > 0:
        stats["player1"]["win_percentage"] = round((points_p1 / total_points) * 100)
        stats["player2"]["win_percentage"] = round((points_p2 / total_points) * 100)
    
    # Statystyki czasów gemów
    if game_durations:
        stats["game_durations"]["average"] = sum(game_durations) / len(game_durations)
        stats["game_durations"]["shortest"] = min(game_durations)
        stats["game_durations"]["longest"] = max(game_durations)
        stats["general"]["total_games"] = len(game_durations)
    
    return stats

def format_duration(seconds):
    """
    Formatowanie czasu z sekund do formatu MM:SS
    
    Args:
        seconds: Liczba sekund
        
    Returns:
        str: Czas w formacie MM:SS
    """
    if not seconds:
        return "00:00"
    
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    return f"{minutes:02d}:{remaining_seconds:02d}"

def get_match_status_text(match):
    """
    Przygotowanie tekstu statusu meczu
    
    Args:
        match: Słownik meczu
        
    Returns:
        str: Tekst statusu meczu
    """
    if match["winner"] > 0:
        winner_name = match["player1"] if match["winner"] == 1 else match["player2"]
        return f"Mecz zakończony. Zwycięzca: {winner_name}"
    
    if match["is_tiebreak"]:
        return f"Mecz w trakcie (Tie-break)"
    
    p1_sets = sum(1 for s in match["score"]["player1"]["sets"] if s > 0)
    p2_sets = sum(1 for s in match["score"]["player2"]["sets"] if s > 0)
    
    return f"Mecz w trakcie, wynik {p1_sets}:{p2_sets} (Set {match['current_set']})"