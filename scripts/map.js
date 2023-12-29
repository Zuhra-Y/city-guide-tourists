// Initialize the map and other variables
let map;
const markers = [];
const infoWindows = [];

function initMap() {
    // Try to get the user's current location using the Geolocation API
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                // If successful, center the map at the user's current location
                const userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                };

                map = new google.maps.Map(document.getElementById('map'), {
                    center: userLocation,
                    zoom: 12,
                });

                // Create a PlacesService to perform a text search on the user-entered location
                const placesService = new google.maps.places.PlacesService(map);

                // Add autocomplete functionality to the location input field
                const locationInput = document.getElementById('locationInput');
                const autocomplete = new google.maps.places.Autocomplete(locationInput, { types: ['geocode'] });

                // Function to search for tourist attractions based on user input
                window.searchLocation = function () {
                    const locationInput = document.getElementById('locationInput');
                    const location = locationInput.value.trim(); // Trim leading and trailing spaces
                
                    if (!location) {
                        displayErrorModal('Please enter a valid location.');
                        return;
                    }
                
                    // Perform a text search
                    placesService.textSearch({
                        query: location,
                    }, (results, status) => {
                        console.log(results); // Log the results to the console for debugging
                
                        if (status === google.maps.places.PlacesServiceStatus.OK) {
                            // Clear existing markers and info windows
                            clearMarkers();
                
                            // Update the map center based on the first result
                            if (results.length > 0) {
                                map.setCenter(results[0].geometry.location);
                            }
                
                            // Display markers for each result and update the list of attractions
                            for (let i = 0; i < results.length; i++) {
                                createMarker(results[i]);
                                updateAttractionList(results[i]);
                            }
                        } else {
                            displayErrorModal('Location search failed. Please try again.');
                        }
                    });
                };

                // Function to create a marker for a place
                function createMarker(place) {
                    const marker = new google.maps.Marker({
                        map: map,
                        position: place.geometry.location,
                    });

                    // Create an info window for the marker
                    const infoWindow = new google.maps.InfoWindow({
                        content: `<strong>${place.name}</strong><br>${place.formatted_address}`,
                    });

                    // Open the info window when the marker is clicked
                    marker.addListener('click', function () {
                        closeInfoWindows();
                        getWeatherInfo(place, infoWindow); // Get weather information
                        infoWindow.open(map, marker);
                    });

                    // Store the marker and info window in arrays
                    markers.push(marker);
                    infoWindows.push(infoWindow);
                }

                // Function to clear all markers from the map
                function clearMarkers() {
                    for (let i = 0; i < markers.length; i++) {
                        markers[i].setMap(null);
                    }
                    markers.length = 0; // Clear the markers array
                }

                // Function to close all open info windows
                function closeInfoWindows() {
                    for (let i = 0; i < infoWindows.length; i++) {
                        infoWindows[i].close();
                    }
                }

                // Function to update the list of attractions in the HTML
                function updateAttractionList(place) {
                    const attractionList = document.getElementById('attractionList');
                
                    // Create a list item for each place
                    const listItem = document.createElement('li');
                    
                    // Display more information (you can customize this based on your needs)
                    listItem.innerHTML = `<strong>${place.name}</strong><br>
                                          Address: ${place.formatted_address}<br>
                                          Rating: ${place.rating || 'N/A'}`;
                
                    // Append the list item to the attractionList
                    attractionList.appendChild(listItem);
                }
                
            },
            (error) => {
                // Handle geolocation errors
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
        // Browser doesn't support Geolocation
        displayErrorModal('Geolocation is not supported by your browser. Please enter a location manually.');
    }
}

// Function to display error modal
function displayErrorModal(errorMessage) {
    const errorModalBody = document.getElementById('errorModalBody');
    errorModalBody.textContent = errorMessage;
    $('#errorModal').modal('show');
}
