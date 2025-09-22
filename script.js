// =======================
// Loader - hide after page load
// =======================
window.onload = function () {
  document.querySelector('.loader').style.display = 'none';
  document.getElementById('authPage').style.display = 'flex';

  // Restore user session from localStorage
  const savedUser = localStorage.getItem("currentUser");
  if (savedUser) {
    try {
      currentUser = JSON.parse(savedUser);
      // Attempt to show dashboard, if API is offline, it will still work
      showDashboard(true); // Indicate it's a cached login attempt
    } catch (e) {
      console.error("Failed to parse cached user data:", e);
      clearUserLocally(); // Clear corrupted data
    }
  }
};

// =======================
// AUTH TOGGLE between login/register
// =======================
function toggleAuth() {
  document.querySelector('.form-container.login').classList.toggle('active');
  document.querySelector('.form-container.register').classList.toggle('active');
}

// =======================
// Backend API URL
// =======================
const API_URL = "http://localhost:3000";

let currentUser = null;
let progressChart = null; // Chart instance

// =======================
// Save/load user locally
// =======================
function saveUserLocally() {
  localStorage.setItem("currentUser", JSON.stringify(currentUser));
}
function clearUserLocally() {
  localStorage.removeItem("currentUser");
}

// =======================
// REGISTER FUNCTION
// =======================
async function registerUser() {
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  if (username && password) {
    try {
      const res = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (res.ok) {
        alert("Registered successfully! Please login.");
        toggleAuth();
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (err) {
      alert("⚠️ Server error: " + err.message + ". Please try again later.");
    }
  } else {
    alert('Please enter valid username and password.');
  }
}

// =======================
// LOGIN FUNCTION
// =======================
async function loginUser() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();
    if (res.ok) {
      currentUser = data.user;
      saveUserLocally();
      showDashboard();
    } else {
      alert(data.message || "Invalid credentials!");
    }
  } catch (err) {
    // Only attempt cached login if there was a network/server error
    alert("⚠️ Could not connect to server. Attempting cached login...");
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        currentUser = JSON.parse(savedUser);
        // Add a check for matching username (password can't be checked for security)
        if (currentUser.username === username) {
          showDashboard(true); // Indicate it's a cached login
        } else {
          alert("Cached user does not match entered username. Please log in when online.");
          clearUserLocally(); // Clear potentially irrelevant cached user
          currentUser = null;
        }
      } catch (e) {
        console.error("Failed to parse cached user data during offline login:", e);
        clearUserLocally();
        currentUser = null;
        alert("Failed to load cached user data. Please try again when online.");
      }
    } else {
      alert("No cached user found. Please try again when online.");
    }
  }
}

// =======================
// LOGOUT FUNCTION
// =======================
function logoutUser() {
  currentUser = null;
  clearUserLocally();
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('authPage').style.display = 'flex';
  resetBadges(); // Reset badges on logout
}

// =======================
// SHOW DASHBOARD
// =======================
function showDashboard(isCachedLogin = false) {
  document.getElementById('authPage').style.display = 'none';
  document.getElementById('dashboard').style.display = 'block';
  document.getElementById('studentName').innerText = currentUser.username;

  if (isCachedLogin) {
    alert("You are viewing cached data. Some features may not be fully synced with the server.");
  }

  updateProgressChart();
  updateStreak();
}

// =======================
// PROGRESS CHART FUNCTION
// =======================
function updateProgressChart() {
  const ctx = document.getElementById('progressChart').getContext('2d');

  // Ensure currentUser.progress exists and is an array
  const userProgress = (currentUser && Array.isArray(currentUser.progress)) ? currentUser.progress : [];

  const data = {
    labels: ['Math', 'Science', 'History', 'English', 'Games'],
    datasets: [{
      label: 'Progress (%)',
      data: userProgress.length ? userProgress : [50, 40, 70, 60, 80], // Default data if user has no progress
      backgroundColor: '#FBBF24',
      borderRadius: 5
    }]
  };

  const options = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, max: 100 } }
  };

  if (progressChart) {
    progressChart.data = data;
    progressChart.update();
  } else {
    progressChart = new Chart(ctx, { type: 'bar', data, options });
  }
}

// =======================
// MINI-GAMES HANDLER
// =======================
function startGame(game) {
  if (!currentUser) return alert('Please login first.');

  if (game === 'math') mathGame();
  if (game === 'words') wordGame();
}

// =======================
// EXAM PANEL HANDLER
// =======================
function startExam(exam) {
  if (!currentUser) return alert('Please login first.');
  alert(`Starting ${exam} exam panel...`);
}

// =======================
// MATH GAME
// =======================
function mathGame() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = prompt(`What is ${a} + ${b}?`);

  if (answer === null) return; // User cancelled prompt

  if (parseInt(answer) === a + b) {
    alert('Correct!');
    incrementStreak();
  } else {
    alert(`Wrong! The correct answer is ${a + b}`);
  }
}

// =======================
// WORD BUILDER GAME
// =======================
function wordGame() {
  const word = 'EDUQUEST';
  const shuffled = word.split('').sort(() => 0.5 - Math.random()).join('');
  const answer = prompt(`Unscramble the letters: ${shuffled}`);

  if (answer === null) return; // User cancelled prompt

  if (answer && answer.toUpperCase() === word) {
    alert('Correct!');
    incrementStreak();
  } else {
    alert(`Wrong! The correct word is ${word}`);
  }
}

// =======================
// STREAK FUNCTIONS
// =======================
async function incrementStreak() {
  if (!currentUser) return; // Safety check

  currentUser.streak = (currentUser.streak || 0) + 1; // Initialize if null/undefined
  updateStreak();
  saveUserLocally();

  try {
    const res = await fetch(`${API_URL}/streak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: currentUser.username, streak: currentUser.streak })
    });
    if (!res.ok) {
      const errorData = await res.json();
      console.warn("⚠️ Server streak update failed: " + (errorData.message || "Unknown error"));
    }
  } catch (err) {
    console.warn("⚠️ Offline: streak saved locally, will sync later. Error: " + err.message);
  }
}

function updateStreak() {
  document.getElementById('streakCounter').innerText = currentUser.streak || 0; // Display 0 if streak is not set

  resetBadges(); // Always reset first before applying current user's badges

  if (currentUser.streak >= 5) document.getElementById('badge1').style.opacity = 1;
  if (currentUser.streak >= 10) document.getElementById('badge2').style.opacity = 1;
  if (currentUser.streak >= 20) document.getElementById('badge3').style.opacity = 1;
}

function resetBadges() {
  document.getElementById('badge1').style.opacity = 0;
  document.getElementById('badge2').style.opacity = 0;
  document.getElementById('badge3').style.opacity = 0;
}

// =======================
// HERO ANIMATIONS (no changes needed here)
// =======================
const badges = document.querySelectorAll('.floating-badge');
badges.forEach((badge) => {
  const speed = Math.random() * 2 + 2;
  const left = Math.random() * 80 + 10;
  const top = Math.random() * 60 + 20;
  badge.style.left = `${left}%`;
  badge.style.top = `${top}%`;
  badge.style.animationDuration = `${speed}s`;
});