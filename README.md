# Tennis Scoreboard

Aplikacja do wyświetlania i obsługi punktacji meczów tenisowych w czasie rzeczywistym.

![Tennis Scoreboard Preview](/static/img/scoreboard-preview.png)

## 📋 O projekcie

Tennis Scoreboard to aplikacja webowa oparta na Flask, która umożliwia prowadzenie punktacji meczów tenisowych. Aplikacja składa się z dwóch głównych komponentów: panelu kontrolnego do zarządzania punktacją oraz tablicy wyników (scoreboard), która może być wyświetlana na osobnym ekranie widocznym dla publiczności.

## ✨ Funkcje

- **Zarządzanie punktacją** - śledzenie punktów, gemów i setów
- **Wskaźnik serwisu** - oznaczenie, który zawodnik aktualnie serwuje
- **Zarządzanie wyglądem tablicy wyników** - dostosowywanie kolorów, tematów i animacji
- **Responsywny design** - dostosowuje się do różnych urządzeń i rozmiarów ekranu
- **Statystyki meczowe** - zapis i przeglądanie statystyk dla rozegranych meczów
- **Dynamiczne sety** - automatyczne wyświetlanie setów w miarę postępu meczu
- **Wskaźniki zwycięzcy** - wyraźne oznaczenie zwycięzcy meczu i wygranych setów

## 🚀 Instalacja

### Wymagania
- Python 3.6+
- Flask

### Kroki instalacji

1. Sklonuj repozytorium:
   ```
   git clone https://github.com/twoja-nazwa-uzytkownika/tennis-scoreboard.git
   cd tennis-scoreboard
   ```

2. Utwórz i aktywuj wirtualne środowisko:
   ```
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. Zainstaluj wymagane pakiety:
   ```
   pip install -r requirements.txt
   ```

4. Inicjalizuj bazę danych:
   ```
   flask init-db
   ```

## 🎮 Użytkowanie

1. Uruchom aplikację:
   ```
   flask run
   ```

2. Otwórz przeglądarkę i przejdź do `http://localhost:5000`

3. Na stronie głównej możesz:
   - Utworzyć nowy mecz
   - Przeglądać historię meczów
   - Otworzyć panel kontrolny aktywnego meczu

4. W panelu kontrolnym:
   - Przydzielaj punkty, gemy i sety zawodnikom
   - Zmieniaj zawodnika serwującego
   - Dostosowuj wygląd scoreboardu
   - Zakończ mecz i wyznacz zwycięzcę

5. Scoreboard możesz otworzyć w nowym oknie przeglądarki i wyświetlić go na osobnym ekranie dla publiczności

## 📁 Struktura projektu

```
tennis-scoreboard/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py
│   ├── utils.py
│   ├── static/
│   │   ├── css/
│   │   │   ├── common.css
│   │   │   ├── control.css
│   │   │   ├── index.css
│   │   │   ├── scoreboard.css
│   │   │   └── statistics.css
│   │   ├── js/
│   │   │   ├── control.js
│   │   │   ├── index.js
│   │   │   ├── scoreboard.js
│   │   │   └── statistics.js
│   │   └── img/
│   └── templates/
│       ├── base.html
│       ├── control.html
│       ├── index.html
│       ├── scoreboard.html
│       └── statistics.html
├── config.py
├── run.py
├── requirements.txt
└── README.md
```

## 💻 Technologie

- **Backend**: Python, Flask
- **Frontend**: HTML, CSS, JavaScript
- **Baza danych**: SQLite (domyślnie)

## 🛠️ Konfiguracja

Parametry aplikacji możesz skonfigurować w pliku `config.py`:

```python
# Przykład konfiguracji
DEBUG = True
DATABASE_URI = "sqlite:///tennis.db"
SECRET_KEY = "twoj-tajny-klucz"
```

## 📊 Statystyki

Aplikacja generuje szczegółowe statystyki meczowe, które są dostępne po zakończeniu meczu:
- Liczba punktów zdobytych przez każdego zawodnika
- Czas trwania meczu i poszczególnych setów
- Historia punktacji
- Wykres przebiegu zdobywania punktów

## 🔮 Planowane funkcje

- Eksport danych meczu do PDF
- Integracja z zewnętrznymi systemami punktacji
- Obsługa turniejów
- Więcej predefiniowanych motywów wyglądu (w stylu turniejów Wielkiego Szlema)

## 🤝 Współpraca

Chętnie przyjmę sugestie, zgłoszenia błędów i pull requesty. Jeśli chcesz wnieść swój wkład w rozwój aplikacji:

1. Sklonuj repozytorium
2. Utwórz nową gałąź (`git checkout -b funkcja/twoja-funkcja`)
3. Wprowadź zmiany i zacommituj je (`git commit -m 'Dodano nową funkcję'`)
4. Wypchnij gałąź (`git push origin funkcja/twoja-funkcja`)
5. Otwórz Pull Request

## 📄 Licencja

Ten projekt jest objęty licencją MIT. Szczegóły znajdziesz w pliku LICENSE.

## 👨‍💻 Autor

Twoje Imię i Nazwisko - [twoja-nazwa-uzytkownika](https://github.com/twoja-nazwa-uzytkownika)

---

**Uwaga**: Upewnij się, że przed pierwszym otwarciem scoreboardu w trybie publicznym przetestowałeś wszystkie funkcje w środowisku lokalnym.