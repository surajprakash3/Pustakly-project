const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');

const normalizeRole = (role) => String(role || 'user').toLowerCase();

const signToken = (user) =>
  jwt.sign({ id: user._id, role: normalizeRole(user.role) }, process.env.JWT_SECRET || 'dev_secret', {
    expiresIn: '7d'
  });

const register = async (req, res) => {
  try {
    const { name, fullName, email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const normalizedFullName = (fullName || name || '').trim();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      fullName: normalizedFullName,
      name: normalizedFullName,
      email: normalizedEmail,
      password: passwordHash,
      role: 'user',
      status: 'Active',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    const token = signToken(user);
    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: { id: user._id, name: user.name, fullName: user.fullName, email: user.email, role: user.role }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Registration failed', error: err.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const matches = await bcrypt.compare(password, user.password);
    if (!matches) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = signToken(user);
    return res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: normalizeRole(user.role) }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Login failed', error: err.message });
  }
};

const me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Failed to fetch user', error: err.message });
  }
};

module.exports = {
  register,
  login,
  me
};
