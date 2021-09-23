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

const mapSubmissions = (submissions) => {
  let students_total = 0;

  const storeSubjects = []
  
  submissions.forEach(submission => {
    students_total = students_total + submission.students_total
    storeSubjects.push(submission.subjects);
  });

// Using _.flatten() method
const subjects = _.flatten(storeSubjects);

  return { numberOfSubmissions: submissions.length, students_total, subjects }
}

const groupInstitutions = (institutions) => {
  const DBSchema = {};

  institutions.map(institution => {
    DBSchema[institution.name] = { ...mapSubmissions(institution.Submissions), institution: institution.name }
  }); 

  return DBSchema
};

const getHigestStudentRatings = (subjects) => {
  const { student_rating: higestStudentRating } = subjects.pop();
  let foundTopSubjects = subjects.filter(subject => subject.student_rating === higestStudentRating)
  foundTopSubjects = foundTopSubjects.map(subject => subject.name) 
  
  return [ ...new Set(foundTopSubjects) ][0]
}

const storeTopSubjectsByInstituitution = (foundInstitutions) => {
  const groupedInstutions = groupInstitutions(foundInstitutions);

  Object.values(groupedInstutions).forEach((institutionValues) => {
    institutionValues.subjects.sort((a, b) => a.student_rating - b.student_rating)
    const higestStudentRatings = getHigestStudentRatings(institutionValues.subjects)

    institutionValues.topSubject = higestStudentRatings
  });

  return groupedInstutions
} 


app.get('/institutions', async function (req, res) {
  const institutions = await Institutions.find().populate('Submissions');

  res.status(200).json(institutions);
});

app.post('/seed', async function (req, res) {
  const importInstitutions = await Institutions.create(institutions);

  const updatedSubmissions = submissions.map(submission => {
    const foundinstitution = importInstitutions.findIndex(institution => institution.id === submission.institution_id);

    return { ...submission, institution: importInstitutions[foundinstitution]._id }
  });

  await Submissions.create(updatedSubmissions);

  const foundInstitutions = await Institutions.find().populate('Submissions');
  const groupedInstutions = storeTopSubjectsByInstituitution(foundInstitutions)

  const topInstitutions = await TopInstitutions.create({ TopInstitutions: groupedInstutions })

  res.status(201).json(topInstitutions);
});

app.listen(process.env.PORT, function () {
  console.log(`Example app listening on port ${process.env.PORT}`);
});
