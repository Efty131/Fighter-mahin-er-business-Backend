const mongoose = require('mongoose');
const { Schema } = mongoose;

const orderSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
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
