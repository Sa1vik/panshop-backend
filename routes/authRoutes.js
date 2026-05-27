const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { generateToken, protect } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, shopName } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please provide name, email and password' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already registered' });
    const user = await User.create({ name, email, password, shopName });
    res.status(201).json({
      _id: user._id, name: user.name, email: user.email,
      shopName: user.shopName, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during registration' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password' });
    res.json({
      _id: user._id, name: user.name, email: user.email,
      shopName: user.shopName, token: generateToken(user._id),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error during login' });
  }
});

router.get('/me', protect, async (req, res) => {
  res.json({ _id: req.user._id, name: req.user.name, email: req.user.email, shopName: req.user.shopName });
});

module.exports = router;
