const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { promises: fs } = require("fs"); // Use fs.promises for async file operations
const path = require("path");
const bcrypt = require("bcrypt"); // For password hashing

const app = express();
const PORT = process.env.PORT || 3000; // Use environment variable for port
const BCRYPT_SALT_ROUNDS = 10; // Recommended salt rounds for bcrypt

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // serve frontend

// Path to store user data
const USERS_FILE = path.join(__dirname, "users.json");

let users = []; // Initialize users array

// Function to load users safely and asynchronously
async function loadUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, "utf8");
    users = JSON.parse(data);
    console.log("Users loaded successfully.");
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log("users.json not found, initializing with an empty user list.");
      users = []; // File doesn't exist, start fresh
      await saveUsers(); // Create the file
    } else {
      console.error("Error loading users file:", err);
      // If parsing fails or other error, log it and start with empty array
      users = [];
    }
  }
}

// Function to save users safely and asynchronously
async function saveUsers() {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
    console.log("Users saved successfully.");
  } catch (err) {
    console.error("Error saving users file:", err);
  }
}

// Immediately load users when the server starts
loadUsers();

// =========================
// REGISTER
// =========================
app.post("/register", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required." });
  }

  // Basic validation for username and password length
  if (username.length < 3 || username.length > 20) {
    return res.status(400).json({ message: "Username must be between 3 and 20 characters." });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters long." });
  }

  if (users.find(u => u.username === username)) {
    return res.status(409).json({ message: "Username already exists." }); // 409 Conflict
  }

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    const newUser = { username, password: hashedPassword, streak: 0, progress: [] };
    users.push(newUser);
    await saveUsers(); // Await file write

    res.status(201).json({ message: "Registered successfully!" }); // 201 Created
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error during registration." });
  }
});

// =========================
// LOGIN
// =========================
app.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  try {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    res.json({
      message: "Login successful!",
      user: {
        username: user.username,
        streak: user.streak || 0,
        progress: user.progress || []
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error during login." });
  }
});

// =========================
// UPDATE STREAK (idempotent, can receive offline updates)
// =========================
app.post("/streak", async (req, res) => {
  const { username, streak } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  try {
    // Only increase streak if new value is higher
    if (streak !== undefined && typeof streak === 'number' && streak > user.streak) {
      user.streak = streak;
      await saveUsers(); // Await file write
      res.json({ message: "Streak updated!", streak: user.streak });
    } else {
      res.status(200).json({ message: "No change to streak or new streak is not higher.", streak: user.streak });
    }
  } catch (error) {
    console.error("Streak update error:", error);
    res.status(500).json({ message: "Server error updating streak." });
  }
});

// =========================
// UPDATE PROGRESS (idempotent)
// =========================
app.post("/progress", async (req, res) => {
  const { username, progress } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  try {
    if (Array.isArray(progress)) {
      user.progress = progress;
      await saveUsers(); // Await file write
      res.json({ message: "Progress updated!" });
    } else {
      res.status(400).json({ message: "Progress must be an array." });
    }
  } catch (error) {
    console.error("Progress update error:", error);
    res.status(500).json({ message: "Server error updating progress." });
  }
});

// =========================
// GET PROGRESS
// =========================
app.get("/progress/:username", (req, res) => {
  const user = users.find(u => u.username === req.params.username);
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  res.json({ progress: user.progress || [] });
});

// =========================
// START SERVER
// =========================
app.listen(PORT, () => {
  console.log(`✅ EduQuest server running at http://localhost:${PORT}`);
});