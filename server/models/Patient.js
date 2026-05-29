const mongoose = require('mongoose');
const Counter = require('./Counter');

const patientSchema = new mongoose.Schema({
  patientId: { type: String, unique: true },
  name: { type: String, required: true, trim: true },
  age: { type: Number, required: true },
  ageUnit: { type: String, enum: ['years', 'months', 'days'], default: 'years' },
  gender: { type: String, enum: ['male', 'female', 'other'], required: true },
  phone: { type: String, required: true },
  email: { type: String, lowercase: true },
  address: { type: String },
  cnic: { type: String },
  bloodGroup: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] },
  referredBy: { type: String },
  medicalHistory: { type: String },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

patientSchema.pre('save', async function (next) {
  if (this.isNew) {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'patientId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    this.patientId = `PT-${String(counter.seq).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Patient', patientSchema);
