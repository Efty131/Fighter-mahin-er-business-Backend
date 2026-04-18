const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const express = require('express');
require('colors'); // Fixed typo: 'colour' -> 'colors'
const cors = require('cors');
const connectDB = require('./config/config');
const router = require('./Routes/route');
const Product = require('./model/model');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
connectDB();

// Middleware
app.use(cors()); // Enable CORS
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies

// Routes
app.use("/api/products", router);

// Serve HTML file for upload form
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/views/upload.html');
});

// Global error handler (Optional, for better error handling)
app.use((err, req, res, next) => {
    console.error('Error:', err.message);
    res.status(500).json({ message: 'Internal Server Error' });
});

app.get('/', (req, res) =>{
    res.sendFile(__dirname + '/./views/upload.html');
});

app.post('/upload', async (req, res) => {
    try {
        const { name, description, category, price, images } = req.body;

        // 🔹 Single validation check
        const missing = ['name', 'description', 'category', 'price'].find(f => !req.body[f]);
        if (missing) return res.status(400).json({ message: `${missing} is required` });
        if (!images?.[0]) return res.status(400).json({ message: 'At least one image URL is required' });

        // 🔹 Create & save in one line
        const product = await Product.create({ name, description, category, price, images });

        res.status(201).json({ message: 'Product uploaded successfully!', product });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ message: 'Failed to upload product' });
    }
});


// Start the server
app.listen(port, () => {  
    console.log(`Server is running at http://127.0.0.1:${port}`.rainbow);
});
