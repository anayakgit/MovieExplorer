// DOM Elements
const registerForm = document.getElementById('register-form');
const registerError = document.getElementById('register-error');

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
  registerError.textContent = '';
  registerError.style.display = 'none';
}

// Register API call
async function register(username, email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }

    setAuthToken(data.token);
    setCurrentUser(data.user);
    
    // Redirect to main app
    window.location.href = 'index.html';
    
    return data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
}

// Validation functions
function validateUsername(username) {
  if (!username || username.trim().length < 3) {
    return 'Username must be at least 3 characters long';
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return 'Username can only contain letters, numbers, and underscores';
  }
  return null;
}

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
}

function validatePassword(password) {
  if (!password || password.length < 6) {
    return 'Password must be at least 6 characters long';
  }
  return null;
}

// Event Listeners
registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearError();
  
  const username = document.getElementById('register-username').value.trim();
  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;

  // Validation
  const usernameError = validateUsername(username);
  if (usernameError) {
    showError(registerError, usernameError);
    return;
  }

  const emailError = validateEmail(email);
  if (emailError) {
    showError(registerError, emailError);
    return;
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    showError(registerError, passwordError);
    return;
  }

  // Disable submit button to prevent double submission
  const submitBtn = registerForm.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating Account...';

  try {
    await register(username, email, password);
  } catch (error) {
    showError(registerError, error.message);
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