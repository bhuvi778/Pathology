const mongoose = require('mongoose');
const Counter = require('./Counter');

const appointmentSchema = new mongoose.Schema({
  appointmentId: { type: String, unique: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor' },
  tests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Test' }],
  appointmentDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['pending', 'sample_collected', 'processing', 'completed', 'cancelled'],
    default: 'pending',
  },
  priority: { type: String, enum: ['normal', 'urgent'], default: 'normal' },
  notes: { type: String },
  referredBy: { type: String },
  sampleCollectedAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

appointmentSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'appointmentId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.appointmentId = `APT-${String(counter.seq).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
