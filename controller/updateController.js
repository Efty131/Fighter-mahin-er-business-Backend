const Product = require('../model/model');

const updateProductByName = async (req, res) => {
    const { name } = req.params;
    const updateData = req.body;

    try {
        const generalProduct = await Product.findOneAndUpdate({ name }, updateData, { new: true });
        
        if (!generalProduct) {
            return res.status(404).json({ message: "Product not found" });
        }
        const updatedProduct = generalProduct;
        res.status(200).json(updatedProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = updateProductByName;