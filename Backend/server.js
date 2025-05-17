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
                FOREIGN KEY (user_id) REFERENCES users(user_id)
            ) ENGINE=InnoDB`,

            `CREATE TABLE IF NOT EXISTS story_chapters (
                chapter_id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                content TEXT NOT NULL,
                university_change INT,
                date DATE NOT NULL,
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
        // For demo, compare plain text (replace with hash check in production)
        if (password === user.password_hash) {
            delete user.password_hash;
            return res.json({ success: true, user });
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
    const sql = 'INSERT INTO users (username, password_hash, current_university, group_id) VALUES (?, ?, ?, ?)';
    db.query(sql, [username, password, 1, null], (err, result) => {
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

app.post('/creategroup', (req, res) => {
    const { groupName } = req.body;
    if (!groupName || !groupName.trim()) {
        return res.status(400).json({ success: false, message: "Group name required" });
    }
    const joinCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const sql = 'INSERT INTO groups (group_name, join_code) VALUES (?, ?)';

    db.query(sql, [groupName, joinCode], (err, result) => {
        if (err) {
            console.log('Group creation error:', err);
            return res.status(500).json({ success: false, message: "Group creation failed" });
        }
        return res.json({ success: true, groupId: result.insertId, joinCode });
    });
});

app.post('/joingroup', (req, res) => {
    const { userId, joinCode } = req.body;

    const getGroupSql = 'SELECT group_id FROM groups WHERE join_code = ?';
    db.query(getGroupSql, [joinCode], (err, rows) => {
        if (err || rows.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid join code" });
        }

        const groupId = rows[0].group_id;
        const updateUserSql = 'UPDATE users SET group_id = ? WHERE user_id = ?';
        db.query(updateUserSql, [groupId, userId], (err) => {
            if (err) return res.status(500).json({ success: false, message: "Join group failed" });
            return res.json({ success: true, groupId });
        });
    });
});

app.get('/grouprankings', (req, res) => {
    const sql = `
        SELECT g.group_name, g.group_id, AVG(u.current_university) as avg_university_tier
        FROM groups g
        JOIN users u ON g.group_id = u.group_id
        GROUP BY g.group_id
        ORDER BY avg_university_tier ASC
    `;

    db.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ success: false });
        return res.json({ success: true, rankings: rows });
    });
});

app.listen(8081, () => {
    console.log("Server listening on port 8081");
});
