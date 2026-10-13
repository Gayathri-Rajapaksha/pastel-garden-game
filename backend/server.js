const express = require('express'); //HTTP requests
const cors = require('cors');//frontend (HTML/JS) to talk
const sqlite3 = require('sqlite3').verbose();//lightweight, file-based database system
const path = require('path');//built-in Node module
const bcrypt = require('bcryptjs'); // NEW: Secure password hashing library!

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Allows the server to read real IPs if you ever upload this to the internet (like Glitch)
app.set('trust proxy', true); 

// --- DATABASE CONNECTION ---
const db = new sqlite3.Database(path.join(__dirname, 'game.db'), (err) => {
    if (err) console.error("Database error:", err.message);
    else console.log("Connected to SQLite database.");
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        best_easy INTEGER DEFAULT 0,
        best_medium INTEGER DEFAULT 0,
        best_hard INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scores_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT,
        level TEXT,
        score INTEGER
    )`);
});

// --- NEW IP SECURITY TRACKER ---
const loginAttempts = {};

// --- API ENDPOINT: SECURE REGISTRATION ---
app.post('/api/register', async (req, res) => {
    const playerIP = req.ip || req.connection.remoteAddress;
    const { username, email, password } = req.body;
    
    try {
        // SECURITY UPGRADE: Hash the password before saving it!
        const salt = await bcrypt.genSalt(10); // Generates a random secure "salt"
        const hashedPassword = await bcrypt.hash(password, salt); // Scrambles the password

        db.run(`INSERT INTO users (username, email, password) VALUES (?, ?, ?)`, 
            [username, email, hashedPassword], // Save the HASHED password, not the real one!
            function(err) {
                if (err) return res.status(400).json({ success: false, message: "Username or Email already exists! 🥀" });
                console.log(`[ANALYTICS] New account created: ${username} (IP: ${playerIP})`);
                res.json({ success: true, message: "Registration successful! 🌸", user: { id: this.lastID, username, best_easy: 0, best_medium: 0, best_hard: 0 } });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error during registration." });
    }
});

// --- API ENDPOINT: SECURE USER LOGIN ---
app.post('/api/login', (req, res) => {
    const playerIP = req.ip || req.connection.remoteAddress;
    const { username, password } = req.body;

    // ANTI-HACKER CHECK: Block IP if they failed 5 times
    if (loginAttempts[playerIP] >= 5) {
        console.log(`[SECURITY ALERT] Blocked IP ${playerIP} for too many login attempts.`);
        return res.status(429).json({ success: false, message: "Too many failed attempts! Wait a moment. 🥀" });
    }

    // Step 1: Find the user by username ONLY (Don't check the password in the database yet)
    db.get(`SELECT * FROM users WHERE username = ?`, [username], async (err, row) => {
        if (row) {
            // Step 2: Compare the typed password with the scrambled password in the database
            const isMatch = await bcrypt.compare(password, row.password);
            
            if (isMatch) {
                loginAttempts[playerIP] = 0; // Reset their strikes to 0 if they get it right!
                console.log(`[ANALYTICS] Successful login: ${username} (IP: ${playerIP})`);
                
                // Remove the password from the user object before sending it to the frontend for extra safety
                delete row.password; 
                res.json({ success: true, message: "Welcome back! 🌸", user: row });
            } else {
                loginAttempts[playerIP] = (loginAttempts[playerIP] || 0) + 1; // Add a strike
                res.status(401).json({ success: false, message: "Invalid credentials! 🥀" });
            }
        } else {
            loginAttempts[playerIP] = (loginAttempts[playerIP] || 0) + 1; // Add a strike
            res.status(401).json({ success: false, message: "Invalid credentials! 🥀" });
        }
    });
});

// --- API ENDPOINT: SCORE TRACKING ---
app.post('/api/score', (req, res) => {
    const playerIP = req.ip || req.connection.remoteAddress;
    const { username, level, score } = req.body;
    const column = `best_${level}`;
    
    console.log(`[ANALYTICS] Score submitted: ${score} by ${username} (IP: ${playerIP})`);
    
    db.run(`INSERT INTO scores_history (username, level, score) VALUES (?, ?, ?)`, [username, level, score]);
    
    db.get(`SELECT ${column} FROM users WHERE username = ?`, [username], (err, row) => {
        if (row && score > row[column]) {
            db.run(`UPDATE users SET ${column} = ? WHERE username = ?`, [score, username], () => {
                res.json({ success: true, updated: true });
            });
        } else {
            res.json({ success: true, updated: false });
        }
    });
});

// --- API ENDPOINT: GLOBAL LEADERBOARD ---
app.get('/api/leaderboard/:level', (req, res) => {
    const level = req.params.level;
    db.all(`SELECT username, best_${level} as score FROM users WHERE best_${level} > 0 ORDER BY best_${level} DESC LIMIT 10`, [], (err, rows) => {
        res.json(rows);
    });
});

// --- API ENDPOINT: PRIVATE PERSONAL LEADERBOARD ---
app.get('/api/leaderboard/private/:username/:level', (req, res) => {
    const { username, level } = req.params;
    db.all(`SELECT DISTINCT score FROM scores_history WHERE username = ? AND level = ? ORDER BY score DESC LIMIT 3`, [username, level], (err, rows) => {
        if (!err && rows && rows.length > 0) {
            res.json(rows); 
        } else {
            db.get(`SELECT best_${level} as score FROM users WHERE username = ? AND best_${level} > 0`, [username], (err, row) => {
                if (row) res.json([{ score: row.score }]);
                else res.json([]);
            });
        }
    });
});

// --- START THE SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));