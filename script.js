// =====================================================
// Loader - hide after page load
window.onload = function() {
  document.querySelector('.loader').style.display = 'none';
  document.getElementById('authPage').style.display = 'flex';
};

// =====================================================
// AUTH TOGGLE between login/register
function toggleAuth() {
  document.querySelector('.form-container.login').classList.toggle('active');
  document.querySelector('.form-container.register').classList.toggle('active');
}

// =====================================================
// Mock user database
let users = [];
let currentUser = null;

// =====================================================
// REGISTER FUNCTION
function registerUser() {
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  if (username && password) {
    // Check for existing user
    const exists = users.find(u => u.username === username);
    if (exists) {
      alert('Username already exists!');
      return;
    }
    users.push({ username, password, progress: [], streak: 0 });
    alert('Registered successfully! Please login.');
    toggleAuth();
  } else {
    alert('Please enter valid username and password.');
  }
}

// =====================================================
// LOGIN FUNCTION
function loginUser() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    currentUser = user;
    document.getElementById('authPage').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    document.getElementById('studentName').innerText = currentUser.username;

    updateProgressChart();
    updateStreak();
  } else {
    alert('Invalid credentials!');
  }
}

// =====================================================
// LOGOUT FUNCTION
function logoutUser() {
  currentUser = null;
  document.getElementById('dashboard').style.display = 'none';
  document.getElementById('authPage').style.display = 'flex';
}

// =====================================================
// PROGRESS CHART FUNCTION using Chart.js
function updateProgressChart() {
  const ctx = document.getElementById('progressChart').getContext('2d');

  // Sample progress data
  const data = {
    labels: ['Math', 'Science', 'History', 'English', 'Games'],
    datasets: [{
      label: 'Progress (%)',
      data: [50, 40, 70, 60, 80],
      backgroundColor: '#FBBF24',
      borderRadius: 5
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true, max: 100 }
    }
  };

  new Chart(ctx, {
    type: 'bar',
    data: data,
    options: options
  });
}

// =====================================================
// MINI-GAMES HANDLER
function startGame(game) {
  if (!currentUser) return alert('Please login first.');

  if (game === 'math') mathGame();
  if (game === 'words') wordGame();
}

// =====================================================
// EXAM PANEL HANDLER
function startExam(exam) {
  if (!currentUser) return alert('Please login first.');
  alert(`Starting ${exam} exam panel...`);
}

// =====================================================
// MATH GAME
function mathGame() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  const answer = prompt(`What is ${a} + ${b}?`);

  if (parseInt(answer) === a + b) {
    alert('Correct!');
    incrementStreak();
  } else {
    alert(`Wrong! The correct answer is ${a + b}`);
  }
}

// =====================================================
// WORD BUILDER GAME
function wordGame() {
  const word = 'EDUQUEST';
  const shuffled = word.split('').sort(() => 0.5 - Math.random()).join('');
  const answer = prompt(`Unscramble the letters: ${shuffled}`);

  if (answer && answer.toUpperCase() === word) {
    alert('Correct!');
    incrementStreak();
  } else {
    alert(`Wrong! The correct word is ${word}`);
  }
}

// =====================================================
// STREAK FUNCTIONS
function incrementStreak() {
  currentUser.streak += 1;
  updateStreak();
}

function updateStreak() {
  document.getElementById('streakCounter').innerText = currentUser.streak;

  // Show badges based on streak
  if (currentUser.streak >= 5) document.getElementById('badge1').style.opacity = 1;
  if (currentUser.streak >= 10) document.getElementById('badge2').style.opacity = 1;
  if (currentUser.streak >= 20) document.getElementById('badge3').style.opacity = 1;
}

// =====================================================
// HERO ANIMATIONS
const badges = document.querySelectorAll('.floating-badge');
badges.forEach((badge, i) => {
  const speed = Math.random() * 2 + 2;
  const left = Math.random() * 80 + 10;
  const top = Math.random() * 60 + 20;
  badge.style.left = `${left}%`;
  badge.style.top = `${top}%`;
  badge.style.animationDuration = `${speed}s`;
});
