const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { category, active } = req.query;
    const query = {};
    if (category) query.category = category;
    if (active !== undefined) query.active = active === 'true';
    else query.active = true;
    const tests = await Test.find(query).sort({ category: 1, name: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const tests = await Test.find().sort({ category: 1, name: 1 });
    res.json(tests);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const test = await Test.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!test) return res.status(404).json({ message: 'Test not found' });
    res.json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Test.findByIdAndUpdate(req.params.id, { active: false });
    res.json({ message: 'Test deactivated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
