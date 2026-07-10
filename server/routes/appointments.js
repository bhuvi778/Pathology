const express = require('express');
const router = express.Router();
const Appointment = require('../models/Appointment');
const Bill = require('../models/Bill');
const Test = require('../models/Test');
const Report = require('../models/Report');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { date, status, page = 1, limit = 20, search, doctorId, patientId, patient } = req.query;
    const query = {};
    if (status) query.status = status;
    if (patientId || patient) {
      query.patient = patientId || patient;
    }
    if (doctorId) {
      query.doctor = doctorId;
    } else if (req.user.role === 'doctor' && req.user.doctorProfile) {
      query.doctor = req.user.doctorProfile;
    }
    if (date) {
      const start = new Date(date); start.setHours(0, 0, 0, 0);
      const end = new Date(date); end.setHours(23, 59, 59, 999);
      query.appointmentDate = { $gte: start, $lte: end };
    }
    const populate = [
      { path: 'patient', select: 'name patientId phone age gender' },
      { path: 'doctor', select: 'name specialty' },
      { path: 'tests', select: 'name shortName price category' },
      { path: 'createdBy', select: 'name' },
    ];
    let apptQuery = Appointment.find(query).populate(populate).sort({ createdAt: -1 });
    if (search) {
      const patients = await require('../models/Patient').find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { patientId: { $regex: search, $options: 'i' } },
        ],
      }).select('_id');
      query.patient = { $in: patients.map(p => p._id) };
      apptQuery = Appointment.find(query).populate(populate).sort({ createdAt: -1 });
    }
    const total = await Appointment.countDocuments(query);
    const appointments = await apptQuery.skip((page - 1) * limit).limit(Number(limit));
    res.json({ appointments, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.get('/today', protect, async (req, res) => {
  try {
    const { doctorId } = req.query;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date(); end.setHours(23, 59, 59, 999);
    const todayQuery = { appointmentDate: { $gte: start, $lte: end } };
    if (doctorId) {
      todayQuery.doctor = doctorId;
    } else if (req.user.role === 'doctor' && req.user.doctorProfile) {
      todayQuery.doctor = req.user.doctorProfile;
    }
    const appointments = await Appointment.find(todayQuery)
      .populate('patient', 'name patientId phone age gender')
      .populate('doctor', 'name specialty')
      .populate('tests', 'name price')
      .sort({ createdAt: -1 });
    res.json(appointments);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient')
      .populate('doctor')
      .populate('tests')
      .populate('createdBy', 'name');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    // Prevent duplicate: same patient on same date with non-cancelled status
    const apptDate = new Date(req.body.appointmentDate);
    const start = new Date(apptDate); start.setHours(0, 0, 0, 0);
    const end = new Date(apptDate); end.setHours(23, 59, 59, 999);
    const existing = await Appointment.findOne({
      patient: req.body.patient,
      appointmentDate: { $gte: start, $lte: end },
      status: { $nin: ['cancelled'] },
    }).populate('patient', 'patientId name');
    if (existing) {
      return res.status(409).json({
        message: `Appointment already exists for this patient on this date (ID: ${existing.appointmentId}). Cancel the existing appointment first to create a new one.`,
      });
    }
    const appointment = new Appointment({ ...req.body, createdBy: req.user._id });
    await appointment.save();

    // Auto-create reports for each test
    for (const testId of req.body.tests || []) {
      const test = await Test.findById(testId);
      if (test) {
        const report = new Report({
          appointment: appointment._id,
          patient: req.body.patient,
          test: testId,
          doctor: req.body.doctor,
          results: test.parameters.map(p => ({
            parameterName: p.name,
            unit: p.unit,
            normalRange: p.normalRange?.general?.text || '',
          })),
          status: 'pending',
        });
        await report.save();
      }
    }

    // Auto-create bill
    const tests = await Test.find({ _id: { $in: req.body.tests || [] } });
    const items = tests.map(t => ({ test: t._id, testName: t.name, price: t.price }));
    const subtotal = items.reduce((acc, i) => acc + i.price, 0);
    const bill = new Bill({
      patient: req.body.patient,
      appointment: appointment._id,
      items,
      subtotal,
      total: subtotal,
      balance: subtotal,
      createdBy: req.user._id,
    });
    await bill.save();

    await appointment.populate(['patient', 'doctor', 'tests']);
    res.status(201).json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('patient')
      .populate('doctor')
      .populate('tests');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Admin only — delete appointment + related reports + bill
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    await Report.deleteMany({ appointment: req.params.id });
    await Bill.deleteMany({ appointment: req.params.id });
    await Appointment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Appointment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
