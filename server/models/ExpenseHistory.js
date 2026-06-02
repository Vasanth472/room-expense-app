const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ExpenseSnapshotSchema = new Schema({
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  date: { type: Date, required: true },
  categoryId: { type: String },
  categoryName: { type: String, default: '' },
  memberId: { type: String },
  addedBy: { type: String, default: '' },
  addedDate: { type: Date }
}, { _id: false });

const ExpenseHistorySchema = new Schema({
  resetAt: { type: Date, default: Date.now, index: true },
  resetByPhone: { type: String, default: '' },
  resetByName: { type: String, default: '' },
  fullAmount: { type: Number, default: 0 },
  totalExpenses: { type: Number, default: 0 },
  totalMembers: { type: Number, default: 0 },
  balance: { type: Number, default: 0 },
  expenseCount: { type: Number, default: 0 },
  expenses: { type: [ExpenseSnapshotSchema], default: [] }
});

module.exports = mongoose.model('ExpenseHistory', ExpenseHistorySchema);
