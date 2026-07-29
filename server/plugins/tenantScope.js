const mongoose = require('mongoose');
const { getTenantContext } = require('../context/tenantContextStore');

module.exports = function tenantScopePlugin(schema, options = {}) {
  // Ensure schema includes tenantId field if not present
  if (!schema.path('tenantId')) {
    schema.add({ tenantId: { type: String, required: true, index: true } });
  }

  const queryHooks = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'updateOne',
    'updateMany',
    'deleteOne',
    'deleteMany',
    'countDocuments',
    'distinct'
  ];

  queryHooks.forEach(hook => {
    schema.pre(hook, function (next) {
      const context = getTenantContext();
      const queryFilter = this.getFilter() || {};

      const isRoleScopeBypassed = queryFilter.bypassRoleScope || (this.options && this.options.bypassRoleScope);
      const isTenantScopeBypassed = queryFilter.bypassTenantScope || (this.options && this.options.bypassTenantScope);

      // Clean up special plugin directives from Mongoose query filter so MongoDB doesn't query them as literal fields
      delete queryFilter.bypassRoleScope;
      delete queryFilter.bypassTenantScope;
      if (this._conditions) {
        delete this._conditions.bypassRoleScope;
        delete this._conditions.bypassTenantScope;
      }

      // Explicit bypass option for system/seeder tasks
      if (isTenantScopeBypassed) {
        return next();
      }

      if (!context) {
        // Fallback: If query runs outside HTTP request lifecycle (e.g., startup/seeder), allow if bypass option passed
        if (options.allowUnscopedOutsideContext) {
          return next();
        }
        return next(new Error('[SECURITY GUARD] Tenant isolation failure: Database query executed without active tenant context.'));
      }

      // If global scope (e.g., superadmin cross-tenant view), do not restrict unless requested
      if (context.isGlobal && !context.tenantId) {
        return next();
      }

      if (context.tenantId) {
        this.where({ tenantId: context.tenantId });
      } else {
        return next(new Error('[SECURITY GUARD] Tenant isolation failure: Tenant context missing tenantId property.'));
      }

      // ---------------------------------------------------------
      // User-Level Isolation
      // ---------------------------------------------------------
      if (context.user && !context.isGlobal && !isRoleScopeBypassed) {
        const role = context.user.role;
        const modelName = this.model ? this.model.modelName : '';

        // Models that are student-specific
        const studentScopedModels = ['Milestone', 'Goal', 'Notification', 'AssessmentAttempt', 'PlacementApplication', 'Offer'];
        
        if (role === 'admin' || role === 'superadmin') {
          // Admins see everything within the tenant
        } else if (role === 'student') {
          if (studentScopedModels.includes(modelName)) {
            if (modelName === 'Notification') {
              this.where({ userId: context.user.id });
            } else {
              this.where({ studentId: context.user.id });
            }
          } else if (modelName === 'User') {
            this.where({ _id: context.user.id });
          }
        } else if (role === 'mentor') {
          // Async lookup mentees to prevent them from seeing other mentor's mentees
          return mongoose.model('User').find({ assignedMentorId: context.user.id }, null, { bypassRoleScope: true })
            .select('_id')
            .then(mentees => {
              const menteeIds = mentees.map(m => m._id);
              if (studentScopedModels.includes(modelName)) {
                this.where({ studentId: { $in: menteeIds } });
              } else if (modelName === 'User') {
                // Mentors can see themselves and their mentees
                this.where({ _id: { $in: [...menteeIds, context.user.id] } });
              }
              next();
            })
            .catch(next);
        } else if (role === 'parent') {
          const parentQuery = {
            $or: [
              { parentId: context.user.id },
              { parentUserId: context.user.id }
            ]
          };
          if (context.user.studentId) {
            parentQuery.$or.push({ _id: context.user.studentId });
          }
          return mongoose.model('User').find(parentQuery, null, { bypassRoleScope: true })
            .select('_id')
            .then(children => {
              const childIds = children.map(m => m._id);
              if (context.user.studentId && !childIds.some(id => String(id) === String(context.user.studentId))) {
                childIds.push(context.user.studentId);
              }
              if (studentScopedModels.includes(modelName)) {
                this.where({ studentId: { $in: childIds } });
              } else if (modelName === 'User') {
                this.where({ _id: { $in: [...childIds, context.user.id] } });
              }
              next();
            })
            .catch(next);
        } else if (role === 'hod') {
          if (context.user.departmentId) {
             return mongoose.model('User').find({ departmentId: context.user.departmentId }, null, { bypassRoleScope: true })
               .select('_id')
               .then(deptUsers => {
                  const deptIds = deptUsers.map(u => u._id);
                  if (studentScopedModels.includes(modelName)) {
                    this.where({ studentId: { $in: deptIds } });
                  } else if (modelName === 'User') {
                    this.where({ departmentId: context.user.departmentId });
                  }
                  next();
               })
               .catch(next);
          }
        }
      }

      next();
    });
  });

  // Aggregation Hook Isolation
  schema.pre('aggregate', function (next) {
    const context = getTenantContext();
    const pipeline = this.pipeline();

    if (context && context.tenantId && !context.bypassTenantScope) {
      pipeline.unshift({ $match: { tenantId: context.tenantId } });
    }
    next();
  });
};
