const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const fileupload = require('express-fileupload');
const cors = require('cors');

app.use(cors());
app.use(fileupload());
app.use(express.static(path.join(__dirname, 'build')));

const uploadFile = (file) => {
  const newpath = __dirname + '/upload/documents/';
  const filename = file.name;
  file.mv(`${newpath}${filename}`, (err) => {
    if (err) {
      return res.status(500).send({ message: 'File upload failed', code: 200 });
    }
  });
};

app.post('/api/upload', (req, res) => {
  const filesToUpload = req.files.attach_file;
  if (filesToUpload.length > 0) {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      uploadFile(file);
    }
  } else {
    uploadFile(req.files.attach_file);
  }
  res.status(200).send({ message: 'Files Uploaded', code: 200 });
});

app.get('/api/results', function (req, res) {
  const path = __dirname + '/documents/input/4Q2006.txt';
  try {
    let data = fs.readFileSync(path, 'utf8');
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
  }
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
