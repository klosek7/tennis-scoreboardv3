/**
 * Moduł statystyk meczu
 */
const TennisStatistics = (function() {
    // Zmienne prywatne
    let matchData = null;
    let matchStats = null;
    let pointsChart = null;
    let timeChart = null;
    
    // Inicjalizacja
    function init() {
        // Pobieranie ID meczu z URL
        const urlParams = new URLSearchParams(window.location.search);
        const matchId = urlParams.get('id');
        
        if (!matchId) {
            showError('Nie podano ID meczu');
            return;
        }
        
        // Konfiguracja przycisków eksportu
        setupExportButtons(matchId);
        
        // Ładowanie danych meczu
        loadMatchData(matchId);
    }
    
    // Konfiguracja przycisków eksportu
    function setupExportButtons(matchId) {
        // Eksport do CSV
        const csvButton = document.getElementById('export-csv');
        if (csvButton) {
            csvButton.addEventListener('click', function(e) {
                e.preventDefault();
                window.location.href = `/api/match/${matchId}/export/csv`;
            });
        }
        
        // Eksport do PDF
        const pdfButton = document.getElementById('export-pdf');
        if (pdfButton) {
            pdfButton.addEventListener('click', function(e) {
                e.preventDefault();
                alert('Funkcja eksportu do PDF jest w trakcie implementacji.');
            });
        }
    }
    
    // Ładowanie danych meczu
    function loadMatchData(matchId) {
        fetch(`/api/match/${matchId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Nie można znaleźć meczu');
                }
                return response.json();
            })
            .then(match => {
                matchData = match;
                
                // Wstawienie podstawowych informacji o meczu
                displayMatchInfo(match);
                
                // Pobranie statystyk
                loadMatchStatistics(matchId);
            })
            .catch(error => {
                console.error('Error:', error);
                showError('Wystąpił błąd podczas pobierania danych o meczu.');
            });
    }
    
    // Ładowanie statystyk meczu
    function loadMatchStatistics(matchId) {
        fetch(`/api/match/${matchId}/statistics`)
            .then(response => response.json())
            .then(stats => {
                matchStats = stats;
                displayStatistics();
            })
            .catch(error => {
                console.error('Error fetching statistics:', error);
                // Jeśli nie ma endpointu statystyk, generujemy je lokalnie
                console.log('Generowanie lokalnych statystyk...');
                matchStats = calculateLocalStatistics(matchData);
                displayStatistics();
            });
    }
    
    // Wyświetlanie informacji o meczu
    function displayMatchInfo(match) {
        // Tytuł strony
        const titleElement = document.getElementById('match-title');
        if (titleElement) {
            titleElement.textContent = `Statystyki: ${match.player1} vs ${match.player2}`;
        }
        
        // Informacje o meczu
        const infoElement = document.getElementById('match-info');
        if (infoElement) {
            const matchDate = formatDate(match.date);
            const matchStatus = match.winner > 0 ? 'Zakończony' : 'W trakcie';
            const winner = match.winner > 0 ? 
                `Zwycięzca: ${match.winner === 1 ? match.player1 : match.player2}` : '';
            
            infoElement.innerHTML = `
                <div><strong>Data:</strong> ${matchDate}</div>
                <div><strong>Format:</strong> do ${match.sets_to_win} wygranych setów</div>
                <div><strong>Status:</strong> ${matchStatus}</div>
                ${winner ? `<div><strong>${winner}</strong></div>` : ''}
            `;
        }
    }
    
    // Wyświetlanie statystyk
    function displayStatistics() {
        if (!matchData || !matchStats) return;
        
        // Podstawowe statystyki
        displayBasicStats();
        
        // Porównanie zawodników
        displayPlayerComparison();
        
        // Sety
        displaySetsInfo();
        
        // Tworzenie wykresów
        createCharts();
        
        // Historia meczu
        displayMatchHistory();
    }
    
    // Wyświetlanie podstawowych statystyk
    function displayBasicStats() {
        // Czas meczu
        document.getElementById('match-duration').textContent = 
            matchStats.general?.match_duration || formatDuration(matchData.time.duration);
        
        // Łączna liczba punktów
        document.getElementById('total-points').textContent = 
            matchStats.general?.total_points || calculateTotalPoints(matchData);
        
        // Najdłuższy gem
        document.getElementById('longest-game').textContent = 
            formatDuration(matchStats.game_durations?.longest || 0);
        
        // Średni czas gema
        document.getElementById('avg-game-time').textContent = 
            formatDuration(matchStats.game_durations?.average || 0);
    }
    
    // Wyświetlanie porównania zawodników
    function displayPlayerComparison() {
        // Nazwy zawodników
        document.getElementById('p1-name').textContent = matchData.player1;
        document.getElementById('p2-name').textContent = matchData.player2;
        
        // Punkty
        const p1Points = matchStats.player1?.points_won || countPlayerPoints(1);
        const p2Points = matchStats.player2?.points_won || countPlayerPoints(2);
        
        document.getElementById('p1-points-won').textContent = p1Points;
        document.getElementById('p2-points-won').textContent = p2Points;
        
        // Procent wygranych punktów
        const totalPoints = p1Points + p2Points;
        const p1Pct = totalPoints > 0 ? Math.round((p1Points / totalPoints) * 100) : 50;
        const p2Pct = totalPoints > 0 ? Math.round((p2Points / totalPoints) * 100) : 50;
        
        document.getElementById('p1-points-pct').style.width = `${p1Pct}%`;
        document.getElementById('p1-pct-label').textContent = `${p1Pct}%`;
        document.getElementById('p2-pct-label').textContent = `${p2Pct}%`;
        
        // Gemy
        const p1Games = matchStats.player1?.games_won || countPlayerGames(1);
        const p2Games = matchStats.player2?.games_won || countPlayerGames(2);
        
        document.getElementById('p1-games').textContent = p1Games;
        document.getElementById('p2-games').textContent = p2Games;
        
        const totalGames = p1Games + p2Games;
        const p1GamesPct = totalGames > 0 ? Math.round((p1Games / totalGames) * 100) : 50;
        
        document.getElementById('p1-games-pct').style.width = `${p1GamesPct}%`;
    }
    
    // Wyświetlanie informacji o setach
    function displaySetsInfo() {
        const p1Sets = countPlayerSets(1);
        const p2Sets = countPlayerSets(2);
        
        // Wynik setowy
        document.getElementById('sets-result').textContent = `${p1Sets} : ${p2Sets}`;
        
        // Szczegóły setów
        const setsDetail = document.getElementById('sets-detail');
        let detailHtml = '';
        
        for (let i = 0; i < 3; i++) {
            if (matchData.score.player1.sets[i] > 0 || matchData.score.player2.sets[i] > 0) {
                detailHtml += `
                    <div class="set-box">
                        Set ${i+1}: ${matchData.score.player1.sets[i]}:${matchData.score.player2.sets[i]}
                    </div>
                `;
            }
        }
        
        setsDetail.innerHTML = detailHtml;
    }
    
    // Tworzenie wykresów
    function createCharts() {
        createPointsChart();
        createTimeChart();
    }
    
    // Tworzenie wykresu punktów
    function createPointsChart() {
        const ctx = document.getElementById('points-chart').getContext('2d');
        
        // Przygotowanie danych dla wykresu
        const pointsData = preparePointsChartData();
        
        // Zniszczenie istniejącego wykresu (jeśli istnieje)
        if (pointsChart) pointsChart.destroy();
        
        // Tworzenie wykresu
        pointsChart = new Chart(ctx, {
            type: 'line',
            data: pointsData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Zdobyte punkty w czasie meczu',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Liczba punktów'
                        }
                    }
                }
            }
        });
    }
    
    // Przygotowanie danych dla wykresu punktów
    function preparePointsChartData() {
        const pointsData = {
            labels: [],
            datasets: [
                {
                    label: matchData.player1,
                    data: [],
                    borderColor: 'rgba(30, 144, 255, 1)',
                    backgroundColor: 'rgba(30, 144, 255, 0.2)',
                    fill: true
                },
                {
                    label: matchData.player2,
                    data: [],
                    borderColor: 'rgba(220, 20, 60, 1)',
                    backgroundColor: 'rgba(220, 20, 60, 0.2)',
                    fill: true
                }
            ]
        };
        
        // Zliczanie punktów w czasie
        let p1Points = 0;
        let p2Points = 0;
        
        // Grupujemy punkty co 5 akcji dla czytelności
        let pointCounter = 0;
        
        matchData.history.forEach((entry, index) => {
            if (entry.action === 'add_point') {
                if (entry.player === 1) {
                    p1Points++;
                } else if (entry.player === 2) {
                    p2Points++;
                }
                
                pointCounter++;
                
                // Dodajemy punkty do wykresu co 5 punktów lub na końcu
                if (pointCounter % 5 === 0 || index === matchData.history.length - 1) {
                    pointsData.labels.push(entry.timestamp);
                    pointsData.datasets[0].data.push(p1Points);
                    pointsData.datasets[1].data.push(p2Points);
                }
            }
        });
        
        // Jeśli mamy mało punktów, dodajmy wszystkie
        if (pointsData.labels.length < 5) {
            pointsData.labels = [];
            pointsData.datasets[0].data = [];
            pointsData.datasets[1].data = [];
            
            p1Points = 0;
            p2Points = 0;
            
            matchData.history.forEach(entry => {
                if (entry.action === 'add_point') {
                    if (entry.player === 1) {
                        p1Points++;
                    } else if (entry.player === 2) {
                        p2Points++;
                    }
                    
                    pointsData.labels.push(entry.timestamp);
                    pointsData.datasets[0].data.push(p1Points);
                    pointsData.datasets[1].data.push(p2Points);
                }
            });
        }
        
        return pointsData;
    }
    
    // Tworzenie wykresu czasów gemów
    function createTimeChart() {
        const ctx = document.getElementById('time-chart').getContext('2d');
        
        // Przygotowanie danych dla wykresu
        const timeData = {
            labels: [],
            datasets: [{
                label: 'Czas trwania gema (sekundy)',
                data: [],
                backgroundColor: 'rgba(75, 192, 192, 0.7)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1
            }]
        };
        
        // Zbieranie danych o gemach
        let gameCount = 1;
        
        matchData.history.forEach(entry => {
            if (entry.action === 'game_completed' && entry.game_info && entry.game_info.duration) {
                timeData.labels.push(`Gem ${gameCount}`);
                timeData.datasets[0].data.push(Math.round(entry.game_info.duration));
                gameCount++;
            }
        });
        
        // Zniszczenie istniejącego wykresu (jeśli istnieje)
        if (timeChart) timeChart.destroy();
        
        // Tworzenie wykresu
        timeChart = new Chart(ctx, {
            type: 'bar',
            data: timeData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: 'Czas trwania gemów',
                        font: {
                            size: 16
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const seconds = context.raw;
                                const minutes = Math.floor(seconds / 60);
                                const remainingSeconds = seconds % 60;
                                return `${minutes}m ${remainingSeconds}s`;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Czas (sekundy)'
                        }
                    }
                }
            }
        });
    }
    
    // Wyświetlanie historii meczu
    function displayMatchHistory() {
        const historyBody = document.getElementById('history-body');
        if (!historyBody) return;
        
        historyBody.innerHTML = '';
        
        if (matchData.history && matchData.history.length > 0) {
            matchData.history.forEach(entry => {
                let actionText = '';
                let scoreState = '';
                
                switch(entry.action) {
                    case 'add_point':
                        actionText = `Punkt dla ${entry.player == 1 ? matchData.player1 : matchData.player2}`;
                        if (entry.state_before) {
                            scoreState = `${entry.state_before.player1_points}:${entry.state_before.player2_points}`;
                        }
                        break;
                    case 'add_game':
                        actionText = `Gem dla ${entry.player == 1 ? matchData.player1 : matchData.player2}`;
                        if (entry.state_before) {
                            scoreState = `Gemy: ${entry.state_before.player1_games}:${entry.state_before.player2_games}`;
                        }
                        break;
                    case 'game_completed':
                        actionText = 'Zakończenie gema';
                        if (entry.game_info) {
                            const duration = entry.game_info.duration ? formatDuration(entry.game_info.duration) : '';
                            scoreState = `${entry.game_info.player1_points}:${entry.game_info.player2_points} (${duration})`;
                        }
                        break;
                    case 'set_completed':
                        actionText = `Zakończenie seta ${entry.set_number}`;
                        if (entry.player1_games !== undefined && entry.player2_games !== undefined) {
                            scoreState = `${entry.player1_games}:${entry.player2_games}`;
                        }
                        break;
                    case 'match_completed':
                        actionText = `KONIEC MECZU`;
                        if (entry.winner) {
                            const winner = entry.winner === 1 ? matchData.player1 : matchData.player2;
                            scoreState = `Zwycięzca: ${winner}`;
                        }
                        break;
                    case 'reset':
                        actionText = 'Reset wyniku';
                        break;
                    case 'toggle_serving':
                        actionText = 'Zmiana serwującego';
                        break;
                    default:
                        actionText = entry.action;
                }
                
                if (actionText) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${entry.timestamp}</td>
                        <td>${actionText}</td>
                        <td>${scoreState}</td>
                    `;
                    historyBody.appendChild(row);
                }
            });
        } else {
            historyBody.innerHTML = '<tr><td colspan="3">Brak historii dla tego meczu.</td></tr>';
        }
    }
    
    // Funkcje pomocnicze
    
    // Obliczanie lokalnych statystyk
    function calculateLocalStatistics(match) {
        return {
            general: {
                match_duration: formatDuration(match.time.duration),
                total_points: calculateTotalPoints(match)
            },
            game_durations: calculateGameDurations(match),
            player1: {
                points_won: countPlayerPoints(1),
                games_won: countPlayerGames(1),
                sets_won: countPlayerSets(1)
            },
            player2: {
                points_won: countPlayerPoints(2),
                games_won: countPlayerGames(2),
                sets_won: countPlayerSets(2)
            }
        };
    }
    
    // Obliczanie sumy punktów
    function calculateTotalPoints(match) {
        let sum = 0;
        match.history.forEach(entry => {
            if (entry.action === 'add_point') {
                sum++;
            }
        });
        return sum;
    }
    
    // Zliczanie punktów zawodnika
    function countPlayerPoints(playerNum) {
        let points = 0;
        matchData.history.forEach(entry => {
            if (entry.action === 'add_point' && entry.player === playerNum) {
                points++;
            }
        });
        return points;
    }
    
    // Zliczanie gemów zawodnika
    function countPlayerGames(playerNum) {
        let games = 0;
        for (let i = 0; i < 3; i++) {
            games += matchData.score[`player${playerNum}`].sets[i] || 0;
        }
        return games;
    }
    
    // Zliczanie setów zawodnika
    function countPlayerSets(playerNum) {
        let sets = 0;
        for (let i = 0; i < 3; i++) {
            if (matchData.score[`player${playerNum}`].sets[i] > 
                matchData.score[`player${playerNum === 1 ? 2 : 1}`].sets[i]) {
                sets++;
            }
        }
        return sets;
    }
    
    // Obliczanie statystyk czasu gemów
    function calculateGameDurations(match) {
        const durations = [];
        
        match.history.forEach(entry => {
            if (entry.action === 'game_completed' && entry.game_info && entry.game_info.duration) {
                durations.push(entry.game_info.duration);
            }
        });
        
        if (durations.length === 0) {
            return { longest: 0, average: 0 };
        }
        
        return {
            longest: Math.max(...durations),
            average: durations.reduce((sum, val) => sum + val, 0) / durations.length
        };
    }
    
    // Formatowanie czasu
    function formatDuration(seconds) {
        if (!seconds) return "00:00";
        
        seconds = Number(seconds);
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes < 10 ? '0' + minutes : minutes}:${secs < 10 ? '0' + secs : secs}`;
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
    
    // Wyświetlanie błędu
    function showError(message) {
        alert(message);
        setTimeout(() => {
            window.location.href = '/';
        }, 1000);
    }
    
    // Publiczne API
    return {
        init: init
    };
})();

// Inicjalizacja po załadowaniu strony
document.addEventListener('DOMContentLoaded', TennisStatistics.init);