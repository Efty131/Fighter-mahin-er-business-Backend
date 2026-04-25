const express = require('express');
const router = express.Router();
const {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderSummary,
} = require('../controller/orderController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

// ─── User routes ──────────────────────────────────────────────────────────────
router.post('/checkout', protect, createOrder);          // Place order with shipping info
router.get('/myorders', protect, getMyOrders);           // User's own order history

// ─── Admin routes ─────────────────────────────────────────────────────────────
router.get('/admin/summary', protect, adminOnly, getOrderSummary);       // Dashboard stats
router.get('/admin/all',     protect, adminOnly, getAllOrders);           // All orders (paginated)
router.get('/admin/:id',     protect, adminOnly, getOrderById);          // Single order detail
router.patch('/admin/:id',   protect, adminOnly, updateOrderStatus);     // Update status

module.exports = router;
