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

1. Open http://localhost:3000 in a web browser.

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

## Getting Help

We welcome your questions, ideas, and feedback. Please create an [issue](https://github.com/elyra-ai/nlp-editor/issues) or a [discussion thread](https://github.com/elyra-ai/nlp-editor/discussions).

## Contributing to the NLP editor
If you are interested in helping make the NLP editor  better, we encourage you to take a look at our 
[Contributing](CONTRIBUTING.md) page.