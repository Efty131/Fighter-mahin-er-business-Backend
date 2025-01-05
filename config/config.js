const mongoose = require('mongoose');

const connectDB = async () => {
    await mongoose.connect(process.env.MONGO_URL)
    console.log("MongoDB atlas is connected!".italic.blue.underline);
};

module.exports = connectDB;