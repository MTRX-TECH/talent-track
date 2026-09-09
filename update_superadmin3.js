require('dotenv').config({ path: '.env' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function run() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to', uri);
    await mongoose.connect(uri);
    
    // Change password to 'password123' as requested before and email to marapathranv@gmail.com
    const hash = await bcrypt.hash('password123', 10);
    
    const result = await mongoose.connection.collection('users').updateOne(
      { role: 'superadmin' },
      { $set: { 
          email: 'marapathranv@gmail.com', 
          username: 'marapathranv@gmail.com', 
          passwordHash: hash 
        } 
      }
    );
    console.log('Update result:', result);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
