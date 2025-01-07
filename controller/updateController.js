const Product = require('../model/model');

const updateProductByName = async (req, res) => {
    const { name } = req.params; // Extract the product name from request parameters
    const updateData = req.body; // Extract update data from the request body

    try {
        // Find the product by name and update it with the provided data
        const updatedProduct = await Product.findOneAndUpdate(
            { name },        // Query to find the product by name
            updateData,      // Data to update
            { new: true }    // Return the updated document
        );

        // If no product is found, return a 404 error
        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        // If the product is successfully updated, return it in the response
        res.status(200).json(updatedProduct);
    } catch (error) {
        // Handle any errors during the operation
        res.status(500).json({ message: error.message });
    }
};

module.exports = updateProductByName;