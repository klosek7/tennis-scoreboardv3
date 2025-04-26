/**
 * Wspólne funkcje pomocnicze dla wszystkich stron
 */

// Obsługa zapytań HTTP
const TennisAPI = (function() {
    // Funkcja do pobierania danych z API
    function getData(url) {
        return fetch(url)
            .then(handleResponse)
            .catch(handleError);
    }
    
    // Funkcja do wysyłania danych do API
    function postData(url, data) {
        return fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
        .then(handleResponse)
        .catch(handleError);
    }
    
    // Obsługa odpowiedzi
    function handleResponse(response) {
        if (!response.ok) {
            return response.json().then(data => {
                throw new Error(data.error || 'Wystąpił błąd serwera');
            });
        }
        return response.json();
    }
    
    // Obsługa błędów
    function handleError(error) {
        console.error('API Error:', error);
        throw error;
    }
    
    // Publiczne API
    return {
        getData,
        postData
    };
})();

// Pomocnicze funkcje
const TennisUtils = (function() {
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
    
    // Pobieranie parametru z URL
    function getUrlParam(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
    
    // Debounce - ograniczenie liczby wywołań funkcji
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this;
            const args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Throttle - wywołanie funkcji nie częściej niż co określony czas
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const context = this;
            const args = arguments;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Obsługa błędów
    function handleError(message, redirectUrl = null) {
        alert(message);
        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        }
    }
    
    // Wyświetlanie komunikatu o sukcesie
    function showSuccess(message, redirectUrl = null) {
        alert(message);
        if (redirectUrl) {
            setTimeout(() => {
                window.location.href = redirectUrl;
            }, 1000);
        }
    }
    
    // Publiczne API
    return {
        formatDuration,
        formatDate,
        getUrlParam,
        debounce,
        throttle,
        handleError,
        showSuccess
    };
})();