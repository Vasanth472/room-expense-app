const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const ExpenseHistory = require('../models/ExpenseHistory');
const Setting = require('../models/Setting');
const Member = require('../models/Member');
const { verifyToken, requireAdmin } = require('../middleware/auth');

function toHistoryList(doc) {
  return {
    id: doc._id.toString(),
    resetAt: doc.resetAt,
    resetByPhone: doc.resetByPhone,
    resetByName: doc.resetByName,
    fullAmount: doc.fullAmount,
    totalExpenses: doc.totalExpenses,
    totalMembers: doc.totalMembers,
    balance: doc.balance,
    expenseCount: doc.expenseCount
  };
}

function toHistoryDetail(doc) {
  return {
    ...toHistoryList(doc),
    expenses: (doc.expenses || []).map(e => ({
      amount: e.amount,
      description: e.description,
      date: e.date,
      categoryId: e.categoryId,
      categoryName: e.categoryName,
      memberId: e.memberId,
      addedBy: e.addedBy,
      addedDate: e.addedDate
    }))
  };
}

// GET /api/expenses/history — read-only list (all authenticated users)
router.get('/history', verifyToken, async (req, res) => {
  try {
    const items = await ExpenseHistory.find({})
      .sort({ resetAt: -1 })
      .limit(100)
      .lean();
    res.json(items.map(toHistoryList));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/expenses/history/:id — read-only detail
router.get('/history/:id', verifyToken, async (req, res) => {
  try {
    const doc = await ExpenseHistory.findById(req.params.id).lean();
    if (!doc) return res.status(404).json({ error: 'History not found' });
    res.json(toHistoryDetail(doc));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/expenses/reset-all — archive all expenses + full amount, then clear (admin only)
router.post('/reset-all', verifyToken, requireAdmin, async (req, res) => {
  try {
    const expenses = await Expense.find({}).sort({ date: -1 }).lean();
    const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
    const totalMembers = await Member.countDocuments({ isActive: true });

    const fullAmountSetting = await Setting.findOne({ key: 'fullAmount' }).lean();
    const fullAmount = fullAmountSetting && typeof fullAmountSetting.value === 'number'
      ? fullAmountSetting.value
      : Number(fullAmountSetting?.value) || 0;

    const balance = fullAmount - totalExpenses;

    let resetByName = req.user.phone || 'Admin';
    try {
      const member = await Member.findById(req.user.id).lean();
      if (member?.name) resetByName = member.name;
    } catch (_) { /* ignore */ }

    const snapshots = expenses.map(e => ({
      amount: e.amount,
      description: e.description || '',
      date: e.date,
      categoryId: e.categoryId ? String(e.categoryId) : '',
      categoryName: e.categoryName || '',
      memberId: e.memberId ? String(e.memberId) : '',
      addedBy: e.addedBy || '',
      addedDate: e.addedDate
    }));

    const history = await ExpenseHistory.create({
      resetAt: new Date(),
      resetByPhone: req.user.phone || '',
      resetByName,
      fullAmount,
      totalExpenses,
      totalMembers,
      balance,
      expenseCount: expenses.length,
      expenses: snapshots
    });

    await Expense.deleteMany({});
    await Setting.findOneAndUpdate(
      { key: 'fullAmount' },
      { value: 0, updatedAt: new Date() },
      { upsert: true }
    );

    res.json({
      success: true,
      message: 'All expenses archived to history. Full amount reset to zero.',
      historyId: history._id.toString(),
      archivedCount: expenses.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
