const mongoose = require('mongoose');

const TopInstitutionsSchema = new mongoose.Schema({
  TopInstitutions: Object
}, {
  timestamps: true,
},
{
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});
 
const TopInstitutions = mongoose.model('TopInstitutions', TopInstitutionsSchema);

module.exports = TopInstitutions;