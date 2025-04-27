import copy
import uuid
from datetime import datetime

# Zmiana modelu z 3 setów na 5 setów
DEFAULT_MATCH = {
    "id": "",
    "player1": "Zawodnik 1",
    "player2": "Zawodnik 2",
    "date": "",
    "sets_to_win": 2,  # Może być 2 lub 3
    "advantage_rule": True,
    "serving_player": 1,
    "current_set": 1,
    "is_tiebreak": False,
    "winner": 0,
    "score": {
        "player1": {
            "sets": [0, 0, 0, 0, 0],  # Maksymalnie 5 setów
            "games": 0,
            "points": "0",
            "tiebreak_points": 0
        },
        "player2": {
            "sets": [0, 0, 0, 0, 0],  # Maksymalnie 5 setów
            "games": 0,
            "points": "0",
            "tiebreak_points": 0
        }
    },
    "time": {
        "start": "",
        "end": "",
        "duration": 0,
        "sets": [],
        "current_game_start": ""
    },
    "history": []
}

# Struktura konfiguracji wyglądu
DEFAULT_APPEARANCE = {
    "theme": "default",
    "logo_url": "",
    "custom_colors": {
        "primary": "rgba(30, 144, 255, 0.7)",
        "secondary": "rgba(220, 20, 60, 0.7)",
        "background": "rgba(0, 0, 0, 0.8)"
    },
    "animations": True,
    "size": 100  # Domyślny rozmiar 100%
}

# Domyślne statystyki
DEFAULT_STATISTICS = {
    "points_won": {"player1": 0, "player2": 0},
    "service_stats": {
        "player1": {"aces": 0, "double_faults": 0},
        "player2": {"aces": 0, "double_faults": 0}
    },
    "break_points": {
        "player1": {"faced": 0, "saved": 0, "converted": 0},
        "player2": {"faced": 0, "saved": 0, "converted": 0}
    },
    "game_durations": [],
    "longest_streak": {"player1": 0, "player2": 0, "current_streak": 0, "current_player": 0}
}

def create_new_match(data):
    """
    Tworzy nowy mecz na podstawie danych wejściowych.
    
    Args:
        data: Słownik z danymi meczu
        
    Returns:
        Słownik reprezentujący nowy mecz
    """
    current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    current_timestamp = datetime.now().strftime("%H:%M:%S")
    
    new_match = copy.deepcopy(DEFAULT_MATCH)
    new_match.update({
        "id": str(uuid.uuid4()),
        "player1": data.get('player1', 'Zawodnik 1'),
        "player2": data.get('player2', 'Zawodnik 2'),
        "date": current_time,
        "sets_to_win": int(data.get('sets_to_win', 2)),
        "advantage_rule": data.get('advantage_rule', True),
        "serving_player": int(data.get('serving_player', 1)),
        "time": {
            "start": current_time,
            "end": "",
            "duration": 0,
            "sets": [{
                "start": current_time,
                "end": "",
                "duration": 0
            }],
            "current_game_start": current_time
        },
        "history": [{
            "action": "match_created",
            "timestamp": current_timestamp
        }]
    })
    
    # Dodanie konfiguracji wyglądu
    new_match["appearance"] = copy.deepcopy(DEFAULT_APPEARANCE)
    
    # Dodanie statystyk
    new_match["statistics"] = copy.deepcopy(DEFAULT_STATISTICS)
    
    return new_match

def validate_match_data(data):
    """
    Sprawdza poprawność danych meczu
    
    Args:
        data: Słownik z danymi meczu
        
    Returns:
        (bool, list): Tuple (czy dane są poprawne, lista błędów)
    """
    errors = []
    
    if not data:
        errors.append("Brak danych meczu")
        return False, errors
    
    # Sprawdzenie nazw zawodników
    if 'player1' in data and not data['player1'].strip():
        errors.append("Nazwa pierwszego zawodnika nie może być pusta")
    
    if 'player2' in data and not data['player2'].strip():
        errors.append("Nazwa drugiego zawodnika nie może być pusta")
    
    # Sprawdzenie liczby setów
    if 'sets_to_win' in data:
        try:
            sets = int(data['sets_to_win'])
            if sets < 1 or sets > 3:
                errors.append("Liczba setów musi być między 1 a 3")
        except ValueError:
            errors.append("Nieprawidłowa wartość liczby setów")
    
    # Sprawdzenie serwującego
    if 'serving_player' in data:
        try:
            serving = int(data['serving_player'])
            if serving != 1 and serving != 2:
                errors.append("Serwujący musi być 1 lub 2")
        except ValueError:
            errors.append("Nieprawidłowa wartość serwującego")
    
    return len(errors) == 0, errors

# Singleton przechowujący aktualny mecz
class MatchContext:
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(MatchContext, cls).__new__(cls)
            cls._instance.current_match = None
        return cls._instance
    
    def get_current_match(self):
        return self.current_match
    
    def set_current_match(self, match):
        self.current_match = match
    
    def has_active_match(self):
        return self.current_match is not None