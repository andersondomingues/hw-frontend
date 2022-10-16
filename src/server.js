import cors from 'cors';

const express = require('express');
const path = require('path');

const app = express();

app.use(cors());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(express.static('build'));
app.use(express.static(`${__dirname}/public`));

const publicPath = path.join(__dirname, '..', 'build');

const PORT = process.env.REACT_APP_PORT || 3000;

app.get('*', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
