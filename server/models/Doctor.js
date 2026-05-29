const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  specialty: { type: String, required: true },
  qualifications: { type: String },
  phone: { type: String },
  email: { type: String, lowercase: true },
  consultationFee: { type: Number, default: 0 },
  pmcNumber: { type: String },
  signature: { type: String },
  active: { type: Boolean, default: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
