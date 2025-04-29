/**
 * JavaScript dla rozszerzonych tablic wyników tenisa
 */
const EnhancedScoreboards = (function() {
    // Zmienne prywatne
    let currentMatch = null;
    let previousState = null;
    const REFRESH_INTERVAL = 2000; // ms
    let animationsEnabled = true;
    let currentTemplate = 'original';
    
    /**
     * Inicjalizacja tablic wyników
     */
    function init() {
      console.log("Inicjalizacja rozszerzonych tablic wyników...");
      
      // Sprawdzenie zapisanego szablonu w localStorage
      const savedTemplate = localStorage.getItem('selected-template');
      if (savedTemplate) {
        currentTemplate = savedTemplate;
        changeTemplate(currentTemplate);
      }
      
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
     * Zmiana szablonu tablicy wyników
     */
    function changeTemplate(templateId) {
      // Ukrycie wszystkich szablonów
      document.querySelectorAll('.template').forEach(template => {
        template.classList.remove('active');
      });
      
      // Wyświetlenie wybranego szablonu
      const selectedTemplate = document.getElementById(`${templateId}-template`);
      if (selectedTemplate) {
        selectedTemplate.classList.add('active');
        currentTemplate = templateId;
        
        // Zapisanie wyboru w localStorage
        localStorage.setItem('selected-template', templateId);
        
        // Aktualizacja danych, jeśli są dostępne
        if (currentMatch) {
          updateAllScoreboards(currentMatch);
        }
        
        console.log(`Zmieniono szablon na: ${templateId}`);
      }
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
      
      // Wskaźniki tie-break
      document.querySelectorAll('.tiebreak-indicator').forEach(el => {
        el.classList.remove('active');
      });
    }
    /**
     * Ładowanie danych meczu
     */
    /**
 * Zmodyfikowana funkcja loadMatchData w pliku enhanced-scoreboards.js
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
      
      // Sprawdzenie czy szablon uległ zmianie
      const templateChanged = !currentMatch || 
                             (currentMatch.appearance && data.appearance && 
                              currentMatch.appearance.template !== data.appearance.template);
      
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
        updateAllScoreboards(data);
      }
      
      // Jeśli tylko szablon się zmienił, aktualizujemy widoczność szablonów
      if (templateChanged && data.appearance && data.appearance.template) {
        currentMatch = data;
        changeTemplate(data.appearance.template);
      }
      
      // Aktualizacja czasu
      updateLastUpdateTime();
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
        
        // Zmiany w setach - sprawdzamy do 5 setów
        for (let i = 0; i < 5; i++) {
          if (oldScore.player1.sets[i] !== newScore.player1.sets[i] ||
              oldScore.player2.sets[i] !== newScore.player2.sets[i]) {
            return true;
          }
        }
        
        // Zmiany w wyglądzie (poza template)
        if (oldData.appearance && newData.appearance) {
          const oldAppearance = { ...oldData.appearance };
          const newAppearance = { ...newData.appearance };
          
          // Usuwamy pole template, bo jest obsługiwane osobno
          delete oldAppearance.template;
          delete newAppearance.template;
          
          if (JSON.stringify(oldAppearance) !== JSON.stringify(newAppearance)) {
            return true;
          }
        }
        
        return false;
      }
      /**
     * Aktualizacja wszystkich tablic wyników
     */
    function updateAllScoreboards(match) {
        // Aktualizacja wszystkich szablonów
        updateOriginalScoreboard(match);
        updateHorizontalScoreboard(match);
        updateVerticalScoreboard(match);
        updateModernScoreboard(match);
        updateBroadcastScoreboard(match);
        updateProTennisScoreboard(match);
        
        // Zastosowanie wyglądu
        applyAppearance(match.appearance);
      }
      
      /**
       * Aktualizacja oryginalnej tablicy wyników
       */
      function updateOriginalScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('original-player1-name').textContent = match.player1;
        document.getElementById('original-player2-name').textContent = match.player2;
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('original-serving1');
        const serving2 = document.getElementById('original-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Odznaki zwycięzcy
        const winner1Badge = document.getElementById('original-winner1-badge');
        const winner2Badge = document.getElementById('original-winner2-badge');
        
        if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
        if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
        
        // Punkty
        updateOriginalElement('original-player1-points', match.score.player1.points);
        updateOriginalElement('original-player2-points', match.score.player2.points);
        
        // Gemy
        updateOriginalElement('original-player1-games', match.score.player1.games);
        updateOriginalElement('original-player2-games', match.score.player2.games);
        
        // Sety
        updateOriginalSets(match);
        
        // Status meczu
        updateMatchStatus('original-match-status', match);
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('original-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }
      
      /**
       * Aktualizacja elementu z animacją dla oryginalnego szablonu
       */
      function updateOriginalElement(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Konwersja na string
        newValue = String(newValue);
        const oldValue = element.textContent;
        
        // Animacja przy zmianie
        if (oldValue !== newValue && animationsEnabled) {
          element.textContent = newValue;
          element.classList.add('animate-point');
          
          setTimeout(() => {
            element.classList.remove('animate-point');
          }, 700);
        } else {
          element.textContent = newValue;
        }
      }
      
      /**
       * Aktualizacja setów dla oryginalnego szablonu
       */
      function updateOriginalSets(match) {
        // Określenie maksymalnej liczby setów
        const maxSets = match.sets_to_win === 3 ? 5 : 3;
        
        // Aktualizacja istniejących setów i dodanie nowych kolumn w razie potrzeby
        for (let i = 0; i < maxSets; i++) {
          // Sprawdzenie czy kolumna już istnieje
          let p1SetElement = document.getElementById(`original-player1-set${i}`);
          let p2SetElement = document.getElementById(`original-player2-set${i}`);
          
          if (!p1SetElement || !p2SetElement) {
            // Jeśli kolumna nie istnieje, a set jest potrzebny, dodaj ją
            if (i === 0 || match.current_set > i || 
                match.score.player1.sets[i] > 0 || match.score.player2.sets[i] > 0) {
              addOriginalSetColumn(i, match);
              
              // Pobierz nowo utworzone elementy
              p1SetElement = document.getElementById(`original-player1-set${i}`);
              p2SetElement = document.getElementById(`original-player2-set${i}`);
            }
          }
          
          // Aktualizacja wartości (jeśli elementy istnieją)
          if (p1SetElement && p2SetElement) {
            updateOriginalElement(`original-player1-set${i}`, match.score.player1.sets[i]);
            updateOriginalElement(`original-player2-set${i}`, match.score.player2.sets[i]);
          }
        }
      }
      /**
     * Aktualizacja tablicy horyzontalnej
     */
    function updateHorizontalScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('horizontal-player1-name').textContent = match.player1;
        document.getElementById('horizontal-player2-name').textContent = match.player2;
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('horizontal-serving1');
        const serving2 = document.getElementById('horizontal-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Odznaki zwycięzcy
        const winner1Badge = document.getElementById('horizontal-winner1-badge');
        const winner2Badge = document.getElementById('horizontal-winner2-badge');
        
        if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
        if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
        
        // Punkty
        updateElement('horizontal-player1-points', match.score.player1.points);
        updateElement('horizontal-player2-points', match.score.player2.points);
        
        // Gemy
        updateElement('horizontal-player1-games', match.score.player1.games);
        updateElement('horizontal-player2-games', match.score.player2.games);
        
        // Dynamiczne aktualizowanie setów
        updateDynamicSets(match, 'horizontal-player1-sets', 1);
        updateDynamicSets(match, 'horizontal-player2-sets', 2);
        
        // Status meczu
        updateMatchStatus('horizontal-match-status', match);
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('horizontal-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }
      
      /**
       * Aktualizacja tablicy wertykalnej
       */
      function updateVerticalScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('vertical-player1-name').textContent = match.player1;
        document.getElementById('vertical-player2-name').textContent = match.player2;
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('vertical-serving1');
        const serving2 = document.getElementById('vertical-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Odznaki zwycięzcy
        const winner1Badge = document.getElementById('vertical-winner1-badge');
        const winner2Badge = document.getElementById('vertical-winner2-badge');
        
        if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
        if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
        
        // Punkty
        updateElement('vertical-player1-points', match.score.player1.points);
        updateElement('vertical-player2-points', match.score.player2.points);
        
        // Gemy
        updateElement('vertical-player1-games', match.score.player1.games);
        updateElement('vertical-player2-games', match.score.player2.games);
        
        // Dynamiczne aktualizowanie setów
        updateDynamicSets(match, 'vertical-player1-sets', 1);
        updateDynamicSets(match, 'vertical-player2-sets', 2);
        
        // Status meczu
        updateMatchStatus('vertical-match-status', match);
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('vertical-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }
      /**
     * Aktualizacja nowoczesnej tablicy
     */
    function updateModernScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('modern-player1-name').textContent = match.player1;
        document.getElementById('modern-player2-name').textContent = match.player2;
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('modern-serving1');
        const serving2 = document.getElementById('modern-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Odznaki zwycięzcy
        const winner1Badge = document.getElementById('modern-winner1-badge');
        const winner2Badge = document.getElementById('modern-winner2-badge');
        
        if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
        if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
        
        // Punkty
        updateElement('modern-player1-points', match.score.player1.points);
        updateElement('modern-player2-points', match.score.player2.points);
        
        // Gemy
        updateElement('modern-player1-games', match.score.player1.games);
        updateElement('modern-player2-games', match.score.player2.games);
        
        // Dynamiczne aktualizowanie setów
        updateDynamicSets(match, 'modern-player1-sets', 1);
        updateDynamicSets(match, 'modern-player2-sets', 2);
        
        // Status meczu
        updateMatchStatus('modern-match-status', match);
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('modern-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }
      
      /**
       * Aktualizacja tablicy telewizyjnej
       */
      function updateBroadcastScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('broadcast-player1-name').textContent = match.player1;
        document.getElementById('broadcast-player2-name').textContent = match.player2;
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('broadcast-serving1');
        const serving2 = document.getElementById('broadcast-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Odznaki zwycięzcy
        const winner1Badge = document.getElementById('broadcast-winner1-badge');
        const winner2Badge = document.getElementById('broadcast-winner2-badge');
        
        if (winner1Badge) winner1Badge.classList.toggle('active', match.winner === 1);
        if (winner2Badge) winner2Badge.classList.toggle('active', match.winner === 2);
        
        // Punkty
        updateElement('broadcast-player1-points', match.score.player1.points);
        updateElement('broadcast-player2-points', match.score.player2.points);
        
        // Gemy
        updateElement('broadcast-player1-games', match.score.player1.games);
        updateElement('broadcast-player2-games', match.score.player2.games);
        
        // Dynamiczne aktualizowanie setów
        updateDynamicSets(match, 'broadcast-player1-sets', 1);
        updateDynamicSets(match, 'broadcast-player2-sets', 2);
        
        // Status meczu
        updateMatchStatus('broadcast-match-status', match);
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('broadcast-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }
      /**
     * Aktualizacja statusu meczu
     */
    function updateMatchStatus(elementId, match) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        if (match.winner > 0) {
          element.textContent = `Mecz zakończony`;
        } else if (match.is_tiebreak) {
          element.textContent = `Tie-break`;
        } else {
          // Wyświetlamy liczbę setów do wygrania
          element.textContent = `Mecz do ${match.sets_to_win} wygranych setów`;
        }
      }
      
      /**
       * Aktualizacja elementu z animacją
       */
      function updateElement(elementId, newValue) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        // Konwersja na string
        newValue = String(newValue);
        const oldValue = element.textContent;
        
        // Animacja przy zmianie
        if (oldValue !== newValue && animationsEnabled) {
          element.textContent = newValue;
          element.classList.add('animate-point');
          
          setTimeout(() => {
            element.classList.remove('animate-point');
          }, 700);
        } else {
          element.textContent = newValue;
        }
      }
      
      /**
 * Dynamiczna aktualizacja setów
 */
function updateDynamicSets(match, containerId, playerNum) {
    const container = document.getElementById(containerId);
    if (!container) return;
    
    // Wyczyszczenie kontenera
    container.innerHTML = '';
    
    // Określenie maksymalnej liczby setów
    const maxSets = match.sets_to_win === 3 ? 5 : 3;
    
    // Poprzednie wartości dla animacji
    const previousSets = previousState ? previousState.score[`player${playerNum}`].sets : null;
    
    // Tworzenie elementów setów
    for (let i = 0; i < maxSets; i++) {
      // Sprawdzenie czy ten set powinien być wyświetlany
      if (isSetVisible(i, match)) {
        // Tworzenie elementu setu
        const setBox = document.createElement('div');
        setBox.className = 'set-box';
        setBox.id = `${containerId.replace('sets', `set${i}`)}`;
        setBox.textContent = match.score[`player${playerNum}`].sets[i];
        
        // Animacja przy zmianie
        if (previousSets && previousSets[i] !== match.score[`player${playerNum}`].sets[i] && animationsEnabled) {
          setBox.classList.add('animate-set');
          setTimeout(() => {
            setBox.classList.remove('animate-set');
          }, 1000);
        }
        
        container.appendChild(setBox);
        
        // Dodanie separatora między setami (oprócz ostatniego)
        if (i < maxSets - 1 && i < maxSets - 1 && isSetVisible(i+1, match)) {
          const separator = document.createElement('span');
          separator.textContent = ' / ';
          separator.style.margin = '0 3px';
          container.appendChild(separator);
        }
      }
    }
  }
  /**
 * Sprawdza czy dany set powinien być widoczny
 */
function isSetVisible(setIndex, match) {
    // Set jest aktualnie rozgrywany
    const isCurrentSet = match.current_set === setIndex + 1;
    
    // Set został już rozegrany - przynajmniej jeden z graczy ma punkty większe od 0
    const isSetCompleted = match.score.player1.sets[setIndex] > 0 || match.score.player2.sets[setIndex] > 0;
    
    return isCurrentSet || isSetCompleted;
  }
      
      /**
       * Dodanie kolumny seta do oryginalnego szablonu
       */
      function addOriginalSetColumn(setIndex, match) {
        // Znajdujemy wiersze tabeli
        const headerRow = document.querySelector('#original-template .score-table thead tr');
        const player1Row = document.querySelector('#original-template .player-row.player1');
        const player2Row = document.querySelector('#original-template .player-row.player2');
        
        if (!headerRow || !player1Row || !player2Row) return;
        
        // Znajdujemy kolumnę gemów (przed którą wstawimy kolumnę seta)
        const gamesHeader = headerRow.querySelector('.games-col');
        
        if (!gamesHeader) return;
        
        // Tworzenie nagłówka nowej kolumny
        const setHeader = document.createElement('th');
        setHeader.className = `set-col set-col-${setIndex}`;
        setHeader.textContent = `SET ${setIndex + 1}`;
        
        // Wstawienie przed kolumną gemów
        headerRow.insertBefore(setHeader, gamesHeader);
        
        // Tworzenie komórki dla gracza 1
        const p1GamesCell = player1Row.querySelector('.games-cell');
        const p1SetCell = document.createElement('td');
        p1SetCell.className = 'set-cell';
        p1SetCell.id = `original-player1-set${setIndex}`;
        p1SetCell.textContent = '0';
        
        player1Row.insertBefore(p1SetCell, p1GamesCell);
        
        // Tworzenie komórki dla gracza 2
        const p2GamesCell = player2Row.querySelector('.games-cell');
        const p2SetCell = document.createElement('td');
        p2SetCell.className = 'set-cell';
        p2SetCell.id = `original-player2-set${setIndex}`;
        p2SetCell.textContent = '0';
        
        player2Row.insertBefore(p2SetCell, p2GamesCell);
      }
      /**
     * Aktualizacja wyświetlania czasu
     */
    function updateTimeDisplay() {
        if (!currentMatch || !currentMatch.time) return;
        
        // Lista elementów czasu meczu dla wszystkich szablonów
        const matchTimeElements = [
          'original-match-time',
          'horizontal-match-time',
          'vertical-match-time',
          'modern-match-time',
          'broadcast-match-time'
        ];
        
        // Lista elementów czasu seta dla wszystkich szablonów
        const setTimeElements = [
          'original-current-set-time',
          'vertical-current-set-time',
          'modern-current-set-time',
          'broadcast-current-set-time'
        ];
        
        // Aktualizacja czasu meczu we wszystkich szablonach
        for (const elementId of matchTimeElements) {
          updateMatchTimeDisplay(elementId);
        }
        
        // Aktualizacja czasu seta we wszystkich szablonach
        for (const elementId of setTimeElements) {
          updateSetTimeDisplay(elementId);
        }
      }
      
      /**
       * Aktualizacja wyświetlania czasu meczu
       */
      function updateMatchTimeDisplay(elementId) {
        const matchTimeEl = document.getElementById(elementId);
        if (!matchTimeEl) return;
        
        if (currentMatch.time.start) {
          const matchStartTime = new Date(currentMatch.time.start);
          
          if (currentMatch.winner > 0 && currentMatch.time.end) {
            // Dla zakończonego meczu
            const matchEndTime = new Date(currentMatch.time.end);
            const diffMs = matchEndTime - matchStartTime;
            formatTimeDisplay(matchTimeEl, diffMs);
          } else {
            // Dla trwającego meczu
            const now = new Date();
            const diffMs = now - matchStartTime;
            formatTimeDisplay(matchTimeEl, diffMs);
          }
        }
      }
      /**
     * Aktualizacja wyświetlania czasu seta
     */
    function updateSetTimeDisplay(elementId) {
        const setTimeEl = document.getElementById(elementId);
        if (!setTimeEl) return;
        
        if (currentMatch.time.sets && currentMatch.time.sets.length > 0) {
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
              formatTimeDisplay(setTimeEl, diffMs, 'Set: ');
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
      
      /**
       * Aktualizacja czasu ostatniej aktualizacji
       */
      function updateLastUpdateTime() {
        const lastUpdateElements = [
          'original-last-update',
          'modern-last-update'
        ];
        
        for (const elementId of lastUpdateElements) {
          const element = document.getElementById(elementId);
          if (element) {
            const now = new Date();
            element.textContent = `Aktualizacja: ${now.toLocaleTimeString()}`;
          }
        }
      }
      /**
     * Aplikowanie ustawień wyglądu
     */
    function applyAppearance(appearance) {
        if (!appearance) return;
        
        const templates = [
          'original',
          'horizontal',
          'vertical',
          'modern',
          'broadcast'
        ];
        
        // Resetowanie klas motywów
        const themeClasses = ['theme-wimbledon', 'theme-roland-garros', 'theme-us-open', 'theme-australian-open'];
        
        for (const template of templates) {
          const container = document.getElementById(`${template}-template`);
          if (container) {
            // Usunięcie poprzednich klas motywów
            themeClasses.forEach(cls => container.classList.remove(cls));
            
            // Dodanie klasy motywu
            if (appearance.theme && appearance.theme !== 'default') {
              container.classList.add(`theme-${appearance.theme}`);
            }
          }
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
        const templates = [
          'original',
          'horizontal',
          'vertical',
          'modern',
          'broadcast'
        ];
        
        for (const template of templates) {
          const logoContainer = document.getElementById(`${template}-tournament-logo`);
          
          if (!logoContainer) continue;
          
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
      }
      
      /**
       * Obsługa przycisku dostosowania wyglądu
       */
      function applyCustomizations() {
        // Ta funkcja może być używana do zapisywania niestandardowych ustawień wyglądu
        console.log("Zapisywanie niestandardowych ustawień...");
        
        // Tu można dodać kod do pobierania wartości z formularza i wysyłania ich do API
        
        const templateSelector = document.getElementById('scoreboard-template');
        if (templateSelector) {
          changeTemplate(templateSelector.value);
        }
      }

      /**
 * Funkcja aktualizująca Pro Tennis Scoreboard
 * Dodaj tę funkcję do pliku enhanced-scoreboards.js
 */
      function updateProTennisScoreboard(match) {
        // Nazwy zawodników
        document.getElementById('pro-tennis-player1-name').textContent = match.player1.toUpperCase();
        document.getElementById('pro-tennis-player2-name').textContent = match.player2.toUpperCase();
        
        // Wskaźniki serwisu
        const serving1 = document.getElementById('pro-tennis-serving1');
        const serving2 = document.getElementById('pro-tennis-serving2');
        
        if (serving1) serving1.classList.toggle('active', match.serving_player === 1);
        if (serving2) serving2.classList.toggle('active', match.serving_player === 2);
        
        // Punkty
        updateProTennisElement('pro-tennis-player1-points', match.score.player1.points);
        updateProTennisElement('pro-tennis-player2-points', match.score.player2.points);
        
        // Gemy aktualnego seta
        updateProTennisElement('pro-tennis-player1-games', match.score.player1.games);
        updateProTennisElement('pro-tennis-player2-games', match.score.player2.games);
        
        // Aktualizacja setów
        updateProTennisSets(match, 'pro-tennis-player1-sets', 1);
        updateProTennisSets(match, 'pro-tennis-player2-sets', 2);
        
        // Status meczu i set
        const setIndicator = document.getElementById('pro-tennis-set-indicator');
        if (setIndicator) {
          setIndicator.textContent = `SET ${match.current_set}`;
        }
        
        // Wskaźnik tie-break
        const tiebreakIndicator = document.getElementById('pro-tennis-tiebreak-indicator');
        if (tiebreakIndicator) {
          tiebreakIndicator.classList.toggle('active', match.is_tiebreak);
        }
      }

/**
 * Aktualizuje element z animacją dla Pro Tennis Scoreboard
 */
function updateProTennisElement(elementId, newValue) {
  const element = document.getElementById(elementId);
  if (!element) return;
  
  // Konwersja na string
  newValue = String(newValue);
  const oldValue = element.textContent;
  
  // Animacja przy zmianie
  if (oldValue !== newValue && animationsEnabled) {
    element.textContent = newValue;
    element.classList.add('animate');
    
    setTimeout(() => {
      element.classList.remove('animate');
    }, 700);
  } else {
    element.textContent = newValue;
  }
}

/**
 * Aktualizuje sety dla Pro Tennis Scoreboard
 */
function updateProTennisSets(match, containerId, playerNum) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  // Wyczyszczenie kontenera
  container.innerHTML = '';
  
  // Określenie maksymalnej liczby setów
  const maxSets = match.sets_to_win === 3 ? 5 : 3;
  
  // Tworzenie elementów setów
  for (let i = 0; i < maxSets; i++) {
    // Sprawdzenie czy ten set powinien być wyświetlany
    if (isSetVisible(i, match)) {
      // Tworzenie elementu setu
      const setBox = document.createElement('div');
      setBox.className = 'pro-tennis-set';
      
      // Dodaj klasę dla aktualnego seta
      if (match.current_set === i + 1) {
        setBox.classList.add('current');
      }
      
      // Pobieramy wyniki obu graczy dla tego seta
      const p1Score = match.score.player1.sets[i];
      const p2Score = match.score.player2.sets[i];
      
      // Tworzenie spana z wynikiem, aby móc go kolorować
      const scoreSpan = document.createElement('span');
      scoreSpan.textContent = match.score[`player${playerNum}`].sets[i];
      
      // Sprawdzanie czy set został zakończony i dodanie odpowiedniej klasy do cyfry wyniku
      if (p1Score > 0 || p2Score > 0) {
        // Set jest zakończony - sprawdzamy kto wygrał
        if (p1Score > p2Score) {
          // Set wygrany przez zawodnika 1
          if (playerNum === 1 && p1Score >= 6) {
            // Tylko zwycięskie cyfry 6 lub 7 dla zawodnika 1
            scoreSpan.className = 'score-p1-won';
          }
        } else if (p2Score > p1Score) {
          // Set wygrany przez zawodnika 2
          if (playerNum === 2 && p2Score >= 6) {
            // Tylko zwycięskie cyfry 6 lub 7 dla zawodnika 2
            scoreSpan.className = 'score-p2-won';
          }
        }
      }
      
      // Dodanie spana z wynikiem do elementu seta
      setBox.appendChild(scoreSpan);
      
      // Dodanie elementu seta do kontenera
      container.appendChild(setBox);
    }
  }
}
      
      // Globalna funkcja do zmiany szablonu
      window.changeTemplate = changeTemplate;
      window.applyCustomizations = applyCustomizations;
      
      // Inicjalizacja po załadowaniu strony
      document.addEventListener('DOMContentLoaded', init);
      
      // Zwrócenie publicznego API
      return {
        init: init,
        changeTemplate: changeTemplate
      };
  })();