const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
  type: { type: String, enum: ['purchase', 'payment'], required: true },
  amount: { type: Number, required: true, min: 1 },
  description: { type: String, trim: true, default: '' },
  balanceAfter: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  note: { type: String, trim: true, default: '' },
}, { timestamps: true });

transactionSchema.index({ customer: 1, date: -1 });

module.exports = mongoose.model('Transaction', transactionSchema);