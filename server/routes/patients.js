const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const LabSettings = require('../models/LabSettings');
const Counter = require('../models/Counter');
const { protect, authorize } = require('../middleware/auth');

// GET /api/patients
router.get('/', protect, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { patientId: { $regex: search, $options: 'i' } },
        { ipNumber: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { cnic: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Patient.countDocuments(query);
    const patients = await Patient.find(query)
      .populate('registeredBy', 'name')
      .populate('tests', 'name shortName category')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ patients, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/patients/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const patient = await Patient.findById(req.params.id)
      .populate('registeredBy', 'name')
      .populate('tests', 'name shortName category');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/patients
router.post('/', protect, async (req, res) => {
  try {
    const { name, age, gender, phone, cnic, ipNumber, tests } = req.body;
    if (!name || age === undefined || !gender || !phone) {
      return res.status(400).json({ message: 'Required fields missing: name, age, gender, phone' });
    }

    const duplicateQuery = [{ phone }];
    if (cnic) duplicateQuery.push({ cnic });
    if (ipNumber) duplicateQuery.push({ ipNumber });

    const duplicate = await Patient.findOne({ $or: duplicateQuery });
    if (duplicate) {
      return res.status(409).json({ message: 'Duplicate patient record or IP number already exists' });
    }

    const settings = await LabSettings.findOne();
    let finalIpNumber = ipNumber;
    if (!finalIpNumber && (settings?.autoIpNumber !== false)) {
      const counter = await Counter.findByIdAndUpdate(
        { _id: 'ipNumber' },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      finalIpNumber = `IP-${String(counter.seq).padStart(5, '0')}`;
    }

    const patient = new Patient({ ...req.body, ipNumber: finalIpNumber, registeredBy: req.user._id, tests });
    await patient.save();
    res.status(201).json(patient);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Duplicate entry' });
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// PUT /api/patients/:id
router.put('/:id', protect, async (req, res) => {
  try {
    if (req.body.ipNumber) {
      const duplicate = await Patient.findOne({ ipNumber: req.body.ipNumber, _id: { $ne: req.params.id } });
      if (duplicate) return res.status(409).json({ message: 'IP number already used by another patient' });
    }
    const patient = await Patient.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/patients/:id
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Patient.findByIdAndDelete(req.params.id);
    res.json({ message: 'Patient deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
