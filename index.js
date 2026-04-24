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

// ✅ Cookie parser & auth routes
const cookieParser = require('cookie-parser');
const authRoutes = require('./Routes/auth');
const courseRoutes = require('./Routes/courseRoutes');
const orderRoutes = require('./Routes/orderRoutes');
const enrollmentRoutes = require('./Routes/enrollmentRoutes');
const { protect, adminOnly } = require('./middleware/authMiddleware');

const app = express();
const port = process.env.PORT || 4002;

// MongoDB connection
connectDB();

// 🔥 CORS Configuration - FIXED for HTTP-only cookies + credentials
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',           // Vite dev server (default)
      'http://127.0.0.1:5173',           // Alternative Vite dev
      'http://localhost:4002',           // Local backend direct access
      'https://fighter-mahin-er-business-backend.onrender.com', // Your Render backend URL
      // ✅ ADD YOUR PRODUCTION FRONTEND DOMAIN HERE WHEN DEPLOYED:
      // 'https://your-frontend-domain.com',
      // 'https://your-academy.vercel.app',
    ];
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`.red);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ CRITICAL: Allow browser to send HTTP-only cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Set-Cookie'], // ✅ Let frontend detect when cookie is set
  optionsSuccessStatus: 200 // Some legacy browsers choke on 204
};

// Apply CORS middleware with our custom options
app.use(cors(corsOptions));
// Handle preflight OPTIONS requests explicitly
app.options('*', cors(corsOptions));

// ✅ Other Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser()); // ✅ Parse cookies for JWT authentication
app.use(express.static('public')); // ✅ Serve static files (CSS/JS/images)

// ✅ Auth routes
app.use('/auth', authRoutes);

// ✅ Login & Register pages (if serving HTML directly)
app.get('/login', (req, res) => {
  res.sendFile(__dirname + '/views/login.html');
});
app.get('/register', (req, res) => {
  res.sendFile(__dirname + '/views/register.html');
});

// ✅ Product API routes
app.use("/api/products", router);

// ✅ Course API routes
app.use("/api/courses", courseRoutes);

// ✅ Order API routes
app.use("/api/orders", orderRoutes);

// ✅ Enrollment API routes
app.use("/api/enrollments", enrollmentRoutes);

// ✅ Serve upload form
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/upload.html');
});

// ✅ Upload route (Protected with JWT & Admin only)
app.post('/upload', protect, adminOnly, async (req, res) => {
  try {
    const { name, description, category, price, images } = req.body;

    // Validation
    const missing = ['name', 'description', 'category', 'price'].find(f => !req.body[f]);
    if (missing) {
      return res.status(400).json({ message: `${missing} is required` });
    }
    if (!images?.[0]) {
      return res.status(400).json({ message: 'At least one image URL is required' });
    }

    const product = await Product.create({ name, description, category, price, images });
    res.status(201).json({ message: 'Product uploaded successfully!', product });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Failed to upload product', error: error.message });
  }
});

// ✅ Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err.message);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// ✅ 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// 🚀 Start the server
app.listen(port, '0.0.0.0', () => {  
  console.log(`✅ Server is running at http://127.0.0.1:${port}`.rainbow);
  console.log(`🌐 CORS allowed origins: localhost:5173, your-production-domain.com`.blue);
});