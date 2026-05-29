const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/db');
const User = require('./models/User');

dotenv.config({ path: path.join(__dirname, '.env'), override: true });

const app = express();

app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/patients', require('./routes/patients'));
app.use('/api/doctors', require('./routes/doctors'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/tests', require('./routes/tests'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/bills', require('./routes/bills'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/users', require('./routes/users'));

app.get('/', (req, res) => res.json({ message: 'Pathology Lab API Running' }));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server Error', error: err.message });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  if (process.env.NODE_ENV === 'development') {
    try {
      await User.updateMany({}, { active: true });
      console.log('Development mode: reactivated all users');
    } catch (error) {
      console.error('Error reactivating users:', error.message);
    }
  }
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();
