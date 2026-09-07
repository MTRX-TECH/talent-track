const mongoose = require('mongoose');
const dataService = require('./services/dataService');
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb://localhost:27017/talenttrack').then(async () => {
  const username = 'founder@MTRX_TECH';
  const password = 'superadmin123';
  
  let user = await dataService.findOne('users', {
    $or: [
      { username: username.trim() },
      { email: username.trim().toLowerCase() }
    ],
    role: 'superadmin',
    bypassTenantScope: true
  });
  
  if (!user) {
    user = await dataService.findOne('users', {
      $or: [
        { username: username.trim() },
        { email: username.trim().toLowerCase() }
      ],
      bypassTenantScope: true
    });
  }
  
  if (!user) {
    console.log("No user found");
    process.exit();
  }
  
  console.log("User found:", user.username, "Role:", user.role, "Tenant:", user.tenantId);
  
  let isMatch = false;
  if (user.passwordHash) {
    isMatch = bcrypt.compareSync(password, user.passwordHash);
  }
  
  console.log("Password match:", isMatch);
  
  // Is it hitting activeTenant pending_deletion?
  if (user.role !== 'superadmin') {
    const activeTenant = await dataService.findOne('tenants', { slug: user.tenantId, bypassTenantScope: true });
    if (activeTenant && activeTenant.subscription && activeTenant.subscription.status === 'pending_deletion') {
      console.log("Pending deletion blocked");
    }
  }
  
  if (!user.isActive) {
    console.log("User not active");
  }
  
  process.exit();
});
