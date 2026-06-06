const express = require('express');
const router = express.Router();
const LabSettings = require('../models/LabSettings');
const { protect, authorize } = require('../middleware/auth');

// GET /api/settings
router.get('/', protect, async (req, res) => {
  try {
    let settings = await LabSettings.findOne();
    if (!settings) {
      settings = await LabSettings.create({});
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/settings
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await LabSettings.findOne();
    if (!settings) {
      settings = await LabSettings.create(req.body);
    } else {
      Object.assign(settings, req.body);
      await settings.save();
    }
    res.json(settings);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
