const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");

const app = express();
const PORT = 3000;
//Middleware
app.use(cors());
app.use(bodyParser.json());

//Path to store user data
const USERS_FILE = "./users.json";
//Load users from file if exists
let users = [];
if(fs.existsSync(USERS_FILE)){
    users = JSON.parse(fs.readFileSync(USERS_FILE, "utf8"));
}
//Save users back to file
function saveUsers(){
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}
//REGISTER
app.post("/register", (req, res) => {
    const { username, password} = req.body;
    if(!username || !password)
        return res.status(400).json({message: "Username and password required."})
    const exists = users.find((u) => u.username === username);
    if(exists) return res.status(400).json({message: "Username already exists."});
    const newUser = { username, password, streak: 0, progress: []};
    users.push(newUser);
    saveUsers();

    res.json({message: "Registered successfully!"});
});
//LOGIN
app.post("/login",(req, res) => {
      const { username, password } = req.body;

  const user = users.find((u) => u.username === username && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials." });

  res.json({
    message: "Login successful!",
    user: { username: user.username, streak: user.streak, progress: user.progress }
  });
});
// UPDATE STREAK
app.post("/streak", (req, res) => {
  const { username } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user) return res.status(404).json({ message: "User not found." });

  user.streak += 1;
  saveUsers();

  res.json({ message: "Streak updated!", streak: user.streak });
});

// =====================================================
// GET PROGRESS
app.get("/progress/:username", (req, res) => {
  const user = users.find((u) => u.username === req.params.username);
  if (!user) return res.status(404).json({ message: "User not found." });

  res.json({ progress: user.progress });
});

// =====================================================
// START SERVER
app.listen(PORT, () => {
  console.log(`✅ EduQuest server running at http://localhost:${PORT}`);
});