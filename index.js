// 🚨 DNS Fix - Keep this at the very top
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const express = require('express');
require('colors');
const cors = require('cors');
const connectDB = require('./config/config');
const router = require('./Routes/route');
const Product = require('./model/model');
require('dotenv').config();

// ✅ NEW: Cookie parser & auth routes
const cookieParser = require('cookie-parser');
const authRoutes = require('./Routes/auth');
const courseRoutes = require('./Routes/courseRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const enrollmentRoutes = require('./Routes/enrollmentRoutes');
const { protect, adminOnly } = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 4002; // ✅ Changed to 4002 (your expected port)

// MongoDB connection
connectDB();

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // ✅ Parse cookies for JWT
app.use(express.static('public')); // ✅ Serve static files (CSS/JS)

// ✅ NEW: Auth routes
app.use('/auth', authRoutes);

// ✅ NEW: Login & Register pages
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

// Product API routes
app.use("/api/products", router);

// Course API routes
app.use("/api/courses", courseRoutes);

// Order API routes
app.use("/api/orders", orderRoutes);

// Enrollment API routes
app.use("/api/enrollments", enrollmentRoutes);

// Serve upload form (✅ Removed duplicate route)
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/upload.html');
});

// Upload route (✅ Protected with JWT & Admin)
app.post('/upload', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, category, price, images } = req.body;

    const missing = ['name', 'description', 'category', 'price'].find(f => !req.body[f]);
    if (missing) return res.status(400).json({ message: `${missing} is required` });
    if (!images?.[0]) return res.status(400).json({ message: 'At least one image URL is required' });

    const product = await Product.create({ name, description, category, price, images });
    res.status(201).json({ message: 'Product uploaded successfully!', product });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload product' });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Start the server
app.listen(port, () => {  
  console.log(`Server is running at http://127.0.0.1:${port}`.rainbow);
});