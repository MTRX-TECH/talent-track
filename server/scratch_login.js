const mongoose = require('mongoose');
const dataService = require('./services/dataService');

mongoose.connect('mongodb://localhost:27017/talenttrack').then(async () => {
  const user = await dataService.findOne('users', { 
    $or: [{username: 'founder@MTRX_TECH'}, {email: 'founder@MTRX_TECH'}], 
    role: 'superadmin', 
    bypassTenantScope: true 
  });
  console.log(user);
  process.exit();
});
