const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    shippingAddress: {
        fullName:   { type: String, required: true },
        email:      { type: String, required: true },
        mobile:     { type: String, required: true },
        address:    { type: String, required: true },
        city:       { type: String, required: true },
        postalCode: { type: String },
        country:    { type: String, required: true },
    },
    orderStatus: {
        type: String,
        enum: ['processing', 'shipped', 'delivered', 'cancelled'],
        default: 'processing',
    },
    items: [
        {
            itemType: {
                type: String,
                required: true,
                enum: ['Course', 'Product'], // Model names for Dynamic Reference
            },
            itemId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'items.itemType', 
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                default: 1, // Quantity for merch products
            }
        }
    ],
    totalAmount: {
        type: Number,
        required: true,
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending',
    },
    paymentMethod: {
        type: String, // 'stripe', 'paypal', 'bkash', etc.
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Order', orderSchema);
