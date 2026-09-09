require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./server/models/User');

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    
    const hash = await bcrypt.hash('password123', 10);
    
    await User.findOneAndUpdate(
      { email: 'faculty@rit.edu' },
      { 
        username: 'faculty@rit.edu',
        name: 'John Doe',
        email: 'faculty@rit.edu',
        passwordHash: hash,
        role: 'faculty',
        tenantId: 'tenant-rit'
      },
      { upsert: true, new: true }
    );
    
    console.log('Faculty user seeded: faculty@rit.edu / password123');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
seed();
