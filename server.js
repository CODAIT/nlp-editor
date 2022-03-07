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

//we temporarily store files here before zipping
const tempFolder = __dirname + '/temp';

//path required by SystemT runtime
//const systemTdataFolder = `/app/Seer-Core/aql-processor`;
const systemTdataFolder = `${__dirname}/Seer-Core/aql-processor`;

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

const uploadFile = (path, file, filename = 'payload.txt') => {
  console.log(`uploading file to temp folder ${file.name}`);
  //we rename the file, the runtime will look for input.txt
  const uploadPath = `${path}/${filename}`;
  return new Promise((resolve, reject) => {
    file.mv(uploadPath, (err) => {
      if (err) {
        reject(err);
      }
      resolve();
    });
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
  const destinationPath = `${systemTdataFolder}/user-data-in/${fileName}`;
  fs.rename(currentPath, destinationPath, function (err) {
    if (err) {
      console.log(`error moving zipfile ${fileName}`);
      throw err;
    } else {
      console.log(`moved zipfile ${fileName} to be processed.`);
    }
  });
};

app.post('/api/upload', async (req, res) => {
  const { workingId } = req.body;
  console.log(`uploading files to ${workingId}`);
  const filesToUpload = req.files.attach_file;

  //create a tmp folder to work in, if it does not exists
  createFolder(tempFolder);
  //create working folder for this session.
  const workingFolder = `${tempFolder}/${workingId}`;
  createFolder(workingFolder);

  try {
    if (filesToUpload.length > 0) {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        await uploadFile(workingFolder, file);
      }
    } else {
      await uploadFile(workingFolder, req.files.attach_file);
    }
    res.status(200).send({ message: 'Files Uploaded' });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'File upload failed' });
  }
});

app.post('/api/uploadflow', async (req, res) => {
  const { workingId } = req.body;
  console.log(`uploading flow to ${workingId}`);
  const filesToUpload = req.files.attach_file;

  //create a tmp folder to work in, if it does not exists
  createFolder(tempFolder);
  //create working folder for this session.
  const workingFolder = `${tempFolder}/${workingId}`;
  createFolder(workingFolder);

  try {
    await uploadFile(workingFolder, req.files.attach_file, 'inputflow.json');
    const doc = fs.readFileSync(`${workingFolder}/inputflow.json`, 'utf8');
    const document = JSON.parse(doc);
    deleteFile(`${workingFolder}/inputflow.json`, `inputflow.json`);
    res.status(200).send({ ...document });
  } catch (e) {
    console.error(e);
    res.status(500).send({ message: 'File upload failed' });
  }
});

app.post('/api/run', (req, res) => {
  console.log('executing pipeline');
  const { workingId, payload } = req.body;
  const workingFolder = `${tempFolder}/${workingId}`;

  fs.readdirSync(workingFolder)
    .filter((f) => f.endsWith('.xml'))
    .forEach((f) => fs.unlinkSync(`${workingFolder}/${f}`));

  //write files to temp folder
  payload.forEach((node) => {
    const { label, xml } = node;
    createNodeFile(workingFolder, `${label}.xml`, xml);
  });

  //zip tempfolder
  const zipFileName = `${workingId}.zip`;
  createZipArchive(workingFolder, zipFileName);

  //move zipfile to be executed
  moveZipFile(workingFolder, zipFileName);

  //read document to render in UI
  const docPath = `${workingFolder}/payload.txt`;
  const document = fs.readFileSync(docPath, 'utf8');

  res.status(200).send({
    message: 'Execution submitted successfully.',
    id: workingId,
    document,
  });
});

const deleteFile = (file, resultFileName) => {
  //delete file since we read it's contents
  console.log(`deleting file ${resultFileName}`);
  fs.unlinkSync(file);
};

const formatResults = ({ annotations, instrumentationInfo }) => {
  const { numAnnotationsPerType } = instrumentationInfo;
  const annonNames = numAnnotationsPerType.map((n) => n.annotationType);
  let annonResults = {};
  let indexResult = 0;
  annonNames.forEach((name) => {
    const items = [];
    const annotation = annotations[name];
    annotation.forEach((elem) => {
      const attr = Object.keys(elem)[0];
      const { location, text } = elem[attr];
      const { begin: start, end } = location;
      items.push({ start, end, text, indexResult: indexResult++ });
    });
    annonResults = { ...annonResults, [name]: items };
  });
  return { annotations: annonResults, names: annonNames };
};

app.get('/api/results', function (req, res) {
  const { workingId } = req.query;
  const resultFileName = `${workingId}-result.json`;
  const file = `${systemTdataFolder}/run-aql-result/${resultFileName}`;
  if (!fs.existsSync(file)) {
    //no file present, assume that runtime is still in progress
    console.log(`results file ${resultFileName} not found.`);
    return res.status(200).send({ status: 'in-progress' });
  }

  //read contents of file
  console.log(`results file ${resultFileName} found.`);
  let fileContents = fs.readFileSync(file, 'utf8');
  const parsedContents = JSON.parse(fileContents);

  // execution returned errors
  if (parsedContents.hasOwnProperty('AqlTaskError')) {
    const message = parsedContents['AqlTaskError'];
    deleteFile(file, resultFileName);
    return res.status(200).send({ status: 'error', message });
  }

  const results = formatResults(parsedContents);

  deleteFile(file, resultFileName);
  return res.status(200).send({ status: 'success', ...results });
});

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(process.env.PORT || 8080);
