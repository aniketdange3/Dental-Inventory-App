const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema({
  category: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  description: { type: String }
});

// Virtual to convert _id to id
expenseSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// Ensure virtual fields are serialized
expenseSchema.set('toJSON', {
  virtuals: true
});

module.exports = mongoose.model("Expense", expenseSchema);
