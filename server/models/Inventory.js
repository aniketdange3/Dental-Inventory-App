const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  supplier: { type: String, default: '' },
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: { type: Date },
  lowStockThreshold: { type: Number, default: 5 },
});

module.exports = mongoose.model('Inventory', inventorySchema);
