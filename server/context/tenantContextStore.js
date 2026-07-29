const { AsyncLocalStorage } = require('async_hooks');

const tenantStorage = new AsyncLocalStorage();

const getTenantContext = () => {
  return tenantStorage.getStore();
};

const runWithTenantContext = (context, callback) => {
  return tenantStorage.run(context, callback);
};

module.exports = {
  tenantStorage,
  getTenantContext,
  runWithTenantContext
};
