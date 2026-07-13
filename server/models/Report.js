const mongoose = require('mongoose');
const Counter = require('./Counter');

const resultSchema = new mongoose.Schema({
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  testName: { type: String },
  testShortName: { type: String },
  sampleType: { type: String },
  category: { type: String },
  parameterName: { type: String, required: true },
  value: { type: String },
  unit: { type: String },
  normalRange: { type: String },
  type: { type: String, enum: ['numeric', 'text', 'options'], default: 'numeric' },
  options: [{ type: String }],
  rangeMin: { type: Number },
  rangeMax: { type: Number },
  flag: { type: String, enum: ['H', 'L', 'N', 'C', ''], default: '' },
}, { _id: false });

const reportSchema = new mongoose.Schema({
  reportId: { type: String, unique: true },
  appointment: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  test: { type: mongoose.Schema.Types.ObjectId, ref: 'Test' },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  results: [resultSchema],
  remarks: { type: String },
  status: {
    type: String,
    enum: ['pending', 'entered', 'verified', 'delivered'],
    default: 'pending',
  },
  enteredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reportDate: { type: Date, default: Date.now },
  verifiedAt: { type: Date },
  deliveredAt: { type: Date },
}, { timestamps: true });

reportSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'reportId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.reportId = `RPT-${String(counter.seq).padStart(6, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Report', reportSchema);
