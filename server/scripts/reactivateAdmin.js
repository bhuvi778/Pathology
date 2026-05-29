const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });

const User = require('../models/User');

(async function(){
  try{
    const uri = process.env.MONGO_URI;
    if(!uri) { console.error('MONGO_URI not set'); process.exit(1); }
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to DB');
    const email = 'admin@dhanvantarilab.in';
    const user = await User.findOneAndUpdate({ email }, { active: true }, { new: true });
    if(!user) {
      console.error('Admin user not found');
      process.exit(1);
    }
    console.log('Reactivated user:', user.email, 'active=', user.active);
    process.exit(0);
  } catch(err){
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
