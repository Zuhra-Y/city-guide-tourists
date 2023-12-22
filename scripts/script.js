document.addEventListener('DOMContentLoaded', function () {
            var form = document.getElementById('search-form');
            var input = document.getElementById('search');
            var resultsContainer = document.getElementById('search-results');

            form.addEventListener('submit', function (event) {
                event.preventDefault();
                performSearch(input.value);
            });
 
  function performSearch(query) {
                alert('Looking for: ' + query);
   }
        });
