const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const templateRoutes = require('./routes/templates');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api', templateRoutes);

// Basic route
app.get('/', (req, res) => {
    res.send('Photobox API is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
