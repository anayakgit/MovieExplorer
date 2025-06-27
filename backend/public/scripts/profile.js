// DOM Elements
const profileUsername = document.getElementById('profile-username');
const profileEmail = document.getElementById('profile-email');
const profileCreated = document.getElementById('profile-created');
const totalLiked = document.getElementById('total-liked');
const recentActivity = document.getElementById('recent-activity');
const recentMoviesContainer = document.getElementById('recent-movies');
const userGreeting = document.getElementById('user-greeting');
const logoutBtn = document.getElementById('logout-btn');
const changePasswordForm = document.getElementById('change-password-form');
const passwordError = document.getElementById('password-error');
const passwordSuccess = document.getElementById('password-success');
const exportDataBtn = document.getElementById('export-data-btn');
const clearLikedBtn = document.getElementById('clear-liked-btn');
const actionMessage = document.getElementById('action-message');

// Auto-detect API base URL (same as login.js)
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

function getCurrentUser() {
  const userStr = localStorage.getItem('movieexplorer_user');
  return userStr ? JSON.parse(userStr) : null;
}

function clearAuth() {
  localStorage.removeItem('movieexplorer_token');
  localStorage.removeItem('movieexplorer_user');
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

function showSuccess(element, message) {
  element.textContent = message;
  element.style.display = 'block';
  setTimeout(() => {
    element.textContent = '';
    element.style.display = 'none';
  }, 5000);
}

function clearMessages() {
  passwordError.textContent = '';
  passwordError.style.display = 'none';
  passwordSuccess.textContent = '';
  passwordSuccess.style.display = 'none';
  actionMessage.textContent = '';
}

// API Helper function
async function apiCall(endpoint, options = {}) {
  const token = getAuthToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers
    }
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || 'Request failed');
  }

  return response.json();
}

// Load user profile data
async function loadProfile() {
  try {
    // Get current user info
    const userResponse = await apiCall('/api/auth/me');
    const user = userResponse.user;
    
    // Update profile display
    profileUsername.textContent = user.username;
    profileEmail.textContent = user.email;
    userGreeting.textContent = `Hello, ${user.username}!`;
    
    // Format creation date
    const createdDate = new Date(user.createdAt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    profileCreated.textContent = createdDate;

    // Load liked movies statistics
    await loadMovieStats();
    
  } catch (error) {
    console.error('Error loading profile:', error);
    // If authentication fails, redirect to login
    if (error.message.includes('token') || error.message.includes('authentication')) {
      clearAuth();
      window.location.href = 'login.html';
    }
  }
}

// Load movie statistics
async function loadMovieStats() {
  try {
    const moviesResponse = await apiCall('/api/movies/liked');
    const movies = moviesResponse;
    
    // Total liked movies
    totalLiked.textContent = movies.length;
    
    // Recent activity (movies liked this month)
    const thisMonth = new Date();
    thisMonth.setDate(1);
    thisMonth.setHours(0, 0, 0, 0);
    
    const recentCount = movies.filter(movie => 
      new Date(movie.likedAt) >= thisMonth
    ).length;
    recentActivity.textContent = recentCount;
    
    // Display recent movies (last 6)
    displayRecentMovies(movies.slice(0, 6));
    
  } catch (error) {
    console.error('Error loading movie stats:', error);
    totalLiked.textContent = '0';
    recentActivity.textContent = '0';
    recentMoviesContainer.innerHTML = '<div style="text-align: center; color: var(--text-color); opacity: 0.7; padding: var(--spacing-lg);">Unable to load movie statistics</div>';
  }
}

// Display recent movies
function displayRecentMovies(movies) {
  if (movies.length === 0) {
    recentMoviesContainer.innerHTML = '<div style="text-align: center; color: var(--text-color); opacity: 0.7; padding: var(--spacing-lg);">No liked movies yet. Start exploring!</div>';
    return;
  }

  recentMoviesContainer.innerHTML = movies.map(movie => `
    <div class="liked-movie-item">
      <img src="https://image.tmdb.org/t/p/w200${movie.posterPath}" 
           alt="${movie.title}" 
           onerror="this.src='https://via.placeholder.com/200x300?text=No+Image'">
      <p>${movie.title}</p>
    </div>
  `).join('');
}

// Handle password change
changePasswordForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessages();
  
  const currentPassword = document.getElementById('current-password').value;
  const newPassword = document.getElementById('new-password').value;
  const confirmPassword = document.getElementById('confirm-password').value;

  // Client-side validation
  if (newPassword !== confirmPassword) {
    showError(passwordError, 'New passwords do not match');
    return;
  }

  if (newPassword.length < 6) {
    showError(passwordError, 'New password must be at least 6 characters long');
    return;
  }

  if (currentPassword === newPassword) {
    showError(passwordError, 'New password must be different from current password');
    return;
  }

  // Disable submit button
  const submitBtn = changePasswordForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Updating...';

  try {
    // Note: You'll need to add this endpoint to your server.js
    await apiCall('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({
        currentPassword,
        newPassword
      })
    });

    showSuccess(passwordSuccess, 'Password updated successfully!');
    changePasswordForm.reset();
    
  } catch (error) {
    showError(passwordError, error.message);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Export user data
exportDataBtn.addEventListener('click', async () => {
  try {
    clearMessages();
    exportDataBtn.disabled = true;
    exportDataBtn.textContent = 'Exporting...';

    const [userResponse, moviesResponse] = await Promise.all([
      apiCall('/api/auth/me'),
      apiCall('/api/movies/liked')
    ]);

    const exportData = {
      user: userResponse.user,
      likedMovies: moviesResponse,
      exportDate: new Date().toISOString()
    };

    // Create and download JSON file
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `movieexplorer-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    actionMessage.textContent = 'Data exported successfully!';
    actionMessage.style.color = 'var(--success-color)';

  } catch (error) {
    actionMessage.textContent = `Export failed: ${error.message}`;
    actionMessage.style.color = 'var(--primary-color)';
  } finally {
    exportDataBtn.disabled = false;
    exportDataBtn.textContent = 'Export My Data';
  }
});

// Clear all liked movies
clearLikedBtn.addEventListener('click', async () => {
  if (!confirm('Are you sure you want to remove all liked movies? This action cannot be undone.')) {
    return;
  }

  try {
    clearMessages();
    clearLikedBtn.disabled = true;
    clearLikedBtn.textContent = 'Clearing...';

    // Get all liked movies first
    const moviesResponse = await apiCall('/api/movies/liked');
    const movies = moviesResponse;

    // Delete each movie (you might want to add a bulk delete endpoint)
    for (const movie of movies) {
      await apiCall(`/api/movies/unlike/${movie.movieId}`, {
        method: 'DELETE'
      });
    }

    actionMessage.textContent = `Successfully removed ${movies.length} liked movies`;
    actionMessage.style.color = 'var(--success-color)';
    
    // Refresh the display
    await loadMovieStats();

  } catch (error) {
    actionMessage.textContent = `Clear failed: ${error.message}`;
    actionMessage.style.color = 'var(--primary-color)';
  } finally {
    clearLikedBtn.disabled = false;
    clearLikedBtn.textContent = 'Clear All Liked Movies';
  }
});

// Logout functionality
logoutBtn.addEventListener('click', () => {
  if (confirm('Are you sure you want to logout?')) {
    clearAuth();
    window.location.href = 'login.html';
  }
});

// Check authentication and load profile on page load
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (!token || !user) {
    // User is not logged in, redirect to login
    window.location.href = 'login.html';
    return;
  }

  // Load profile data
  loadProfile();
});