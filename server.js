const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const fileupload = require('express-fileupload');
const cors = require('cors');

app.use(cors());
app.use(fileupload());
app.use(express.static(path.join(__dirname, 'build')));

app.get('/api/ping', function (req, res) {
  return res.send('pong');
});

const uploadFile = (file) => {
  const newpath = __dirname + '/junk/documents/';
  console.log('uploading file', file);
  const filename = file.name;
  file.mv(`${newpath}${filename}`, (err) => {
    if (err) {
      return res.status(500).send({ message: 'File upload failed', code: 200 });
    }
  });
};

app.post('/api/upload', (req, res) => {
  const filesToUpload = req.files.attach_file;
  console.log(req.files);
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

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
