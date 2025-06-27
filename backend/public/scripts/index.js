// DOM Elements
const app = document.getElementById('app');
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const searchBar = document.getElementById('search-bar');
const suggestions = document.getElementById('suggestions');
const movieDetails = document.getElementById('movie-details');
const likedMovies = document.getElementById('liked-movies');

// API Configuration
const apiKey = '47d4888f9bb27a01416321f91aa31a22';
let debounceTimer;
let currentUser = null;
let authToken = null;

// Auto-detect API base URL
const API_BASE_URL = (() => {
  const hostname = window.location.hostname;
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }
  
  if (hostname.includes('movieexplorer-latest')) {
    return 'https://movieexplorer-latest.onrender.com';
  }
  
  return 'https://movieexplorer-uetc.onrender.com';
})();

// Authentication Functions
function getAuthToken() {
  return localStorage.getItem('movieexplorer_token');
}

function removeAuthToken() {
  localStorage.removeItem('movieexplorer_token');
  localStorage.removeItem('movieexplorer_user');
  authToken = null;
  currentUser = null;
}

function getCurrentUser() {
  const userStr = localStorage.getItem('movieexplorer_user');
  return userStr ? JSON.parse(userStr) : null;
}

// API Helper function
async function apiRequest(url, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    // Token expired or invalid
    removeAuthToken();
    redirectToLogin();
    throw new Error('Authentication required');
  }

  return response;
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

function logout() {
  removeAuthToken();
  redirectToLogin();
}

// Movie Functions
async function fetchMovieSuggestions(query) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie suggestions');
    const data = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error fetching movie suggestions:', error);
    return [];
  }
}

async function fetchMovieDetails(movieId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie details');
    const movie = await response.json();
    await displayMovieDetails(movie);
  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
}

async function displayMovieDetails(movie) {
  // Check if movie is already liked
  const likedMoviesData = await fetchLikedMovies();
  const isLiked = likedMoviesData.some(likedMovie => likedMovie.movieId === movie.id);

  movieDetails.innerHTML = `
    <h2>${movie.title}</h2>
    <p><strong>Release Date:</strong> ${movie.release_date || 'Not Available'}</p>
    <p><strong>Genres:</strong> ${movie.genres ? movie.genres.map(g => g.name).join(', ') : 'Not Available'}</p>
    <p><strong>Overview:</strong> ${movie.overview || 'No overview available'}</p>
    <img src="https://image.tmdb.org/t/p/w500${movie.poster_path || '/placeholder.png'}" alt="${movie.title}">
    <p><strong>Rating:</strong> ${movie.vote_average || 'Not Available'}</p>
    <button class="like-button ${isLiked ? 'liked' : ''}" 
            data-movie-id="${movie.id}" 
            data-title="${movie.title.replace(/"/g, '&quot;')}" 
            data-release-date="${movie.release_date || ''}" 
            data-poster-path="${movie.poster_path || ''}">
      ${isLiked ? 'Unlike ❤️' : 'Like 🤍'}
    </button>
  `;

  // Add event listener to Like/Unlike button
  const likeButton = document.querySelector('.like-button');
  likeButton.addEventListener('click', async () => {
    const { movieId, title, releaseDate, posterPath } = likeButton.dataset;
    const isCurrentlyLiked = likeButton.classList.contains('liked');
    
    if (isCurrentlyLiked) {
      await unlikeMovie(parseInt(movieId));
    } else {
      await likeMovie(parseInt(movieId), title, releaseDate, posterPath);
    }
  });
}

async function likeMovie(movieId, title, releaseDate, posterPath) {
  try {
    const response = await apiRequest('/api/movies/like', {
      method: 'POST',
      body: JSON.stringify({ movieId, title, releaseDate, posterPath })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to like movie');
    }

    // Update button state
    const likeButton = document.querySelector('.like-button');
    likeButton.classList.add('liked');
    likeButton.textContent = 'Unlike ❤️';

    // Refresh liked movies
    await loadLikedMovies();
  } catch (error) {
    console.error('Error liking movie:', error);
    alert('Failed to like movie. Please try again.');
  }
}

async function unlikeMovie(movieId) {
  try {
    const response = await apiRequest(`/api/movies/unlike/${movieId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to unlike movie');
    }

    // Update button state only if the button exists (when movie details are displayed)
    const likeButton = document.querySelector('.like-button');
    if (likeButton) {
      likeButton.classList.remove('liked');
      likeButton.textContent = 'Like 🤍';
    }

    // Refresh liked movies
    await loadLikedMovies();
  } catch (error) {
    console.error('Error unliking movie:', error);
    alert('Failed to unlike movie. Please try again.');
  }
}

async function fetchLikedMovies() {
  try {
    const response = await apiRequest('/api/movies/liked');
    if (!response.ok) {
      throw new Error('Failed to fetch liked movies');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching liked movies:', error);
    return [];
  }
}

async function loadLikedMovies() {
  try {
    const movies = await fetchLikedMovies();
    displayLikedMovies(movies);
  } catch (error) {
    console.error('Error loading liked movies:', error);
  }
}

function displayLikedMovies(movies) {
  likedMovies.innerHTML = '';
  
  if (movies.length === 0) {
    likedMovies.innerHTML = '<p class="no-movies">No liked movies yet. Start exploring!</p>';
    return;
  }

  movies.forEach(movie => {
    const item = document.createElement('div');
    item.classList.add('liked-movie-item');
    item.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w200${movie.posterPath || '/placeholder.png'}" alt="${movie.title}">
      <p>${movie.title}</p>
      <button class="unlike-btn" data-movie-id="${movie.movieId}">Remove</button>
    `;
    
    // Add click event to view movie details
    item.addEventListener('click', (e) => {
      if (!e.target.classList.contains('unlike-btn')) {
        fetchMovieDetails(movie.movieId);
      }
    });

    // Add click event to unlike button
    const unlikeBtn = item.querySelector('.unlike-btn');
    unlikeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      unlikeMovie(movie.movieId);
    });

    likedMovies.appendChild(item);
  });
}

// Search functionality
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

function clearSearch() {
  searchBar.value = '';
  suggestions.innerHTML = '';
}

// Initialize app
function initializeApp() {
  const user = getCurrentUser();
  if (user) {
    currentUser = user;
    authToken = getAuthToken();
    usernameDisplay.textContent = `Hello, ${user.username}!`;
    loadLikedMovies();
  } else {
    redirectToLogin();
  }
}

// Event Listeners
logoutBtn.addEventListener('click', logout);

// Search functionality
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

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (token && user) {
    initializeApp();
  } else {
    redirectToLogin();
  }
});