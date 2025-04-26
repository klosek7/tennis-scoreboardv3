/**
 * Moduł panelu kontrolnego meczu tenisowego
 * Odpowiada za zarządzanie UI panelu kontrolnego i komunikację z API
 */
const TennisControlPanel = (function() {
    // Zmienne prywatne
    let currentMatch = null;
    const REFRESH_INTERVAL = 3000; // ms
    let timeUpdateInterval = null;
    
    /**
     * Inicjalizacja panelu kontrolnego
     */
    function init() {
        console.log("Inicjalizacja panelu kontrolnego...");
        
        // Usunięcie inline onclick ze wszystkich przycisków w HTML
        removeInlineEvents();
        
        // Ustawienie event listenerów
        setupEventListeners();
        
        // Pobranie aktualnych danych
        loadMatchData();
        loadPreviousMatches();
        
        // Uruchomienie automatycznego odświeżania danych
        startDataRefresher();
        
        // Uruchomienie aktualizacji czasów
        startTimeUpdater();
    }
    
    /**
     * Usunięcie inline onclick ze wszystkich przycisków w HTML
     */
    function removeInlineEvents() {
        // Pobranie wszystkich elementów z atrybutem onclick
        const elementsWithOnclick = document.querySelectorAll('[onclick]');
        
        // Usunięcie atrybutu onclick z każdego elementu, z wyjątkiem przycisków zmiany wyglądu
        elementsWithOnclick.forEach(element => {
            // Sprawdź, czy to nie jest przycisk aktualizacji wyglądu
            const text = element.textContent.trim();
            if (text !== "Zastosuj zmiany" && text !== "Resetuj ustawienia wyglądu") {
                element.removeAttribute('onclick');
            }
        });
    }
    
    /**
     * Ustawienie nasłuchiwania na zdarzenia
     */
    function setupEventListeners() {
        // Obsługa zakładek
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', handleTabClick);
        });
        
        // Przycisk rozpoczęcia meczu
        const startMatchBtn = document.getElementById('start-match-btn');
        if (startMatchBtn) {
            startMatchBtn.addEventListener('click', createNewMatch);
        } else {
            setupButtonByText("ROZPOCZNIJ NOWY MECZ", createNewMatch);
        }
        
        // Przyciski dla punktów
        setupButton('add-point-btn1', () => updateScore('add_point', 1));
        setupButton('remove-point-btn1', () => updateScore('remove_point', 1));
        setupButton('add-point-btn2', () => updateScore('add_point', 2));
        setupButton('remove-point-btn2', () => updateScore('remove_point', 2));
        
        // Przyciski dla gemów
        setupButton('add-game-btn1', () => updateScore('add_game', 1));
        setupButton('remove-game-btn1', () => updateScore('remove_game', 1));
        setupButton('add-game-btn2', () => updateScore('add_game', 2));
        setupButton('remove-game-btn2', () => updateScore('remove_game', 2));
        
        // Przyciski akcji meczu
        setupButton('end-match-btn', endMatch);
        setupButton('reset-btn', resetScore);
        
        setupButtonByText("Zmień serwującego", () => updateScore('toggle_serving', 0));

        // Przyciski wyglądu
        setupButtonByText("Zastosuj zmiany", updateAppearance);
        setupButtonByText("Resetuj ustawienia wyglądu", resetAppearance);
        
        // Przyciski resetowania danych
        setupButtonByText("Resetuj dane (zachowaj aktywny mecz)", () => resetMatchData(false));
        setupButtonByText("Resetuj dane i zakończ mecz", () => resetMatchData(true));
        
        // Przyciski historii
        setupButtonByText("Zobacz historię", showHistoryTab);
        setupButtonByText("Powrót do meczu", backToMatchTab);
    }
    
    /**
     * Pomocnicza funkcja do konfiguracji przycisku po ID
     */
    function setupButton(id, handler) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                handler();
            });
        }
    }
    
    /**
     * Pomocnicza funkcja do konfiguracji przycisku po selektorze
     */
    function setupButtonByText(buttonText, handler) {
        // Znajdź wszystkie przyciski
        const allButtons = document.querySelectorAll('button');
        let buttonsFound = 0;
        
        // Sprawdź każdy przycisk
        allButtons.forEach(btn => {
            if (btn.textContent.trim().includes(buttonText)) {
                btn.addEventListener('click', function(e) {
                    e.preventDefault();
                    handler();
                });
                buttonsFound++;
            }
        });
        
        // Loguj informację o znalezionych przyciskach
        console.log(`Znaleziono ${buttonsFound} przycisków zawierających tekst "${buttonText}"`);
        
        return buttonsFound;
    }
    
    /**
     * Uruchomienie automatycznego odświeżania danych
     */
    function startDataRefresher() {
        setInterval(() => {
            loadMatchData();
            
            // Odświeżanie listy meczów tylko na zakładce ustawień
            if (isTabActive('setup')) {
                loadPreviousMatches();
            }
        }, REFRESH_INTERVAL);
    }
    
    /**
     * Uruchomienie aktualizacji czasów
     */
    function startTimeUpdater() {
        // Czyszczenie poprzedniego interwału
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
        }
        
        timeUpdateInterval = setInterval(() => {
            if (currentMatch && !currentMatch.winner) {
                updateMatchTimes(currentMatch);
            }
        }, 1000);
    }
    
    /**
     * Sprawdza czy dana zakładka jest aktywna
     */
    function isTabActive(tabName) {
        const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        return tab && tab.classList.contains('active');
    }
    
    /**
     * Pokazuje zakładkę o podanej nazwie
     */
    function showTab(tabName) {
        const tab = document.querySelector(`.tab[data-tab="${tabName}"]`);
        if (tab && !tab.classList.contains('disabled')) {
            tab.click();
        }
    }
    
    /**
     * Obsługa kliknięcia zakładki
     */
    function handleTabClick(event) {
        const tab = event.currentTarget;
        
        // Jeśli zakładka jest wyłączona, nie rób nic
        if (tab.classList.contains('disabled')) {
            return;
        }
        
        // Ukrycie wszystkich treści zakładek
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Usunięcie aktywnej klasy ze wszystkich zakładek
        document.querySelectorAll('.tab').forEach(t => {
            t.classList.remove('active');
        });
        
        // Aktywacja wybranej zakładki
        tab.classList.add('active');
        const tabContent = document.getElementById('tab-' + tab.dataset.tab);
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        // Odświeżenie danych przy przełączaniu zakładek
        if (tab.dataset.tab === 'history') {
            loadMatchHistory();
        } else if (tab.dataset.tab === 'setup') {
            loadPreviousMatches();
            updateMatchStatusIndicator();
        }
    }
    
    /**
     * Pobranie danych o aktualnym meczu
     */
    function loadMatchData() {
        fetch('/api/current-match')
            .then(handleApiResponse)
            .then(data => {
                currentMatch = data;
                updateScoreDisplay(data);
                updateButtonsState(data);
                updateMatchTimes(data);
                enableMatchTab(); // Odblokowanie zakładki "Mecz"
                updateMatchStatusIndicator(); // Aktualizacja wskaźnika statusu
                updateStatsLink();
            })
            .catch(error => {
                console.error('Błąd pobierania danych meczu:', error);
                disableMatchTab(); // Zablokowanie zakładki "Mecz"
                updateMatchStatusIndicator(false); // Aktualizacja wskaźnika statusu
            });
    }
    
    /**
     * Obsługa odpowiedzi z API z weryfikacją błędów
     */
    function handleApiResponse(response) {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Wystąpił błąd serwera');
            });
        }
        return response.json();
    }

    /**
     * Utworzenie nowego meczu
     */
    function createNewMatch() {
        // Pobieranie danych z formularza
        const player1 = document.getElementById('player1-name').value.trim() || 'Zawodnik 1';
        const player2 = document.getElementById('player2-name').value.trim() || 'Zawodnik 2';
        const setsToWin = document.getElementById('sets-to-win').value;
        const advantageRule = document.getElementById('advantage-rule').checked;
        const servingPlayer = parseInt(document.getElementById('serving-player').value);
        
        // Przygotowanie danych do wysłania
        const data = {
            player1: player1,
            player2: player2,
            sets_to_win: parseInt(setsToWin),
            advantage_rule: advantageRule,
            serving_player: servingPlayer
        };
        
        console.log("Wysyłanie danych nowego meczu:", data);
        
        // Wysłanie danych do API
        fetch('/api/match/new', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        })
        .then(handleApiResponse)
        .then(data => {
            console.log("Otrzymane dane nowego meczu:", data);
            currentMatch = data;
            enableMatchTab();
            updateMatchStatusIndicator(true);
            
            // Przełączenie na zakładkę meczu
            showTab('match');
            
            updateScoreDisplay(data);
            updateButtonsState(data);
            updateMatchTimes(data);
        })
        .catch(error => {
            console.error('Błąd:', error);
            alert('Wystąpił błąd podczas tworzenia nowego meczu: ' + error.message);
        });
    }
    
    /**
     * Aktualizacja wyświetlania wyniku
     */
    function updateScoreDisplay(match) {
        if (!match) return;
        
        // Nazwy zawodników i oznaczenie serwującego/zwycięzcy
        const player1NameEl = document.getElementById('score-player1-name');
        if (player1NameEl) {
            player1NameEl.innerHTML = 
                `<span id="control-serving1" style="display: ${match.serving_player === 1 ? 'inline-block' : 'none'};">⚪</span>
                 ${match.player1}
                 <span id="control-winner1" style="display: ${match.winner === 1 ? 'inline-block' : 'none'};">👑</span>`;
        }
        
        const player2NameEl = document.getElementById('score-player2-name');
        if (player2NameEl) {
            player2NameEl.innerHTML = 
                `<span id="control-serving2" style="display: ${match.serving_player === 2 ? 'inline-block' : 'none'};">⚪</span>
                 ${match.player2}
                 <span id="control-winner2" style="display: ${match.winner === 2 ? 'inline-block' : 'none'};">👑</span>`;
        }
        
        // Punkty
        const p1PointsEl = document.getElementById('score-player1-points');
        if (p1PointsEl) p1PointsEl.textContent = match.score.player1.points;
        
        const p2PointsEl = document.getElementById('score-player2-points');
        if (p2PointsEl) p2PointsEl.textContent = match.score.player2.points;
        
        // Gemy
        const p1GamesEl = document.getElementById('score-player1-games');
        if (p1GamesEl) p1GamesEl.textContent = match.score.player1.games;
        
        const p2GamesEl = document.getElementById('score-player2-games');
        if (p2GamesEl) p2GamesEl.textContent = match.score.player2.games;
        
        // Sety
        for (let i = 0; i < 3; i++) {
            const p1SetEl = document.getElementById(`score-player1-set${i}`);
            if (p1SetEl) p1SetEl.textContent = match.score.player1.sets[i];
            
            const p2SetEl = document.getElementById(`score-player2-set${i}`);
            if (p2SetEl) p2SetEl.textContent = match.score.player2.sets[i];
        }
        
        // Zaktualizuj tekst przycisku zakończenia meczu
        const endMatchBtn = document.getElementById('end-match-btn');
        if (endMatchBtn) {
            if (match.winner > 0) {
                endMatchBtn.textContent = 'Mecz zakończony';
                endMatchBtn.disabled = true;
            } else {
                endMatchBtn.textContent = 'Zakończ mecz';
                endMatchBtn.disabled = false;
            }
        }
    }
    
    /**
     * Aktualizacja stanu przycisków
     */
    function updateButtonsState(match) {
        if (!match) return;
        
        const buttonsToDisable = [
            'add-point-btn1', 'add-point-btn2', 
            'remove-point-btn1', 'remove-point-btn2',
            'add-game-btn1', 'add-game-btn2',
            'remove-game-btn1', 'remove-game-btn2'
        ];
        
        // Wyłącz przyciski jeśli mecz się zakończył
        if (match.winner > 0) {
            buttonsToDisable.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) btn.disabled = true;
            });
        } else {
            buttonsToDisable.forEach(btnId => {
                const btn = document.getElementById(btnId);
                if (btn) btn.disabled = false;
            });
        }
        
        // Aktualizacja stanu przycisku toggle serving
        const toggleServingBtn = document.querySelector("Zmień serwującego");
        if (toggleServingBtn) {
            toggleServingBtn.disabled = match.winner > 0;
        }
    }
    
    /**
     * Aktualizacja czasów meczu i seta
     */
    function updateMatchTimes(match) {
        if (!match || !match.time) return;
        
        // Czas meczu
        const matchTimeEl = document.getElementById('control-match-time');
        if (matchTimeEl && match.time.start) {
            const matchStartTime = new Date(match.time.start);
            
            if (match.winner > 0 && match.time.end) {
                // Dla zakończonego meczu pokazujemy całkowity czas meczu
                const matchEndTime = new Date(match.time.end);
                const diffMs = matchEndTime - matchStartTime;
                const minutes = Math.floor(diffMs / 60000);
                const seconds = Math.floor((diffMs % 60000) / 1000);
                matchTimeEl.textContent = 
                    (minutes < 10 ? '0' : '') + minutes + ':' + 
                    (seconds < 10 ? '0' : '') + seconds;
            } else {
                // Dla trwającego meczu aktualizujemy czas na bieżąco
                const now = new Date();
                const diffMs = now - matchStartTime;
                const minutes = Math.floor(diffMs / 60000);
                const seconds = Math.floor((diffMs % 60000) / 1000);
                matchTimeEl.textContent = 
                    (minutes < 10 ? '0' : '') + minutes + ':' + 
                    (seconds < 10 ? '0' : '') + seconds;
            }
        }
        
        // Czas aktualnego seta
        updateSetTimeDisplay(match);
    }
    
    /**
     * Aktualizacja wyświetlania czasu seta
     */
    function updateSetTimeDisplay(match) {
        const setTimeEl = document.getElementById('control-set-time');
        if (!setTimeEl || !match || !match.time || !match.time.sets) return;
        
        if (match.time.sets.length > 0) {
            const currentSetIndex = match.current_set - 1;
            if (currentSetIndex >= 0 && currentSetIndex < match.time.sets.length) {
                const setInfo = match.time.sets[currentSetIndex];
                if (setInfo && setInfo.start) {
                    const setStartTime = new Date(setInfo.start);
                    let setEndTime;
                    
                    if (setInfo.end) {
                        // Dla zakończonego seta
                        setEndTime = new Date(setInfo.end);
                    } else {
                        // Dla trwającego seta
                        setEndTime = new Date();
                    }
                    
                    const diffMs = setEndTime - setStartTime;
                    const minutes = Math.floor(diffMs / 60000);
                    const seconds = Math.floor((diffMs % 60000) / 1000);
                    setTimeEl.textContent = 
                        `${(minutes < 10 ? '0' : '') + minutes + ':' + (seconds < 10 ? '0' : '') + seconds}`;
                }
            }
        }
    }
    
    /**
     * Włączenie zakładki "Mecz"
     */
    function enableMatchTab() {
        const matchTab = document.querySelector('.tab[data-tab="match"]');
        if (matchTab) {
            matchTab.classList.remove('disabled');
        }
    }
    
    /**
     * Wyłączenie zakładki "Mecz"
     */
    function disableMatchTab() {
        const matchTab = document.querySelector('.tab[data-tab="match"]');
        if (matchTab) {
            matchTab.classList.add('disabled');
            
            // Jeśli ta zakładka jest aktywna, przełącz na "Ustawienia"
            if (matchTab.classList.contains('active')) {
                const setupTab = document.querySelector('.tab[data-tab="setup"]');
                if (setupTab) setupTab.click();
            }
        }
    }
    
    /**
     * Przejście do zakładki Historia
     */
    function showHistoryTab() {
        const historyTab = document.querySelector('.tab[data-tab="history"]');
        if (historyTab) historyTab.click();
    }
    
    /**
     * Powrót do zakładki Mecz
     */
    function backToMatchTab() {
        const matchTab = document.querySelector('.tab[data-tab="match"]');
        if (matchTab && !matchTab.classList.contains('disabled')) {
            matchTab.click();
        }
    }
    
    /**
     * Aktualizacja wskaźnika statusu meczu
     */
    function updateMatchStatusIndicator(hasMatch = true) {
        const indicator = document.getElementById('match-status-indicator');
        if (!indicator) return;
        
        if (!hasMatch || !currentMatch) {
            indicator.textContent = "Brak aktywnego meczu. Skonfiguruj nowy mecz poniżej.";
            indicator.style.color = "#3498db";
            return;
        }
        
        if (currentMatch.winner > 0) {
            // Mecz zakończony
            const winner = currentMatch.winner === 1 ? currentMatch.player1 : currentMatch.player2;
            indicator.textContent = `Mecz zakończony! Zwycięzca: ${winner}`;
            indicator.style.color = "#27ae60";
        } else {
            // Mecz w trakcie
            indicator.textContent = `Aktywny mecz: ${currentMatch.player1} vs ${currentMatch.player2}`;
            indicator.style.color = "#e67e22";
        }
    }
    
    /**
     * Aktualizacja wyniku
     */
    function updateScore(action, player) {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu. Rozpocznij nowy mecz w zakładce Ustawienia.');
            return;
        }
        
        fetch('/api/score', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action,
                player: player
            }),
        })
        .then(handleApiResponse)
        .then(data => {
            currentMatch = data;
            updateScoreDisplay(data);
            updateButtonsState(data);
            updateMatchTimes(data);
            updateMatchStatusIndicator(); // Aktualizacja wskaźnika statusu
        })
        .catch(error => {
            console.error('Error:', error);
            alert(error.message);
        });
    }
    
    /**
     * Zakończenie meczu
     */
    function endMatch() {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu.');
            return;
        }
        
        if (confirm('Czy na pewno chcesz zakończyć mecz? To zablokuje dalsze zmiany wyniku.')) {
            fetch('/api/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'end_match'
                }),
            })
            .then(handleApiResponse)
            .then(data => {
                currentMatch = data;
                updateScoreDisplay(data);
                updateButtonsState(data);
                updateMatchTimes(data);
                updateMatchStatusIndicator(); // Aktualizacja wskaźnika statusu
                
                let winnerMessage = '';
                if (data.winner === 1) {
                    winnerMessage = `${data.player1} wygrał mecz!`;
                } else if (data.winner === 2) {
                    winnerMessage = `${data.player2} wygrał mecz!`;
                } else {
                    winnerMessage = 'Mecz zakończony bez jednoznacznego zwycięzcy.';
                }
                
                let duration = '';
                if (data.time && data.time.duration) {
                    const minutes = Math.floor(data.time.duration / 60);
                    const seconds = Math.floor(data.time.duration % 60);
                    duration = `${minutes}m ${seconds}s`;
                }
                
                alert(`Mecz zakończony!\n\n${winnerMessage}\nCzas trwania: ${duration}`);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Wystąpił błąd podczas kończenia meczu.');
            });
        }
    }
    
    /**
     * Aktualizacja linku do statystyk
     */
    function updateStatsLink() {
        const statsLink = document.getElementById('stats-link');
        if (statsLink && currentMatch && currentMatch.id) {
            statsLink.href = `/statistics?id=${currentMatch.id}`;
        }
    }
    
    /**
     * Reset wyniku
     */
    function resetScore() {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu.');
            return;
        }
        
        if (confirm('Czy na pewno chcesz zresetować wynik meczu?')) {
            fetch('/api/score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'reset'
                }),
            })
            .then(handleApiResponse)
            .then(data => {
                currentMatch = data;
                updateScoreDisplay(data);
                updateButtonsState(data);
                updateMatchTimes(data);
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Wystąpił błąd podczas resetowania wyniku.');
            });
        }
    }
    
    /**
     * Resetowanie wszystkich danych meczu
     */
    function resetMatchData(closeMatch) {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu.');
            return;
        }
        
        const confirmMessage = closeMatch 
            ? 'Czy na pewno chcesz zresetować wszystkie dane meczu i zakończyć aktywny mecz?' 
            : 'Czy na pewno chcesz zresetować wszystkie dane meczu? Ta operacja usunie imiona zawodników, punkty, gemy, sety i historię, ale zachowa aktywny mecz.';
        
        if (confirm(confirmMessage)) {
            fetch('/api/match/reset-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ close_match: closeMatch })
            })
            .then(handleApiResponse)
            .then(data => {
                if (closeMatch) {
                    // Jeśli zamykamy mecz, ustawiamy currentMatch na null
                    currentMatch = null;
                    
                    // Wyłączamy zakładkę meczu
                    disableMatchTab();
                    
                    // Aktualizujemy wskaźnik statusu meczu
                    updateMatchStatusIndicator(false);
                    
                    alert('Dane meczu zostały zresetowane, a mecz został zakończony.');
                    
                    // Przełączamy na zakładkę ustawień
                    showTab('setup');
                } else {
                    // Aktualizujemy currentMatch
                    currentMatch = data;
                    
                    // Aktualizujemy pola formularza
                    updateFormFields(data);
                    
                    // Aktualizujemy wyświetlanie
                    updateScoreDisplay(data);
                    updateButtonsState(data);
                    updateMatchTimes(data);
                    updateMatchStatusIndicator();
                    
                    alert('Dane meczu zostały zresetowane do wartości domyślnych.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Wystąpił błąd podczas resetowania danych meczu: ' + error.message);
            });
        }
    }
    
    /**
     * Aktualizacja pól formularza
     */
    function updateFormFields(data) {
        if (!data) return;
        
        const fields = [
            { id: 'player1-name', value: data.player1 || '' },
            { id: 'player2-name', value: data.player2 || '' },
            { id: 'sets-to-win', value: data.sets_to_win || '2' }
        ];
        
        fields.forEach(field => {
            const element = document.getElementById(field.id);
            if (element) element.value = field.value;
        });
        
        // Checkboxy i selecty
        const advantageRule = document.getElementById('advantage-rule');
        if (advantageRule) advantageRule.checked = data.advantage_rule !== false;
        
        const servingPlayer = document.getElementById('serving-player');
        if (servingPlayer) servingPlayer.value = data.serving_player || '1';
    }
    
    /**
     * Aktualizacja wyglądu tablicy wyników
     */
    function updateAppearance() {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu.');
            return;
        }
        
        // Pobranie wartości z formularza
        const theme = document.getElementById('theme-select').value;
        const logoUrl = document.getElementById('logo-url').value;
        const primaryColor = document.getElementById('primary-color').value;
        const secondaryColor = document.getElementById('secondary-color').value;
        const bgColor = document.getElementById('bg-color').value;
        const animations = document.getElementById('animations-toggle').checked;
        
        console.log("Aktualizacja wyglądu:", {
            theme, logoUrl, primaryColor, secondaryColor, bgColor, animations
        });
        
        // Konwersja kolorów HEX na rgba
        const hexToRgba = (hex, alpha = 0.7) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        // Przygotowanie danych
        const data = {
            theme: theme,
            logo_url: logoUrl,
            custom_colors: {
                primary: hexToRgba(primaryColor),
                secondary: hexToRgba(secondaryColor),
                background: hexToRgba(bgColor, 0.8)
            },
            animations: animations
        };
        
        // Wysłanie do API
        fetch('/api/appearance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(handleApiResponse)
        .then(data => {
            console.log("Odpowiedź po aktualizacji wyglądu:", data);
            alert('Wygląd tablicy wyników został zaktualizowany!');
        })
        .catch(error => {
            console.error('Error:', error);
            alert('Wystąpił błąd podczas aktualizacji wyglądu: ' + error.message);
        });
    }
    
    /**
     * Resetowanie wyglądu do domyślnych ustawień
     */
    function resetAppearance() {
        if (!currentMatch) {
            alert('Nie ma aktywnego meczu.');
            return;
        }
        
        // Ustawienie domyślnych wartości w formularzu
        const defaultValues = {
            'theme-select': 'default',
            'logo-url': '',
            'primary-color': '#1e90ff',
            'secondary-color': '#dc143c',
            'bg-color': '#000000',
            'animations-toggle': true
        };
        
        // Ustawienie domyślnych wartości w formularzu
        Object.keys(defaultValues).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = defaultValues[id];
                } else {
                    element.value = defaultValues[id];
                }
            }
        });
        
        // Aktualizacja wyglądu
        updateAppearance();
    }
    
    /**
     * Ładowanie listy poprzednich meczów
     */
    function loadPreviousMatches() {
        fetch('/api/matches')
            .then(handleApiResponse)
            .then(matches => {
                displayPreviousMatches(matches);
            })
            .catch(error => {
                console.error('Error:', error);
                const prevMatchesEl = document.getElementById('previous-matches');
                if (prevMatchesEl) {
                    prevMatchesEl.innerHTML = '<p>Nie udało się załadować poprzednich meczów.</p>';
                }
            });
    }
    
    /**
     * Wyświetlanie listy poprzednich meczów
     */
    function displayPreviousMatches(matches) {
        const container = document.getElementById('previous-matches');
        if (!container) return;
        
        if (matches.length === 0) {
            container.innerHTML = '<p>Brak zapisanych meczów.</p>';
            return;
        }
        
        let html = `
            <table class="prev-matches-table">
                <thead>
                    <tr>
                        <th>Data</th>
                        <th>Zawodnicy</th>
                        <th>Wynik</th>
                        <th>Czas</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        matches.forEach(match => {
            const statusBadge = match.completed ? 
                '<span style="color: green;">✓</span>' : 
                '<span style="color: orange;">⏱</span>';
                
            html += `
                <tr>
                    <td>${formatDate(match.date)}</td>
                    <td>${match.player1} vs ${match.player2}</td>
                    <td>${match.score} ${statusBadge}</td>
                    <td>${match.duration || "-"}</td>
                    <td class="action-buttons">
                        <button class="small-button load-match-btn" data-id="${match.id}">
                            Załaduj
                        </button>
                        <button class="small-button view-history-btn" data-id="${match.id}">
                            Historia
                        </button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        container.innerHTML = html;
        
        // Dodanie obsługi zdarzeń dla przycisków
        setupMatchButtons();
    }
    
    /**
     * Konfiguracja przycisków dla meczów
     */
    function setupMatchButtons() {
        // Przyciski ładowania meczu
        document.querySelectorAll('.load-match-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-id');
                loadMatch(matchId);
            });
        });
        
        // Przyciski wyświetlania historii
        document.querySelectorAll('.view-history-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const matchId = this.getAttribute('data-id');
                viewMatchHistory(matchId);
            });
        });
    }
    
    /**
     * Ładowanie konkretnego meczu
     */
    function loadMatch(matchId) {
        fetch(`/api/match/${matchId}`)
            .then(handleApiResponse)
            .then(data => {
                currentMatch = data;
                
                // Przełączenie na zakładkę z meczem
                enableMatchTab();
                showTab('match');
                
                updateScoreDisplay(data);
                updateButtonsState(data);
                updateMatchTimes(data);
                updateMatchStatusIndicator(); // Aktualizacja wskaźnika statusu
                
                alert('Mecz został załadowany!');
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Wystąpił błąd podczas ładowania meczu.');
            });
    }
    
    /**
     * Wyświetlanie historii wybranego meczu
     */
    function viewMatchHistory(matchId) {
        fetch(`/api/match/${matchId}`)
            .then(handleApiResponse)
            .then(data => {
                // Zapisujemy aktualny mecz
                const tempMatch = currentMatch;
                
                // Tymczasowo używamy danych załadowanego meczu do wyświetlenia historii
                currentMatch = data;
                
                // Przełączenie na zakładkę Historia
                showTab('history');
                
                // Dodanie informacji o meczu
                updateMatchHistoryHeader(data);
                
                // Wyświetlenie historii
                loadMatchHistory();
                
                // Przywracamy aktualny mecz
                currentMatch = tempMatch;
            })
            .catch(error => {
                console.error('Error:', error);
                alert('Wystąpił błąd podczas ładowania historii meczu.');
            });
    }
    
    /**
     * Aktualizacja nagłówka historii
     */
    function updateMatchHistoryHeader(match) {
        const headerEl = document.getElementById('match-info-header');
        if (!headerEl) return;
        
        const completed = match.winner > 0;
        
        let duration = '';
        if (match.time && match.time.duration) {
            const minutes = Math.floor(match.time.duration / 60);
            const seconds = Math.floor(match.time.duration % 60);
            duration = `${minutes}m ${seconds}s`;
        }
        
        const p1Sets = match.score.player1.sets.filter(s => s > 0).length;
        const p2Sets = match.score.player2.sets.filter(s => s > 0).length;
        
        headerEl.innerHTML = `
            <div style="background-color: #f8f9fa; padding: 10px; border-radius: 5px; margin-bottom: 10px;">
                <div><strong>${match.player1} vs ${match.player2}</strong></div>
                <div>Data: ${formatDate(match.date)}</div>
                <div>Status: ${completed ? 'Zakończony' : 'W trakcie'}</div>
                <div>Wynik: ${p1Sets}:${p2Sets}</div>
                <div>Czas trwania: ${duration || 'brak danych'}</div>
            </div>
        `;
    }
    
    /**
     * Ładowanie historii meczu
     */
    function loadMatchHistory() {
        if (!currentMatch) {
            const historyEl = document.getElementById('match-history');
            if (historyEl) {
                historyEl.innerHTML = '<p>Brak aktywnego meczu.</p>';
            }
            return;
        }
        
        // Aktualizacja nagłówka dla aktualnego meczu
        updateMatchHistoryHeader(currentMatch);
        
        const historyEl = document.getElementById('match-history');
        if (!historyEl) return;
        
        if (currentMatch.history && currentMatch.history.length > 0) {
            let historyHtml = '';
            currentMatch.history.forEach(entry => {
                let actionText = '';
                let additionalInfo = '';
                
                switch(entry.action) {
                    case 'add_point':
                        actionText = `Punkt dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
                        if (entry.state_before) {
                            additionalInfo = `(${entry.state_before.player1_points}:${entry.state_before.player2_points} → ${entry.player == 1 ? 'punkt dla ' + currentMatch.player1 : 'punkt dla ' + currentMatch.player2})`;
                        }
                        break;
                    case 'remove_point':
                        actionText = `Cofnięty punkt dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
                        break;
                    case 'add_game':
                        actionText = `Gem dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
                        break;
                    case 'remove_game':
                        actionText = `Cofnięty gem dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
                        break;
                    case 'add_set':
                        actionText = `Set dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
                        break;
                    case 'reset':
                        actionText = 'Reset wyniku';
                        break;
                    case 'update_names':
                        actionText = 'Zmiana nazw zawodników';
                        break;
                    case 'game_completed':
                        if (entry.game_info) {
                            const duration = entry.game_info.duration ? Math.round(entry.game_info.duration) + 's' : '';
                            actionText = `Zakończenie gema (${duration})`;
                            additionalInfo = `${entry.game_info.player1_points}:${entry.game_info.player2_points}`;
                        } else {
                            actionText = 'Zakończenie gema';
                        }
                        break;
                    case 'set_completed':
                        if (entry.duration) {
                            const minutes = Math.floor(entry.duration / 60);
                            const seconds = Math.floor(entry.duration % 60);
                            actionText = `Zakończenie seta ${entry.set_number} (${minutes}m ${seconds}s)`;
                            additionalInfo = `${entry.player1_games}:${entry.player2_games}`;
                        } else {
                            actionText = `Zakończenie seta ${entry.set_number}`;
                        }
                        break;
                    case 'match_completed':
                        if (entry.duration) {
                            const minutes = Math.floor(entry.duration / 60);
                            const seconds = Math.floor(entry.duration % 60);
                            actionText = `KONIEC MECZU (${minutes}m ${seconds}s)`;
                            
                            const winner = entry.winner === 1 ? currentMatch.player1 : 
                                        entry.winner === 2 ? currentMatch.player2 : 'Brak jednoznacznego zwycięzcy';
                            additionalInfo = `Zwycięzca: ${winner}`;
                        } else {
                            actionText = 'KONIEC MECZU';
                        }
                        break;
                    case 'toggle_serving':
                        actionText = 'Zmiana serwującego';
                        break;
                    case 'match_created':
                        actionText = 'Utworzenie meczu';
                        break;
                    case 'reset_data':
                        actionText = 'Reset danych meczu';
                        break;
                    default:
                        actionText = entry.action;
                }
                
                historyHtml += `
                    <div class="history-item">
                        <span>${entry.timestamp}</span> - ${actionText} ${additionalInfo ? `<span style="color: #666;">${additionalInfo}</span>` : ''}
                    </div>
                `;
            });
            
            historyEl.innerHTML = historyHtml;
        } else {
            historyEl.innerHTML = '<p>Brak historii dla tego meczu.</p>';
        }
        
        updateStatsLink();
    }
    
    /**
     * Formatowanie daty
     */
    function formatDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            
            return date.toLocaleDateString('pl-PL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    }
    
    /**
     * Funkcja czyszcząca
     * Wywoływana przy zamknięciu strony
     */
    function cleanup() {
        // Czyszczenie wszystkich interwałów
        if (timeUpdateInterval) {
            clearInterval(timeUpdateInterval);
        }
    }
    
    // Nasłuchiwanie na zamknięcie strony
    window.addEventListener('beforeunload', cleanup);
    
    // Zwrócenie publicznego API
    return {
        init: init,
        startTimeUpdater: startTimeUpdater,
        showTab: showTab,
        loadMatchData: loadMatchData,
        loadPreviousMatches: loadPreviousMatches
    };
})();

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', function() {
    console.log("Strona załadowana - inicjalizacja panelu kontrolnego");
    TennisControlPanel.init();
});