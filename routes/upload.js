// Import required modules
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const db = require('../db/sqlite');
const ffmpeg = require('fluent-ffmpeg');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const router = express.Router();

// Configuration de multer pour stocker temporairement les fichiers
const storage = multer.memoryStorage(); // Stockage en mémoire au lieu du disque
const upload = multer({ storage }).single('file');

// Middleware to check if the review name already exists
async function checkReviewName(req, res, next) {
    const { name } = req.body;
    try {
        const row = await new Promise((resolve, reject) => {
            db.get('SELECT reviewName FROM reviews WHERE reviewName = ?', [name], (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (row) {
            return res.status(400).send({ message: 'Review name already exists.' });
        }
        next();
    } catch (err) {
        console.error('Database error:', err);
        return res.status(500).send('Database error.');
    }
}

// Route to check if the review name already exists
router.post('/checkReviewName', checkReviewName, (req, res) => {
    res.status(200).send({ message: 'Review name is available.' });
});

// Test route to verify connection
router.get('/test', (req, res) => {
    res.status(200).send({ message: 'Test route works!' });
});

// Helper function to upload file to Cloudinary
const uploadToCloudinary = (buffer, options) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            options,
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        
        const readableStream = new Readable({
            read() {
                this.push(buffer);
                this.push(null);
            }
        });
        
        readableStream.pipe(uploadStream);
    });
};

// Simplified upload route to handle file upload
router.post('/', (req, res) => {
    console.log('Upload route hit');
    upload(req, res, async (err) => {
        if (err) {
            console.error('Multer error:', err);
            return res.status(500).send({ message: 'Error uploading file.' });
        }

        const file = req.file;
        const { name, password } = req.body;
        console.log(`File: ${file ? file.originalname : 'No file'}, Name: ${name}, Password: ${password}`);
        
        if (!file) {
            return res.status(400).send({ message: 'No file uploaded.' });
        }

        try {
            // Upload to Cloudinary
            console.log('Starting Cloudinary upload...');
            const cloudinaryResult = await uploadToCloudinary(file.buffer, {
                resource_type: 'video',
                folder: 'openvidreview',
                public_id: `${name.replace(/\s+/g, '_')}_${Date.now()}`
            });
            
            console.log('Cloudinary upload successful:', cloudinaryResult.secure_url);
            
            // Utiliser une valeur par défaut pour le frameRate sans essayer d'analyser la vidéo
            // Cela évite les problèmes potentiels avec ffprobe sur Render
            const frameRate = 24;
            console.log('Using default frame rate:', frameRate);

            // Insert video details into the database using a promise
            console.log('Inserting into database...');
            
            // Vérifier si un enregistrement avec le même nom existe déjà
            db.get("SELECT id FROM reviews WHERE reviewName = ?", [name], async (err, row) => {
                if (err) {
                    console.error('Database error checking existing review:', err);
                    return res.status(500).send({ message: `Database error: ${err.message}` });
                }
                
                if (row) {
                    console.log(`Review with name "${name}" already exists`);
                    return res.status(400).send({ message: 'A review with this name already exists.' });
                }
                
                // Insérer le nouvel enregistrement
                db.run(
                    "INSERT INTO reviews (videoUrl, reviewName, password, frameRate) VALUES (?, ?, ?, ?)",
                    [cloudinaryResult.secure_url, name, password, frameRate],
                    function (err) {
                        if (err) {
                            console.error('Database insertion error:', err);
                            return res.status(500).send({ message: `Database error: ${err.message}` });
                        }
                        
                        console.log('Database insertion successful, ID:', this.lastID);
                        console.log('Upload process completed successfully');
                        
                        return res.status(200).json({ 
                            message: 'File uploaded successfully.', 
                            fileName: cloudinaryResult.public_id, 
                            name, 
                            frameRate 
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Error processing video file:', error);
            return res.status(500).send({ message: `Error processing video file: ${error.message}` });
        }
    });
});

module.exports = router;
