const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Patient = require("../models/Patient");

// Get all patients
router.get("/", async (req, res) => {
  try {
    console.log("Fetching all patients");
    const patients = await Patient.find();
    console.log(`Found ${patients.length} patients`);
    res.json(patients);
  } catch (err) {
    console.error("Error fetching patients:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Add a patient
router.post("/", async (req, res) => {
  try {
    const { name, contact, age, gender, medicalHistory, treatmentRecords, appointments } = req.body;
    console.log("Received patient data:", req.body);

    if (!name || !contact || !age || !gender) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Name, contact, age, and gender are required" });
    }
    if (!["Male", "Female", "Other"].includes(gender)) {
      console.log("Validation failed: Invalid gender");
      return res.status(400).json({ message: "Invalid gender" });
    }

    const patient = new Patient({
      name,
      contact,
      age,
      gender,
      medicalHistory: medicalHistory || "",
      treatmentRecords: treatmentRecords || [],
      appointments: appointments || [],
    });

    await patient.save();
    console.log("Patient saved successfully:", patient._id);
    res.status(201).json({ message: "Patient added successfully", patient });
  } catch (err) {
    console.error("Error adding patient:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Update a patient
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, contact, age, gender, medicalHistory, treatmentRecords, appointments } = req.body;
    console.log(`Updating patient ${id} with data:`, req.body);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid patient ID: ${id}`);
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    if (!name || !contact || !age || !gender) {
      console.log("Validation failed: Missing required fields");
      return res.status(400).json({ message: "Name, contact, age, and gender are required" });
    }
    if (!["Male", "Female", "Other"].includes(gender)) {
      console.log("Validation failed: Invalid gender");
      return res.status(400).json({ message: "Invalid gender" });
    }

    const patient = await Patient.findByIdAndUpdate(
      id,
      {
        name,
        contact,
        age,
        gender,
        medicalHistory: medicalHistory || "",
        treatmentRecords: treatmentRecords || [],
        appointments: appointments || [],
      },
      { new: true, runValidators: true }
    );

    if (!patient) {
      console.log(`Patient ${id} not found`);
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log("Patient updated successfully:", patient._id);
    res.json({ message: "Patient updated successfully", patient });
  } catch (err) {
    console.error("Error updating patient:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// Delete a patient
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Deleting patient ${id}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log(`Invalid patient ID: ${id}`);
      return res.status(400).json({ message: "Invalid patient ID" });
    }

    const patient = await Patient.findByIdAndDelete(id);

    if (!patient) {
      console.log(`Patient ${id} not found`);
      return res.status(404).json({ message: "Patient not found" });
    }

    console.log("Patient deleted successfully:", id);
    res.json({ message: "Patient deleted successfully" });
  } catch (err) {
    console.error("Error deleting patient:", err.message);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;