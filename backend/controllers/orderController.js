const mongoose = require("mongoose");
const Order = require("../models/Order");
const sendEmail = require("../utils/sendEmail");
const inMemoryStore = require("../data/inMemoryStore");

const addOrderItems = async (req, res) => {
  try {
    const { items, totalAmount, address, paymentId } = req.body;
    if (items && items.length === 0) {
      return res.status(400).json({ message: "No order items" });
    }

    if (mongoose.connection.readyState !== 1) {
      const createdOrder = {
        _id: "order_" + Date.now(),
        userId: req.user._id,
        items,
        totalAmount,
        address,
        paymentId: paymentId || "sandbox_txn_" + Date.now(),
        status: "Pending",
        createdAt: new Date().toISOString(),
      };
      inMemoryStore.orders.unshift({
        ...createdOrder,
        userId: { _id: req.user._id, name: req.user.name || "Customer", email: req.user.email || "" },
      });
      return res.status(201).json(createdOrder);
    }

    const order = new Order({
      userId: req.user._id,
      items,
      totalAmount,
      address,
      paymentId,
    });
    const createdOrder = await order.save();

    // Send Order Confirmation Email
    const message = `
      <h2>Order Confirmation</h2>
      <p>Hello ${req.user.name},</p>
      <p>Your order has been successfully placed! Order ID: <strong>${createdOrder._id}</strong></p>
      <p>Total Amount Paid: $${totalAmount.toFixed(2)}</p>
      <p>It will be shipped to: ${address.street}, ${address.city}</p>
      <p>Thank you for shopping with ShopMood!</p>
    `;

    await sendEmail({
      email: req.user.email,
      subject: "ShopMood - Order Confirmation",
      message,
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyOrders = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(
        inMemoryStore.orders.filter(
          (o) =>
            o.userId === req.user._id ||
            (o.userId && o.userId._id === req.user._id) ||
            req.user.role === "admin"
        )
      );
    }
    const orders = await Order.find({ userId: req.user._id });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOrders = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json(inMemoryStore.orders);
    }
    const orders = await Order.find({}).populate("userId", "id name");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const order = inMemoryStore.orders.find((o) => o._id === req.params.id);
      if (order) {
        order.status = req.body.status || order.status;
        return res.json(order);
      }
      return res.status(404).json({ message: "Order not found" });
    }
    const order = await Order.findById(req.params.id);
    if (order) {
      order.status = req.body.status || order.status;
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { addOrderItems, getMyOrders, getOrders, updateOrderStatus };
