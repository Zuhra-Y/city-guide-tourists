// main.js
document.addEventListener('DOMContentLoaded', function () {
    const apiKey = '286dd95f6799c998fae158ba92641d63';
    let map;
    const markers = [];
    const infoWindows = [];
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const historyContainer = document.getElementById('history');
    const todayContainer = document.getElementById('today');
    const forecastContainer = document.getElementById('forecast');

    // Load the Google Maps API script asynchronously
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=YOUR_GOOGLE_MAPS_API_KEY&libraries=places&callback=initMap`;
    script.defer = true;
    document.head.appendChild(script);

    // Load other scripts
    const weatherScript = document.createElement('script');
    weatherScript.src = 'scripts/weather-api.js';
    weatherScript.defer = true;
    document.head.appendChild(weatherScript);

    // Event listener for the search form
    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const location = searchInput.value.trim();

        if (location !== '') {
            searchLocation(location);
            getWeatherData(location);
        }
    });

    // ... (other functions specific to OpenWeatherMap API)
});