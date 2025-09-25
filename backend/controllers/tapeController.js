const Tape = require('../models/Tape');

// GET /api/tapes
exports.getAllTapes = async (req, res) => {
  try {
    const tapes = await Tape.find().sort({ createdAt: -1 });
    res.json(tapes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/tapes
exports.createTape = async (req, res) => {
  try {
    const tape = new Tape(req.body);
    await tape.save();
    res.status(201).json(tape);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Tape ID already exists' });
    }
    res.status(400).json({ error: error.message });
  }
};

// PUT /api/tapes/:id
exports.updateTape = async (req, res) => {
  try {
    const tape = await Tape.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!tape) return res.status(404).json({ error: 'Tape not found' });
    res.json(tape);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// POST /api/tapes/:id/signature - Upload signature image
exports.uploadSignature = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  try {
    const tape = await Tape.findOne({ id: req.params.id });
    if (!tape) return res.status(404).json({ error: 'Tape not found' });

    tape.signatureFilePath = `/uploads/${req.file.filename}`;
    await tape.save();
    res.json({ message: 'Signature uploaded', path: tape.signatureFilePath });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
