const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const app = express();
app.use(bodyParser.json({ limit: '5mb' }));

const basePngPath = path.join(__dirname, 'input.png'); // Place your base PNG file here

app.post('/embed-signature', (req, res) => {
  const { signature } = req.body;
  if (!signature) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  fs.createReadStream(basePngPath)
    .pipe(new PNG())
    .on('parsed', function () {
      // Inject signature as text chunk
      this.text = [{ keyword: 'signature', text: signature }];

      const chunks = [];
      this.pack()
        .on('data', (chunk) => chunks.push(chunk))
        .on('end', () => {
          const buffer = Buffer.concat(chunks);
          res.json({ pngBase64: buffer.toString('base64') });
        });
    })
    .on('error', (err) => {
      console.error('PNG processing error:', err);
      res.status(500).json({ error: 'Error processing PNG' });
    });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Signature embedder API running on port ${PORT}`);
});
