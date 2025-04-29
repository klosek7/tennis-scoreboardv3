/**
 * Modernizowany mobilny panel kontrolny
 */
const TennisControlPanel = (function() {
    // Zmienne prywatne
    let currentMatch = null;
    const REFRESH_INTERVAL = 3000; // ms
    let timeUpdateInterval = null;
    let fabMenuOpen = false;
    
    /**
     * Inicjalizacja panelu kontrolnego
     */
    function init() {
      console.log("Inicjalizacja mobilnego panelu kontrolnego...");
      
      // Ustawienie theme mode
      initThemeMode();
      
      // Ustawienie event listenerów
      setupEventListeners();
      
      // Pobranie aktualnych danych
      loadMatchData();
      
      // Uruchomienie automatycznego odświeżania danych
      startDataRefresher();
      
      // Uruchomienie aktualizacji czasów
      startTimeUpdater();
    }
    
    /**
     * Inicjalizacja trybu ciemnego/jasnego
     */
    function initThemeMode() {
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const savedMode = localStorage.getItem('darkMode');
      
      if (savedMode !== null) {
        // Użyj zapisanej preferencji
        const isDarkMode = savedMode === 'true';
        document.body.classList.toggle('dark-theme', isDarkMode);
        darkModeToggle.checked = isDarkMode;
      } else if (prefersDarkMode) {
        // Użyj preferencji systemowych
        document.body.classList.add('dark-theme');
        darkModeToggle.checked = true;
      }
    }

    /**
 * Aktualizacja szablonu tablicy wyników
 */
function updateScoreboardTemplate() {
  if (!currentMatch) {
    showNotification('Nie ma aktywnego meczu. Rozpocznij nowy mecz.', 'warning');
    return;
  }
  
  const templateSelect = document.getElementById('scoreboard-template');
  if (!templateSelect) return;
  
  const selectedTemplate = templateSelect.value;
  
  // Wysłanie do API
  fetch('/api/scoreboard-template', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      template: selectedTemplate
    }),
  })
  .then(handleApiResponse)
  .then(data => {
    showNotification(`Szablon tablicy wyników został zmieniony na: ${selectedTemplate}`, 'success');
  })
  .catch(error => {
    console.error('Error:', error);
    showNotification('Wystąpił błąd podczas zmiany szablonu: ' + error.message, 'error');
  });
}

    /**
 * Inicjalizacja formularza wyboru szablonu
 */
function initTemplateForm() {
  // Pobranie elementów formularza
  const templateSelect = document.getElementById('scoreboard-template');
  const updateTemplateBtn = document.getElementById('update-template-btn');
  
  if (!templateSelect || !updateTemplateBtn) return;
  
  // Aktualizacja wyboru szablonu na podstawie aktualnego meczu
  if (currentMatch && currentMatch.appearance && currentMatch.appearance.template) {
    templateSelect.value = currentMatch.appearance.template;
  }
  
  // Dodanie obsługi zdarzenia kliknięcia przycisku
  updateTemplateBtn.addEventListener('click', updateScoreboardTemplate);
}
    
    /**
     * Ustawienie nasłuchiwania na zdarzenia
     */
    function setupEventListeners() {
      // Przełącznik ciemnego motywu
      const darkModeToggle = document.getElementById('dark-mode-toggle');
      darkModeToggle.addEventListener('change', toggleDarkMode);
      
      // Obsługa zakładek
      document.querySelectorAll('.tab-button').forEach(tab => {
        tab.addEventListener('click', handleTabClick);
      });
      
      // Floating Action Button (FAB)
      const fabToggle = document.getElementById('fab-toggle');
      fabToggle.addEventListener('click', toggleFabMenu);
      
      document.querySelectorAll('.fab-option').forEach(option => {
        option.addEventListener('click', handleFabOption);
      });
      
      // Przycisk rozpoczęcia meczu
      const startMatchBtn = document.getElementById('start-match-btn');
      if (startMatchBtn) {
        startMatchBtn.addEventListener('click', createNewMatch);
      }
      
      // Przyciski dla punktów
      setupButton('add-point-btn1', () => updateScore('add_point', 1));
      setupButton('remove-point-btn1', () => updateScore('remove_point', 1));
      setupButton('add-point-btn2', () => updateScore('add_point', 2));
      setupButton('remove-point-btn2', () => updateScore('remove_point', 2));
      
      // Przyciski akcji meczu
      setupButton('toggle-serving-btn', () => updateScore('toggle_serving', 0));
      setupButton('end-match-btn', endMatch);
      setupButton('reset-btn', resetScore);
      
      // Przyciski wyglądu
      setupButton('update-appearance-btn', updateAppearance);
      setupButton('reset-appearance-btn', resetAppearance);
      
      // Przyciski historii
      setupButton('quick-history-btn', () => showTab('history'));
      setupButton('back-to-match-btn', () => showTab('match'));
      
      // Przycisk statystyk do szybkiego przejścia
      setupButton('quick-stats-btn', openStatistics);
      
      // Przycisk szybkiego przejścia do ustawień
      setupButton('quick-settings-btn', () => showTab('setup'));
      
      // Dodajemy obsługę kliknięcia poza menu FAB do jego zamknięcia
      document.addEventListener('click', function(event) {
        const fabContainer = document.querySelector('.fab-container');
        const fabButton = document.getElementById('fab-toggle');
        
        if (fabMenuOpen && !fabContainer.contains(event.target) && event.target !== fabButton) {
          closeFabMenu();
        }
      });
    }
    /**
   * Przełączanie trybu ciemnego/jasnego
   */
  function toggleDarkMode() {
    document.body.classList.toggle('dark-theme');
    const isDarkMode = document.body.classList.contains('dark-theme');
    localStorage.setItem('darkMode', isDarkMode);
  }
  
  /**
   * Przełączanie menu FAB
   */
  function toggleFabMenu() {
    const fabContainer = document.querySelector('.fab-container');
    fabContainer.classList.toggle('active');
    fabMenuOpen = fabContainer.classList.contains('active');
  }
  
  /**
   * Zamknięcie menu FAB
   */
  function closeFabMenu() {
    const fabContainer = document.querySelector('.fab-container');
    fabContainer.classList.remove('active');
    fabMenuOpen = false;
  }
  
  /**
   * Obsługa opcji FAB
   */
  function handleFabOption(event) {
    // Zamknięcie menu po wybraniu opcji
    closeFabMenu();
  }
  
  /**
   * Otwarcie strony statystyk
   */
  function openStatistics() {
    if (currentMatch && currentMatch.id) {
      window.open(`/statistics?id=${currentMatch.id}`, '_blank');
    } else {
      showNotification('Brak aktywnego meczu', 'error');
    }
  }
  
  /**
   * Pomocnicza funkcja do konfiguracji przycisku
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
   * Uruchomienie automatycznego odświeżania danych
   */
  function startDataRefresher() {
    let isScrolling = false;
    let scrollTimeout;
    let lastMatchesRefresh = 0;
    const MATCHES_REFRESH_INTERVAL = 5000; // Rzadziej odświeżamy listę meczów (co 5 sekund)
    
    // Wykrywanie przewijania
    window.addEventListener('scroll', function() {
      isScrolling = true;
      clearTimeout(scrollTimeout);
      
      // Ustaw flagę przewijania na false po 200ms bez przewijania
      scrollTimeout = setTimeout(function() {
        isScrolling = false;
      }, 200);
    });
    
    setInterval(() => {
      // Nie odświeżaj danych podczas przewijania
      if (!isScrolling) {
        // Zawsze odświeżaj dane meczu
        loadMatchData();
        
        // Odświeżaj listę meczów rzadziej i tylko gdy jesteśmy na zakładce ustawień
        const currentTime = Date.now();
        if (isTabActive('setup') && currentTime - lastMatchesRefresh > MATCHES_REFRESH_INTERVAL) {
          loadPreviousMatches();
          lastMatchesRefresh = currentTime;
        }
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
    const tabContent = document.getElementById(`tab-${tabName}`);
    return tabContent && tabContent.classList.contains('active');
  }
  
  /**
   * Pokazuje zakładkę o podanej nazwie
   */
  function showTab(tabName) {
    const tabButton = document.querySelector(`.tab-button[data-tab="${tabName}"]`);
    if (tabButton) {
      tabButton.click();
    }
  }
  
  /**
   * Obsługa kliknięcia zakładki
   */
  function handleTabClick(event) {
    const tabName = event.currentTarget.dataset.tab;
    
    // Ukrycie wszystkich treści zakładek
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    
    // Usunięcie aktywnej klasy ze wszystkich zakładek
    document.querySelectorAll('.tab-button').forEach(t => {
      t.classList.remove('active');
    });
    
    // Aktywacja wybranej zakładki
    event.currentTarget.classList.add('active');
    const tabContent = document.getElementById(`tab-${tabName}`);
    if (tabContent) {
      tabContent.classList.add('active');
    }
    
    // Odświeżenie danych przy przełączaniu zakładek
    if (tabName === 'history') {
      loadMatchHistory();
    } else if (tabName === 'setup') {
      loadPreviousMatches();
    }
  }
  /**
 * Pobranie danych o aktualnym meczu
 */

  /**
 * Inicjalizacja kontenerów dla wyświetlania setów
 */
function initSetsDisplayContainers(match) {
  // Sprawdzenie czy kontenery istnieją i ew. ich utworzenie, jeśli nie
  const player1SetsContainer = document.getElementById('player1-sets');
  const player2SetsContainer = document.getElementById('player2-sets');
  
  if (!player1SetsContainer || !player2SetsContainer) {
    console.error('Nie znaleziono kontenerów na sety w HTML');
    return;
  }
  
  // Upewniamy się, że kontenery są puste przed dodaniem nowych elementów
  player1SetsContainer.innerHTML = '';
  player2SetsContainer.innerHTML = '';
  
  // Określenie maksymalnej liczby setów
  const maxSets = match.sets_to_win === 3 ? 5 : 3;
  
  // Dodanie dla debugowania - warto wyświetlić w konsoli informację o liczbie setów
  console.log(`Inicjalizacja setów do wyświetlenia. Format meczu: do ${match.sets_to_win} wygranych, max setów: ${maxSets}`);
  
  // Aktualizacja wyświetlania setów dla obu graczy
  updateSetsDisplay(match, 'player1');
  updateSetsDisplay(match, 'player2');
}
function loadMatchData() {
  fetch('/api/current-match')
    .then(handleApiResponse)
    .then(data => {
      const hasMatchChanged = !currentMatch || currentMatch.id !== data.id;
      currentMatch = data;
      
      updateScoreDisplay(data);
      updateButtonsState(data);
      updateMatchTimes(data);
      
      // Aktualizacja pól formularza, jeśli zmienił się mecz
      if (hasMatchChanged) {
        updateFormFields(data);
        
        // Inicjalizacja kontenera setów przy pierwszym ładowaniu
        initSetsDisplayContainers(data);
      }
      
      // Aktualizacja statusu meczu
      updateMatchInfo(data);
      
      // Aktualizacja linku do statystyk
      updateStatsLink(data);
    })
    .catch(error => {
      console.error('Błąd pobierania danych meczu:', error);
      updateMatchInfo(null);
    });
}
  
  /**
   * Aktualizacja informacji o meczu
   */
  function updateMatchInfo(match) {
    const matchStatusText = document.getElementById('match-status-text');
    const player1Display = document.getElementById('player1-display');
    const player2Display = document.getElementById('player2-display');
    
    if (match) {
      // Aktualizacja nazw zawodników
      if (player1Display) player1Display.textContent = match.player1;
      if (player2Display) player2Display.textContent = match.player2;
      
      // Aktualizacja statusu
      if (matchStatusText) {
        if (match.winner > 0) {
          const winner = match.winner === 1 ? match.player1 : match.player2;
          matchStatusText.textContent = `Zwycięzca: ${winner}`;
          matchStatusText.style.backgroundColor = "rgba(16, 185, 129, 0.2)"; // Success color
        } else if (match.is_tiebreak) {
          matchStatusText.textContent = "Tie Break";
          matchStatusText.style.backgroundColor = "rgba(245, 158, 11, 0.2)"; // Warning color
        } else {
          matchStatusText.textContent = `Set ${match.current_set}`;
          matchStatusText.style.backgroundColor = "rgba(59, 130, 246, 0.1)"; // Primary color
        }
      }
    } else {
      // Brak aktywnego meczu
      if (player1Display) player1Display.textContent = "Zawodnik 1";
      if (player2Display) player2Display.textContent = "Zawodnik 2";
      
      if (matchStatusText) {
        matchStatusText.textContent = "Brak aktywnego meczu";
        matchStatusText.style.backgroundColor = "rgba(100, 116, 139, 0.1)"; // Neutral color
      }
    }
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
    
    // Sprawdź która opcja jest zaznaczona
    const servingPlayerRadios = document.getElementsByName('serving-player');
    let servingPlayer = 1;
    
    for (const radio of servingPlayerRadios) {
      if (radio.checked) {
        servingPlayer = parseInt(radio.value);
        break;
      }
    }
    
    // Przygotowanie danych do wysłania
    const data = {
      player1: player1,
      player2: player2,
      sets_to_win: parseInt(setsToWin),
      advantage_rule: advantageRule,
      serving_player: servingPlayer
    };
    
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
      
      // Przełączenie na zakładkę meczu
      showTab('match');
      
      updateScoreDisplay(data);
      updateButtonsState(data);
      updateMatchTimes(data);
      updateMatchInfo(data);
      
      showNotification('Utworzono nowy mecz!', 'success');
    })
    .catch(error => {
      console.error('Błąd:', error);
      showNotification('Wystąpił błąd podczas tworzenia meczu: ' + error.message, 'error');
    });
  }
  /**
   * Wyświetlanie powiadomienia
   */
  function showNotification(message, type = 'info') {
    // Sprawdzenie czy kontener na powiadomienia istnieje
    let notificationContainer = document.querySelector('.notification-container');
    
    if (!notificationContainer) {
      notificationContainer = document.createElement('div');
      notificationContainer.className = 'notification-container';
      notificationContainer.style.position = 'fixed';
      notificationContainer.style.bottom = '80px';
      notificationContainer.style.left = '0';
      notificationContainer.style.right = '0';
      notificationContainer.style.display = 'flex';
      notificationContainer.style.flexDirection = 'column';
      notificationContainer.style.alignItems = 'center';
      notificationContainer.style.zIndex = '1000';
      document.body.appendChild(notificationContainer);
    }
    
    // Stworzenie elementu powiadomienia
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Stylowanie powiadomienia
    notification.style.backgroundColor = type === 'success' ? '#10B981' : 
                                        type === 'error' ? '#EF4444' : 
                                        type === 'warning' ? '#F59E0B' : '#3B82F6';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '8px';
    notification.style.margin = '8px';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(20px)';
    notification.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // Dodanie powiadomienia do kontenera
    notificationContainer.appendChild(notification);
    
    // Animacja pojawienia
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);
    
    // Usunięcie po 3 sekundach
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-20px)';
      
      // Usunięcie z DOM po zakończeniu animacji
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
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
  const p1PointsEl = document.getElementById('player1-points');
  if (p1PointsEl) {
    p1PointsEl.textContent = match.score.player1.points;
    console.log(`Aktualizacja punktów player1: ${match.score.player1.points}`);
  } else {
    console.error('Element player1-points nie znaleziony!');
  }
  
  const p2PointsEl = document.getElementById('player2-points');
  if (p2PointsEl) {
    p2PointsEl.textContent = match.score.player2.points;
    console.log(`Aktualizacja punktów player2: ${match.score.player2.points}`);
  } else {
    console.error('Element player2-points nie znaleziony!');
  }
  
  // Gemy
  const p1GamesEl = document.getElementById('player1-games');
  if (p1GamesEl) {
    p1GamesEl.textContent = match.score.player1.games;
    console.log(`Aktualizacja gemów player1: ${match.score.player1.games}`);
  } else {
    console.error('Element player1-games nie znaleziony!');
  }
  
  const p2GamesEl = document.getElementById('player2-games');
  if (p2GamesEl) {
    p2GamesEl.textContent = match.score.player2.games;
    console.log(`Aktualizacja gemów player2: ${match.score.player2.games}`);
  } else {
    console.error('Element player2-games nie znaleziony!');
  }
  
  // Dynamiczne aktualizowanie setów dla obu graczy
  updateSetsDisplay(match, 'player1');
  updateSetsDisplay(match, 'player2');
  
  // Aktualizacja stanu przycisków
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
 * Funkcja do dynamicznej aktualizacji wyświetlania setów
 */
function updateSetsDisplay(match, playerKey) {
  const setsContainer = document.getElementById(`${playerKey}-sets`);
  
  if (!setsContainer) {
    console.error(`Element ${playerKey}-sets nie znaleziony`);
    return;
  }
  
  // Wyczyszczenie kontenera
  setsContainer.innerHTML = '';
  
  // Określenie maksymalnej liczby setów bazując na formacie meczu (sets_to_win)
  const maxSets = match.sets_to_win === 3 ? 5 : 3;
  
  // Tworzenie elementów setów
  for (let i = 0; i < maxSets; i++) {
    // Sprawdzenie czy ten set powinien być wyświetlany
    if (i === 0 || 
        match.current_set > i || 
        match.score.player1.sets[i] > 0 || 
        match.score.player2.sets[i] > 0) {
      
      // Tworzenie elementu setu
      const setBox = document.createElement('div');
      setBox.className = 'set-box';
      setBox.id = `${playerKey}-set${i}`;
      setBox.textContent = match.score[playerKey].sets[i];
      
      setsContainer.appendChild(setBox);
      
      // Dodanie separatora między setami (oprócz ostatniego)
      if (i < maxSets - 1) {
        const separator = document.createElement('span');
        separator.textContent = ' / ';
        separator.style.margin = '0 3px';
        setsContainer.appendChild(separator);
      }
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
      'toggle-serving-btn'
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
  }
  
  /**
   * Aktualizacja czasów meczu i seta
   */
  function updateMatchTimes(match) {
    if (!match || !match.time) return;
    
    // Czas meczu
    const matchTimeEl = document.getElementById('match-time');
    if (matchTimeEl && match.time.start) {
      const matchStartTime = new Date(match.time.start);
      
      if (match.winner > 0 && match.time.end) {
        // Dla zakończonego meczu pokazujemy całkowity czas meczu
        const matchEndTime = new Date(match.time.end);
        const diffMs = matchEndTime - matchStartTime;
        updateTimeDisplay(matchTimeEl, diffMs);
      } else {
        // Dla trwającego meczu aktualizujemy czas na bieżąco
        const now = new Date();
        const diffMs = now - matchStartTime;
        updateTimeDisplay(matchTimeEl, diffMs);
      }
    }
    
    // Czas aktualnego seta
    updateSetTimeDisplay(match);
  }
  /**
   * Aktualizacja wyświetlania czasu seta
   */
  function updateSetTimeDisplay(match) {
    const setTimeEl = document.getElementById('set-time');
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
          updateTimeDisplay(setTimeEl, diffMs);
        }
      }
    }
  }
  
  /**
   * Pomocnicza funkcja do aktualizacji wyświetlania czasu
   */
  function updateTimeDisplay(element, diffMs) {
    const minutes = Math.floor(diffMs / 60000);
    const seconds = Math.floor((diffMs % 60000) / 1000);
    element.textContent = `${(minutes < 10 ? '0' : '') + minutes}:${(seconds < 10 ? '0' : '') + seconds}`;
  }
  
  /**
   * Aktualizacja pól formularza na podstawie aktualnego meczu
   */
  function updateFormFields(match) {
    if (!match) return;
    
    // Aktualizacja nazw zawodników
    const player1NameInput = document.getElementById('player1-name');
    const player2NameInput = document.getElementById('player2-name');
    
    if (player1NameInput) player1NameInput.value = match.player1 || '';
    if (player2NameInput) player2NameInput.value = match.player2 || '';
    
    // Aktualizacja liczby setów
    const setsToWinSelect = document.getElementById('sets-to-win');
    if (setsToWinSelect) setsToWinSelect.value = match.sets_to_win || '2';
    
    // Aktualizacja zasady przewag
    const advantageRuleToggle = document.getElementById('advantage-rule');
    if (advantageRuleToggle) advantageRuleToggle.checked = match.advantage_rule !== false;
    
    // Aktualizacja serwującego
    const servingPlayer1Radio = document.getElementById('serving-player-1');
    const servingPlayer2Radio = document.getElementById('serving-player-2');
    
    if (servingPlayer1Radio && servingPlayer2Radio) {
      servingPlayer1Radio.checked = match.serving_player === 1;
      servingPlayer2Radio.checked = match.serving_player === 2;
    }

    initTemplateForm();
  }
  /**
   * Aktualizacja linku do statystyk
   */
  function updateStatsLink(match) {
    const statsLink = document.getElementById('stats-link');
    if (statsLink && match && match.id) {
      statsLink.href = `/statistics?id=${match.id}`;
    }
  }
  
  /**
   * Aktualizacja wyniku
   */
  function updateScore(action, player) {
    if (!currentMatch) {
      showNotification('Nie ma aktywnego meczu. Rozpocznij nowy mecz w zakładce Ustawienia.', 'warning');
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
      updateMatchInfo(data);
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification(error.message, 'error');
    });
  }
  
  /**
   * Zakończenie meczu
   */
  function endMatch() {
    if (!currentMatch) {
      showNotification('Nie ma aktywnego meczu.', 'warning');
      return;
    }
    
    const confirmDialog = confirm('Czy na pewno chcesz zakończyć mecz? To zablokuje dalsze zmiany wyniku.');
    
    if (confirmDialog) {
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
        updateMatchInfo(data);
        
        let winnerMessage = '';
        if (data.winner === 1) {
          winnerMessage = `${data.player1} wygrał mecz!`;
        } else if (data.winner === 2) {
          winnerMessage = `${data.player2} wygrał mecz!`;
        } else {
          winnerMessage = 'Mecz zakończony bez jednoznacznego zwycięzcy.';
        }
        
        showNotification(winnerMessage, 'success');
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Wystąpił błąd podczas kończenia meczu.', 'error');
      });
    }
  }
  
  /**
   * Reset wyniku
   */
  function resetScore() {
    if (!currentMatch) {
      showNotification('Nie ma aktywnego meczu.', 'warning');
      return;
    }
    
    const confirmDialog = confirm('Czy na pewno chcesz zresetować wynik meczu?');
    
    if (confirmDialog) {
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
        updateMatchInfo(data);
        
        showNotification('Wynik został zresetowany.', 'success');
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Wystąpił błąd podczas resetowania wyniku.', 'error');
      });
    }
  }
  /**
   * Aktualizacja wyglądu tablicy wyników
   */
  function updateAppearance() {
    if (!currentMatch) {
      showNotification('Nie ma aktywnego meczu.', 'warning');
      return;
    }
    
    // Pobranie wartości z formularza
    const theme = document.getElementById('theme-select').value;
    const logoUrl = document.getElementById('logo-url').value;
    const primaryColor = document.getElementById('primary-color').value;
    const secondaryColor = document.getElementById('secondary-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const animations = document.getElementById('animations-toggle').checked;
    
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
      showNotification('Wygląd tablicy wyników został zaktualizowany!', 'success');
    })
    .catch(error => {
      console.error('Error:', error);
      showNotification('Wystąpił błąd podczas aktualizacji wyglądu: ' + error.message, 'error');
    });
  }
  
  /**
   * Resetowanie wyglądu do domyślnych ustawień
   */
  function resetAppearance() {
    if (!currentMatch) {
      showNotification('Nie ma aktywnego meczu.', 'warning');
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
    const matchesContainer = document.getElementById('previous-matches');
    if (!matchesContainer) return;
    
    // Zapisujemy wysokość kontenera przed aktualizacją, aby uniknąć skakania
    const containerHeight = matchesContainer.offsetHeight;
    
    // Jeśli to pierwsze ładowanie, pokaż komunikat o ładowaniu
    if (matchesContainer.innerHTML.trim() === '') {
      matchesContainer.innerHTML = '<p class="loading-text">Ładowanie poprzednich meczów...</p>';
    }
    
    // Zapisz aktualną pozycję przewijania
    const scrollPosition = window.scrollY;
    
    // Dodajemy stałą wysokość do kontenera, aby uniknąć zmiany rozmiaru
    if (containerHeight > 0) {
      matchesContainer.style.minHeight = containerHeight + 'px';
    }
    
    fetch('/api/matches')
      .then(handleApiResponse)
      .then(matches => {
        // Przygotuj nową zawartość przed wstawieniem
        let html = '';
        if (matches.length === 0) {
          html = '<p class="empty-message">Brak zapisanych meczów.</p>';
        } else {
          matches.forEach(match => {
            const statusBadge = match.completed ? 
              '<span style="color: #10B981;">✓</span>' : 
              '<span style="color: #F59E0B;">⏱</span>';
            
            html += `
              <div class="match-card">
                <div class="match-card-header">
                  <div class="match-title">${match.player1} vs ${match.player2}</div>
                  <div class="match-date">${formatDate(match.date)}</div>
                </div>
                <div class="match-result">
                  <div>Wynik: ${match.score} ${statusBadge}</div>
                  <div>Czas: ${match.duration || "-"}</div>
                </div>
                <div class="match-actions">
                  <button class="primary load-match-btn" data-id="${match.id}">
                    <i class="fas fa-folder-open"></i> Załaduj
                  </button>
                  <button class="view-history-btn" data-id="${match.id}">
                    <i class="fas fa-history"></i> Historia
                  </button>
                  <button class="view-stats-btn" data-id="${match.id}">
                    <i class="fas fa-chart-bar"></i> Statystyki
                  </button>
                </div>
              </div>
            `;
          });
        }
        
        // Teraz aktualizuj DOM w jednej operacji
        matchesContainer.innerHTML = html;
        
        // Dodanie obsługi zdarzeń dla przycisków
        setupMatchButtons();
        
        // Przywróć pozycję przewijania
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
          
          // Po załadowaniu możemy usunąć minHeight, ale dopiero po przywróceniu przewijania
          setTimeout(() => {
            matchesContainer.style.minHeight = '';
          }, 100);
        }, 10);
      })
      .catch(error => {
        console.error('Error:', error);
        matchesContainer.innerHTML = '<p class="empty-message">Nie udało się załadować meczów. Spróbuj ponownie później.</p>';
        
        // Przywróć pozycję przewijania w przypadku błędu
        setTimeout(() => {
          window.scrollTo({
            top: scrollPosition,
            behavior: 'auto'
          });
          matchesContainer.style.minHeight = '';
        }, 10);
      });
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
    
    // Przyciski wyświetlania statystyk
    document.querySelectorAll('.view-stats-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const matchId = this.getAttribute('data-id');
        window.open(`/statistics?id=${matchId}`, '_blank');
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
        showTab('match');
        
        updateScoreDisplay(data);
        updateButtonsState(data);
        updateMatchTimes(data);
        updateMatchInfo(data);
        updateFormFields(data);
        
        showNotification('Mecz został załadowany!', 'success');
      })
      .catch(error => {
        console.error('Error:', error);
        showNotification('Wystąpił błąd podczas ładowania meczu.', 'error');
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
        showNotification('Wystąpił błąd podczas ładowania historii meczu.', 'error');
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
      <div class="player-names">${match.player1} vs ${match.player2}</div>
      <div>Data: ${formatDate(match.date)}</div>
      <div>Status: ${completed ? 'Zakończony' : 'W trakcie'}</div>
      <div>Wynik: ${p1Sets}:${p2Sets}</div>
      <div>Czas trwania: ${duration || 'brak danych'}</div>
    `;
  }
  /**
   * Ładowanie historii meczu
   */
  function loadMatchHistory() {
    const historyEl = document.getElementById('match-history');
    if (!historyEl) return;
    
    if (!currentMatch) {
      historyEl.innerHTML = '<p class="empty-message">Brak aktywnego meczu.</p>';
      return;
    }
    
    if (currentMatch.history && currentMatch.history.length > 0) {
      let historyHtml = '';
      
      currentMatch.history.forEach(entry => {
        let actionText = '';
        let additionalInfo = '';
        
        switch(entry.action) {
          case 'add_point':
            actionText = `Punkt dla ${entry.player == 1 ? currentMatch.player1 : currentMatch.player2}`;
            if (entry.state_before) {
              additionalInfo = `${entry.state_before.player1_points}:${entry.state_before.player2_points}`;
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
          case 'reset':
            actionText = 'Reset wyniku';
            break;
          default:
            actionText = entry.action;
        }
        
        historyHtml += `
          <div class="history-item">
            <div class="history-time">${entry.timestamp}</div>
            <div>${actionText} ${additionalInfo ? `<span style="color: var(--text-secondary);">[${additionalInfo}]</span>` : ''}</div>
          </div>
        `;
      });
      
      historyEl.innerHTML = historyHtml;
    } else {
      historyEl.innerHTML = '<p class="empty-message">Brak historii dla tego meczu.</p>';
    }
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
    init: init
  };
})();

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', TennisControlPanel.init);