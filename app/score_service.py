from datetime import datetime
from app.storage import save_match

def process_add_point(match, player_num):
    """
    Dodaje punkt dla zawodnika
    
    Args:
        match: Słownik meczu
        player_num: Numer zawodnika (1 lub 2)
    
    Returns:
        dict: Zaktualizowany mecz
    """
    player_key = f"player{player_num}"
    other_player = "player1" if player_num == 2 else "player2"
    
    # Obsługa tie-breaka - naprawiony błąd - sprawdzenie czy istnieje pole is_tiebreak
    if match.get("is_tiebreak", False):
        process_tiebreak_point(match, player_num)
        return match
    
    p1_points = match["score"]["player1"]["points"]
    p2_points = match["score"]["player2"]["points"]
    
    # Logika punktacji tenisa
    if match["advantage_rule"]:
        # Z zasadą przewag
        if player_key == "player1":
            if p1_points == "0":
                match["score"]["player1"]["points"] = "15"
            elif p1_points == "15":
                match["score"]["player1"]["points"] = "30"
            elif p1_points == "30":
                match["score"]["player1"]["points"] = "40"
            elif p1_points == "40" and p2_points != "40" and p2_points != "AD":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 1)
            elif p1_points == "40" and p2_points == "40":
                match["score"]["player1"]["points"] = "AD"
            elif p1_points == "40" and p2_points == "AD":
                match["score"]["player2"]["points"] = "40"
            elif p1_points == "AD":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 1)
        else:  # player2
            if p2_points == "0":
                match["score"]["player2"]["points"] = "15"
            elif p2_points == "15":
                match["score"]["player2"]["points"] = "30"
            elif p2_points == "30":
                match["score"]["player2"]["points"] = "40"
            elif p2_points == "40" and p1_points != "40" and p1_points != "AD":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 2)
            elif p2_points == "40" and p1_points == "40":
                match["score"]["player2"]["points"] = "AD"
            elif p2_points == "40" and p1_points == "AD":
                match["score"]["player1"]["points"] = "40"
            elif p2_points == "AD":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 2)
    else:
        # Bez zasady przewag (sudden death przy 40:40)
        if player_key == "player1":
            if p1_points == "0":
                match["score"]["player1"]["points"] = "15"
            elif p1_points == "15":
                match["score"]["player1"]["points"] = "30"
            elif p1_points == "30":
                match["score"]["player1"]["points"] = "40"
            elif p1_points == "40":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 1)
        else:  # player2
            if p2_points == "0":
                match["score"]["player2"]["points"] = "15"
            elif p2_points == "15":
                match["score"]["player2"]["points"] = "30"
            elif p2_points == "30":
                match["score"]["player2"]["points"] = "40"
            elif p2_points == "40":
                # Wygrana gema
                match["score"]["player1"]["points"] = "0"
                match["score"]["player2"]["points"] = "0"
                process_add_game(match, 2)
    
    return match

def process_tiebreak_point(match, player_num):
    """
    Obsługa punktacji podczas tie-breaka
    
    Args:
        match: Słownik meczu
        player_num: Numer zawodnika (1 lub 2)
    
    Returns:
        dict: Zaktualizowany mecz
    """
    player_key = f"player{player_num}"
    other_player = "player1" if player_num == 2 else "player2"
    
    # Naprawiony błąd - inicjalizacja punktów tie-breaka jeśli nie istnieją
    if "tiebreak_points" not in match["score"]["player1"]:
        match["score"]["player1"]["tiebreak_points"] = 0
        match["score"]["player2"]["tiebreak_points"] = 0
    
    # Zwiększenie liczby punktów
    match["score"][player_key]["tiebreak_points"] += 1
    
    # Pobranie punktów obu graczy
    p1_points = match["score"]["player1"]["tiebreak_points"]
    p2_points = match["score"]["player2"]["tiebreak_points"]
    
    # Sprawdzenie wygranego tie-breaka
    # Wygrywa zawodnik, który pierwszy zdobędzie 7 punktów z przewagą 2 punktów
    if player_num == 1 and (p1_points >= 7 and p1_points - p2_points >= 2):
        # Player 1 wygrywa tie-break i seta
        end_tiebreak(match, 1)
    elif player_num == 2 and (p2_points >= 7 and p2_points - p1_points >= 2):
        # Player 2 wygrywa tie-break i seta
        end_tiebreak(match, 2)
    else:
        # Tie-break trwa, aktualizuj wyświetlanie punktów
        match["score"]["player1"]["points"] = str(p1_points)
        match["score"]["player2"]["points"] = str(p2_points)
    
    return match

def end_tiebreak(match, winner):
    """
    Zakończenie tie-breaka i przejście do następnego seta
    
    Args:
        match: Słownik meczu
        winner: Numer zwycięzcy (1 lub 2)
    
    Returns:
        dict: Zaktualizowany mecz
    """
    current_set = match["current_set"] - 1  # Indeks zaczyna się od 0
    player_key = f"player{winner}"
    other_player = "player1" if winner == 2 else "player2"
    
    # Zapisz wynik seta (7-6 dla zwycięzcy tie-breaka)
    match["score"][player_key]["sets"][current_set] = 7
    match["score"][other_player]["sets"][current_set] = 6
    
    # Reset gemów
    match["score"]["player1"]["games"] = 0
    match["score"]["player2"]["games"] = 0
    
    # Reset punktów tie-breaka
    match["score"]["player1"]["tiebreak_points"] = 0
    match["score"]["player2"]["tiebreak_points"] = 0
    match["score"]["player1"]["points"] = "0"
    match["score"]["player2"]["points"] = "0"
    
    # Wyłączenie trybu tie-breaka
    match["is_tiebreak"] = False
    
    # Naprawiony błąd - zapisanie informacji o zakończeniu seta
    current_time = datetime.now()
    end_current_set(match, current_time)
    
    # Sprawdź czy mecz się skończył
    check_match_winner(match)
    
    # Przejdź do następnego seta jeśli mecz się nie skończył
    if match["winner"] == 0:
        match["current_set"] += 1
        
        # Dodanie informacji o nowym secie
        # Naprawiony błąd - inicjalizacja informacji o nowym secie
        if len(match["time"]["sets"]) < match["current_set"]:
            match["time"]["sets"].append({
                "start": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "end": "",
                "duration": 0
            })
    
    return match

def process_add_game(match, player_num):
    """
    Dodaje gem dla zawodnika
    
    Args:
        match: Słownik meczu
        player_num: Numer zawodnika (1 lub 2)
    
    Returns:
        dict: Zaktualizowany mecz
    """
    player_key = f"player{player_num}"
    other_player = "player1" if player_num == 2 else "player2"
    current_set = match["current_set"] - 1  # Indeks zaczyna się od 0
    
    # Zakończenie aktualnego gema
    current_time = datetime.now()
    end_current_game(match, current_time)
    
    # Zwiększenie liczby gemów
    match["score"][player_key]["games"] += 1
    games = match["score"][player_key]["games"]
    other_games = match["score"][other_player]["games"]
    
    # Zmiana serwującego po każdym gemie
    match["serving_player"] = 1 if match["serving_player"] == 2 else 2
    
    # Sprawdzenie czy zaczyna się tie-break (6:6)
    if games == 6 and other_games == 6:
        # Rozpocznij tie-break
        start_tiebreak(match)
        return match
    
    # Sprawdzenie wygranego seta
    if (games >= 6 and games - other_games >= 2):
        # Zapisz wynik seta
        match["score"][player_key]["sets"][current_set] = games
        match["score"][other_player]["sets"][current_set] = other_games
        
        # Reset gemów
        match["score"][player_key]["games"] = 0
        match["score"][other_player]["games"] = 0
        
        # Naprawiony błąd - zapisanie informacji o zakończeniu seta
        end_current_set(match, current_time)
        
        # Sprawdź czy mecz się skończył
        check_match_winner(match)
        
        # Przejdź do następnego seta jeśli mecz się nie skończył
        if match["winner"] == 0:
            match["current_set"] += 1
            
            # Dodanie informacji o nowym secie
            if len(match["time"]["sets"]) < match["current_set"]:
                match["time"]["sets"].append({
                    "start": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "end": "",
                    "duration": 0
                })
    
    return match

def start_tiebreak(match):
    """
    Rozpoczęcie tie-breaka
    
    Args:
        match: Słownik meczu
    
    Returns:
        dict: Zaktualizowany mecz
    """
    match["is_tiebreak"] = True
    
    # Naprawiony błąd - inicjalizacja punktów tie-breaka
    match["score"]["player1"]["tiebreak_points"] = 0
    match["score"]["player2"]["tiebreak_points"] = 0
    match["score"]["player1"]["points"] = "0"
    match["score"]["player2"]["points"] = "0"
    
    return match

def check_match_winner(match):
    """
    Sprawdzenie czy mecz się zakończył
    
    Args:
        match: Słownik meczu
    
    Returns:
        int: Numer zwycięzcy (0 jeśli mecz trwa)
    """
    sets_to_win = match["sets_to_win"]
    
    # POPRAWIONE: Prawidłowe liczenie wygranych setów
    p1_sets_won = 0
    p2_sets_won = 0
    
    # Porównujemy wyniki w każdym secie, aby określić kto wygrał dany set
    for i in range(len(match["score"]["player1"]["sets"])):
        p1_games = match["score"]["player1"]["sets"][i]
        p2_games = match["score"]["player2"]["sets"][i]
        
        if p1_games > p2_games and p1_games > 0:
            p1_sets_won += 1
        elif p2_games > p1_games and p2_games > 0:
            p2_sets_won += 1
    
    winner = 0
    if p1_sets_won >= sets_to_win:
        winner = 1
    elif p2_sets_won >= sets_to_win:
        winner = 2
    
    if winner > 0:
        match["winner"] = winner
        # Zakończenie meczu
        end_match(match)
    
    return match["winner"]

def end_match(match):
    """
    Zakończenie meczu
    
    Args:
        match: Słownik meczu
    
    Returns:
        dict: Zaktualizowany mecz
    """
    current_time = datetime.now()
    
    # Zapisanie czasu zakończenia meczu
    match["time"]["end"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Aktualizacja czasu trwania meczu
    if match["time"]["start"]:
        match_start = datetime.strptime(match["time"]["start"], "%Y-%m-%d %H:%M:%S")
        match["time"]["duration"] = (current_time - match_start).total_seconds()
    
    # Dodanie informacji do historii
    p1_sets = sum(1 for s in match["score"]["player1"]["sets"] if s > 0)
    p2_sets = sum(1 for s in match["score"]["player2"]["sets"] if s > 0)
    
    history_entry = {
        "timestamp": current_time.strftime("%H:%M:%S"),
        "action": "match_completed",
        "winner": match["winner"],
        "duration": match["time"]["duration"],
        "final_score": {
            "player1_sets": p1_sets,
            "player2_sets": p2_sets,
            "sets_detail": [
                {
                    "player1_games": match["score"]["player1"]["sets"][i],
                    "player2_games": match["score"]["player2"]["sets"][i]
                } for i in range(3) if match["score"]["player1"]["sets"][i] > 0 or match["score"]["player2"]["sets"][i] > 0
            ]
        }
    }
    match["history"].append(history_entry)
    
    return match

def end_current_game(match, current_time):
    """
    Zakończenie aktualnego gema i zapisanie jego czasu trwania
    
    Args:
        match: Słownik meczu
        current_time: Aktualny czas
    
    Returns:
        dict: Zaktualizowany mecz
    """
    if "current_game_start" in match["time"] and match["time"]["current_game_start"]:
        try:
            game_start = datetime.strptime(match["time"]["current_game_start"], "%Y-%m-%d %H:%M:%S")
            game_duration = (current_time - game_start).total_seconds()
            
            # Dodanie informacji o gemie do historii
            game_info = {
                "start": match["time"]["current_game_start"],
                "end": current_time.strftime("%Y-%m-%d %H:%M:%S"),
                "duration": game_duration,
                "player1_points": match["score"]["player1"]["points"],
                "player2_points": match["score"]["player2"]["points"]
            }
            
            # Dodanie informacji jako osobny wpis w historii
            history_entry = {
                "timestamp": current_time.strftime("%H:%M:%S"),
                "action": "game_completed",
                "game_info": game_info
            }
            match["history"].append(history_entry)
            
            # Dodanie czasu gema do statystyk
            if "statistics" in match and "game_durations" in match["statistics"]:
                match["statistics"]["game_durations"].append(game_duration)
            
            # Aktualizacja czasu rozpoczęcia nowego gema
            match["time"]["current_game_start"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
        except (ValueError, TypeError) as e:
            print(f"Błąd podczas kończenia gema: {e}")
            match["time"]["current_game_start"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
    else:
        # Inicjalizacja czasu rozpoczęcia gema jeśli nie istnieje
        match["time"]["current_game_start"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
    
    return match

def end_current_set(match, current_time):
    """
    Zakończenie aktualnego seta i zapisanie jego czasu trwania
    
    Args:
        match: Słownik meczu
        current_time: Aktualny czas
    
    Returns:
        dict: Zaktualizowany mecz
    """
    current_set_index = match["current_set"] - 1
    
    # Sprawdzenie czy mamy informacje o czasie rozpoczęcia seta
    if current_set_index < len(match["time"]["sets"]):
        set_info = match["time"]["sets"][current_set_index]
        
        if "start" in set_info and set_info["start"]:
            try:
                set_start = datetime.strptime(set_info["start"], "%Y-%m-%d %H:%M:%S")
                set_duration = (current_time - set_start).total_seconds()
                
                # Aktualizacja informacji o zakończonym secie
                match["time"]["sets"][current_set_index]["end"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
                match["time"]["sets"][current_set_index]["duration"] = set_duration
                
                # Dodanie wpisu do historii
                history_entry = {
                    "timestamp": current_time.strftime("%H:%M:%S"),
                    "action": "set_completed",
                    "set_number": match["current_set"],
                    "duration": set_duration,
                    "player1_games": match["score"]["player1"]["sets"][current_set_index],
                    "player2_games": match["score"]["player2"]["sets"][current_set_index]
                }
                match["history"].append(history_entry)
            except (ValueError, TypeError) as e:
                print(f"Błąd podczas kończenia seta: {e}")
    
    return match

def update_match_score(match, action, player_num):
    """
    Główna funkcja do aktualizacji wyniku meczu
    
    Args:
        match: Słownik meczu
        action: Rodzaj akcji (add_point, remove_point, add_game, remove_game, itd.)
        player_num: Numer zawodnika (1 lub 2)
    
    Returns:
        dict: Zaktualizowany mecz
    """
    # Sprawdzenie czy mecz się zakończył
    if match["winner"] != 0 and action not in ["reset", "end_match"]:
        return match
    
    # Zapisanie aktualnego stanu przed zmianą (dla historii)
    old_p1_points = match["score"]["player1"]["points"]
    old_p2_points = match["score"]["player2"]["points"]
    
    # Pobranie aktualnego czasu
    current_time = datetime.now()
    
    # Dodanie wpisu do historii
    history_entry = {
        "timestamp": current_time.strftime("%H:%M:%S"),
        "action": action,
        "player": player_num,
        "state_before": {
            "player1_points": old_p1_points,
            "player2_points": old_p2_points,
            "player1_games": match["score"]["player1"]["games"],
            "player2_games": match["score"]["player2"]["games"],
            "current_set": match["current_set"],
            "is_tiebreak": match.get("is_tiebreak", False)
        }
    }
    match["history"].append(history_entry)
    
    # Obsługa poszczególnych akcji
    if action == "add_point":
        process_add_point(match, player_num)
    elif action == "remove_point":
        process_remove_point(match, player_num)
    elif action == "add_game":
        # Zakończenie aktualnego gema i rozpoczęcie nowego
        end_current_game(match, current_time)
        process_add_game(match, player_num)
    elif action == "remove_game":
        process_remove_game(match, player_num)
    elif action == "toggle_serving":
        # Zmiana serwującego
        match["serving_player"] = 1 if match["serving_player"] == 2 else 2
    elif action == "end_match":
        # Ręczne zakończenie meczu
        if match["winner"] == 0:
            determine_winner(match)
        end_match(match)
    elif action == "reset":
        reset_match(match)
    
    # Aktualizacja czasu trwania meczu
    update_match_duration(match, current_time)
    
    # Zapisanie meczu
    save_match(match)
    
    return match

def process_remove_point(match, player_num):
    """Obsługa cofnięcia punktu"""
    player_key = f"player{player_num}"
    
    # Obsługa cofnięcia punktu w tie-breaku
    if match.get("is_tiebreak", False):
        if "tiebreak_points" not in match["score"][player_key]:
            match["score"][player_key]["tiebreak_points"] = 0
        
        if match["score"][player_key]["tiebreak_points"] > 0:
            match["score"][player_key]["tiebreak_points"] -= 1
            # Aktualizacja wyświetlania
            p1_points = match["score"]["player1"]["tiebreak_points"]
            p2_points = match["score"]["player2"]["tiebreak_points"]
            match["score"]["player1"]["points"] = str(p1_points)
            match["score"]["player2"]["points"] = str(p2_points)
        return match
    
    p_points = match["score"][player_key]["points"]
    
    if p_points == "15":
        match["score"][player_key]["points"] = "0"
    elif p_points == "30":
        match["score"][player_key]["points"] = "15"
    elif p_points == "40":
        match["score"][player_key]["points"] = "30"
    elif p_points == "AD":
        match["score"][player_key]["points"] = "40"
    
    return match

def process_remove_game(match, player_num):
    """Obsługa cofnięcia gema"""
    player_key = f"player{player_num}"
    
    # Jeśli jest tie-break, cofnij do stanu 6:6
    if match.get("is_tiebreak", False):
        match["is_tiebreak"] = False
        match["score"]["player1"]["games"] = 6
        match["score"]["player2"]["games"] = 6
        match["score"]["player1"]["tiebreak_points"] = 0
        match["score"]["player2"]["tiebreak_points"] = 0
        match["score"]["player1"]["points"] = "0"
        match["score"]["player2"]["points"] = "0"
        return match
    
    if match["score"][player_key]["games"] > 0:
        match["score"][player_key]["games"] -= 1
        
        # Zmiana serwującego (cofnięcie zmiany)
        match["serving_player"] = 1 if match["serving_player"] == 2 else 2
    
    return match

def reset_match(match):
    """Reset wyniku meczu"""
    current_time = datetime.now()
    match["current_set"] = 1
    match["winner"] = 0
    match["is_tiebreak"] = False
    
    # Reset czasów
    match["time"]["current_game_start"] = current_time.strftime("%Y-%m-%d %H:%M:%S")
    
    # Resetowanie setów - zachowaj tylko pierwszy
    if len(match["time"]["sets"]) > 0:
        first_set = {
            "start": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "end": "",
            "duration": 0
        }
        match["time"]["sets"] = [first_set]
    
    # Reset wyniku
    match["score"] = {
        "player1": {
            "sets": [0, 0, 0],
            "games": 0,
            "points": "0",
            "tiebreak_points": 0
        },
        "player2": {
            "sets": [0, 0, 0],
            "games": 0,
            "points": "0",
            "tiebreak_points": 0
        }
    }
    
    # Dodanie informacji o resecie do historii
    history_entry = {
        "timestamp": current_time.strftime("%H:%M:%S"),
        "action": "match_reset"
    }
    match["history"].append(history_entry)
    
    return match

def determine_winner(match):
    """
    Określenie zwycięzcy na podstawie aktualnego wyniku
    
    Args:
        match: Słownik meczu
        
    Returns:
        int: Numer zwycięzcy (0 jeśli brak jednoznacznego zwycięzcy)
    """
    sets_to_win = match["sets_to_win"]
    
    # POPRAWIONE: Prawidłowe liczenie wygranych setów
    p1_sets_won = 0
    p2_sets_won = 0
    
    # Porównujemy wyniki w każdym secie, aby określić kto wygrał dany set
    for i in range(len(match["score"]["player1"]["sets"])):
        p1_games = match["score"]["player1"]["sets"][i]
        p2_games = match["score"]["player2"]["sets"][i]
        
        if p1_games > p2_games and p1_games > 0:
            p1_sets_won += 1
        elif p2_games > p1_games and p2_games > 0:
            p2_sets_won += 1
    
    if p1_sets_won >= sets_to_win:
        winner = 1
    elif p2_sets_won >= sets_to_win:
        winner = 2
    else:
        # Brak zwycięzcy, ponieważ żaden zawodnik nie osiągnął wymaganej liczby wygranych setów
        winner = 0
    
    return winner

def update_match_duration(match, current_time):
    """Aktualizacja całkowitego czasu trwania meczu"""
    if "start" in match["time"] and match["time"]["start"]:
        try:
            match_start = datetime.strptime(match["time"]["start"], "%Y-%m-%d %H:%M:%S")
            match["time"]["duration"] = (current_time - match_start).total_seconds()
        except (ValueError, TypeError) as e:
            print(f"Błąd podczas aktualizacji czasu trwania meczu: {e}")
    
    return match