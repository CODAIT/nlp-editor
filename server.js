const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const fileupload = require('express-fileupload');
const cors = require('cors');
const AdmZip = require('adm-zip');

app.use(cors());
app.use(fileupload());
const jsonParser = express.json();
app.use(jsonParser);

app.use(express.static(path.join(__dirname, 'build')));

const createFolder = (folderName) => {
  console.log(`creating folder ${folderName}`);
  try {
    if (!fs.existsSync(folderName)) {
      fs.mkdirSync(folderName);
    }
  } catch (error) {
    //TODO properly log error
    console.log(error);
    return { error, message: `Unable to create folder ${folderName}.` };
  }
};

const uploadFile = (path, file) => {
  console.log(`uploading file ${file.name}`);
  //we rename the file, the runtime will look for input.txt
  const uploadPath = `${path}/input.txt`;
  file.mv(uploadPath, (err) => {
    if (err) {
      return res.status(500).send({ message: 'File upload failed', code: 200 });
    }
  });
};

const createNodeFile = (path, fileName, contents) => {
  console.log(`creating file ${fileName}`);
  fs.writeFileSync(`${path}/${fileName}`, contents);
};

const createZipArchive = async (tmpFolder, fileName) => {
  console.log(`creating zipfile ${fileName}`);
  const zip = new AdmZip();
  zip.addLocalFolder(tmpFolder);
  zip.writeZip(`${tmpFolder}/${fileName}`);
};

const moveZipFile = (tmpFolder, fileName) => {
  const currentPath = `${tmpFolder}/${fileName}`;
  const destinationPath = `${__dirname}/user-data-in/${fileName}`;
  fs.rename(currentPath, destinationPath, function (err) {
    if (err) {
      console.log(`error moving zipfile ${fileName}`);
      throw err;
    } else {
      console.log('Successfully moved the file!');
    }
  });
};

const tabularResults = (req) => {
  console.log('retrieving tabular results');
  const { name } = req.query;
  const path = __dirname + `/data/results-singledoc.json`;
  let data = [];
  try {
    data = fs.readFileSync(path, 'utf8');
  } catch (err) {
    console.error(err);
  }
  return data;
};

app.post('/api/upload', (req, res) => {
  const { workingId } = req.body;
  console.log(`uploading files to ${workingId}`);
  const filesToUpload = req.files.attach_file;

  //create a tmp filder to work in, if it does not exists
  const tmpFolder = __dirname + '/temp';
  createFolder(tmpFolder);
  //create working folder for this session.
  const workingFolder = `${tmpFolder}/${workingId}`;
  createFolder(workingFolder);

  if (filesToUpload.length > 0) {
    for (let i = 0; i < filesToUpload.length; i++) {
      const file = filesToUpload[i];
      uploadFile(workingFolder, file);
    }
  } else {
    uploadFile(workingFolder, req.files.attach_file);
  }
  res.status(200).send({ message: 'Files Uploaded', code: 200 });
});

//app.post('/api/run', textParser, (req, res) => {
app.post('/api/run', (req, res) => {
  console.log('executing pipeline');
  const { workingId, payload } = req.body;
  const tmpFolder = __dirname + '/temp' + `/${workingId}`;

  //write files to temp folder
  payload.forEach((node) => {
    const { label, xml } = node;
    createNodeFile(tmpFolder, `${label}.xml`, xml);
  });

  //zip tempfolder
  const zipFileName = `${workingId}.zip`;
  createZipArchive(tmpFolder, zipFileName);

  //move zipfile to be executed
  moveZipFile(tmpFolder, zipFileName);

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

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
