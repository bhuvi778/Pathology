const express = require('express');
const router = express.Router();
const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Bill = require('../models/Bill');
const Doctor = require('../models/Doctor');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, authorize('admin', 'receptionist'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const endToday = new Date(); endToday.setHours(23, 59, 59, 999);
    const todayFilter = { createdAt: { $gte: today, $lte: endToday } };
    const todayApptFilter = { appointmentDate: { $gte: today, $lte: endToday } };

    const [
      totalPatients, todayPatients, totalAppointments, todayAppointments,
      pendingReports, completedReports, totalBills, todayRevenue,
      totalDoctors, pendingBills, recentAppointments,
    ] = await Promise.all([
      Patient.countDocuments(),
      Patient.countDocuments(todayFilter),
      Appointment.countDocuments(),
      Appointment.countDocuments(todayApptFilter),
      Report.countDocuments({ status: 'pending' }),
      Report.countDocuments({ status: { $in: ['verified', 'delivered'] } }),
      Bill.countDocuments(),
      Bill.aggregate([
        { $match: { createdAt: { $gte: today, $lte: endToday } } },
        { $group: { _id: null, total: { $sum: '$paidAmount' } } },
      ]),
      Doctor.countDocuments({ active: true }),
      Bill.countDocuments({ paymentStatus: { $in: ['pending', 'partial'] } }),
      Appointment.find(todayApptFilter)
        .populate('patient', 'name patientId')
        .populate('doctor', 'name')
        .populate('tests', 'name')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Weekly stats
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      const dEnd = new Date(d); dEnd.setHours(23, 59, 59, 999);
      const [pts, rev] = await Promise.all([
        Appointment.countDocuments({ appointmentDate: { $gte: d, $lte: dEnd } }),
        Bill.aggregate([{ $match: { createdAt: { $gte: d, $lte: dEnd } } }, { $group: { _id: null, total: { $sum: '$paidAmount' } } }]),
      ]);
      weeklyData.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        date: d.toLocaleDateString(),
        patients: pts,
        revenue: rev[0]?.total || 0,
      });
    }

    res.json({
      stats: {
        totalPatients, todayPatients, totalAppointments, todayAppointments,
        pendingReports, completedReports, totalBills,
        todayRevenue: todayRevenue[0]?.total || 0,
        totalDoctors, pendingBills,
      },
      recentAppointments,
      weeklyData,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
