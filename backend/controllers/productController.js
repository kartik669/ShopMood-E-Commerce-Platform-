const fs = require("fs");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const cloudinary = require("../config/cloudinary");
const mockProducts = require("../data/mockProducts");

const getProducts = async (req, res) => {
  try {
    const { keyword, category, search } = req.query;
    const searchTerm = (keyword || search || "").trim().toLowerCase();

    // Resilient fallback when MongoDB is not connected
    if (mongoose.connection.readyState !== 1) {
      let filtered = [...mockProducts];
      if (searchTerm) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(searchTerm) ||
            p.description.toLowerCase().includes(searchTerm) ||
            p.category.toLowerCase().includes(searchTerm)
        );
      }
      if (category && category !== "All") {
        filtered = filtered.filter(
          (p) => p.category.toLowerCase() === category.toLowerCase()
        );
      }
      return res.json(filtered);
    }

    const query = {};
    if (searchTerm) {
      query.$or = [
        { name: { $regex: searchTerm, $options: "i" } },
        { description: { $regex: searchTerm, $options: "i" } },
        { category: { $regex: searchTerm, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      query.category = { $regex: new RegExp(`^${category}$`, "i") };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const product =
        mockProducts.find(
          (p) => p._id === req.params.id || p._id.toString() === req.params.id
        ) || mockProducts[0];
      return res.json(product);
    }

    const product = await Product.findById(req.params.id);
    if (product) {
      res.json(product);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;
    let imageUrl = req.body.imageUrl || "";

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        imageUrl = result.secure_url;
      } finally {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Failed to delete temp file:", err.message);
        });
      }
    }

    if (!imageUrl) {
      return res.status(400).json({ message: "Product image is required (upload a file or provide imageUrl)" });
    }

    if (mongoose.connection.readyState !== 1) {
      const createdProduct = {
        _id: "prod_" + Date.now(),
        name,
        description,
        price: Number(price),
        category,
        stock: Number(stock),
        imageUrl,
        ratings: 5.0,
        numReviews: 0,
      };
      mockProducts.unshift(createdProduct);
      return res.status(201).json(createdProduct);
    }

    const product = new Product({
      name,
      description,
      price,
      category,
      stock,
      imageUrl,
    });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { name, description, price, category, stock } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const product = mockProducts.find(
        (p) => p._id === req.params.id || p._id.toString() === req.params.id
      );
      if (!product) return res.status(404).json({ message: "Product not found" });
      if (name !== undefined) product.name = name;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = Number(price);
      if (category !== undefined) product.category = category;
      if (stock !== undefined) product.stock = Number(stock);
      if (req.body.imageUrl) product.imageUrl = req.body.imageUrl;
      return res.json(product);
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (price !== undefined) product.price = price;
    if (category !== undefined) product.category = category;
    if (stock !== undefined) product.stock = stock;

    if (req.file) {
      try {
        const result = await cloudinary.uploader.upload(req.file.path);
        product.imageUrl = result.secure_url;
      } finally {
        fs.unlink(req.file.path, (err) => {
          if (err) console.error("Failed to delete temp file:", err.message);
        });
      }
    } else if (req.body.imageUrl) {
      product.imageUrl = req.body.imageUrl;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      const idx = mockProducts.findIndex(
        (p) => p._id === req.params.id || p._id.toString() === req.params.id
      );
      if (idx !== -1) {
        mockProducts.splice(idx, 1);
        return res.json({ message: "Product removed" });
      }
      return res.status(404).json({ message: "Product not found" });
    }

    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: "Product removed" });
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};
