const express = require('express');
const app = express();
const mongoose = require('mongoose');
const Jokes = require('./models/Submissions');
const dotenv = require('dotenv');
const Institutions = require('./models/Institutions');
const Submissions = require('./models/Submissions');
const TopInstitutions = require('./models/TopInstitutions');

const fs = require('fs');
const _ = require("lodash");
dotenv.config();
  
// READ JSON FILE
const institutions = JSON.parse(fs.readFileSync(`${__dirname}/import-data/institutions.json`, 'utf-8'));
const submissions = JSON.parse(fs.readFileSync(`${__dirname}/import-data/submissions.json`, 'utf-8'));
// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true, 
    useUnifiedTopology: true 
  })
  .then(() => console.log('DB connection successful!'));


app.get('/', async function (req, res) {
  const test = await Submissions.find()
  .populate({
    path: 'institution',
    select: '-__v -Submissions -createdAt -updatedAt'
  }).select('-__v -institution_id');

  res.status(201).json(test);
});

app.get('/institutions', async function (req, res) {
  const institutions = await Institutions.find().populate('Submissions');

  res.status(200).json(institutions);
});

app.listen(process.env.PORT, function () {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
