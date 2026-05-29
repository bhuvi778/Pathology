const mongoose = require('mongoose');

const labSettingsSchema = new mongoose.Schema({
  labName: { type: String, default: 'City Pathology Laboratory' },
  labAddress: { type: String, default: '123 Main Street, City' },
  labPhone: { type: String, default: '+91-98765-43210' },
  labEmail: { type: String, default: 'lab@example.com' },
  labLogo: { type: String },
  reportHeader: { type: String },
  reportFooter: { type: String, default: 'Thank you for choosing our laboratory.' },
  doctorSignature: { type: String },
  labDirector: { type: String, default: 'Dr. Lab Director' },
  labDirectorQualification: { type: String, default: 'MBBS, FCPS (Pathology)' },
  registrationNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LabSettings', labSettingsSchema);
