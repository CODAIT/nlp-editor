const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const fileupload = require('express-fileupload');
const cors = require('cors');

app.use(cors());
app.use(fileupload());
const jsonParser = express.json();
app.use(jsonParser);

const textParser = express.text();

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

const tabularResults = (req) => {
  console.log('retrieving tabular results');
  const { name } = req.query;
  const path = __dirname + `/data/result.json`;
  let data = [];
  try {
    data = fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error(err);
  }
  return data;
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

app.post('/api/run', textParser, (req, res) => {
  console.log('executing node');
  console.log(req.body);
  const tabularData = tabularResults(req);
  res.status(200).send(tabularData);
});

app.get('/api/document', function (req, res) {
  const { name } = req.query;
  console.log('retrieving document - ', name);
  const path = __dirname + `/data/documents/${name}`;
  try {
    let data = fs.readFileSync(path, 'utf8');
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
  }
});

/*app.get('/api/result', function (req, res) {
  const path = __dirname + '/data/result.json';
  try {
    let data = fs.readFileSync(path, 'utf8');
    res.status(200).send(data);
  } catch (err) {
    console.error(err);
  }
});*/

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
