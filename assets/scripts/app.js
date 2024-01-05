document.addEventListener('DOMContentLoaded', function () {
    const apiKey = '286dd95f6799c998fae158ba92641d63';
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('locationInput');
    const locationHeading = document.getElementById('location-heading');
    const historyContainer = document.getElementById('history');
    const todayContainer = document.getElementById('today');
    const forecastContainer = document.getElementById('forecast');
    let map;
    const markers = [];
    const infoWindows = [];
    let placesService;  // Added placesService as a global variable

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const cityName = searchInput.value.trim();

        if (cityName !== '') {
            searchLocation(cityName);
        }
    });

    function searchLocation(cityName) {
        const locationInput = document.getElementById('locationInput');
        const location = locationInput.value.trim();

        if (!location) {
            displayErrorModal('Please enter a valid location.');
            return;
        }

        clearMarkers(); 
        clearAttractionList();
        updateLocationHeading(cityName || location);

        // Pass city name directly to getWeatherData
        getWeatherData(location);
    }

    function updateLocationHeading(cityName) {
        console.log('Updating heading with:', cityName);
        locationHeading.textContent = cityName;
    }

    function clearMarkers() {
        for (let i = 0; i < markers.length; i++) {
            markers[i].setMap(null);
        }
        markers.length = 0;
    }

    function clearAttractionList() {
        const attractionList = document.getElementById('attractionList');
        attractionList.innerHTML = '';
        console.log('clear attraction');
    }

    function getWeatherData(cityName) {
        const geocodingUrl = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;

        fetch(geocodingUrl)
            .then(response => response.json())
            .then(data => {
                const coordinates = data.coord;
    
                if (!coordinates || typeof coordinates !== 'object') {
                    console.error('Invalid coordinates data:', coordinates);
                    throw new Error('Invalid coordinates data');
                }

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

        const mainWeatherCondition = currentWeather.weather && currentWeather.weather.length > 0
        ? currentWeather.weather[0].main
        : '';

        const getWeatherIcon = (condition) => {
            switch (condition.toLowerCase()) {
                case 'clear':
                    return 'bi-sun-fill';
                case 'thunderstorm':
                    return 'bi-cloud-lightning';
                case 'drizzle':
                case 'rain':
                    return 'bi-cloud-rain';
                case 'snow':
                    return 'bi-snow';
                case 'clear':
                    return 'bi-sun';
                case 'clouds':
                    return 'bi-cloud';
                default:
                    return 'bi-question';
            }
        };

        todayContainer.innerHTML = `
            <h2>${data.city.name}</h2>
            <p>Date: ${new Date(currentWeather.dt * 1000).toLocaleDateString()}</p>
            <p>Temp: ${convertToCelsius(currentWeather.main.temp)}°C</p>
            <p>Humidity: ${currentWeather.main.humidity}%</p>
            <p>Wind Speed: ${currentWeather.wind.speed} m/s</p>
            <p><i class="${getWeatherIcon(mainWeatherCondition)}"></i></p>
        `;

        forecastContainer.innerHTML = forecastData.map(day => `
            <div class="col-md-2">
                <p>Date: ${new Date(day.dt * 1000).toLocaleDateString()}</p>
                <p>Temp: ${convertToCelsius(day.main.temp)}°C</p>
                <p>Humidity: ${day.main.humidity}%</p>
                <p>Wind Speed: ${currentWeather.wind.speed} m/s</p>
                <p><i class="${getWeatherIcon(mainWeatherCondition)}"></i></p>
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
        historyItem.classList.add('nav', 'nav-pills', 'flex-column', 'mb-auto', 'list-group-item', 'list-group-item-action');
        historyItem.addEventListener('click', function () {
            weatherDataFunction(city);
        });
        historyContainer.prepend(historyItem);
    }

    const clearHistoryButton = document.getElementById('clear_history');
    clearHistoryButton.addEventListener('click', function () {
        clearLocalStorage();
        renderSearchHistory(); // Update the page to display nothing
    });

    function clearLocalStorage() {
        localStorage.removeItem('searchHistory');
    }

    function weatherDataFunction(city) {
        placesService.textSearch({
            query: city,
        }, (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK) {
                clearMarkers();
                clearAttractionList();

                if (results.length > 0) {
                    map.setCenter(results[0].geometry.location);
                    const location = results[0].geometry.location;

                    placesService.nearbySearch({
                        location: location,
                        radius: 5000,
                        type: 'tourist_attraction',
                    }, (nearbyResults, nearbyStatus) => {
                        if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK) {
                            for (let i = 0; i < nearbyResults.length; i++) {
                                createMarker(nearbyResults[i]);
                                updateAttractionList(nearbyResults[i]);
                            }
                        } else {
                            console.error('Nearby search failed. Please try again.');
                        }
                    });
                }

                for (let i = 0; i < results.length; i++) {
                    createMarker(results[i]);
                    updateAttractionList(results[i]);
                }

                if (results.length > 0) {
                    const firstResult = results[0];
                    const cityName = firstResult.name || firstResult.formatted_address;
                    getWeatherData(cityName);
                }
            } else {
                displayErrorModal('Location search failed. Please try again.');
            }
        });
    }

    function updateAttractionList(place) {
        const attractionList = document.getElementById('attractionList');

        const listItem = document.createElement('li');

        listItem.innerHTML = `<strong>${place.name}</strong><br>
                              Address: ${place.formatted_address}<br>
                              Rating: ${place.rating || 'N/A'}`;
        
        listItem.setAttribute('class', 'list-group-item d-flex justify-content-between align-items-start');

        attractionList.prepend(listItem);
    }

    function createMarker(place) {
        const marker = new google.maps.Marker({
            map: map,
            position: place.geometry.location,
        });

        const infoWindow = new google.maps.InfoWindow({
            content: `<strong>${place.name}</strong><br>${place.formatted_address}`,
        });

        marker.addListener('click', function () {
            closeInfoWindows();
            infoWindow.open(map, marker);
        });

        markers.push(marker);
        infoWindows.push(infoWindow);
    }

    function closeInfoWindows() {
        for (let i = 0; i < infoWindows.length; i++) {
            infoWindows[i].close();
        }
    }

    function initMap() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    };

                    map = new google.maps.Map(document.getElementById('map'), {
                        center: userLocation,
                        zoom: 12,
                    });

                    placesService = new google.maps.places.PlacesService(map);

                    const locationInput = document.getElementById('locationInput');
                    const autocomplete = new google.maps.places.Autocomplete(locationInput, { types: ['geocode'] });

                    window.searchLocation = function () {
                        const locationInput = document.getElementById('locationInput');
                        const location = locationInput.value.trim();

                        if (!location) {
                            displayErrorModal('Please enter a valid location.');
                            return;
                        }

                        placesService.textSearch({
                            query: location,
                        }, (results, status) => {
                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                clearMarkers();
                                clearAttractionList();

                                if (results.length > 0) {
                                    map.setCenter(results[0].geometry.location);
                                    const location = results[0].geometry.location;

                                    placesService.nearbySearch({
                                        location: location,
                                        radius: 5000,
                                        type: 'tourist_attraction',
                                    }, (nearbyResults, nearbyStatus) => {
                                        if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK) {
                                            for (let i = 0; i < nearbyResults.length; i++) {
                                                createMarker(nearbyResults[i]);
                                                updateAttractionList(nearbyResults[i]);
                                            }
                                        } else {
                                            console.error('Nearby search failed. Please try again.');
                                        }
                                    });
                                }

                                for (let i = 0; i < results.length; i++) {
                                    createMarker(results[i]);
                                    updateAttractionList(results[i]);
                                }

                                if (results.length > 0) {
                                    const firstResult = results[0];
                                    const cityName = firstResult.name || firstResult.formatted_address;
                                    getWeatherData(cityName);
                                }
                            } else {
                                displayErrorModal('Location search failed. Please try again.');
                            }
                        });
                    };

                    loadSearchHistory();  // Load search history once the map is initialized

                },
                (error) => {
                    let errorMessage = '';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = "User denied the request for Geolocation. Please enter a location manually.";
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = "Location information is unavailable. Please try again later or enter a location manually.";
                            break;
                        case error.TIMEOUT:
                            errorMessage = "The request to get user location timed out. Please try again.";
                            break;
                        case error.UNKNOWN_ERROR:
                            errorMessage = "An unknown error occurred while trying to retrieve the location. Please try again.";
                            break;
                    }
                    displayErrorModal(errorMessage);
                }
            );
        } else {
            displayErrorModal('Geolocation is not supported by your browser. Please enter a location manually.');
        }
    }

    function displayErrorModal(errorMessage) {
        const errorModal = document.getElementById('errorModal');
        if (errorModal) {
            const errorModalBody = document.getElementById('errorModalBody');
            if (errorModalBody) {
                errorModalBody.textContent = errorMessage;
                $('#errorModal').modal('show');
            } else {
                console.error('Error modal body not found.');
            }
        } else {
            console.error('Error modal not found.');
        }
    }

    // Check if the Google Maps API is already loaded
    if (typeof google !== 'undefined' && google.maps) {
        initMap();
    } else {
        // If not, wait for it to load
        window.initMap = initMap;
    }
});
