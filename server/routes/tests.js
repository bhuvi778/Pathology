const express = require('express');
const router = express.Router();
const Test = require('../models/Test');
const { protect, authorize } = require('../middleware/auth');

const sanitizeParameter = (parameter) => ({
  ...parameter,
  name: parameter.name?.trim(),
  unit: parameter.unit?.trim() || '',
  options: parameter.type === 'options' ? (parameter.options || []).map((option) => option.trim()).filter(Boolean) : [],
});

const validateTestPayload = (payload) => {
  const parameters = Array.isArray(payload.parameters) ? payload.parameters.map(sanitizeParameter) : [];
  if (!parameters.length) return 'At least one parameter is required.';

  const names = new Set();
  for (const parameter of parameters) {
    if (!parameter.name) return 'Parameter name is required.';
    const normalizedName = parameter.name.toLowerCase();
    if (names.has(normalizedName)) return `Duplicate parameter name: ${parameter.name}`;
    names.add(normalizedName);

    if (parameter.type === 'options' && !parameter.options.length) {
      return `Add at least one option for ${parameter.name}.`;
    }

    if (parameter.type === 'numeric') {
      for (const key of ['male', 'female', 'general']) {
        const range = parameter.normalRange?.[key];
        if (range?.min !== undefined && range?.max !== undefined && Number(range.min) > Number(range.max)) {
          return `${parameter.name}: ${key} minimum cannot be greater than maximum.`;
        }
      }
    }
  }

  payload.parameters = parameters;
  return '';
};

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
    const validationMessage = validateTestPayload(req.body);
    if (validationMessage) return res.status(400).json({ message: validationMessage });
    const test = new Test(req.body);
    await test.save();
    res.status(201).json(test);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    if (req.body.parameters) {
      const validationMessage = validateTestPayload(req.body);
      if (validationMessage) return res.status(400).json({ message: validationMessage });
    }
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
