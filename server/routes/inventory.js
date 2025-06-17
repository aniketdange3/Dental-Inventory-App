const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');

// Fetch all inventory items
router.get('/', async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    console.error('Error fetching inventory:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch inventory items', error: err.message });
  }
});

// Add an inventory item
router.post('/', async (req, res) => {
  try {
    const {
      name,
      quantity,
      supplier,
      purchaseDate,
      expiryDate,
      lowStockThreshold,
    } = req.body;

    if (!name || quantity === undefined) {
      return res
        .status(400)
        .json({ message: 'Name and quantity are required' });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const itemData = {
      name,
      quantity,
      supplier: supplier || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      lowStockThreshold: lowStockThreshold || 10,
    };

    if (expiryDate) {
      itemData.expiryDate = new Date(expiryDate);
    }

    const item = new Inventory(itemData);
    await item.save();

    res
      .status(201)
      .json({ message: 'Inventory item added successfully', item });
  } catch (err) {
    console.error('Error adding inventory item:', err);
    res
      .status(500)
      .json({ message: 'Failed to add inventory item', error: err.message });
  }
});

// Fetch a single inventory item by ID
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json(item);
  } catch (err) {
    console.error('Error fetching inventory item:', err);
    res
      .status(500)
      .json({ message: 'Failed to fetch inventory item', error: err.message });
  }
});

// Update an inventory item by ID
router.put('/:id', async (req, res) => {
  try {
    const {
      name,
      quantity,
      supplier,
      purchaseDate,
      expiryDate,
      lowStockThreshold,
    } = req.body;

    if (!name || quantity === undefined) {
      return res
        .status(400)
        .json({ message: 'Name and quantity are required' });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: 'Quantity cannot be negative' });
    }

    const updateData = {
      name,
      quantity,
      supplier: supplier || '',
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      lowStockThreshold: lowStockThreshold || 10,
    };

    // Only update expiryDate if it's provided
    if (expiryDate) {
      updateData.expiryDate = new Date(expiryDate);
    }

    const item = await Inventory.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
    });

    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }

    res.json({ message: 'Inventory item updated successfully', item });
  } catch (err) {
    console.error('Error updating inventory item:', err);
    res
      .status(500)
      .json({ message: 'Failed to update inventory item', error: err.message });
  }
});

// Delete an inventory item by ID
router.delete('/:id', async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) {
      return res.status(404).json({ message: 'Inventory item not found' });
    }
    res.json({ message: 'Inventory item deleted successfully' });
  } catch (err) {
    console.error('Error deleting inventory item:', err);
    res
      .status(500)
      .json({ message: 'Failed to delete inventory item', error: err.message });
  }
});

module.exports = router;
