#!/usr/bin/env python3
"""
Główny punkt wejścia dla aplikacji Tennis Score System
"""

import os
import logging
from flask import Flask, send_from_directory
from app import create_app
from app.config import current_config

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    datefmt='%d-%b-%y %H:%M:%S'
)

logger = logging.getLogger(__name__)

# Tworzenie aplikacji Flask
app = create_app()

# Definicja trasy dla plików statycznych
@app.route('/static/<path:filename>')
def serve_static(filename):
    """Serwowanie plików statycznych"""
    return send_from_directory('static', filename)

# Przekierowanie do dokumentacji API
@app.route('/api')
def api_documentation():
    """Przekierowanie do dokumentacji API"""
    return """
    <h1>Tennis Score System API</h1>
    <p>Dostępne endpointy API:</p>
    <ul>
        <li><code>/api/current-match</code> - Pobiera dane aktualnego meczu</li>
        <li><code>/api/matches</code> - Pobiera listę wszystkich meczów</li>
        <li><code>/api/match/:id</code> - Pobiera dane konkretnego meczu</li>
        <li><code>/api/match/new</code> - Tworzy nowy mecz</li>
        <li><code>/api/score</code> - Aktualizuje wynik meczu</li>
        <li><code>/api/appearance</code> - Aktualizuje wygląd tablicy wyników</li>
        <li><code>/api/match/:id/statistics</code> - Pobiera statystyki meczu</li>
        <li><code>/api/match/:id/export/csv</code> - Eksport danych meczu do CSV</li>
    </ul>
    """

def create_template_dir():
    """Tworzy katalogi dla szablonów HTML jeśli nie istnieją"""
    for dir_name in ['templates', 'static/css', 'static/js']:
        if not os.path.exists(dir_name):
            os.makedirs(dir_name)
            logger.info(f"Utworzono katalog: {dir_name}")

if __name__ == '__main__':
    # Upewnienie się, że katalogi dla szablonów istnieją
    create_template_dir()
    
    # Uruchomienie serwera
    logger.info(f"Uruchamianie serwera na {current_config.HOST}:{current_config.PORT}")
    logger.info(f"Tryb debugowania: {current_config.DEBUG}")
    logger.info(f"Folder z meczami: {current_config.MATCHES_FOLDER}")
    
    app.run(
        host=current_config.HOST, 
        port=current_config.PORT, 
        debug=current_config.DEBUG
    )