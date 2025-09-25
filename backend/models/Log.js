const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
  tapeId: { type: String, required: true },
  action: String,
  date: Date,
  userStation: String,
  purpose: String,
  location: String,
  handOverBy: String,
  receivedBy: String,
  remarks: String
}, { timestamps: true });

module.exports = mongoose.model('Log', LogSchema);
