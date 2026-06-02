const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PasswordResetRequestSchema = new Schema({
  memberId: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  memberName: { type: String, required: true },
  phone: { type: String, required: true },
  message: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
  requestedAt: { type: Date, default: Date.now },
  resolvedAt: { type: Date },
  resolvedBy: { type: Schema.Types.ObjectId, ref: 'Member' }
});

PasswordResetRequestSchema.index({ phone: 1, status: 1 });

module.exports = mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
