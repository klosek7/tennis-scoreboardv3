from flask import Flask
import os

def create_app():
    """Inicjalizacja aplikacji Flask"""
    # Ważne: Ustalamy absolutne ścieżki do katalogów templates i static
    base_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
    templates_dir = os.path.join(base_dir, 'templates')
    static_dir = os.path.join(base_dir, 'static')
    
    # Diagnostyka ścieżek
    print(f"Katalog bazowy: {base_dir}")
    print(f"Katalog szablonów: {templates_dir}")
    print(f"Czy katalog szablonów istnieje: {os.path.exists(templates_dir)}")
    print(f"Plik index.html: {os.path.join(templates_dir, 'index.html')}")
    print(f"Czy index.html istnieje: {os.path.exists(os.path.join(templates_dir, 'index.html'))}")
    
    # Tworzenie aplikacji Flask z jawnie określonymi ścieżkami
    app = Flask(__name__, 
                template_folder=templates_dir,
                static_folder=static_dir)
    
    # Upewnij się, że katalog dla meczów istnieje
    from app.config import current_config
    if not os.path.exists(current_config.MATCHES_FOLDER):
        os.makedirs(current_config.MATCHES_FOLDER)
    
    # Rejestracja tras
    from app.routes import register_routes
    register_routes(app)
    
    return app