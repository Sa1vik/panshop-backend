const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const Transaction = require('../models/Transaction');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/stats', async (req, res) => {
  try {
    const ownerId = req.user._id;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalCustomers, customersWithPending, todayPurchases, todayPayments, allTimeStats, recentTransactions] =
      await Promise.all([
        Customer.countDocuments({ owner: ownerId, isActive: true }),
        Customer.countDocuments({ owner: ownerId, isActive: true, pendingAmount: { $gt: 0 } }),
        Transaction.aggregate([{ $match: { owner: ownerId, type: 'purchase', date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Transaction.aggregate([{ $match: { owner: ownerId, type: 'payment', date: { $gte: todayStart } } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
        Customer.aggregate([{ $match: { owner: ownerId, isActive: true } }, { $group: { _id: null, totalPending: { $sum: '$pendingAmount' }, totalLifetimeSales: { $sum: '$totalPurchases' }, totalLifetimePaid: { $sum: '$totalPaid' } } }]),
        Transaction.find({ owner: ownerId }).sort({ date: -1 }).limit(8).populate('customer', 'name'),
      ]);

    const stats = allTimeStats[0] || {};
    res.json({
      totalCustomers,
      customersWithPending,
      totalPendingAmount: stats.totalPending || 0,
      totalLifetimeSales: stats.totalLifetimeSales || 0,
      totalLifetimePaid: stats.totalLifetimePaid || 0,
      todaySales: todayPurchases[0]?.total || 0,
      todayPayments: todayPayments[0]?.total || 0,
      recentTransactions,
    });
  } catch (err) {
    res.status(500).json({ message: 'Error fetching stats' });
  }
});

module.exports = router;
