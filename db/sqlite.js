const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Assurez-vous que le répertoire de la base de données existe
const dbDir = path.dirname('./comments.db');
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

// Créer ou ouvrir la base de données
const db = new sqlite3.Database('./comments.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

// Fonction pour exécuter une requête SQL avec gestion des erreurs
function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error(`Error executing query: ${query}`, err);
                reject(err);
            } else {
                resolve(this);
            }
        });
    });
}

// Initialiser la base de données de manière asynchrone
async function initializeDatabase() {
    try {
        console.log('Initializing database...');
        
        // Créer la table comments si elle n'existe pas
        await runQuery(`CREATE TABLE IF NOT EXISTS comments (
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
        console.log('Comments table initialized');

        // Créer la table reviews si elle n'existe pas
        await runQuery(`CREATE TABLE IF NOT EXISTS reviews (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            reviewName TEXT UNIQUE,
            videoUrl TEXT,
            password TEXT,
            frameRate REAL
        )`);
        console.log('Reviews table initialized');
        
        // Créer la table colors si elle n'existe pas
        await runQuery(`CREATE TABLE IF NOT EXISTS colors (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            resolveColor TEXT
        )`);
        console.log('Colors table initialized');
        
        // Vérifier si la table colors est vide
        db.get("SELECT COUNT(*) as count FROM colors", async (err, row) => {
            if (err) {
                console.error('Error checking colors table:', err.message);
                return;
            }
            
            if (row.count === 0) {
                console.log('Inserting default colors...');
                // Insérer des couleurs prédéfinies
                const colors = [
                    { name: 'Blue', resolveColor: '#4cb7e3' },
                    { name: 'Cyan', resolveColor: '#E0FFFF' },
                    { name: 'Green', resolveColor: '#6AA84F' },
                    { name: 'Pink', resolveColor: '#c90076' },
                    { name: 'Red', resolveColor: '#FF0000' },
                    { name: 'Yellow', resolveColor: '#ffd966' }
                ];
                
                try {
                    for (const color of colors) {
                        await runQuery("INSERT INTO colors (name, resolveColor) VALUES (?, ?)", 
                            [color.name, color.resolveColor]);
                    }
                    console.log('Default colors inserted successfully');
                } catch (insertErr) {
                    console.error('Error inserting default colors:', insertErr.message);
                }
            } else {
                console.log(`Colors table already has ${row.count} entries`);
            }
        });
        
        console.log('Database initialization completed');
    } catch (error) {
        console.error('Database initialization failed:', error.message);
    }
}

// Initialiser la base de données au démarrage
initializeDatabase();

module.exports = db;
