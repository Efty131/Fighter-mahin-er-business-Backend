const Product = require('../model/model');

const searchAllProducts = async (req, res) => {
    const query = req.query.q;
    try {
        const generalProducts = await Product.find({ name: { $regex: query, $options: 'i' } });
        
        const allProducts = [...generalProducts];
        res.status(200).json(allProducts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = searchAllProducts;