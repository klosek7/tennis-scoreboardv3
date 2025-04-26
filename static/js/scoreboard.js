/**
 * Moduł tablicy wyników
 */
const TennisScoreboard = (function() {
    // Zmienne prywatne
    let currentMatch = null;
    let previousState = null;
    let matchStartTime = new Date();
    let matchEndTime = null;
    const REFRESH_INTERVAL = 2000; // ms - zwiększone z 1000ms dla lepszej wydajności
    
    /**
     * Inicjalizacja modułu
     */
    function init() {
        loadMatchData();
        
        // Uruchomienie timera do aktualizacji czasów
        setInterval(updateTimeUI, 1000);
        
        // Odświeżanie danych co 2 sekundy (zamiast co 1 sekundę)
        setInterval(loadMatchData, REFRESH_INTERVAL);
    }
    
    /**
     * Pobieranie danych meczu z serwera
     */
    function loadMatchData() {
        fetch('/api/current-match')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Brak aktywnego meczu');
                }
                return response.json();
            })
            .then(data => {
                // Sprawdzenie czy dane rzeczywiście się zmieniły przed aktualizacją UI
                if (!currentMatch || hasDataChanged(currentMatch, data)) {
                    currentMatch = data;
                    updateScoreboard(data);
                }
                
                // Zawsze aktualizujemy czas ostatniej aktualizacji
                document.getElementById('last-update').textContent = 
                    'Aktualizacja: ' + new Date().toLocaleTimeString();
            })
            .catch(error => {
                console.error('Error:', error);
                // Możemy tu dodać obsługę braku aktywnego meczu
            });
    }
    
    /**
     * Sprawdzenie czy dane meczu uległy zmianie
     * Zapobiega niepotrzebnym aktualizacjom DOM
     */
    function hasDataChanged(oldData, newData) {
        // Sprawdzenie podstawowych zmian które wymagają aktualizacji UI
        if (oldData.serving_player !== newData.serving_player ||
            oldData.winner !== newData.winner ||
            oldData.is_tiebreak !== newData.is_tiebreak) {
            return true;
        }
        
        // Sprawdzenie zmian w punktacji
        const oldScore = oldData.score;
        const newScore = newData.score;
        
        if (oldScore.player1.points !== newScore.player1.points ||
            oldScore.player2.points !== newScore.player2.points ||
            oldScore.player1.games !== newScore.player1.games ||
            oldScore.player2.games !== newScore.player2.games) {
            return true;
        }
        
        // Sprawdzenie zmian w setach
        for (let i = 0; i < 3; i++) {
            if (oldScore.player1.sets[i] !== newScore.player1.sets[i] ||
                oldScore.player2.sets[i] !== newScore.player2.sets[i]) {
                return true;
            }
        }
        
        // Sprawdzenie zmian w wyglądzie (theme, colors)
        if (JSON.stringify(oldData.appearance) !== JSON.stringify(newData.appearance)) {
            return true;
        }
        
          // Dodaj logowanie, aby sprawdzić czy zmiany są wykrywane
    if (JSON.stringify(oldData.appearance) !== JSON.stringify(newData.appearance)) {
        console.log("Wykryto zmiany w wyglądzie!");
        console.log("Stary wygląd:", oldData.appearance);
        console.log("Nowy wygląd:", newData.appearance);
        return true;
    }
    
    return false;
}
    
    
    /**
     * Aktualizacja tablicy wyników
     */
    function updateScoreboard(match) {
        console.log("Aktualizacja tablicy wyników");
        
        // Obsługa motywu i wyglądu
        if (match.appearance) {
            applyTheme(match.appearance.theme, match.appearance.custom_colors);
            setLogo(match.appearance.logo_url);
        }
        
        // Aktualizacja nazw zawodników i serwisu
        updatePlayerInfo(match);
        
        // Przygotowanie do animacji (tylko gdy są włączone)
        setupAnimations(match);
        
        // Aktualizacja punktacji
        updateScores(match);
        
        // Aktualizacja widoczności setów
        updateSetsVisibility(match);
        
        // Aktualizacja statusu meczu
        updateMatchStatus(match);
        
        // Zapisanie aktualnego stanu do porównania przy następnej aktualizacji
        previousState = JSON.parse(JSON.stringify(match));
        
        // Aktualizacja czasu meczu i seta
        updateMatchTime(match);
        updateSetTime(match);
    }

    /**
     * Aktualizacja informacji o zawodnikach
     */
    function updatePlayerInfo(match) {
        // Zawodnik 1
        document.getElementById('player1-name').innerHTML = 
            `<span id="serving1" class="serving" style="display: ${match.serving_player === 1 ? 'inline-block' : 'none'};"></span>
             ${match.player1}
             <span id="winner1" class="winner-badge" style="display: ${match.winner === 1 ? 'inline-block' : 'none'};">ZWYCIĘZCA</span>`;
        
        // Zawodnik 2
        document.getElementById('player2-name').innerHTML = 
            `<span id="serving2" class="serving" style="display: ${match.serving_player === 2 ? 'inline-block' : 'none'};"></span>
             ${match.player2}
             <span id="winner2" class="winner-badge" style="display: ${match.winner === 2 ? 'inline-block' : 'none'};">ZWYCIĘZCA</span>`;
    }
    
    /**
     * Przygotowanie animacji przy zmianie wyniku
     */
    function setupAnimations(match) {
        // Obsługa animacji (tylko jeśli włączone)
        const animationsEnabled = match.appearance?.animations !== false;
        
        if (animationsEnabled && previousState) {
            animateScoringChanges(previousState, match);
        }
    }
    
    /**
     * Animacja zmian w punktacji
     */
    function animateScoringChanges(oldState, newState) {
        // Animacje punktów, gemów i setów
        // Implementacja...
    }
    
    /**
     * Aktualizacja wyników na tablicy
     */
    function updateScores(match) {
        // Sety
        for (let i = 0; i < 3; i++) {
            document.getElementById(`player1-set${i}`).textContent = match.score.player1.sets[i];
            document.getElementById(`player2-set${i}`).textContent = match.score.player2.sets[i];
        }
        
        // Gemy
        document.getElementById('player1-games').textContent = match.score.player1.games;
        document.getElementById('player2-games').textContent = match.score.player2.games;
        
        // Punkty
        document.getElementById('player1-points').textContent = match.score.player1.points;
        document.getElementById('player2-points').textContent = match.score.player2.points;
    }
    
    /**
     * Aktualizacja statusu meczu
     */
    function updateMatchStatus(match) {
        let statusText = `Mecz do ${match.sets_to_win} wygranych setów`;
        
        if (match.is_tiebreak) {
            statusText += " - TIE BREAK";
        }
        
        if (match.winner > 0) {
            statusText = `KONIEC MECZU - Zwycięzca: ${match.winner === 1 ? match.player1 : match.player2}`;
        }
        
        document.getElementById('match-status').textContent = statusText;
    }
    
    // ... pozostałe funkcje ...
    
    /**
     * Aktualizacja wyświetlanych czasów w UI
     */
    function updateTimeUI() {
        if (!currentMatch) return;
        
        // Aktualizacja czasu meczu
        if (!matchEndTime) {
            const now = new Date();
            const diffMs = now - matchStartTime;
            updateTimeDisplay('match-time', diffMs);
            
            // Możemy również tu zaktualizować czas seta
            // jeśli potrzebujemy to aktualizować częściej
        }
    }
    
    // Funkcje pomocnicze dla czasu
    function updateMatchTime(match) {
        // Implementacja...
    }
    
    function updateSetTime(match) {
        // Implementacja...
    }
    
    function updateTimeDisplay(elementId, diffMs) {
        const minutes = Math.floor(diffMs / 60000);
        const seconds = Math.floor((diffMs % 60000) / 1000);
        document.getElementById(elementId).textContent = 
            `${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
    }
    
    // Funkcje dla motywów
    // Funkcje dla motywów
function applyTheme(themeName, customColors) {
    console.log("Stosowanie motywu:", themeName, customColors);
    
    // Zastosowanie niestandardowych kolorów
    if (customColors) {
        // Aktualizacja styli dla zawodników
        const player1Elements = document.getElementsByClassName('player1');
        const player2Elements = document.getElementsByClassName('player2');
        const scoreboardElement = document.querySelector('.scoreboard');
        
        // Zastosowanie kolorów dla wszystkich elementów player1
        for (let i = 0; i < player1Elements.length; i++) {
            player1Elements[i].style.backgroundColor = customColors.primary || 'rgba(30, 144, 255, 0.7)';
        }
        
        // Zastosowanie kolorów dla wszystkich elementów player2
        for (let i = 0; i < player2Elements.length; i++) {
            player2Elements[i].style.backgroundColor = customColors.secondary || 'rgba(220, 20, 60, 0.7)';
        }
        
        // Zastosowanie koloru tła dla całej tablicy wyników
        if (scoreboardElement) {
            scoreboardElement.style.backgroundColor = customColors.background || 'rgba(0, 0, 0, 0.8)';
        }
    }
    
    // Możesz dodać obsługę predefiniowanych motywów
    if (themeName && themeName !== 'default') {
        // Zastosuj predefiniowane style dla konkretnych motywów
        const dynamicStyle = document.getElementById('dynamic-theme');
        
        if (dynamicStyle) {
            let css = '';
            
            switch(themeName) {
                case 'wimbledon':
                    css = `
                        .player1, .player2 { background-color: rgba(0, 100, 0, 0.8) !important; }
                        .scoreboard { background-color: rgba(43, 43, 43, 0.9) !important; }
                        .serving { background-color: white !important; }
                    `;
                    break;
                case 'roland-garros':
                    css = `
                        .player1, .player2 { background-color: rgba(208, 94, 40, 0.8) !important; }
                        .scoreboard { background-color: rgba(34, 40, 49, 0.9) !important; }
                    `;
                    break;
                case 'us-open':
                    css = `
                        .player1, .player2 { background-color: rgba(0, 31, 91, 0.8) !important; }
                        .scoreboard { background-color: rgba(0, 0, 0, 0.9) !important; }
                        .winner-badge { background-color: #ffc72c !important; }
                    `;
                    break;
                case 'australian-open':
                    css = `
                        .player1, .player2 { background-color: rgba(0, 99, 167, 0.8) !important; }
                        .scoreboard { background-color: rgba(0, 0, 0, 0.9) !important; }
                    `;
                    break;
            }
            
            dynamicStyle.innerHTML = css;
        }
    } else {
        // Resetowanie dynamicznych styli jeśli wybrano domyślny motyw
        const dynamicStyle = document.getElementById('dynamic-theme');
        if (dynamicStyle) {
            dynamicStyle.innerHTML = '';
        }
    }
}


    
function setLogo(logoUrl) {
    console.log("Ustawianie logo:", logoUrl);
    
    const logoContainer = document.getElementById('tournament-logo');
    
    if (!logoContainer) return;
    
    if (logoUrl && logoUrl.trim() !== '') {
        // Wyczyść container
        logoContainer.innerHTML = '';
        
        // Dodaj obraz
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = 'Tournament logo';
        img.onerror = function() {
            // W przypadku błędu ładowania
            console.error('Nie można załadować logo:', logoUrl);
            logoContainer.innerHTML = ''; // Wyczyść kontener
            logoContainer.style.display = 'none'; // Ukryj kontener
        };
        
        // Gdy obraz zostanie załadowany, pokaż container
        img.onload = function() {
            logoContainer.style.display = 'block';
        };
        
        logoContainer.appendChild(img);
    } else {
        // Brak URL - ukryj logo
        logoContainer.innerHTML = '';
        logoContainer.style.display = 'none';
    }
}

/**
 * Funkcja do aktualizacji widoczności setów w scoreboardzie
 */
function updateSetsVisibility(match) {
    // Dla każdego możliwego seta (0, 1, 2) sprawdzamy czy jest rozegrany
    for (let i = 0; i < 3; i++) {
        const isSetPlayed = match.score.player1.sets[i] > 0 || match.score.player2.sets[i] > 0;
        const containerElements = document.querySelectorAll(`.set${i}-container`);
        
        // Pokazujemy set tylko jeśli został rozegrany - WAŻNA ZMIANA
        containerElements.forEach(element => {
            // Zamiast pustego stringa ustawiamy jawnie wartość display
            // Element .set-label powinien mieć display: block
            // Element .set powinien mieć display: flex (jak w oryginalnym CSS)
            if (element.classList.contains('set-label')) {
                element.style.display = isSetPlayed ? 'block' : 'none';
            } else if (element.classList.contains('set')) {
                element.style.display = isSetPlayed ? 'flex' : 'none';
            } else {
                element.style.display = isSetPlayed ? 'block' : 'none';
            }
        });
        
        // Jeśli set został rozegrany, oznacz zwycięzcę
        if (isSetPlayed) {
            const p1Score = match.score.player1.sets[i];
            const p2Score = match.score.player2.sets[i];
            
            // Oznaczenie zwycięzcy seta innym kolorem
            const p1SetElement = document.getElementById(`player1-set${i}`);
            const p2SetElement = document.getElementById(`player2-set${i}`);
            
            if (p1SetElement && p2SetElement) {
                // Resetowanie stylów
                p1SetElement.classList.remove('winner-set');
                p2SetElement.classList.remove('winner-set');
                
                // Dodanie klasy dla zwycięzcy
                if (p1Score > p2Score) {
                    p1SetElement.classList.add('winner-set');
                } else if (p2Score > p1Score) {
                    p2SetElement.classList.add('winner-set');
                }
            }
        }
    }
    
    // Dodajemy informacje diagnostyczne
    console.log("Aktualizacja widoczności setów - isSetPlayed:", 
                match.score.player1.sets.map((val, idx) => 
                    `Set ${idx+1}: ${val > 0 || match.score.player2.sets[idx] > 0}`
                ));
}

// Dodaj tę funkcję do obsługi zmiany rozmiaru
function applyScoreboardSize(size) {
    console.log("Stosowanie nowego rozmiaru scoreboardu:", size);
    
    const scoreboard = document.querySelector('.scoreboard');
    if (!scoreboard) return;
    
    // Domyślna szerokość to 600px, dostosowujemy ją na podstawie procentu
    if (size) {
        // Konwertuj wartość liczbową na string z jednostką procentową
        const scaleValue = typeof size === 'number' ? `${size}%` : size;
        
        // Ustawienie nowej szerokości
        scoreboard.style.width = scaleValue;
        
        // Dostosowanie rozmiaru czcionki
        const baseFontSize = 100;  // początkowa wartość 100%
        const scaleFactor = parseInt(size) / 100;
        const newFontSize = `${baseFontSize * scaleFactor}%`;
        
        scoreboard.style.fontSize = newFontSize;
        
        console.log(`Zastosowano rozmiar ${scaleValue}, font-size: ${newFontSize}`);
    } else {
        // Resetowanie do domyślnych wartości
        scoreboard.style.width = '600px';
        scoreboard.style.fontSize = '100%';
    }
}

    
    // Zwracamy publiczne API
    return {
        init: init
    };
})();

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', TennisScoreboard.init);