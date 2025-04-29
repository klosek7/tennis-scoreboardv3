import os
from flask import render_template, request, jsonify, redirect, url_for, Response
from app.models import MatchContext, create_new_match, validate_match_data
from app.storage import save_match, load_match, get_all_matches, export_match_to_csv
from app.score_service import update_match_score
from app.match_service import calculate_match_statistics
import traceback

match_context = MatchContext()

def register_routes(app):
    """Rejestracja wszystkich tras aplikacji"""
    
    # Ważne: Jawne sprawdzenie istnienia szablonu
    def check_template(template_name):
        template_path = os.path.join(app.template_folder, template_name)
        exists = os.path.exists(template_path)
        if not exists:
            app.logger.error(f"Szablon {template_name} nie istnieje w {template_path}")
        return exists
    

    
    @app.before_request
    def before_request():
        """Funkcja wywoływana przed każdym żądaniem"""
        # Weryfikacja dostępności szablonów przy pierwszym żądaniu
        if request.endpoint == 'index' and not hasattr(app, '_checked_templates'):
            app._checked_templates = True
            app.logger.info(f"Katalog szablonów: {app.template_folder}")
            app.logger.info(f"Szablon index.html: {check_template('index.html')}")
            app.logger.info(f"Szablon control.html: {check_template('control.html')}")
            app.logger.info(f"Szablon scoreboard.html: {check_template('scoreboard.html')}")
    
    @app.route('/')
    def index():
        """Strona główna"""
        app.logger.info("Próba renderowania strony głównej (index.html)")
        try:
            matches = get_all_matches()
            return render_template('index.html', matches=matches)
        except Exception as e:
            app.logger.error(f"Błąd podczas renderowania index.html: {e}")
            # Zwróć szczegóły błędu zamiast przekierowywać
            error_details = traceback.format_exc()
            return f"""
            <h1>Błąd renderowania szablonu</h1>
            <p>Wystąpił błąd podczas renderowania strony głównej:</p>
            <pre>{str(e)}</pre>
            <h2>Szczegóły techniczne:</h2>
            <pre>{error_details}</pre>
            """
    
    @app.route('/scoreboard')
    def scoreboard():
        """Tablica wyników do wyświetlania w OBS"""
        app.logger.info("Renderowanie scoreboard.html")
        return render_template('scoreboard.html')
    
    @app.route('/enhanced-scoreboards')
    def enhanced_scoreboards():
        """Rozszerzone tablice wyników do wyświetlania w OBS"""
        app.logger.info("Renderowanie enhanced-scoreboards.html")
        return render_template('enhanced-scoreboards.html')
    
    # API - Aktualizacja szablonu tablicy wyników
    @app.route('/api/scoreboard-template', methods=['POST'])
    def update_scoreboard_template():
        """Aktualizacja szablonu tablicy wyników"""
        current_match = match_context.get_current_match()
        
        if not current_match:
            return jsonify({"error": "Brak aktywnego meczu"}), 404
        
        try:
            data = request.json
            
            # Aktualizacja konfiguracji wyglądu
            if "appearance" not in current_match:
                from app.models import DEFAULT_APPEARANCE
                current_match["appearance"] = DEFAULT_APPEARANCE.copy()
            
            # Dodanie pola template do appearance, jeśli nie istnieje
            if "template" not in current_match["appearance"]:
                current_match["appearance"]["template"] = "original"
            
            # Aktualizacja szablonu
            if "template" in data:
                template = data["template"]
                # Sprawdzenie czy template jest jednym z dozwolonych
                allowed_templates = ["original", "horizontal", "vertical", "modern", "broadcast", "pro-tennis"]
                if template in allowed_templates:
                    current_match["appearance"]["template"] = template
                else:
                    return jsonify({"error": f"Niedozwolony szablon: {template}"}), 400
            
            # Zapisanie meczu
            match_context.set_current_match(current_match)
            save_match(current_match)
            
            return jsonify({"template": current_match["appearance"]["template"]})
        except Exception as e:
            print(f"Błąd podczas aktualizacji szablonu: {e}")
            return jsonify({"error": str(e)}), 500
    
    @app.route('/control')
    def control_panel():
        """Panel kontrolny meczu (dostępny z telefonu)"""
        app.logger.info("Renderowanie control.html")
        return render_template('control.html')
    
    @app.route('/statistics')
    def statistics_page():
        """Strona ze statystykami meczu"""
        app.logger.info("Renderowanie statistics.html")
        match_id = request.args.get('id')
        
        # Jeśli nie podano ID, przekieruj do aktualnego meczu (jeśli istnieje)
        if not match_id and match_context.has_active_match():
            return redirect(f'/statistics?id={match_context.get_current_match()["id"]}')
        
        # Jeśli nie ma aktualnego meczu, możemy sprawdzić ostatni mecz w historii
        if not match_id:
            matches = get_all_matches()
            if matches:
                return redirect(f'/statistics?id={matches[0]["id"]}')
        
        return render_template('statistics.html')
   

   
    # API - Aktualny mecz
    @app.route('/api/current-match')
    def get_current_match():
        """Pobieranie aktualnego meczu"""
        current_match = match_context.get_current_match()
        if not current_match:
            return jsonify({"error": "Brak aktywnego meczu"}), 404
        
        return jsonify(current_match)
    
    # API - Tworzenie nowego meczu
    @app.route('/api/match/new', methods=['POST'])
    def create_match():
        """Tworzenie nowego meczu"""
        try:
            data = request.json
            
            # Walidacja danych wejściowych
            is_valid, errors = validate_match_data(data)
            if not is_valid:
                return jsonify({"error": "Nieprawidłowe dane meczu", "details": errors}), 400
            
            # Tworzenie nowego meczu
            new_match = create_new_match(data)
            
            # Ustawienie jako aktualny mecz
            match_context.set_current_match(new_match)
            
            # Zapisanie meczu do pliku
            save_match(new_match)
            
            return jsonify(new_match)
        except Exception as e:
            error_traceback = traceback.format_exc()
            print(f"Błąd podczas tworzenia nowego meczu: {e}")
            print(f"Szczegóły błędu: {error_traceback}")
            
            return jsonify({
                "error": str(e),
                "traceback": error_traceback
            }), 500
    
    # API - Ładowanie meczu
    @app.route('/api/match/<match_id>')
    def get_match(match_id):
        """Pobieranie pojedynczego meczu i ustawienie go jako aktualny"""
        match = load_match(match_id)
        
        if not match:
            return jsonify({"error": "Mecz nie istnieje"}), 404
        
        # Ustawienie jako aktualny mecz
        match_context.set_current_match(match)
        
        return jsonify(match)
    
    # API - Aktualizacja wyniku
    @app.route('/api/score', methods=['POST'])
    def update_score():
        """Aktualizacja wyniku meczu"""
        current_match = match_context.get_current_match()
        
        if not current_match:
            return jsonify({"error": "Brak aktywnego meczu"}), 404
        
        data = request.json
        action = data.get("action")
        player_num = data.get("player", 0)
        
        try:
            # Aktualizacja wyniku
            updated_match = update_match_score(current_match, action, player_num)
            
            # Aktualizacja kontekstu meczu
            match_context.set_current_match(updated_match)
            
            return jsonify(updated_match)
        except Exception as e:
            print(f"Błąd podczas aktualizacji wyniku: {e}")
            return jsonify({"error": str(e)}), 500
    
    # API - Reset danych meczu
    @app.route('/api/match/reset-data', methods=['POST'])
    def reset_match_data():
        """Resetowanie wszystkich danych meczu do wartości domyślnych"""
        current_match = match_context.get_current_match()
        
        if not current_match:
            return jsonify({"error": "Brak aktywnego meczu"}), 404
        
        try:
            # Sprawdzenie, czy zamykamy mecz
            close_match = request.json.get('close_match', False)
            
            if close_match:
                # Jeśli zamykamy mecz, zapisujemy go i ustawiamy na None
                save_match(current_match)
                match_context.set_current_match(None)
                return jsonify({"status": "success", "message": "Mecz został zresetowany i zakończony"})
            
            # W przeciwnym razie resetujemy aktualne dane
            # i aktualizujemy aktualny mecz (implementacja w match_service.py)
            from app.match_service import reset_match_data
            updated_match = reset_match_data(current_match)
            
            match_context.set_current_match(updated_match)
            return jsonify(updated_match)
        except Exception as e:
            print(f"Błąd podczas resetowania danych: {e}")
            return jsonify({"error": str(e)}), 500
    
    # API - Lista meczów
    @app.route('/api/matches', methods=['GET'])
    def list_matches():
        """Pobieranie listy wszystkich meczów"""
        matches = get_all_matches()
        return jsonify(matches)
    
   
    
    # API - Statystyki meczu
    @app.route('/api/match/<match_id>/statistics', methods=['GET'])
    def get_match_statistics(match_id):
        """Pobieranie statystyk meczu"""
        match = load_match(match_id)
        
        if not match:
            return jsonify({"error": "Mecz nie istnieje"}), 404
        
        stats = calculate_match_statistics(match)
        return jsonify(stats)
    
    # API - Aktualizacja wyglądu tablicy wyników
    @app.route('/api/appearance', methods=['POST'])
    def update_appearance():
        """Aktualizacja wyglądu tablicy wyników"""
        current_match = match_context.get_current_match()
        
        if not current_match:
            return jsonify({"error": "Brak aktywnego meczu"}), 404
        
        try:
            data = request.json
            
            # Aktualizacja konfiguracji wyglądu
            if "appearance" not in current_match:
                from app.models import DEFAULT_APPEARANCE
                current_match["appearance"] = DEFAULT_APPEARANCE.copy()
            
            if "theme" in data:
                current_match["appearance"]["theme"] = data["theme"]
            
            if "logo_url" in data:
                current_match["appearance"]["logo_url"] = data["logo_url"]
            
            if "custom_colors" in data:
                for key, value in data["custom_colors"].items():
                    if key in current_match["appearance"]["custom_colors"]:
                        current_match["appearance"]["custom_colors"][key] = value
            
            if "animations" in data:
                current_match["appearance"]["animations"] = data["animations"]
            
            # Zapisanie meczu
            match_context.set_current_match(current_match)
            save_match(current_match)
            
            return jsonify(current_match["appearance"])
        except Exception as e:
            print(f"Błąd podczas aktualizacji wyglądu: {e}")
            return jsonify({"error": str(e)}), 500
        
    
    # API - Eksport danych meczu do CSV
    @app.route('/api/match/<match_id>/export/csv', methods=['GET'])
    def export_match_csv(match_id):
        """Eksport danych meczu do CSV"""
        csv_data = export_match_to_csv(match_id)
        
        if not csv_data:
            return jsonify({"error": "Mecz nie istnieje"}), 404
        
        return Response(
            csv_data,
            mimetype="text/csv",
            headers={"Content-disposition": f"attachment; filename=mecz_{match_id}.csv"}
        )