const express = require('express');
const mysql = require('mysql');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: '',
});

const dbName = 'studyquest';
const dbSql = `CREATE DATABASE IF NOT EXISTS ${dbName}`;

db.query(dbSql, (err) => {
    if (err) {
        console.log('Error in creating database:', err);
        return;
    }

    console.log('Database created or already exists');

    db.changeUser({ database: dbName }, (err) => {
        if (err) {
            console.log('Failed to switch to database:', err);
            return;
        }

        const tableStatements = [
            `CREATE TABLE IF NOT EXISTS groups (
                group_id INT AUTO_INCREMENT PRIMARY KEY,
                group_name VARCHAR(100) NOT NULL,
                join_code VARCHAR(20) UNIQUE NOT NULL
            ) ENGINE=InnoDB`,

            `CREATE TABLE IF NOT EXISTS users (
                user_id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                password_hash VARCHAR(255) NOT NULL,
                current_university INT NOT NULL,
                group_id INT,
                FOREIGN KEY (group_id) REFERENCES groups(group_id)
            ) ENGINE=InnoDB`,

            `CREATE TABLE IF NOT EXISTS study_sessions (
                session_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                start_time DATETIME NOT NULL,
                end_time DATETIME NOT NULL,
                focus_score INT,
                content TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            ) ENGINE=InnoDB`,

            `CREATE TABLE IF NOT EXISTS files (
                file_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                filename VARCHAR(255) NOT NULL,
                filepath VARCHAR(255) NOT NULL,
                upload_date DATE NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            ) ENGINE=InnoDB`
        ];

        for (const sql of tableStatements) {
            db.query(sql, (err) => {
                if (err) {
                    console.log('Error creating table:', err.sqlMessage);
                } else {
                    console.log('Table created or already exists');
                }
            });
        }
    });
});

app.get('/', (req, res) => {
    return res.json("This is the server");
});

app.post('/verifyuser', (req, res) => {
    const { username, password } = req.body;
    const sql = 'SELECT * FROM users WHERE username = ?';

    db.query(sql, [username], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Internal server error" });
        if (rows.length === 0) return res.status(401).json({ success: false, message: "Invalid credentials" });

        const user = rows[0];
        if (password === user.password_hash) {
            delete user.password_hash;
            // Fetch study sessions for this user
            db.query('SELECT * FROM study_sessions WHERE user_id = ? ORDER BY start_time DESC', [user.user_id], (err2, sessions) => {
                if (err2) return res.status(500).json({ success: false, message: "Internal server error" });
                return res.json({ success: true, user, sessions });
            });
        } else {
            return res.status(401).json({ success: false, message: "Invalid credentials" });
        }
    });
});

app.put('/create', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: "Missing username or password" });
    }
    const sql = 'INSERT INTO users (username, password_hash, current_university, group_id) VALUES (?, ?, 6, ?)';
    db.query(sql, [username, password, null], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.json({ success: false, message: "Username already exists" });
            }
            return res.status(500).json({ success: false, message: "Signup failed" });
        }
        const user = { user_id: result.insertId, username, current_university: 1, group_id: null };
        return res.json({ success: true, user });
    });
});

app.put('/update', (req, res) => {
    const { userId, currentUniversity } = req.body;
    if (userId == null || currentUniversity == null) { // allow 0 and 1
        return res.status(400).json({ success: false, message: "Missing userId or currentUniversity" });
    }
    const sql = 'UPDATE users SET current_university = ? WHERE user_id = ?';
    db.query(sql, [currentUniversity, userId], (err, result) => {
        if (err) {
            console.log('Update error:', err);
            return res.status(500).json({ success: false, message: "Update failed" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        return res.json({ success: true, message: "User updated successfully" });
    });
});

app.post('/creategroup', (req, res) => {
    const { groupName } = req.body;
    console.log('Received groupName:', groupName); // This is fine here
    if (!groupName || !groupName.trim()) {
        return res.status(400).json({ success: false, message: "Group name required" });
    }
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const sql = 'INSERT INTO groups (group_name, join_code) VALUES (?, ?)';

    db.query(sql, [groupName, joinCode], (err, result) => {
        if (err) {
            console.log('Group creation error:', err); // <-- Only here!
            return res.status(500).json({ success: false, message: "Group creation failed" });
        }
        return res.json({ success: true, groupId: result.insertId, joinCode });
    });
});

app.post('/joingroup', (req, res) => {
    const { userId, joinCode } = req.body;
    console.log('Joining group:', { userId, joinCode });

    const getGroupSql = 'SELECT group_id FROM groups WHERE join_code = ?';
    db.query(getGroupSql, [joinCode], (err, rows) => {
        if (err || rows.length == 0) {
            console.log('Invalid join code or SQL error:', err);
            return res.status(400).json({ success: false, message: "Invalid join code" });
        }

        const groupId = rows[0].group_id;
        console.log('Found groupId:', groupId);
        const updateUserSql = 'UPDATE users SET group_id = ? WHERE user_id = ?';
        db.query(updateUserSql, [groupId, userId], (err, result) => {
            if (err) {
                console.log('Failed to update user:', err);
                return res.status(500).json({ success: false, message: "Join group failed" });
            }
            console.log('User updated:', result); // <-- Look for affectedRows: 1
            return res.json({ success: true, groupId });
        });
    });
});

app.get('/grouprankings', (req, res) => {
    const sql = `
        SELECT u.username, u.current_university, g.group_name, g.group_id
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.group_id
        ORDER BY u.current_university ASC
    `;
    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true, rankings: rows });
    });
});

app.get('/group/:id', (req, res) => {
    const groupId = req.params.id;
    const sql = 'SELECT * FROM groups WHERE group_id = ?';
    db.query(sql, [groupId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        if (rows.length === 0) return res.status(404).json({ success: false, message: "Group not found" });
        return res.json({ success: true, group: rows[0] });
    });
});

app.get('/group/:id/users', (req, res) => {
    const groupId = req.params.id; // <-- Use params, not body
    const sql = `
        SELECT user_id, username, current_university
        FROM users
        WHERE group_id = ?
        ORDER BY current_university ASC
    `;
    db.query(sql, [groupId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        return res.json({ success: true, users: rows });
    });
});

app.get('/users', (req, res) => {
    const sql = `
        SELECT u.username, u.current_university, g.group_name, g.group_id
        FROM users u
        LEFT JOIN groups g ON u.group_id = g.group_id
        ORDER BY u.current_university ASC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        return res.json({ success: true, users: rows });
    });
});

app.post('/studysession', (req, res) => {
    const { user_id, start_time, end_time, focus_score, content } = req.body;
    if (!user_id || !start_time || !end_time || !content) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const sql = `INSERT INTO study_sessions (user_id, start_time, end_time, focus_score, content)
                 VALUES (?, ?, ?, ?, ?)`;
    db.query(sql, [user_id, start_time, end_time, focus_score, content], (err, result) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Failed to save session" });
        }
        return res.json({ success: true, session_id: result.insertId });
    });
});

app.get('/studysessions/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = `SELECT * FROM study_sessions WHERE user_id = ? ORDER BY start_time DESC`;
    db.query(sql, [userId], (err, rows) => {
        if (err) return res.status(500).json({ success: false, message: "Database error" });
        return res.json({ success: true, sessions: rows });
    });
});

app.listen(8081, () => {
    console.log("Server listening on port 8081");
});
