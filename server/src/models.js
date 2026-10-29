import mongoose from 'mongoose';
const { Schema } = mongoose;
const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  emailVerified: { type: Boolean, default: false }, disabled: { type: Boolean, default: false },
  authVersion: { type: Number, default: 0, select: false },
  resetHash: { type: String, select: false }, resetExpires: { type: Date, select: false },
  verifyHash: { type: String, select: false }, verifyExpires: { type: Date, select: false }
}, { timestamps: true, strict: 'throw' });
userSchema.index({ resetHash: 1 }, { sparse: true });
userSchema.index({ verifyHash: 1 }, { sparse: true });
export const User = mongoose.model('User', userSchema);
export const Session = mongoose.model('Session', new Schema({
  tokenHash: { type: String, required: true, unique: true }, csrf: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true }, authVersion: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, expires: 0 }
}, { timestamps: true, strict: 'throw' }));
export const RateBucket = mongoose.model('RateBucket', new Schema({
  _id: String, count: { type: Number, default: 0 }, expiresAt: { type: Date, required: true, expires: 0 }
}, { versionKey: false }));
