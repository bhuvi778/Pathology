const mongoose = require('mongoose');
const Counter = require('./Counter');

const billItemSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: { type: String },
  price: { type: Number, required: true },
}, { _id: false });

const billSchema = new mongoose.Schema({
  billId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  items: [billItemSchema],
  subtotal: { type: Number, required: true },
  discount: { type: Number, default: 0 },
  discountType: { type: String, enum: ['fixed', 'percent'], default: 'fixed' },
  total: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'insurance', 'online', 'other'],
    default: 'cash',
  },
  notes: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

billSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'billId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.billId = `BILL-${String(counter.seq).padStart(5, '0')}`;
  }
  this.balance = this.total - this.paidAmount;
  next();
});

module.exports = mongoose.model('Bill', billSchema);
