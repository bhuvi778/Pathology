const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const User = require('../models/User');
const Patient = require('../models/Patient');
const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Report = require('../models/Report');
const Bill = require('../models/Bill');
const Test = require('../models/Test');
const LabSettings = require('../models/LabSettings');
const Counter = require('../models/Counter');

(async function cleanDbKeepLatestAdmin() {
  try {
    const uri = process.env.MONGO_URI || process.argv[2];
    if (!uri) {
      console.error('MONGO_URI not set. Provide it via environment or as first argument.');
      process.exit(1);
    }

    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    console.log('Connected to DB');

    const latestAdmin = await User.findOne({ role: 'admin' }).sort({ createdAt: -1 });
    if (!latestAdmin) {
      console.error('No admin user found. Cleanup aborted to avoid lockout.');
      process.exit(1);
    }

    const keepAdminId = latestAdmin._id;
    console.log(`Keeping admin: ${latestAdmin.email || latestAdmin.name} (${keepAdminId})`);

    const operations = [
      { name: 'patients', exec: () => Patient.deleteMany({}) },
      { name: 'doctors', exec: () => Doctor.deleteMany({}) },
      { name: 'appointments', exec: () => Appointment.deleteMany({}) },
      { name: 'reports', exec: () => Report.deleteMany({}) },
      { name: 'bills', exec: () => Bill.deleteMany({}) },
      { name: 'tests', exec: () => Test.deleteMany({}) },
      { name: 'labSettings', exec: () => LabSettings.deleteMany({}) },
      { name: 'counters', exec: () => Counter.deleteMany({}) },
      {
        name: 'users(except-latest-admin)',
        exec: () => User.deleteMany({ _id: { $ne: keepAdminId } }),
      },
    ];

    for (const op of operations) {
      const result = await op.exec();
      console.log(`${op.name}: deleted ${result.deletedCount || 0}`);
    }

    console.log('Database cleanup complete. Latest admin preserved.');
    process.exit(0);
  } catch (error) {
    console.error('Cleanup error:', error.message);
    process.exit(1);
  }
})();
