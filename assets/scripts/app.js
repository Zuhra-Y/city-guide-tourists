document.addEventListener('DOMContentLoaded', function () {
    const apiKey = '286dd95f6799c998fae158ba92641d63';
    const form = document.getElementById('search-form');
    const searchInput = document.getElementById('locationInput');
    const historyContainer = document.getElementById('history');
    const todayContainer = document.getElementById('today');
    const forecastContainer = document.getElementById('forecast');
    let map;
    const markers = [];
    const infoWindows = [];

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        const cityName = searchInput.value.trim();

        if (cityName !== '') {
            searchLocation(cityName);
        }
    });

    function searchLocation() {
        const locationInput = document.getElementById('locationInput');
        const location = locationInput.value.trim();

        if (!location) {
            displayErrorModal('Please enter a valid location.');
            return;
        }

        clearMarkers(); clearAttractionList();

        // Pass city name directly to getWeatherData
        getWeatherData(location);
    };

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

        // Get the first weather condition from the array (assuming it exists)
        const mainWeatherCondition = currentWeather.weather && currentWeather.weather.length > 0
        ? currentWeather.weather[0].main
        : '';

        // Function to get the corresponding Bootstrap icon based on the weather condition
        const getWeatherIcon = (condition) => {
            switch (condition.toLowerCase()) {
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
            createHistoryItem(city, getWeatherData);
        });
    }

    function renderSearchHistory() {
        historyContainer.innerHTML = '';
        loadSearchHistory();
    }

    function createHistoryItem(city, weatherDataFunction) {
        const historyItem = document.createElement('button');
        historyItem.textContent = city;
        historyItem.classList.add('list-group-item', 'list-group-item-action');
        historyItem.addEventListener('click', function () {
            weatherDataFunction(city);
        });
        historyContainer.appendChild(historyItem);
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

                    const placesService = new google.maps.places.PlacesService(map);

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
                            console.log(results);

                            if (status === google.maps.places.PlacesServiceStatus.OK) {
                                clearMarkers();
                                clearAttractionList();

                                if (results.length > 0) {
                                    map.setCenter(results[0].geometry.location);
                                    const location = results[0].geometry.location;

                                    // Perform nearby search around the location
                                    placesService.nearbySearch({
                                        location: location,
                                        radius: 5000,  // Adjust the radius as needed
                                        type: 'tourist_attraction',  // Specify the type of places you're interested in [Attractions]
                                    }, (nearbyResults, nearbyStatus) => {
                                        if (nearbyStatus === google.maps.places.PlacesServiceStatus.OK) {
                                            // Display nearby attractions
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
                            getWeatherInfo(place, infoWindow);
                            infoWindow.open(map, marker);
                        });

                        markers.push(marker);
                        infoWindows.push(infoWindow);
                    }

                    function clearMarkers() {
                        for (let i = 0; i < markers.length; i++) {
                            markers[i].setMap(null);
                        }
                        markers.length = 0;
                    }

                    function closeInfoWindows() {
                        for (let i = 0; i < infoWindows.length; i++) {
                            infoWindows[i].close();
                        }
                    }

                    function updateAttractionList(place) {
                        const attractionList = document.getElementById('attractionList');

                        const listItem = document.createElement('li');

                        listItem.innerHTML = `<strong>${place.name}</strong><br>
                                              Address: ${place.formatted_address}<br>
                                              Rating: ${place.rating || 'N/A'}`;

                        attractionList.appendChild(listItem);
                    }

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