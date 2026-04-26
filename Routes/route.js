const express = require('express');
const getProducts = require('../controller/controller')
const searchAllProducts = require('../controller/searchController');
const updateProductByName = require('../controller/updateController');
const getProductsByCategory = require('../controller/category');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const router = express.Router();

router.get("/", getProducts);
router.get("/search", searchAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/slug/:slug', async (req, res) => {
    try {
        const Product = require('../model/model');
        const product = await Product.findOne({ slug: req.params.slug }).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.status(200).json({ product });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});
router.put('/update/:name', protect, adminOnly, updateProductByName);

module.exports = router;