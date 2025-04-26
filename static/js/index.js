/**
 * Moduł strony głównej
 */
const TennisIndex = (function() {
    // Stałe
    const REFRESH_INTERVAL = 10000; // 10 sekund
    
    // Inicjalizacja
    function init() {
        loadMatchesList();
        
        // Odświeżanie listy meczów co 10 sekund
        setInterval(loadMatchesList, REFRESH_INTERVAL);
        
        // Dodanie nasłuchiwania na zdarzenia dla przycisków
        setupEventListeners();
    }
    
    // Ładowanie listy meczów
    function loadMatchesList() {
        fetch('/api/matches')
            .then(response => response.json())
            .then(matches => {
                displayMatches(matches);
            })
            .catch(error => {
                console.error('Błąd ładowania listy meczów:', error);
                showErrorMessage('Nie udało się załadować listy meczów. Spróbuj odświeżyć stronę.');
            });
    }
    
    // Wyświetlanie listy meczów
    function displayMatches(matches) {
        const matchesList = document.getElementById('matches-list');
        
        if (!matchesList) return;
        
        if (matches.length === 0) {
            matchesList.innerHTML = `
                <div class="empty-message">
                    <p>Brak zapisanych meczów</p>
                    <p>Utwórz nowy mecz w panelu kontrolnym</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <table>
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
                    <td class="match-actions">
                        <a href="#" class="load-match-btn" data-id="${match.id}">
                            Załaduj
                        </a>
                        <a href="/statistics?id=${match.id}" target="_blank">
                            Statystyki
                        </a>
                    </td>
                </tr>
            `;
        });
        
        html += `
                </tbody>
            </table>
        `;
        
        matchesList.innerHTML = html;
        
        // Dodanie obsługi zdarzeń dla nowo utworzonych przycisków
        setupMatchButtons();
    }
    
    // Konfiguracja nasłuchiwania na zdarzenia
    function setupEventListeners() {
        // Na razie brak konkretnych zdarzeń do obsługi na stronie głównej
        // poza przyciskami meczów, które są dodawane dynamicznie
    }
    
    // Konfiguracja przycisków dla meczów
    function setupMatchButtons() {
        document.querySelectorAll('.load-match-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const matchId = this.getAttribute('data-id');
                loadMatch(matchId);
            });
        });
    }
    
    // Ładowanie meczu
    function loadMatch(matchId) {
        fetch(`/api/match/${matchId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Nie można załadować meczu');
                }
                return response.json();
            })
            .then(data => {
                // Przekierowanie do panelu kontrolnego po załadowaniu meczu
                showSuccessMessage(`Mecz "${data.player1} vs ${data.player2}" został załadowany`);
                
                // Przekierowanie po krótkim opóźnieniu, aby użytkownik zobaczył komunikat
                setTimeout(() => {
                    window.location.href = '/control';
                }, 1000);
            })
            .catch(error => {
                console.error('Error:', error);
                showErrorMessage('Wystąpił błąd podczas ładowania meczu.');
            });
    }
    
    // Wyświetlanie komunikatu o błędzie
    function showErrorMessage(message) {
        // Można zaimplementować bardziej rozbudowany system powiadomień
        alert(message);
    }
    
    // Wyświetlanie komunikatu o sukcesie
    function showSuccessMessage(message) {
        // Można zaimplementować bardziej rozbudowany system powiadomień
        alert(message);
    }
    
    // Formatowanie daty
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        
        // Sprawdzenie czy data jest poprawna
        if (isNaN(date.getTime())) return dateString;
        
        return date.toLocaleString('pl-PL', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    // Publiczne API
    return {
        init: init
    };
})();

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', TennisIndex.init);