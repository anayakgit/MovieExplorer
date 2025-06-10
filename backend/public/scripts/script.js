const searchBar = document.getElementById('search-bar');
const suggestions = document.getElementById('suggestions');
const movieDetails = document.getElementById('movie-details');
const likedMovies = document.getElementById('liked-movies');
const apiKey = '47d4888f9bb27a01416321f91aa31a22'; // Your TMDB API key
const userId = 'user123'; // Hardcoded for demo; replace with dynamic user ID if needed
let debounceTimer;

// Auto-detect API base URL based on environment
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  // Local development
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  // Production environments
  if (hostname.includes('movieexplorer-latest')) {
    return 'https://movieexplorer-latest.onrender.com';
  }
  
  // Default production URL
  return 'https://movieexplorer-uetc.onrender.com';
})(); // Replace with your actual Render backend URL

// Fetch movie suggestions from TMDB API
async function fetchMovieSuggestions(query) {
  try {
    console.log('Fetching suggestions for query:', query);
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );
    console.log('Response status:', response.status);
    if (!response.ok) throw new Error('Failed to fetch movie suggestions');
    const data = await response.json();
    console.log('API response:', data);
    return data.results;
  } catch (error) {
    console.error('Error fetching movie suggestions:', error);
    return [];
  }
}

// Fetch detailed movie information
async function fetchMovieDetails(movieId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie details');
    const movie = await response.json();
    displayMovieDetails(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
}

// Display movie details with a Like button
function displayMovieDetails(movie) {
  movieDetails.innerHTML = `
    <h2>${movie.title}</h2>
    <p><strong>Release Date:</strong> ${movie.release_date || 'Not Available'}</p>
    <p><strong>Genres:</strong> ${movie.genres ? movie.genres.map(g => g.name).join(', ') : 'Not Available'}</p>
    <p><strong>Overview:</strong> ${movie.overview || 'No overview available'}</p>
    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path || '/placeholder.png'}" alt="${movie.title}">
    <p><strong>Rating:</strong> ${movie.vote_average || 'Not Available'}</p>
    <button class="like-button" data-movie-id="${movie.id}" data-title="${movie.title.replace(/"/g, '&quot;')}" data-release-date="${movie.release_date || ''}" data-poster-path="${movie.poster_path || ''}">Like</button>
  `;

  // Add event listeners to Like buttons
  document.querySelectorAll('.like-button').forEach(button => {
    button.addEventListener('click', () => {
      const { movieId, title, releaseDate, posterPath } = button.dataset;
      likeMovie(parseInt(movieId), title, releaseDate, posterPath);
    });
  });
}

// Like a movie and save to backend
async function likeMovie(movieId, title, releaseDate, posterPath) {
  try {
    console.log('Making request to:', `${API_BASE_URL}/api/movies/like`); // Debug log
    const response = await fetch(`${API_BASE_URL}/api/movies/like`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, movieId, title, releaseDate, posterPath })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to like movie: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    console.log(data.message);
    fetchLikedMovies(); // Refresh liked movies
  } catch (error) {
    console.error('Error liking movie:', error);
    alert('Failed to like movie. Please try again.'); // User feedback
  }
}

// Fetch and display liked movies
async function fetchLikedMovies() {
  try {
    console.log('Making request to:', `${API_BASE_URL}/api/movies/liked/${userId}`); // Debug log
    const response = await fetch(`${API_BASE_URL}/api/movies/liked/${userId}`);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch liked movies: ${response.status} - ${errorText}`);
    }
    const movies = await response.json();
    displayLikedMovies(movies);
  } catch (error) {
    console.error('Error fetching liked movies:', error);
  }
}

// Display liked movies
function displayLikedMovies(movies) {
  likedMovies.innerHTML = '';
  movies.forEach(movie => {
    const item = document.createElement('div');
    item.classList.add('liked-movie-item');
    item.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w200${movie.posterPath || '/placeholder.png'}" alt="${movie.title}">
      <p>${movie.title}</p>
    `;
    likedMovies.appendChild(item);
  });
}

// Display movie suggestions
function displaySuggestions(matches) {
  suggestions.innerHTML = '';
  const seenMovies = new Set();
  matches.forEach(movie => {
    const movieTitle = movie.title.toLowerCase();
    if (!seenMovies.has(movieTitle)) {
      seenMovies.add(movieTitle);
      const releaseDate = movie.release_date || 'Not Available';
      const item = document.createElement('div');
      item.textContent = `${movie.title} (${releaseDate})`;
      item.classList.add('highlight');
      item.addEventListener('click', () => {
        fetchMovieDetails(movie.id);
        clearSearch();
      });
      suggestions.appendChild(item);
    }
  });
}

// Clear search bar and suggestions
function clearSearch() {
  searchBar.value = '';
  suggestions.innerHTML = '';
}

// Event listener for search bar input
searchBar.addEventListener('input', async () => {
  clearTimeout(debounceTimer);
  const query = searchBar.value.trim();
  if (query) {
    debounceTimer = setTimeout(async () => {
      const matches = await fetchMovieSuggestions(query);
      displaySuggestions(matches);
    }, 300);
  } else {
    suggestions.innerHTML = '';
  }
});

// Initialize liked movies
fetchLikedMovies();