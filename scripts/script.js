// main.js

// Import the Trie class for handling search data
import Trie from './trie.js';

// Select the DOM elements for interaction
const searchBar = document.getElementById('search-bar'); // Search bar input element
const suggestions = document.getElementById('suggestions'); // Suggestions dropdown
const movieDetails = document.getElementById('movie-details'); // Movie details container

// Replace this placeholder with your actual API Key
const apiKey = 'api key';

// Timer for debouncing user input
let debounceTimer;

// Create an instance of the Trie class to store and search movie data
const movieTrie = new Trie();

/**
 * Fetch trending movies and populate the Trie with their data.
 */
async function populateTrie() {
  try {
    // API call to fetch trending movies
    const response = await fetch(
      `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`
    );
    if (!response.ok) throw new Error('Failed to fetch trending movies');

    // Parse the JSON response
    const data = await response.json();

    // Add each movie title and details to the Trie
    console.log('Trending movies being added to the Trie:');
    data.results.forEach(movie => {
      movieTrie.insert(movie.title, movie.release_date, movie.id);
      console.log(`- ${movie.title}`); // Log movie titles being added
    });

    console.log('Movies stored in the Trie successfully.');
  } catch (error) {
    console.error('Error populating Trie:', error);
  }
}

/**
 * Fetch movie suggestions from the API based on the user's query.
 * @param {string} query - User input for the search query.
 * @returns {Array} Array of movie suggestion objects.
 */
async function fetchMovieSuggestions(query) {
  try {
    // API call to search for movies matching the query
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie suggestions');

    // Parse the JSON response
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching movie suggestions:', error);
    return [];
  }
}

/**
 * Fetch detailed information about a specific movie.
 * @param {number} movieId - Unique ID of the selected movie.
 */
async function fetchMovieDetails(movieId) {
  try {
    // API call to fetch detailed movie information
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie details');

    // Parse the JSON response and display movie details
    const movie = await response.json();
    displayMovieDetails(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
}

/**
 * Render the detailed information about a selected movie.
 * @param {Object} movie - Movie details object.
 */
function displayMovieDetails(movie) {
  movieDetails.innerHTML = `
    <h2>${movie.title}</h2>
    <p><strong>Release Date:</strong> ${movie.release_date}</p>
    <p><strong>Genres:</strong> ${movie.genres.map(g => g.name).join(', ')}</p>
    <p><strong>Overview:</strong> ${movie.overview}</p>
    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path || 'placeholder.png'}" alt="${movie.title}">
    <p><strong>Rating:</strong> ${movie.vote_average}</p>
  `;
}

/**
 * Render the movie suggestions in the dropdown.
 * @param {Array} matches - Array of matched movie objects.
 */
function displaySuggestions(matches) {
  suggestions.innerHTML = ''; // Clear existing suggestions
  const seenMovies = new Set();

  matches.forEach(movie => {
    const movieTitle = movie.title.toLowerCase();
    if (!seenMovies.has(movieTitle)) {
      seenMovies.add(movieTitle);

      const releaseDate = movie.releaseDate || movie.release_date || 'Not Available';
      const movieId = movie.movieId || movie.id; // Handle both Trie and API response formats

      const item = document.createElement('div'); // Create a suggestion item
      item.textContent = `${movie.title} (${releaseDate})`; // Display title and release date
      item.classList.add('highlight');
      item.addEventListener('click', () => {
        if (movieId) {
          fetchMovieDetails(movieId); // Fetch and display details on click
          clearSearch(); // Clear the search bar and suggestions
        } else {
          console.error('Movie ID not found');
        }
      });
      suggestions.appendChild(item);
    }
  });
}

/**
 * Clear the search bar input and suggestions dropdown.
 */
function clearSearch() {
  searchBar.value = '';
  suggestions.innerHTML = '';
}

// Event listener for handling user input in the search bar
searchBar.addEventListener('input', async () => {
  clearTimeout(debounceTimer); // Clear any previous debounce timers
  const query = searchBar.value.trim(); // Get the trimmed input value

  if (query) {
    debounceTimer = setTimeout(async () => {
      const trieMatches = movieTrie.search(query); // Search for matches in the Trie

      // Combine Trie and API matches, avoiding duplicates
      const allMatches = [];
      const seenMovies = new Set();

      trieMatches.forEach(movie => {
        if (!seenMovies.has(movie.title.toLowerCase())) {
          seenMovies.add(movie.title.toLowerCase());
          allMatches.push({
            title: movie.title,
            releaseDate: movie.releaseDate,
            movieId: movie.movieId
          });
          console.log(`Movie "${movie.title}" taken from the Trie.`);
        }
      });

      // Fetch additional matches from the API if needed
      if (allMatches.length < 5) {
        const apiMatches = await fetchMovieSuggestions(query);
        apiMatches.forEach(movie => {
          const movieTitle = movie.title.toLowerCase();
          if (!seenMovies.has(movieTitle)) {
            seenMovies.add(movieTitle);
            allMatches.push({
              title: movie.title,
              releaseDate: movie.release_date,
              movieId: movie.id
            });
          }
        });
      }

      // Display combined suggestions
      displaySuggestions(allMatches);
    }, 300); // Debounce delay of 300ms
  } else {
    suggestions.innerHTML = ''; // Clear suggestions if query is empty
  }
});

// Initialize the application by populating the Trie with trending movies
populateTrie();
