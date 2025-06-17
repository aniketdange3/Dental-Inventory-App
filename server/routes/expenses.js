const express = require("express");
const router = express.Router();
const Expense = require("../models/Expense");

// Fetch all expenses
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all expenses");
    const expenses = await Expense.find();
    console.log(`Found ${expenses.length} expenses`);
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add an expense
router.post("/", async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    console.log("Received expense data:", req.body);

    if (!category || !amount) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Category and amount are required" });
    }
    if (amount <= 0) {
      console.log("Validation failed: Non-positive amount");
      return res.status(400).json({ message: "Amount must be positive" });
    }
    if (!["Consumables", "Equipment", "Salaries", "Maintenance"].includes(category)) {
      console.log("Validation failed: Invalid category");
      return res.status(400).json({ message: "Invalid category" });
    }

    const expense = new Expense({
      category,
      amount,
      date: date ? new Date(date) : Date.now(),
      description: description || "",
    });

    await expense.save();
    console.log("Expense saved successfully:", expense._id);
    res.status(201).json({ message: "Expense added successfully", expense });
  } catch (err) {
    console.error("Error adding expense:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Fetch a single expense by ID
router.get("/:id", async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      console.log("Expense not found");
      return res.status(404).json({ message: "Expense not found" });
    }
    console.log("Found expense:", expense._id);
    res.json(expense);
  } catch (err) {
    console.error("Error fetching expense:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update an expense by ID
router.put("/:id", async (req, res) => {
  try {
    const { category, amount, date, description } = req.body;
    console.log("Updating expense with ID:", req.params.id);

    if (!category || !amount) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Category and amount are required" });
    }
    if (amount <= 0) {
      console.log("Validation failed: Non-positive amount");
      return res.status(400).json({ message: "Amount must be positive" });
    }
    if (!["Consumables", "Equipment", "Salaries", "Maintenance"].includes(category)) {
      console.log("Validation failed: Invalid category");
      return res.status(400).json({ message: "Invalid category" });
    }

    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      {
        category,
        amount,
        date: date ? new Date(date) : Date.now(),
        description: description || "",
      },
      { new: true }
    );

    if (!expense) {
      console.log("Expense not found");
      return res.status(404).json({ message: "Expense not found" });
    }

    console.log("Expense updated successfully:", expense._id);
    res.json({ message: "Expense updated successfully", expense });
  } catch (err) {
    console.error("Error updating expense:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete an expense by ID
router.delete("/:id", async (req, res) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) {
      console.log("Expense not found");
      return res.status(404).json({ message: "Expense not found" });
    }
    console.log("Expense deleted successfully:", expense._id);
    res.json({ message: "Expense deleted successfully" });
  } catch (err) {
    console.error("Error deleting expense:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;
