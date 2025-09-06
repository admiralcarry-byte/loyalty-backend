const mongoose = require('mongoose');

const cashbackTransactionSchema = new mongoose.Schema({
  transaction_number: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sale: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Sale'
  },
  rule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CashbackRule'
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'paid', 'rejected'],
    default: 'pending'
  },
  payment_date: Date,
  notes: String
}, {
  timestamps: true
});

// Index is automatically created by unique: true on transaction_number field
cashbackTransactionSchema.index({ user: 1 });
cashbackTransactionSchema.index({ status: 1 });

module.exports = mongoose.model('CashbackTransaction', cashbackTransactionSchema); 