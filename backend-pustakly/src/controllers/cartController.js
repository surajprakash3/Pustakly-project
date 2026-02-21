

const Cart = require('../models/Cart');
const mongoose = require('mongoose');

const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ userId, items: [], subtotal: 0 });
    }
    return res.json({ items: cart.items, subtotal: cart.subtotal });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, title, price, quantity = 1 } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    if (!title || price === undefined) {
      return res.status(400).json({ message: 'title and price are required' });
    }

    let cart = await Cart.findOne({ userId });
    const itemId = new mongoose.Types.ObjectId(productId);

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId: itemId, title, price, quantity }]
      });
    } else {
      const existing = cart.items.find(item => item.productId.equals(itemId));
      if (existing) {
        existing.quantity += quantity;
      } else {
        cart.items.push({ productId: itemId, title, price, quantity });
      }
    }
    cart.recalculateSubtotal();
    await cart.save();
    return res.json({ items: cart.items, subtotal: cart.subtotal });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: 'productId and quantity are required' });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const itemId = new mongoose.Types.ObjectId(productId);
    const item = cart.items.find((item) => item.productId.equals(itemId));
    if (!item) {
      return res.status(404).json({ message: 'Item not found in cart' });
    }
    item.quantity = Math.max(1, Number(quantity));
    cart.recalculateSubtotal();
    await cart.save();
    return res.json({ items: cart.items, subtotal: cart.subtotal });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid productId' });
    }
    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });
    cart.items = cart.items.filter(item => !item.productId.equals(productId));
    cart.recalculateSubtotal();
    await cart.save();
    return res.json({ items: cart.items, subtotal: cart.subtotal });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart
};
