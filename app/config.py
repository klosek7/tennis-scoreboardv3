"""
Konfiguracja aplikacji
"""

import os

class Config:
    """Podstawowa konfiguracja aplikacji"""
    # Folder przechowujący dane meczów
    MATCHES_FOLDER = os.environ.get('MATCHES_FOLDER', 'matches')
    
    # Konfiguracja aplikacji Flask
    DEBUG = os.environ.get('DEBUG', 'True').lower() in ('true', 'yes', '1')
    SECRET_KEY = os.environ.get('SECRET_KEY', 'twoj-tajny-klucz-aplikacji')
    
    # Konfiguracja serwera
    HOST = os.environ.get('HOST', '0.0.0.0')
    PORT = int(os.environ.get('PORT', 5000))
    
    # Konfiguracja eksportu
    EXPORT_FORMATS = ['csv', 'pdf']
    
    # Konfiguracja templatów
    THEME_PRESETS = {
        'default': {
            'playerBg1': 'rgba(30, 144, 255, 0.7)',
            'playerBg2': 'rgba(220, 20, 60, 0.7)',
            'background': 'rgba(0, 0, 0, 0.8)',
            'textColor': 'white'
        },
        'wimbledon': {
            'playerBg1': 'rgba(0, 100, 0, 0.8)',
            'playerBg2': 'rgba(0, 100, 0, 0.8)',
            'background': 'rgba(43, 43, 43, 0.9)',
            'textColor': 'white',
            'accentColor': '#8d4190'
        },
        'roland-garros': {
            'playerBg1': 'rgba(208, 94, 40, 0.8)',
            'playerBg2': 'rgba(208, 94, 40, 0.8)',
            'background': 'rgba(34, 40, 49, 0.9)',
            'textColor': 'white'
        },
        'us-open': {
            'playerBg1': 'rgba(0, 31, 91, 0.8)',
            'playerBg2': 'rgba(0, 31, 91, 0.8)',
            'background': 'rgba(0, 0, 0, 0.9)',
            'textColor': 'white',
            'accentColor': '#ffc72c'
        },
        'australian-open': {
            'playerBg1': 'rgba(0, 99, 167, 0.8)',
            'playerBg2': 'rgba(0, 99, 167, 0.8)',
            'background': 'rgba(0, 0, 0, 0.9)',
            'textColor': 'white',
            'accentColor': '#b4e0fc'
        }
    }

class DevelopmentConfig(Config):
    """Konfiguracja dla środowiska deweloperskiego"""
    DEBUG = True
    TESTING = False

class TestingConfig(Config):
    """Konfiguracja dla środowiska testowego"""
    DEBUG = True
    TESTING = True
    MATCHES_FOLDER = 'tests/matches'

class ProductionConfig(Config):
    """Konfiguracja dla środowiska produkcyjnego"""
    DEBUG = False
    TESTING = False
    
    # W produkcji warto ustawić bezpieczny klucz
    SECRET_KEY = os.environ.get('SECRET_KEY', None)
    
    # Sprawdzenie czy SECRET_KEY jest ustawiony
    @classmethod
    def init_app(cls, app):
        Config.init_app(app)
        
        # Sprawdzenie czy klucz jest ustawiony
        assert cls.SECRET_KEY, "SECRET_KEY nie jest ustawiony!"

# Słownik z dostępnymi konfiguracjami
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# Domyślna konfiguracja
current_config = config[os.environ.get('FLASK_ENV', 'default')]