// DOM Elements
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');

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
function setAuthToken(token) {
  localStorage.setItem('movieexplorer_token', token);
}

function setCurrentUser(user) {
  localStorage.setItem('movieexplorer_user', JSON.stringify(user));
}

function getAuthToken() {
  return localStorage.getItem('movieexplorer_token');
}

function getCurrentUser() {
  const userStr = localStorage.getItem('movieexplorer_user');
  return userStr ? JSON.parse(userStr) : null;
}

function showError(element, message) {
  element.textContent = message;
  element.style.display = 'block';
}

function clearError() {
  loginError.textContent = '';
  loginError.style.display = 'none';
}

// Login API call
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setAuthToken(data.token);
    setCurrentUser(data.user);
    
    // Redirect to main app
    window.location.href = 'index.html';
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

// Event Listeners
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  // Basic validation
  if (!email || !password) {
    showError(loginError, 'Please fill in all fields');
    return;
  }

  // Disable submit button to prevent double submission
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Logging in...';

  try {
    await login(email, password);
  } catch (error) {
    showError(loginError, error.message);
  } finally {
    // Re-enable submit button
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
});

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', () => {
  const token = getAuthToken();
  const user = getCurrentUser();
  
  if (token && user) {
    // User is already logged in, redirect to main app
    window.location.href = 'index.html';
  }
});