const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./comments.db');

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS comments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        videoId TEXT,
        text TEXT,
        timestamp INTEGER,
        createdAt TEXT,
        username TEXT,
        color TEXT,
        colorName TEXT,
        isDone INTEGER DEFAULT 0
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reviewName TEXT UNIQUE,
        videoUrl TEXT,
        password TEXT,
        frameRate REAL
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS colors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        resolveColor TEXT
    )`);
    
    // Vérifier si la table colors est vide et y insérer des données si nécessaire
    db.get("SELECT COUNT(*) as count FROM colors", (err, row) => {
        if (err || row.count === 0) {
            // Insérer des couleurs prédéfinies
            const colors = [
                { name: 'Blue', resolveColor: '#4cb7e3' },
                { name: 'Cyan', resolveColor: '#E0FFFF' },
                { name: 'Green', resolveColor: '#6AA84F' },
                { name: 'Pink', resolveColor: '#c90076' },
                { name: 'Red', resolveColor: '#FF0000' },
                { name: 'Yellow', resolveColor: '#ffd966' }
            ];
            
            const stmt = db.prepare("INSERT INTO colors (name, resolveColor) VALUES (?, ?)");
            colors.forEach(color => {
                stmt.run(color.name, color.resolveColor);
            });
            stmt.finalize();
        }
    });
});

module.exports = db;
