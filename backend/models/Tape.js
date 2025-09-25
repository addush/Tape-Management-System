const mongoose = require('mongoose');

const TapeSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true },
  type: { type: String, required: true },
  status: { type: String, required: true },  // e.g. New or Reused
  dateInserted: { type: Date, required: true },
  handOverBy: String,
  receivedBy: String,
  usageHistory: String,
  nextAvailableDate: Date,
  handOverByReused: String,
  receivedByReused: String,
  signatureFilePath: String,  // Path to signature image on server
}, { timestamps: true });

module.exports = mongoose.model('Tape', TapeSchema);
