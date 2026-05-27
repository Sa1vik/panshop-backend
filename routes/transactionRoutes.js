const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/customer/:customerId', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const customer = await Customer.findOne({ _id: req.params.customerId, owner: req.user._id });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setDate(end.getDate() + 1);
        dateFilter.date.$lte = end;
      }
    }

    const transactions = await Transaction.find({
      customer: req.params.customerId,
      owner: req.user._id,
      ...dateFilter,
    }).sort({ date: -1 });

    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

router.post('/purchase', async (req, res) => {
  try {
    const { customerId, amount, description } = req.body;
    if (!customerId || !amount) return res.status(400).json({ message: 'Customer ID and amount are required' });
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const customer = await Customer.findOne({ _id: customerId, owner: req.user._id, isActive: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    const newPending = customer.pendingAmount + Number(amount);

    const transaction = await Transaction.create({
      owner: req.user._id, customer: customerId,
      type: 'purchase', amount: Number(amount),
      description: description || '', balanceAfter: newPending,
    });

    await Customer.findByIdAndUpdate(customerId, {
      $inc: { pendingAmount: Number(amount), totalPurchases: Number(amount) },
    });

    const updatedCustomer = await Customer.findById(customerId);
    res.status(201).json({ transaction, customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ message: 'Error adding purchase' });
  }
});

router.post('/payment', async (req, res) => {
  try {
    const { customerId, amount, note } = req.body;
    if (!customerId || !amount) return res.status(400).json({ message: 'Customer ID and amount are required' });
    if (amount <= 0) return res.status(400).json({ message: 'Amount must be greater than 0' });

    const customer = await Customer.findOne({ _id: customerId, owner: req.user._id, isActive: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    if (Number(amount) > customer.pendingAmount)
      return res.status(400).json({ message: `Payment cannot exceed pending amount ₹${customer.pendingAmount}` });

    const newPending = customer.pendingAmount - Number(amount);

    const transaction = await Transaction.create({
      owner: req.user._id, customer: customerId,
      type: 'payment', amount: Number(amount),
      note: note || '', balanceAfter: newPending,
    });

    await Customer.findByIdAndUpdate(customerId, {
      $inc: { pendingAmount: -Number(amount), totalPaid: Number(amount) },
    });

    const updatedCustomer = await Customer.findById(customerId);
    res.status(201).json({ transaction, customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ message: 'Error adding payment' });
  }
});

router.get('/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const transactions = await Transaction.find({ owner: req.user._id })
      .sort({ date: -1 }).limit(limit).populate('customer', 'name phone');
    res.json(transactions);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, owner: req.user._id });
    if (!transaction) return res.status(404).json({ message: 'Transaction not found' });

    if (transaction.type === 'purchase') {
      await Customer.findByIdAndUpdate(transaction.customer, {
        $inc: { pendingAmount: -transaction.amount, totalPurchases: -transaction.amount },
      });
    } else {
      await Customer.findByIdAndUpdate(transaction.customer, {
        $inc: { pendingAmount: transaction.amount, totalPaid: -transaction.amount },
      });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    const updatedCustomer = await Customer.findById(transaction.customer);
    res.json({ message: 'Transaction deleted', customer: updatedCustomer });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting transaction' });
  }
});

module.exports = router;
