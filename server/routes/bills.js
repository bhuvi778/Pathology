const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const { status, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (status) query.paymentStatus = status;
    const total = await Bill.countDocuments(query);
    const bills = await Bill.find(query)
      .populate('patient', 'name patientId phone')
      .populate('appointment', 'appointmentId appointmentDate')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ bills, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id)
      .populate('patient')
      .populate({ path: 'appointment', populate: ['doctor', 'tests'] })
      .populate('createdBy', 'name');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/appointment/:appointmentId', protect, async (req, res) => {
  try {
    const bill = await Bill.findOne({ appointment: req.params.appointmentId })
      .populate('patient')
      .populate('appointment');
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id/payment', protect, async (req, res) => {
  try {
    const { paidAmount, paymentMethod, discount, discountType } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (discount !== undefined) {
      bill.discount = discount;
      bill.discountType = discountType || 'fixed';
    }
    let discountAmount = 0;
    if (bill.discountType === 'percent') discountAmount = (bill.subtotal * bill.discount) / 100;
    else discountAmount = bill.discount;
    bill.total = bill.subtotal - discountAmount;

    if (paidAmount !== undefined) bill.paidAmount = paidAmount;
    if (paymentMethod) bill.paymentMethod = paymentMethod;
    bill.balance = bill.total - bill.paidAmount;

    if (bill.paidAmount >= bill.total) bill.paymentStatus = 'paid';
    else if (bill.paidAmount > 0) bill.paymentStatus = 'partial';
    else bill.paymentStatus = 'pending';

    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const bill = await Bill.findByIdAndDelete(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });
    res.json({ message: 'Bill deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
