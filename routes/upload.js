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

// Helper function to analyze video with ffprobe
const analyzeVideo = (url) => {
    return new Promise((resolve, reject) => {
        try {
            ffmpeg.ffprobe(url, (err, metadata) => {
                if (err) {
                    console.warn('Warning: Could not analyze video with ffprobe:', err.message);
                    // Résoudre avec un frameRate par défaut au lieu d'échouer
                    return resolve({ frameRate: 24 });
                }
                
                const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
                const frameRate = videoStream ? eval(videoStream.r_frame_rate) : 24;
                
                resolve({ frameRate });
            });
        } catch (error) {
            console.warn('Warning: ffprobe error:', error.message);
            // Résoudre avec un frameRate par défaut au lieu d'échouer
            resolve({ frameRate: 24 });
        }
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
            
            let frameRate = 24; // Valeur par défaut
            
            try {
                // Analyze the uploaded video
                console.log('Analyzing video...');
                const result = await analyzeVideo(cloudinaryResult.secure_url);
                frameRate = result.frameRate;
                console.log('Frame Rate:', frameRate);
            } catch (analyzeError) {
                console.warn('Warning: Could not analyze video, using default frame rate:', analyzeError.message);
            }

            // Insert video details into the database
            console.log('Inserting into database...');
            db.run(
                "INSERT INTO reviews (videoUrl, reviewName, password, frameRate) VALUES (?, ?, ?, ?)",
                [cloudinaryResult.secure_url, name, password, frameRate],
                function (err) {
                    if (err) {
                        console.error('Database error:', err);
                        return res.status(500).send({ message: 'Database error.' });
                    }

                    console.log('Upload process completed successfully');
                    res.status(200).json({ 
                        message: 'File uploaded successfully.', 
                        fileName: cloudinaryResult.public_id, 
                        name, 
                        frameRate 
                    });
                }
            );
        } catch (error) {
            console.error('Error processing video file:', error);
            res.status(500).send({ message: `Error processing video file: ${error.message}` });
        }
    });
});

module.exports = router;
