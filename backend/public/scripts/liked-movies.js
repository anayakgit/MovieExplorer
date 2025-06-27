// DOM Elements
const usernameDisplay = document.getElementById('username-display');
const logoutBtn = document.getElementById('logout-btn');
const moviesGrid = document.getElementById('movies-grid');
const moviesCount = document.getElementById('movies-count');
const filterSearch = document.getElementById('filter-search');
const sortSelect = document.getElementById('sort-select');
const emptyState = document.getElementById('empty-state');
const movieModal = document.getElementById('movie-modal');
const modalMovieDetails = document.getElementById('modal-movie-details');
const closeModal = document.querySelector('.close-modal');

// API Configuration
const apiKey = '47d4888f9bb27a01416321f91aa31a22';
let currentUser = null;
let allMovies = [];
let filteredMovies = [];

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
  currentUser = null;
}

function getCurrentUser() {
  const userStr = localStorage.getItem('movieexplorer_user');
  return userStr ? JSON.parse(userStr) : null;
}

function redirectToLogin() {
  window.location.href = 'login.html';
}

function logout() {
  removeAuthToken();
  redirectToLogin();
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
    removeAuthToken();
    redirectToLogin();
    throw new Error('Authentication required');
  }

  return response;
}

// Movie Functions
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

async function fetchMovieDetails(movieId) {
  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}`
    );
    if (!response.ok) throw new Error('Failed to fetch movie details');
    return await response.json();
  } catch (error) {
    console.error('Error fetching movie details:', error);
    return null;
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

    // Remove from current arrays
    allMovies = allMovies.filter(movie => movie.movieId !== movieId);
    applyFiltersAndSort();
    
  } catch (error) {
    console.error('Error unliking movie:', error);
    alert('Failed to unlike movie. Please try again.');
  }
}

// Display Functions
function displayMovies(movies) {
  moviesGrid.innerHTML = '';
  
  if (movies.length === 0) {
    emptyState.style.display = 'block';
    moviesCount.textContent = 'No movies found';
    return;
  }

  emptyState.style.display = 'none';
  moviesCount.textContent = `${movies.length} movie${movies.length !== 1 ? 's' : ''} in your collection`;

  movies.forEach(movie => {
    const movieCard = document.createElement('div');
    movieCard.className = 'movie-card';
    
    movieCard.innerHTML = `
      <img src="https://image.tmdb.org/t/p/w300${movie.posterPath || '/placeholder.png'}" 
           alt="${movie.title}" class="movie-poster">
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-release-date">${movie.releaseDate || 'Release date unknown'}</p>
        <div class="movie-actions">
          <button class="view-details-btn" data-movie-id="${movie.movieId}">
            View Details
          </button>
          <button class="remove-btn" data-movie-id="${movie.movieId}">
            Remove
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    const viewBtn = movieCard.querySelector('.view-details-btn');
    const removeBtn = movieCard.querySelector('.remove-btn');
    
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      showMovieDetails(movie.movieId);
    });
    
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm(`Are you sure you want to remove "${movie.title}" from your collection?`)) {
        unlikeMovie(movie.movieId);
      }
    });

    moviesGrid.appendChild(movieCard);
  });
}

async function showMovieDetails(movieId) {
  const movieDetails = await fetchMovieDetails(movieId);
  if (!movieDetails) return;

  modalMovieDetails.innerHTML = `
    <div style="padding: 2rem;">
      <h2>${movieDetails.title}</h2>
      <div style="display: flex; gap: 2rem; margin-top: 1rem;">
        <img src="https://image.tmdb.org/t/p/w300${movieDetails.poster_path}" 
             alt="${movieDetails.title}" style="border-radius: 8px;">
        <div style="flex: 1;">
          <p><strong>Release Date:</strong> ${movieDetails.release_date || 'Not Available'}</p>
          <p><strong>Runtime:</strong> ${movieDetails.runtime ? movieDetails.runtime + ' minutes' : 'Not Available'}</p>
          <p><strong>Genres:</strong> ${movieDetails.genres ? movieDetails.genres.map(g => g.name).join(', ') : 'Not Available'}</p>
          <p><strong>Rating:</strong> ${movieDetails.vote_average ? movieDetails.vote_average.toFixed(1) + '/10' : 'Not Available'}</p>
          <p><strong>Overview:</strong></p>
          <p>${movieDetails.overview || 'No overview available'}</p>
        </div>
      </div>
    </div>
  `;

  movieModal.style.display = 'flex';
}

// Filter and Sort Functions
function applyFiltersAndSort() {
  let filtered = [...allMovies];
  
  // Apply search filter
  const searchTerm = filterSearch.value.toLowerCase().trim();
  if (searchTerm) {
    filtered = filtered.filter(movie => 
      movie.title.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply sorting
  const sortBy = sortSelect.value;
  filtered.sort((a, b) => {
    switch (sortBy) {
      case 'title-asc':
        return a.title.localeCompare(b.title);
      case 'title-desc':
        return b.title.localeCompare(a.title);
      case 'date-desc':
        return new Date(b.likedAt || 0) - new Date(a.likedAt || 0);
      case 'date-asc':
        return new Date(a.likedAt || 0) - new Date(b.likedAt || 0);
      case 'release-desc':
        return new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0);
      case 'release-asc':
        return new Date(a.releaseDate || 0) - new Date(b.releaseDate || 0);
      default:
        return 0;
    }
  });
  
  filteredMovies = filtered;
  displayMovies(filteredMovies);
}

// Initialize Functions
async function loadLikedMovies() {
  try {
    moviesGrid.innerHTML = '<div class="loading-message"><p>Loading your liked movies...</p></div>';
    
    const movies = await fetchLikedMovies();
    allMovies = movies;
    applyFiltersAndSort();
    
  } catch (error) {
    console.error('Error loading liked movies:', error);
    moviesGrid.innerHTML = '<div class="loading-message"><p>Error loading movies. Please refresh the page.</p></div>';
  }
}

function initializeApp() {
  const user = getCurrentUser();
  if (user) {
    currentUser = user;
    usernameDisplay.textContent = `Hello, ${user.username}!`;
    loadLikedMovies();
  } else {
    redirectToLogin();
  }
}

// Event Listeners
logoutBtn.addEventListener('click', logout);

filterSearch.addEventListener('input', applyFiltersAndSort);
sortSelect.addEventListener('change', applyFiltersAndSort);

closeModal.addEventListener('click', () => {
  movieModal.style.display = 'none';
});

movieModal.addEventListener('click', (e) => {
  if (e.target === movieModal) {
    movieModal.style.display = 'none';
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