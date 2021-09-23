const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  address: {
    type: String,
  },
  country: {
    type: String,
  },
  region: {
    type: String,
  },
  id: {
    type: String,
  }
  
}, {
  timestamps: true,
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
 
institutionSchema.virtual('Submissions', {
  ref: 'Submissions',
  localField: '_id',
  foreignField: 'institution',
});

const Institutions = mongoose.model('Institutions', institutionSchema);

module.exports = Institutions;