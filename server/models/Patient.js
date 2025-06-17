const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  contact: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["Male", "Female", "Other"], required: true },
  medicalHistory: { type: String },
  appointments: [{ date: Date, purpose: String }],
});

module.exports = mongoose.model("Patient", patientSchema);