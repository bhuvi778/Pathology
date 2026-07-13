const mongoose = require('mongoose');

const labSettingsSchema = new mongoose.Schema({
  labName: { type: String, default: '' },
  labAddress: { type: String, default: '' },
  labPhone: { type: String, default: '' },
  labEmail: { type: String, default: '' },
  labLogo: { type: String },
  reportHeader: { type: String, default: '' },
  reportFooter: { type: String, default: '' },
  doctorSignature: { type: String },
  includeHeader: { type: Boolean, default: true },
  includeFooter: { type: Boolean, default: true },
  autoPrint: { type: Boolean, default: false },
  reportLayout: { type: String, enum: ['standard', 'compact'], default: 'standard' },
  autoIpNumber: { type: Boolean, default: true },
  ipNumberPrefix: { type: String, default: 'IP-' },
  labDirector: { type: String, default: '' },
  labDirectorQualification: { type: String, default: '' },
  registrationNumber: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('LabSettings', labSettingsSchema);
