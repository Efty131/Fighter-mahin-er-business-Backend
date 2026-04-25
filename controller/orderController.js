const Order = require('../model/Order');
const Enrollment = require('../model/Enrollment');
const Progress = require('../model/Progress');

// ─── User: Checkout & place order ────────────────────────────────────────────
const createOrder = async (req, res) => {
    try {
        const { items, totalAmount, paymentMethod, shippingAddress } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No order items provided' });
        }

        // Validate shipping address fields
        const required = ['address', 'city', 'country', 'mobile'];
        for (const field of required) {
            if (!shippingAddress?.[field]) {
                return res.status(400).json({ message: `Shipping address missing: ${field}` });
            }
        }

        // Mobile number basic validation
        if (!/^\+?[\d\s\-]{7,15}$/.test(shippingAddress.mobile)) {
            return res.status(400).json({ message: 'Invalid mobile number' });
        }

        // Pull name & email from the authenticated user's account
        const fullName = shippingAddress.fullName || req.user.name;
        const email    = shippingAddress.email    || req.user.email;

        const order = new Order({
            user: req.user._id,
            items,
            totalAmount,
            paymentMethod,
            paymentStatus: 'completed', // mocked — swap with real gateway later
            orderStatus: 'processing',
            shippingAddress: {
                ...shippingAddress,
                fullName,
                email,
            },
        });

        const createdOrder = await order.save();

        // Auto-enroll user in any purchased courses
        for (const item of items) {
            if (item.itemType === 'Course') {
                const enrollment = new Enrollment({
                    user: req.user._id,
                    course: item.itemId,
                    order: createdOrder._id,
                });
                const savedEnrollment = await enrollment.save();
                await new Progress({ enrollment: savedEnrollment._id }).save();
            }
        }

        res.status(201).json({ message: 'Order placed successfully', order: createdOrder });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create order', error: error.message });
    }
};

// ─── User: Get own orders ─────────────────────────────────────────────────────
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('items.itemId', 'name price images')
            .sort({ createdAt: -1 });
        res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

// ─── Admin: Get all orders ────────────────────────────────────────────────────
const getAllOrders = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const filter = status ? { orderStatus: status } : {};

        const orders = await Order.find(filter)
            .populate('user', 'name email')
            .populate('items.itemId', 'name price')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(Number(limit));

        const total = await Order.countDocuments(filter);

        res.status(200).json({ total, page: Number(page), orders });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders', error: error.message });
    }
};

// ─── Admin: Get single order detail ──────────────────────────────────────────
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name email')
            .populate('items.itemId', 'name price images');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json(order);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch order', error: error.message });
    }
};

// ─── Admin: Update order status ───────────────────────────────────────────────
const updateOrderStatus = async (req, res) => {
    try {
        const { orderStatus, paymentStatus } = req.body;

        const allowedOrderStatuses   = ['processing', 'shipped', 'delivered', 'cancelled'];
        const allowedPaymentStatuses = ['pending', 'completed', 'failed'];

        if (orderStatus && !allowedOrderStatuses.includes(orderStatus)) {
            return res.status(400).json({ message: 'Invalid order status' });
        }
        if (paymentStatus && !allowedPaymentStatuses.includes(paymentStatus)) {
            return res.status(400).json({ message: 'Invalid payment status' });
        }

        const update = {};
        if (orderStatus)   update.orderStatus   = orderStatus;
        if (paymentStatus) update.paymentStatus = paymentStatus;

        const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
            .populate('user', 'name email');

        if (!order) return res.status(404).json({ message: 'Order not found' });

        res.status(200).json({ message: 'Order updated', order });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update order', error: error.message });
    }
};

// ─── Admin: Dashboard summary ─────────────────────────────────────────────────
const getOrderSummary = async (req, res) => {
    try {
        const [total, processing, shipped, delivered, cancelled, revenue] = await Promise.all([
            Order.countDocuments(),
            Order.countDocuments({ orderStatus: 'processing' }),
            Order.countDocuments({ orderStatus: 'shipped' }),
            Order.countDocuments({ orderStatus: 'delivered' }),
            Order.countDocuments({ orderStatus: 'cancelled' }),
            Order.aggregate([
                { $match: { paymentStatus: 'completed' } },
                { $group: { _id: null, total: { $sum: '$totalAmount' } } },
            ]),
        ]);

        res.status(200).json({
            totalOrders: total,
            byStatus: { processing, shipped, delivered, cancelled },
            totalRevenue: revenue[0]?.total || 0,
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch summary', error: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus,
    getOrderSummary,
};
