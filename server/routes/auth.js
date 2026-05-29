const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt for:', email);
  if (!email || !password)
    return res.status(400).json({ message: 'Please provide email and password' });
  try {
    const user = await User.findOne({ email }).populate('doctorProfile');
    if (!user) {
      console.log('Login failed: user not found for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (!user.active) {
      console.log('Login failed: account inactive for', email);
      return res.status(401).json({ message: 'Account is deactivated' });
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Login failed: password mismatch for', email);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    user.lastLogin = new Date();
    await user.save();
    console.log('Login success for', email);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      doctorProfile: user.doctorProfile,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error for', email, error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user._id).populate('doctorProfile').select('-password');
  res.json(user);
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  try {
    const user = await User.findById(req.user._id);
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
