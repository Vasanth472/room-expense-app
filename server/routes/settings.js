const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// GET /api/settings/full-amount
router.get('/full-amount', verifyToken, async (req, res) => {
  try {
    const s = await Setting.findOne({ key: 'fullAmount' }).lean();
    const val = s && typeof s.value === 'number' ? s.value : 0;
    res.json({ fullAmount: val });
  } catch (err) {
    console.error('Failed to get fullAmount setting', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/settings/admin-contact — public (for forgot-password screen)
router.get('/admin-contact', async (req, res) => {
  try {
    const s = await Setting.findOne({ key: 'adminContactPhone' }).lean();
    let phone = s && s.value ? String(s.value) : '';
    if (!phone) {
      const Member = require('../models/Member');
      const admin = await Member.findOne({ isAdmin: true, isActive: true }).sort({ addedDate: 1 }).lean();
      phone = admin ? admin.phone : '';
    }
    res.json({ adminContactPhone: phone });
  } catch (err) {
    console.error('Failed to get admin contact', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/admin-contact - admin only
router.put('/admin-contact', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { adminContactPhone } = req.body;
    const phone = String(adminContactPhone || '').replace(/\D/g, '').slice(0, 10);
    if (phone.length !== 10) {
      return res.status(400).json({ error: 'Valid 10-digit admin contact phone required' });
    }
    await Setting.findOneAndUpdate(
      { key: 'adminContactPhone' },
      { value: phone, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ adminContactPhone: phone });
  } catch (err) {
    console.error('Failed to set admin contact', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/settings/full-amount - admin only
router.put('/full-amount', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { fullAmount } = req.body;
    const parsed = Number(fullAmount) || 0;
    const updated = await Setting.findOneAndUpdate(
      { key: 'fullAmount' },
      { value: parsed, updatedAt: new Date() },
      { upsert: true, new: true }
    ).lean();
    res.json({ fullAmount: parsed });
  } catch (err) {
    console.error('Failed to set fullAmount', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
