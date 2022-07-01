<!--

Copyright 2022 Elyra Authors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
-->
# Visual Editor for NLP rules

Visual Editor for creating NLP rules. 

![Visual editor interface](https://user-images.githubusercontent.com/81634386/158040876-7bb94cbd-7c4a-4b2c-b50f-7524985801c0.png)

## Watch a demo

Watch a live demo of the NLP editor, and learn more about our future plans in our recent [IBM Data Science Community presentation](https://community.ibm.com/community/user/datascience/blogs/tim-bonnemann1/2022/06/30/replay-available-learn-about-elyra-visual-nlp-edit?CommunityKey=f1c2cf2b-28bf-4b68-8570-b239473dcbbc)


## Try the editor

1. Clone the repository

   ```
   git clone git@github.com:elyra-ai/nlp-editor.git
   ```

1. Navigate to the source code
   ```
   cd nlp-editor
   ```

The application users a NodeJS server file as proxy, this makes it easy to replace and embed the UI with any other server - Websphere, Nginx, etc.

### Prerequisites

1. Install latest `node` from https://nodejs.org/en/download/ - it also installs a compatible `npm`

1. In a terminal, check `node` and `npm` versions

```bash
node -v
v16.14.2
```

```bash
$ npm -v
8.5.0
```

### Run locally (option 1)

**Prerequsites**:
 - NodeJS 14+

Install the dependencies and run the GUI locally:

1. Install the dependencies
   ```
   npm install
   ```

1. Run the app
   ```
   npm start
   ```

1. Open http://localhost:8080 in a web browser.

### Run locally (option 2)

**Prerequsites**:
 - NodeJS 14+

Create a production build for the application and run it locally on port 8080:

1. Install the dependencies
   ```
   npm install
   ```

1. Build the app
   ```
   npm run build
   ```

1. Run the app
   ```
   npm run serve
   ```

1. Open http://localhost:8080 in a web browser.

### Run in a container

You can run the editor in a container, eliminating the need to install NodeJS locally.

**Prerequsites**:
 - Docker

To run the NLP editor in a container:

1. Build the container image
   ```
   docker build . -t nlp-web-app
   ```

1. Run the container
   ```
   docker run -p 8080:8080 nlp-web-app
   ```

1. Open http://localhost:8080 in a web browser.


### Run the editor locally using the IBM Watson Discovery Backend container

**Prerequsites**:
 - NodeJS 14+ (see prerequisites on how to install)
 - Docker
 - IBM Watson Discovery Backend container `ibm_watson_discovery_web_nlp_tool-<date>.tar.gz` supplied to you


1. Clone the repository

   ```
   git clone git@github.com:elyra-ai/nlp-editor.git
   ```

2. Navigate to the editor source code directory
   ```
   cd nlp-editor
   ```

3. Build the app
   ```
   npm run build
   ```

4. Run the app
   ```
   npm run serve
   ```

5. Extract `ibm_watson_discovery_web_nlp_tool-<date>.tar.gz` into a folder of your choice, say `watson_nlp_web_tool`

6. Build the container image
   ```
   cd watson_nlp_web_tool
   docker build -t watson_nlp_web_tool:1.0 .
   ```

7. Run the container image with volumes mapped. Note that `/path/to/nlp-editor` s the absolute path to the `nlp-editor` repository (from Step 1).

   ```
   docker run -d -v /path/to/nlp-editor/Seer-Core/aql-processor/user-data-in:/app/Seer-Core/aql-processor/user-data-in -v /path/to/nlp-editor/Seer-Core/aql-processor/run-aql-result:/app/Seer-Core/aql-processor/run-aql-result --name watson_nlp_web_tool watson_nlp_web_tool:1.0
   ```

8. Open http://localhost:8080 in a web browser.

9. Create your NLP model. Use the [Tutorial](./tutorial.md) for guidance.

10. When you are satisfied with your model, clock **Export**. A `.zip` file is generated on your local file system. 

11. In Watson Discovery on CloudPak for Data, apply the model by following the steps in [Advanced Rules Models](https://cloud.ibm.com/docs/discovery-data?topic=discovery-data-domain#advanced-rules).


## Getting Help

We welcome your questions, ideas, and feedback. Please create an [issue](https://github.com/elyra-ai/nlp-editor/issues) or a [discussion thread](https://github.com/elyra-ai/nlp-editor/discussions).

## Contributing to the NLP editor
If you are interested in helping make the NLP editor  better, we encourage you to take a look at our 
[Contributing](CONTRIBUTING.md) page.
