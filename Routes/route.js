const express = require('express');
const getProducts = require('../controller/controller')
const searchAllProducts = require('../controller/searchController');
const updateProductByName = require('../controller/updateController');
const getProductsByCategory = require('../controller/category');
const router = express.Router();

router.get("/", getProducts);
router.put('/update/:name', updateProductByName);
router.get("/search", searchAllProducts);
router.get('/category/:category', getProductsByCategory);

module.exports = router;