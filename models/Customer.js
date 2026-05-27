const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, trim: true, default: '' },
  address: { type: String, trim: true, default: '' },
  pendingAmount: { type: Number, default: 0 },
  totalPurchases: { type: Number, default: 0 },
  totalPaid: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);