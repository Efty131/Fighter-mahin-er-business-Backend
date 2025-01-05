const Product = require('../model/model');

const getProductsByCategory = async (req, res) => {
    const category = req.params.category;
    try {
        const generalProducts = await Product.find({ category });
        const allProducts = [...generalProducts];
        res.status(200).json(allProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = getProductsByCategory;