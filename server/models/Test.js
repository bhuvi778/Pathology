const mongoose = require('mongoose');

const parameterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unit: { type: String },
  normalRange: {
    male: { min: Number, max: Number, text: String },
    female: { min: Number, max: Number, text: String },
    general: { min: Number, max: Number, text: String },
  },
  type: { type: String, enum: ['numeric', 'text', 'options'], default: 'numeric' },
  options: [String],
}, { _id: false });

const testSchema = new mongoose.Schema({
  name: { type: String, required: true },
  shortName: { type: String, required: true },
  category: {
    type: String,
    enum: [
      'hematology', 'biochemistry', 'serology', 'urology',
      'microbiology', 'hormones', 'radiology', 'cardiology', 'other'
    ],
    required: true,
  },
  price: { type: Number, required: true },
  turnaroundTime: { type: String, default: '24 hours' },
  sampleType: { type: String, default: 'Blood' },
  parameters: [parameterSchema],
  description: { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
