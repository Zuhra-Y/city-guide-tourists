document.addEventListener('DOMContentLoaded', function () {
    const apiKey = '0d142952be23539c1c223a0715da6c6e'; 
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const historyContainer = document.getElementById('history');
    const todayContainer = document.getElementById('today');
    const forecastContainer = document.getElementById('forecast');

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const cityName = searchInput.value.trim();

        if (cityName !== '') {
            getWeatherData(cityName);
        }
    });

    function getWeatherData(cityName) {
        const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                const { lat, lon } = data.coord;
                const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

                return fetch(weatherUrl);
            })
            .then(response => response.json())
            .then(data => {
                displayWeather(data);
                saveToLocalStorage(cityName);
            })
            .catch(error => console.error('Error fetching weather data:', error));
    }

    function displayWeather(data) {
        const currentWeather = data.list[0];
        const forecastData = data.list.slice(1, 6);
    
        
        todayContainer.innerHTML = `
            <h2>${data.city.name}</h2>
            <p>Date: ${new Date(currentWeather.dt * 1000).toLocaleDateString()}</p>
            <p>Temp: ${convertToCelsius(currentWeather.main.temp)}°C</p>
            <p>Humidity: ${currentWeather.main.humidity}%</p>
            <p>Wind Speed: ${currentWeather.wind.speed} m/s</p>
        `;
    
        
        forecastContainer.innerHTML = forecastData.map(day => ` 
         <div class="col-md-2">
                <p>Date: ${new Date(day.dt * 1000).toLocaleDateString()}</p>
                <p>Temp: ${convertToCelsius(day.main.temp)}°C</p>
                <p>Humidity: ${day.main.humidity}%</p>
            </div>
        `).join('');
    }
    
   
    function convertToCelsius(kelvin) {
        return (kelvin - 273.15).toFixed(2);
    }

    function saveToLocalStorage(cityName) {
        let searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        if (!searchHistory.includes(cityName)) {
            searchHistory.push(cityName);
            localStorage.setItem('searchHistory', JSON.stringify(searchHistory));
            renderSearchHistory();
        }
    }

    function loadSearchHistory() {
        const searchHistory = JSON.parse(localStorage.getItem('searchHistory')) || [];
        searchHistory.forEach(city => {
            createHistoryItem(city);
        });
    }

    function renderSearchHistory() {
        historyContainer.innerHTML = '';
        loadSearchHistory();
    }

    function createHistoryItem(city) {
        const historyItem = document.createElement('button');
        historyItem.textContent = city;
        historyItem.classList.add('list-group-item', 'list-group-item-action');
        historyItem.addEventListener('click', function () {
            getWeatherData(city);
        });
        historyContainer.appendChild(historyItem);
    }

    
    loadSearchHistory();
});
