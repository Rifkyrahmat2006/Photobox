const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir);
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/png') {
            cb(null, true);
        } else {
            cb(new Error('Only PNG files are allowed!'), false);
        }
    }
});

// GET /templates - List all templates
router.get('/templates', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM templates ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// POST /admin/templates - Upload template
router.post('/admin/templates', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const { name, config_json, layout_type } = req.body;
        // Store relative path
        const image_path = 'uploads/' + req.file.filename;

        // Validate JSON
        let config;
        try {
            config = JSON.parse(config_json);
        } catch (e) {
            return res.status(400).json({ message: 'Invalid JSON config' });
        }

        const [result] = await db.query(
            'INSERT INTO templates (name, image_path, layout_type, config_json) VALUES (?, ?, ?, ?)',
            [name, image_path, layout_type || 'single', JSON.stringify(config)]
        );

        res.status(201).json({
            message: 'Template created',
            id: result.insertId,
            image_path
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// DELETE /admin/templates/:id - Delete template
router.delete('/admin/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get file path first
        const [rows] = await db.query('SELECT image_path FROM templates WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }

        const imagePath = rows[0].image_path;

        // Delete from DB
        await db.query('DELETE FROM templates WHERE id = ?', [id]);

        // Delete file
        const fullPath = path.join(__dirname, '..', imagePath);
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
        }

        res.json({ message: 'Template deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// GET /templates/:id - Get single template
router.get('/templates/:id', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM templates WHERE id = ?', [req.params.id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }
        res.json(rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// PUT /admin/templates/:id - Update template
router.put('/admin/templates/:id', upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { name, config_json, layout_type } = req.body;

        // Validate JSON if provided
        let config;
        if (config_json) {
            try {
                config = JSON.parse(config_json);
            } catch (e) {
                return res.status(400).json({ message: 'Invalid JSON config' });
            }
        }

        // Check if template exists
        const [rows] = await db.query('SELECT * FROM templates WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Template not found' });
        }
        const currentTemplate = rows[0];

        let image_path = currentTemplate.image_path;
        if (req.file) {
            // If new file uploaded, delete old one
            const oldPath = path.join(__dirname, '..', currentTemplate.image_path);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
            image_path = 'uploads/' + req.file.filename;
        }

        const updateQuery = `
            UPDATE templates 
            SET name = ?, 
                layout_type = ?, 
                config_json = ?, 
                image_path = ? 
            WHERE id = ?
        `;

        await db.query(updateQuery, [
            name || currentTemplate.name,
            layout_type || currentTemplate.layout_type,
            config_json ? JSON.stringify(config) : currentTemplate.config_json,
            image_path,
            id
        ]);

        res.json({ message: 'Template updated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

module.exports = router;
