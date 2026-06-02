const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const Member = require('../models/Member');
const PasswordResetRequest = require('../models/PasswordResetRequest');
const Setting = require('../models/Setting');
const { verifyToken, requireAdmin } = require('../middleware/auth');

async function getAdminContactPhone() {
  const s = await Setting.findOne({ key: 'adminContactPhone' }).lean();
  if (s && s.value) return String(s.value);
  const admin = await Member.findOne({ isAdmin: true, isActive: true }).sort({ addedDate: 1 }).lean();
  return admin ? admin.phone : '';
}

function toSafeRequest(doc) {
  return {
    id: doc._id.toString(),
    memberId: doc.memberId?.toString?.() || String(doc.memberId),
    memberName: doc.memberName,
    phone: doc.phone,
    message: doc.message || '',
    status: doc.status,
    requestedAt: doc.requestedAt,
    resolvedAt: doc.resolvedAt || null
  };
}

// POST /api/auth/forgot-password — public reset request (notifies admin queue)
router.post('/forgot-password', async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !/^\d{10}$/.test(String(phone).trim())) {
    return res.status(400).json({ error: 'Valid 10-digit phone number required' });
  }
  const trimmedPhone = String(phone).trim();
  const note = (message || '').trim().slice(0, 500);

  try {
    const member = await Member.findOne({ phone: trimmedPhone, isActive: true }).lean();
    if (!member) {
      return res.status(404).json({
        error: 'Phone number not registered. Contact the group admin to join.',
        code: 'MEMBER_NOT_FOUND'
      });
    }

    const existing = await PasswordResetRequest.findOne({
      phone: trimmedPhone,
      status: 'pending'
    });

    let requestDoc;
    if (existing) {
      existing.requestedAt = new Date();
      if (note) existing.message = note;
      await existing.save();
      requestDoc = existing;
    } else {
      requestDoc = await PasswordResetRequest.create({
        memberId: member._id,
        memberName: member.name,
        phone: trimmedPhone,
        message: note,
        status: 'pending'
      });
    }

    const adminContactPhone = await getAdminContactPhone();
    return res.json({
      success: true,
      message: 'Your reset request was sent to the admin. They will set a new password for you shortly.',
      requestId: requestDoc._id.toString(),
      adminContactPhone
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/auth/password-reset-requests — admin: list requests (default pending)
router.get('/password-reset-requests', verifyToken, requireAdmin, async (req, res) => {
  const status = req.query.status || 'pending';
  try {
    const filter = status === 'all' ? {} : { status };
    const items = await PasswordResetRequest.find(filter)
      .sort({ requestedAt: -1 })
      .limit(50)
      .lean();
    res.json(items.map(toSafeRequest));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH /api/auth/password-reset-requests/:id — admin approve (set password) or reject
router.patch('/password-reset-requests/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { action, password } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'action must be approve or reject' });
  }

  try {
    const requestDoc = await PasswordResetRequest.findById(id);
    if (!requestDoc) return res.status(404).json({ error: 'Request not found' });
    if (requestDoc.status !== 'pending') {
      return res.status(400).json({ error: 'This request was already handled' });
    }

    if (action === 'reject') {
      requestDoc.status = 'rejected';
      requestDoc.resolvedAt = new Date();
      requestDoc.resolvedBy = req.user.id;
      await requestDoc.save();
      return res.json({ success: true, request: toSafeRequest(requestDoc) });
    }

    const newPassword = (password || '').trim();
    if (newPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const member = await Member.findById(requestDoc.memberId);
    if (!member) return res.status(404).json({ error: 'Member not found' });

    member.passwordHash = await bcrypt.hash(newPassword, 10);
    await member.save();

    requestDoc.status = 'resolved';
    requestDoc.resolvedAt = new Date();
    requestDoc.resolvedBy = req.user.id;
    await requestDoc.save();

    return res.json({
      success: true,
      message: 'Password updated. Tell the member their new password securely.',
      request: toSafeRequest(requestDoc)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
