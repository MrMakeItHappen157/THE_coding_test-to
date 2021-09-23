const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Institutions = require('../models/Institutions');
const Submissions = require('../models/Submissions');

dotenv.config();

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
  
  // READ JSON FILE
  const institutions = JSON.parse(fs.readFileSync(`${__dirname}/institutions.json`, 'utf-8'));
  const submissions = JSON.parse(fs.readFileSync(`${__dirname}/submissions.json`, 'utf-8'));

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

  const updateSubmissions = (submissions, importInstitutions) => 
    submissions.map(submission => {
      const foundinstitution = importInstitutions.findIndex(institution => institution.id === submission.institution_id);

      return { ...submission, institution: importInstitutions[foundinstitution]._id }
    });
  

// IMPORT DATA INTO DB
const importData = async () => {
  try {
    const importInstitutions = await Institutions.create(institutions);

    const updatedSubmissions = updateSubmissions(submissions, importInstitutions)

    await Submissions.create(updatedSubmissions);

    const foundInstitutions = await Institutions.find().populate('Submissions');
    const groupedInstutions = storeTopSubjectsByInstituitution(foundInstitutions)

    await TopInstitutions.create({ TopInstitutions: groupedInstutions })

    console.log('Data successfully loaded!');

    process.exit()
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

// DELETE ALL DATA FROM DB
const deleteData = async () => {
  try {
    await Institutions.deleteMany();
    await Submissions.deleteMany();
    console.log('Data successfully deleted!');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

if (process.argv[2] === '--import') {
  importData();
} else if (process.argv[2] === '--delete') {
  deleteData();
}