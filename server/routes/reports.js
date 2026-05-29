const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { appointment, patient, status, doctor, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (appointment) query.appointment = appointment;
    if (patient) query.patient = patient;
    if (status) query.status = status;
    if (doctor) query.doctor = doctor;
    if (search) {
      const patients = await require('../models/Patient').find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.patient = { $in: patients.map(p => p._id) };
    }
    const total = await Report.countDocuments(query);
    const reports = await Report.find(query)
      .populate('patient', 'name patientId age gender')
      .populate('test', 'name shortName category')
      .populate('doctor', 'name specialty')
      .populate('enteredBy', 'name')
      .populate('verifiedBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ reports, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('patient')
      .populate('test')
      .populate('doctor')
      .populate('appointment')
      .populate('enteredBy', 'name')
      .populate('verifiedBy', 'name');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.body.status === 'entered') updateData.enteredBy = req.user._id;
    if (req.body.status === 'verified') {
      updateData.verifiedBy = req.user._id;
      updateData.verifiedAt = new Date();
    }
    const report = await Report.findByIdAndUpdate(req.params.id, updateData, { new: true })
      .populate('patient')
      .populate('test')
      .populate('doctor')
      .populate('appointment');
    if (!report) return res.status(404).json({ message: 'Report not found' });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/appointment/:appointmentId', protect, async (req, res) => {
  try {
    const reports = await Report.find({ appointment: req.params.appointmentId })
      .populate('patient', 'name patientId age gender bloodGroup')
      .populate('test', 'name shortName category sampleType')
      .populate('doctor', 'name specialty qualifications pmcNumber')
      .populate('enteredBy', 'name')
      .populate('verifiedBy', 'name');
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
