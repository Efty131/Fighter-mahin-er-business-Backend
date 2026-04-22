const express = require('express');
const router = express.Router();
const { createOrder, getMyOrders } = require('../controller/orderController');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, createOrder);
router.get('/myorders', protect, getMyOrders);

module.exports = router;
