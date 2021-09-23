const mongoose = require('mongoose');

const submissionsSchema = new mongoose.Schema({
  institution_id: String,
  subjects: [Object],
  year: Number,
  students_total: Number,
  undergraduates_total: Number,
  postgraduates_total: Number,
  staff_total: Number,
  academic_papers: Number,
  institution_income: Number,
  institution: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Institutions'
  },
}, {
  timestamps: true,
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

const Submissions = mongoose.model('Submissions', submissionsSchema);
module.exports = Submissions;