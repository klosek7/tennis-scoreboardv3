"""
Funkcje pomocnicze dla aplikacji
"""

from datetime import datetime
import os
import json

def format_duration(seconds):
    """
    Formatuje czas z sekund na format MM:SS
    
    Args:
        seconds: Czas w sekundach (float lub int)
        
    Returns:
        str: Sformatowany czas w formacie MM:SS
    """
    if not seconds:
        return "00:00"
    
    seconds = float(seconds)
    minutes = int(seconds // 60)
    remaining_seconds = int(seconds % 60)
    
    return f"{minutes:02d}:{remaining_seconds:02d}"

def format_timestamp(timestamp):
    """
    Formatuje timestamp do czytelnej postaci
    
    Args:
        timestamp: Timestamp w formacie ISO
        
    Returns:
        str: Sformatowana data i czas
    """
    if not timestamp:
        return ""
    
    try:
        dt = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S")
        return dt.strftime("%d.%m.%Y %H:%M")
    except ValueError:
        return timestamp

def get_current_timestamp():
    """
    Zwraca aktualny timestamp w formacie ISO
    
    Returns:
        str: Aktualny timestamp
    """
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")

def get_current_time():
    """
    Zwraca aktualny czas w formacie HH:MM:SS
    
    Returns:
        str: Aktualny czas
    """
    return datetime.now().strftime("%H:%M:%S")

def calculate_duration(start_time, end_time=None):
    """
    Oblicza czas trwania między dwoma timestampami
    
    Args:
        start_time: Timestamp początkowy w formacie ISO
        end_time: Timestamp końcowy w formacie ISO (domyślnie aktualny czas)
        
    Returns:
        float: Czas trwania w sekundach
    """
    if not start_time:
        return 0
    
    try:
        start = datetime.strptime(start_time, "%Y-%m-%d %H:%M:%S")
        end = datetime.strptime(end_time, "%Y-%m-%d %H:%M:%S") if end_time else datetime.now()
        
        return (end - start).total_seconds()
    except ValueError:
        return 0

def safe_json_loads(json_str, default=None):
    """
    Bezpieczne wczytywanie JSON
    
    Args:
        json_str: String z JSON
        default: Wartość domyślna w przypadku błędu
        
    Returns:
        dict|list|default: Rozpakowany JSON lub wartość domyślna
    """
    if not json_str:
        return default
    
    try:
        return json.loads(json_str)
    except (json.JSONDecodeError, TypeError):
        return default

def ensure_dir_exists(dir_path):
    """
    Upewnia się, że katalog istnieje, tworząc go w razie potrzeby
    
    Args:
        dir_path: Ścieżka do katalogu
    """
    if not os.path.exists(dir_path):
        os.makedirs(dir_path)

def validate_file_name(file_name):
    """
    Sprawdza czy nazwa pliku jest bezpieczna
    
    Args:
        file_name: Nazwa pliku do sprawdzenia
        
    Returns:
        bool: True jeśli nazwa jest bezpieczna, False w przeciwnym wypadku
    """
    # Usunięcie nieprawidłowych znaków z nazwy pliku
    invalid_chars = '\\/:*?"<>|'
    
    # Sprawdzenie czy nazwa pliku nie zawiera nieprawidłowych znaków
    return not any(char in file_name for char in invalid_chars)

def sanitize_file_name(file_name):
    """
    Czyści nazwę pliku z nieprawidłowych znaków
    
    Args:
        file_name: Nazwa pliku do oczyszczenia
        
    Returns:
        str: Oczyszczona nazwa pliku
    """
    # Usunięcie nieprawidłowych znaków z nazwy pliku
    invalid_chars = '\\/:*?"<>|'
    
    for char in invalid_chars:
        file_name = file_name.replace(char, '_')
    
    return file_name

def get_set_score_display(match):
    """
    Zwraca tekstową reprezentację wyniku setowego
    
    Args:
        match: Słownik z danymi meczu
        
    Returns:
        str: Tekstowa reprezentacja wyniku setowego (np. "2:1")
    """
    if not match:
        return "0:0"
    
    p1_sets = sum(1 for s in match["score"]["player1"]["sets"] if s > 0 and 
                 s > match["score"]["player2"]["sets"][match["score"]["player1"]["sets"].index(s)])
    
    p2_sets = sum(1 for s in match["score"]["player2"]["sets"] if s > 0 and 
                 s > match["score"]["player1"]["sets"][match["score"]["player2"]["sets"].index(s)])
    
    return f"{p1_sets}:{p2_sets}"

def get_detailed_set_scores(match):
    """
    Zwraca listę wyników poszczególnych setów
    
    Args:
        match: Słownik z danymi meczu
        
    Returns:
        list: Lista stringów z wynikami setów (np. ["6:4", "2:6", "7:6"])
    """
    if not match:
        return []
    
    result = []
    
    for i in range(3):  # Maksymalnie 3 sety
        p1_games = match["score"]["player1"]["sets"][i]
        p2_games = match["score"]["player2"]["sets"][i]
        
        if p1_games > 0 or p2_games > 0:
            result.append(f"{p1_games}:{p2_games}")
    
    return result