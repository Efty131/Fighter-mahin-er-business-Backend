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
        const { name, description, category, images } = req.body;

        // Check for required fields
        if (!name || !description || !category) {
            return res.status(400).json({ message: 'Please fill in all required fields' });
        }

        // Ensure at least one image URL is provided
        if (!images || !images[0]) {
            return res.status(400).json({ message: 'At least one image URL is required.' });
        }

        // Create new Product instance
        const newProduct = new Product({
            name,
            description,
            category,
            images, // Save the array of image URLs
        });

        // Save the new product
        await newProduct.save();

        res.json({ message: 'Product uploaded successfully!', product: newProduct });
    } catch (error) {
        console.error('Error uploading product:', error);
        res.status(500).json({ message: 'Error uploading product' });
    }
});


// Start the server
app.listen(port, () => {  
    console.log(`Server is running at http://127.0.0.1:${port}`.rainbow);
});
