const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    tenantId: { type: String, required: true, default: 'TNT_GLOBAL', index: true },
    institutionId: { type: String, required: true, default: 'INST_GLOBAL', index: true },
    customId: { type: String, unique: true }, // Legacy compatible ID
    name: { type: String, required: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String, lowercase: true, trim: true, default: '' },
    mobile: { type: String, default: '' },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'hod', 'faculty', 'mentor', 'student', 'parent'],
      required: true,
      index: true,
    },
    domain: { type: String, default: '' }, // Class or Department name
    departmentId: { type: String, default: '' },
    mentorId: { type: String, default: '' },
    isSuspended: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'disabled'], default: 'active', index: true },
    lastLogin: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ tenantId: 1, role: 1 });
userSchema.index({ tenantId: 1, username: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  obj.id = obj.customId || obj._id.toString();
  delete obj.password;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
