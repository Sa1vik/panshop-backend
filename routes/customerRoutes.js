const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { search } = req.query;
    let query = { owner: req.user._id, isActive: true };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }
    const customers = await Customer.find(query).sort({ pendingAmount: -1, name: 1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customers' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOne({ _id: req.params.id, owner: req.user._id, isActive: true });
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching customer' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    if (!name) return res.status(400).json({ message: 'Customer name is required' });
    const customer = await Customer.create({ owner: req.user._id, name, phone: phone || '', address: address || '' });
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error creating customer' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { name, phone, address } = req.body;
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { name, phone, address },
      { new: true, runValidators: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch (err) {
    res.status(500).json({ message: 'Error updating customer' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findOneAndUpdate(
      { _id: req.params.id, owner: req.user._id },
      { isActive: false },
      { new: true }
    );
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting customer' });
  }
});

module.exports = router;
