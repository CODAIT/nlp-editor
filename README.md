# Visual Editor for NLP rules

Prototype - Visual Editor for creating NLP rules

### Screenshot of Elyra NLP Visual Editor
![Elyra_NLP](https://user-images.githubusercontent.com/81634386/158040876-7bb94cbd-7c4a-4b2c-b50f-7524985801c0.png)

### Clone repository

```

git clone git@github.com:elyra-ai/nlp-canvas-private.git

```

### Install dependencies and run UI locally at port 3000

The application users a NodeJS server file as proxy, this makes it easy to replace and embed the UI with any other server - Websphere, Nginx, etc.

```

npm install
npm start

```

### Make a production build for the application and run locally on port 8080.

```
npm install
npm run build
npm run serve
```

### Create docker build and run as a container

View application on `http://localhost:8080`

```
docker build . -t nlp-web-app
docker run -p 8080:8080 nlp-web-app
```
