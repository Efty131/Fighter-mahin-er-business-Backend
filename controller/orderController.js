const Order = require('../model/Order');
const Enrollment = require('../model/Enrollment');
const Progress = require('../model/Progress');

const createOrder = async (req, res) => {
    try {
        const { items, totalAmount, paymentMethod } = req.body;
        
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items' });
        }

        const order = new Order({
            user: req.user._id,
            items,
            totalAmount,
            paymentMethod,
            paymentStatus: 'completed' // Mocking immediate payment for Phase 2
        });

        const createdOrder = await order.save();

        // If items contain courses and payment is completed, auto-enroll user
        for (const item of items) {
            if (item.itemType === 'Course') {
                const enrollment = new Enrollment({
                    user: req.user._id,
                    course: item.itemId,
                    order: createdOrder._id
                });
                const savedEnrollment = await enrollment.save();

                // Initialize Progress
                const progress = new Progress({
                    enrollment: savedEnrollment._id
                });
                await progress.save();
            }
        }

        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).populate('items.itemId');
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

module.exports = { createOrder, getMyOrders };
