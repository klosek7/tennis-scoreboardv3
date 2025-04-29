/**
 * JavaScript dla tabeli wyników tenisa
 */
const TennisScoreboard = (function() {
    // Zmienne prywatne
    let currentMatch = null;
    let previousState = null;
    const REFRESH_INTERVAL = 2000; // ms
    let animationsEnabled = true;
    
    /**
     * Inicjalizacja tablicy wyników
     */
    function init() {
      console.log("Inicjalizacja tabeli wyników...");
      
      // Ukrycie elementów warunkowych
      hideConditionalElements();
      
      // Pobranie początkowych danych
      loadMatchData();
      
      // Odświeżanie czasu co sekundę
      setInterval(updateTimeDisplay, 1000);
      
      // Odświeżanie danych meczu
      setInterval(loadMatchData, REFRESH_INTERVAL);
    }
    
    /**
     * Ukrycie elementów warunkowych
     */
    function hideConditionalElements() {
      // Wskaźniki serwisu
      document.querySelectorAll('.serving-indicator').forEach(el => {
        el.classList.remove('active');
      });
      
      // Odznaki zwycięzcy
      document.querySelectorAll('.winner-badge').forEach(el => {
        el.classList.remove('active');
      });
      
      // Wskaźnik tie-break
      const tiebreakIndicator = document.getElementById('tiebreak-indicator');
      if (tiebreakIndicator) {
        tiebreakIndicator.classList.remove('active');
      }
    }
    
    /**
     * Ładowanie danych meczu
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
          // Sprawdzenie czy dane uległy zmianie
          const hasChanged = !currentMatch || hasDataChanged(currentMatch, data);
          
          if (hasChanged) {
            // Zachowanie poprzedniego stanu dla animacji
            previousState = currentMatch ? { ...currentMatch } : null;
            
            // Aktualizacja aktualnego stanu
            currentMatch = data;
            
            // Ustawienie animacji
            if (data.appearance && data.appearance.animations !== undefined) {
              animationsEnabled = data.appearance.animations;
            }
            
            // Aktualizacja interfejsu
            updateScoreboard(data);
          }
          
          // Aktualizacja czasu
          document.getElementById('last-update').textContent = 
            'Aktualizacja: ' + new Date().toLocaleTimeString();
        })
        .catch(error => {
          console.error('Error:', error);
        });
    }
    
    /**
     * Sprawdzenie czy dane meczu uległy zmianie
     */
    function hasDataChanged(oldData, newData) {
      // Podstawowe zmiany
      if (oldData.serving_player !== newData.serving_player ||
          oldData.winner !== newData.winner ||
          oldData.is_tiebreak !== newData.is_tiebreak ||
          oldData.current_set !== newData.current_set ||
          oldData.sets_to_win !== newData.sets_to_win) {
        return true;
      }
      
      // Zmiany w punktacji
      const oldScore = oldData.score;
      const newScore = newData.score;
      
      if (oldScore.player1.points !== newScore.player1.points ||
          oldScore.player2.points !== newScore.player2.points ||
          oldScore.player1.games !== newScore.player1.games ||
          oldScore.player2.games !== newScore.player2.games) {
        return true;
      }
      
      // Zmiany w setach - teraz sprawdzamy do 5 setów
      for (let i = 0; i < 5; i++) {
        if (oldScore.player1.sets[i] !== newScore.player1.sets[i] ||
            oldScore.player2.sets[i] !== newScore.player2.sets[i]) {
          return true;
        }
      }
      
      // Zmiany w wyglądzie
      if (JSON.stringify(oldData.appearance) !== JSON.stringify(newData.appearance)) {
        return true;
      }
      
      return false;
    }
    
    /**
     * Aktualizacja tablicy wyników
     */
    function updateScoreboard(match) {
      // Aplikowanie wyglądu
      applyAppearance(match.appearance);
      
      // Aktualizacja nazw zawodników i serwisu
      updatePlayerInfo(match);
      
      // Aktualizacja punktacji
      updateScores(match);
      
      // Aktualizacja widoczności setów
      updateSetsVisibility(match);
      
      // Aktualizacja statusu meczu
      updateMatchStatus(match);
    }
    
    /**
     * Aplikowanie ustawień wyglądu
     */
/**
 * Aplikowanie ustawień wyglądu - poprawiona wersja
 */
function applyAppearance(appearance) {
  if (!appearance) return;
  
  const scoreboard = document.querySelector('.scoreboard-container');
  
  // Resetowanie klas motywów
  const themeClasses = ['theme-wimbledon', 'theme-roland-garros', 'theme-us-open', 'theme-australian-open'];
  themeClasses.forEach(cls => scoreboard.classList.remove(cls));
  
  // Dodanie klasy motywu
  if (appearance.theme && appearance.theme !== 'default') {
    scoreboard.classList.add(`theme-${appearance.theme}`);
  }
  
  // Niestandardowe kolory - mają pierwszeństwo nad motywami
  if (appearance.custom_colors) {
    // Kolor pierwszego zawodnika
    if (appearance.custom_colors.primary) {
      document.documentElement.style.setProperty('--player1-color', appearance.custom_colors.primary);
    }
    
    // Kolor drugiego zawodnika
    if (appearance.custom_colors.secondary) {
      document.documentElement.style.setProperty('--player2-color', appearance.custom_colors.secondary);
    }
    
    // Tło główne
    if (appearance.custom_colors.background) {
      document.documentElement.style.setProperty('--bg-color', appearance.custom_colors.background);
      
      // Aktualizujemy również kolory nagłówka i stopki dla spójności
      const bgColor = appearance.custom_colors.background;
      
      // Konwersja rgba na obiekt z wartościami
      const parseRgba = (rgba) => {
        const match = rgba.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([0-9.]+))?\)/);
        if (match) {
          return {
            r: parseInt(match[1]),
            g: parseInt(match[2]),
            b: parseInt(match[3]),
            a: match[4] ? parseFloat(match[4]) : 1
          };
        }
        return null;
      };
      
      // Ciemniejsza wersja koloru tła
      const bgColorObj = parseRgba(bgColor);
      if (bgColorObj) {
        // Przyciemniamy kolor tła dla nagłówka i stopki
        const darkerFactor = 0.8; // 20% ciemniejszy
        const headerBg = `rgba(${Math.floor(bgColorObj.r * darkerFactor)}, ${Math.floor(bgColorObj.g * darkerFactor)}, ${Math.floor(bgColorObj.b * darkerFactor)}, ${bgColorObj.a})`;
        
        document.documentElement.style.setProperty('--header-bg', headerBg);
        document.documentElement.style.setProperty('--footer-bg', headerBg);
      }
    }
  }
  
  // Logo
  setLogo(appearance.logo_url);
}
    
    /**
     * Ustawienie logo turnieju
     */
    function setLogo(logoUrl) {
      const logoContainer = document.getElementById('tournament-logo');
      
      if (!logoContainer) return;
      
      if (logoUrl && logoUrl.trim()) {
        // Wyczyszczenie kontenera
        logoContainer.innerHTML = '';
        
        // Utworzenie elementu img
        const img = document.createElement('img');
        img.src = logoUrl;
        img.alt = 'Tournament logo';
        
        // Obsługa błędu
        img.onerror = () => {
          logoContainer.style.display = 'none';
        };
        
        // Obsługa sukcesu
        img.onload = () => {
          logoContainer.style.display = 'block';
        };
        
        logoContainer.appendChild(img);
      } else {
        logoContainer.innerHTML = '';
        logoContainer.style.display = 'none';
      }
    }
    
    /**
     * Aktualizacja informacji o zawodnikach
     */
    function updatePlayerInfo(match) {
      // Nazwy zawodników
      document.getElementById('player1-name').textContent = match.player1;
      document.getElementById('player2-name').textContent = match.player2;
      
      // Wskaźniki serwisu
      const serving1 = document.getElementById('serving1');
      const serving2 = document.getElementById('serving2');
      
      if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
      if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
      
      // Odznaki zwycięzcy
      const winner1Badge = document.getElementById('winner1-badge');
      const winner2Badge = document.getElementById('winner2-badge');
      
      if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
      if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
    }
    
    /**
     * Aktualizacja punktacji
     */
    function updateScores(match) {
      if (!match) return;
      
      // Poprzedni stan (dla animacji)
      const oldState = previousState?.score || { 
        player1: { points: "0", games: 0, sets: [0, 0, 0, 0, 0] }, 
        player2: { points: "0", games: 0, sets: [0, 0, 0, 0, 0] }
      };
      
      // Aktualizacja punktów
      updateElementWithAnimation('player1-points', oldState.player1.points, match.score.player1.points, 'animate-point');
      updateElementWithAnimation('player2-points', oldState.player2.points, match.score.player2.points, 'animate-point');
      
      // Aktualizacja gemów
      updateElementWithAnimation('player1-games', oldState.player1.games, match.score.player1.games, 'animate-game');
      updateElementWithAnimation('player2-games', oldState.player2.games, match.score.player2.games, 'animate-game');
      
      // Aktualizacja setów
      // Ustalamy maksymalną liczbę setów w zależności od tego, ile trzeba wygrać
      const maxSets = match.sets_to_win === 3 ? 5 : 3;
      
      for (let i = 0; i < maxSets; i++) {
        // Dodanie dodatkowej kolumny seta, jeśli to potrzebne
        ensureSetColumn(i, match);
        
        updateElementWithAnimation(
          `player1-set${i}`, 
          oldState.player1.sets[i], 
          match.score.player1.sets[i], 
          'animate-set'
        );
        
        updateElementWithAnimation(
          `player2-set${i}`, 
          oldState.player2.sets[i], 
          match.score.player2.sets[i], 
          'animate-set'
        );
      }
    }

/**
 * Funkcja sprawdzająca, czy dany set powinien być wyświetlany
 * Warunek: set jest aktualnie rozgrywany LUB został już rozegrany
 */
function isSetNeeded(setIndex, match) {
  // Set jest aktualnie rozgrywany
  const isCurrentSet = match.current_set === setIndex + 1;
  
  // Set został już rozegrany - przynajmniej jeden z graczy ma punkty większe od 0
  const isSetCompleted = match.score.player1.sets[setIndex] > 0 || match.score.player2.sets[setIndex] > 0;
  
  return isCurrentSet || isSetCompleted;
}

 /**
 * Upewnienie się, że kolumna seta istnieje
 */
function ensureSetColumn(setIndex, match) {
  // Pierwszy set zawsze istnieje, sprawdzamy tylko dla seta 2+ (indeksy 1-4)
  if (setIndex === 0) return;
  
  const headerRow = document.querySelector('.score-table thead tr');
  const player1Row = document.querySelector('.player-row.player1');
  const player2Row = document.querySelector('.player-row.player2');
  
  // Sprawdzamy, czy kolumna już istnieje
  const setHeaderExists = document.querySelector(`.set-col-${setIndex}`);
  if (setHeaderExists) return;
  
  // Sprawdzamy czy set jest potrzebny zgodnie z nowymi regułami
  const isNeeded = isSetNeeded(setIndex, match);
  
  // Dodajemy kolumnę tylko jeśli set jest potrzebny
  if (isNeeded) {
    // Dodajemy nagłówek kolumny
    const gamesTh = document.querySelector('.games-col');
    const setTh = document.createElement('th');
    setTh.className = `set-col set-col-${setIndex}`;
    setTh.textContent = `SET ${setIndex + 1}`;
    headerRow.insertBefore(setTh, gamesTh);
    
    // Dodajemy komórkę dla pierwszego zawodnika
    const p1GamesCell = player1Row.querySelector('.games-cell');
    const p1SetCell = document.createElement('td');
    p1SetCell.className = 'set-cell';
    p1SetCell.id = `player1-set${setIndex}`;
    p1SetCell.textContent = '0';
    player1Row.insertBefore(p1SetCell, p1GamesCell);
    
    // Dodajemy komórkę dla drugiego zawodnika
    const p2GamesCell = player2Row.querySelector('.games-cell');
    const p2SetCell = document.createElement('td');
    p2SetCell.className = 'set-cell';
    p2SetCell.id = `player2-set${setIndex}`;
    p2SetCell.textContent = '0';
    player2Row.insertBefore(p2SetCell, p2GamesCell);
  }
}
    
    /**
     * Aktualizacja elementu z animacją
     */
    function updateElementWithAnimation(elementId, oldValue, newValue, animationClass) {
      const element = document.getElementById(elementId);
      if (!element) return;
      
      // Konwersja na string
      oldValue = String(oldValue);
      newValue = String(newValue);
      
      // Animacja przy zmianie
      if (oldValue !== newValue && animationsEnabled) {
        element.textContent = newValue;
        element.classList.add(animationClass);
        
        setTimeout(() => {
          element.classList.remove(animationClass);
        }, 700);
      } else {
        element.textContent = newValue;
      }
    }
    
    /**
     * Aktualizacja widoczności setów
     */
/**
 * Aktualizacja widoczności setów
 */
function updateSetsVisibility(match) {
  // Określamy maksymalną liczbę setów
  const maxSets = match.sets_to_win === 3 ? 5 : 3;
  
  // Dla każdego seta sprawdzamy czy powinien być widoczny
  for (let i = 0; i < maxSets; i++) {
    // Sprawdzenie dla każdego seta (poza pierwszym)
    if (i > 0) {
      // Pobieramy elementy kolumny dla tego seta
      const setHeader = document.querySelector(`.set-col-${i}`);
      const p1SetCell = document.getElementById(`player1-set${i}`);
      const p2SetCell = document.getElementById(`player2-set${i}`);
      
      // Sprawdzamy czy set powinien być widoczny
      const isNeeded = isSetNeeded(i, match);
      
      // Jeśli elementy istnieją, aktualizujemy ich widoczność
      if (setHeader && p1SetCell && p2SetCell) {
        if (isNeeded) {
          setHeader.style.display = '';
          p1SetCell.style.display = '';
          p2SetCell.style.display = '';
        } else {
          setHeader.style.display = 'none';
          p1SetCell.style.display = 'none';
          p2SetCell.style.display = 'none';
        }
      }
      // Jeśli elementy nie istnieją, a są potrzebne, tworzymy je
      else if (isNeeded) {
        ensureSetColumn(i, match);
      }
    }
  }
}
    
    /**
     * Aktualizacja statusu meczu
     */
    function updateMatchStatus(match) {
      // Status meczu
      const matchStatus = document.getElementById('match-status');
      if (matchStatus) {
        if (match.winner > 0) {
          matchStatus.textContent = `Mecz zakończony`;
        } else if (match.is_tiebreak) {
          matchStatus.textContent = `Tie-break`;
        } else {
          // Wyświetlamy liczbę setów do wygrania
          matchStatus.textContent = `Mecz do ${match.sets_to_win} wygranych setów`;
        }
      }
      
      // Wskaźnik tie-break
      const tiebreakIndicator = document.getElementById('tiebreak-indicator');
      if (tiebreakIndicator) {
        tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
      }
    }
    
    /**
     * Aktualizacja wyświetlania czasu
     */
    function updateTimeDisplay() {
      if (!currentMatch || !currentMatch.time) return;
      
      // Czas meczu
      const matchTimeEl = document.getElementById('match-time');
      if (matchTimeEl && currentMatch.time.start) {
        const matchStartTime = new Date(currentMatch.time.start);
        
        if (currentMatch.winner > 0 && currentMatch.time.end) {
          // Zakończony mecz
          const matchEndTime = new Date(currentMatch.time.end);
          const diffMs = matchEndTime - matchStartTime;
          formatTimeDisplay(matchTimeEl, diffMs);
        } else {
          // Trwający mecz
          const now = new Date();
          const diffMs = now - matchStartTime;
          formatTimeDisplay(matchTimeEl, diffMs);
        }
      }
    
    // Czas seta
    const setTimeEl = document.getElementById('current-set-time');
    updateSetTimeDisplay(setTimeEl);
  }
  
  /**
   * Aktualizacja wyświetlania czasu seta
   */
  function updateSetTimeDisplay(element) {
    if (!element || !currentMatch || !currentMatch.time || !currentMatch.time.sets) return;
    
    if (currentMatch.time.sets.length > 0) {
      const currentSetIndex = currentMatch.current_set - 1;
      if (currentSetIndex >= 0 && currentSetIndex < currentMatch.time.sets.length) {
        const setInfo = currentMatch.time.sets[currentSetIndex];
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
          formatTimeDisplay(element, diffMs, 'Set: ');
        }
      }
    }
  }
  
  /**
   * Formatowanie wyświetlania czasu
   */
  function formatTimeDisplay(element, diffMs, prefix = '') {
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    element.textContent = `${prefix}${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
  }
  
  // Inicjalizacja po załadowaniu strony
  document.addEventListener('DOMContentLoaded', init);
  
  // Publiczne API
  return {
    init: init,
    updateAppearance: applyAppearance
  };
})();