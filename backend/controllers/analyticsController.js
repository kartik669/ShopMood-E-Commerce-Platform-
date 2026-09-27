const mongoose = require("mongoose");
const Order = require("../models/Order");
const Product = require("../models/Product");
const User = require("../models/User");
const inMemoryStore = require("../data/inMemoryStore");

const getAdminStats = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const orders = inMemoryStore.orders || [];
      const totalRevenue = orders.reduce(
        (acc, item) => acc + (item.totalAmount || 0),
        0
      );
      return res.json({
        totalOrders: orders.length,
        totalProducts: inMemoryStore.products.length,
        totalUsers: 1,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
      });
    }

    const totalOrders = await Order.countDocuments({});
    const totalProducts = await Product.countDocuments({});
    const totalUsers = await User.countDocuments({ role: "user" });

    const orders = await Order.find({});
    const totalRevenue = orders.reduce(
      (acc, item) => acc + item.totalAmount,
      0,
    );

    res.json({ totalOrders, totalProducts, totalUsers, totalRevenue });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAdminStats };
