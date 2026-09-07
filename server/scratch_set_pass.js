const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/talenttrack').then(async () => {
  const hash = bcrypt.hashSync('superadmin123', 10);
  await User.updateOne({username: 'founder@MTRX_TECH'}, {passwordHash: hash});
  
  const user = await User.findOne({username: 'founder@MTRX_TECH'});
  const match = bcrypt.compareSync('superadmin123', user.passwordHash);
  
  console.log("Hash in DB:", user.passwordHash);
  console.log("Match:", match);
  process.exit();
});
