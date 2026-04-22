// 🚨 ADD THESE TWO LINES AT THE VERY TOP
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

const mongoose = require('mongoose');
const User = require('../model/User');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URL)
  .then(async () => {
    const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;
    
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('❌ Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env');
      process.exit(1);
    }

    const exists = await User.findOne({ email: ADMIN_EMAIL });
    if (exists) {
      console.log('✅ Admin already exists. Skipping.');
      process.exit();
    }

    await User.create({
      name: 'Admin',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD, // Auto-hashed by User model
      role: 'admin'
    });

    console.log('✅ Admin created successfully!');
    console.log(`📧 Email: ${ADMIN_EMAIL}`);
    console.log(`🔑 Role: admin`);
    process.exit();
  })
  .catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
  });