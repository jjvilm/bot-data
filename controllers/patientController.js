const Patient = require('../models/patient');

exports.create = async function(req, res) {
  console.log("get into the create method");
  let patient = new Patient({
    creatorId: req.body.creatorId,
    creatorName: req.body.creatorName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    birthdate: req.body.birthdate,
    zipcode: req.body.zipcode,
    state: req.body.state,
    phoneNumber: req.body.phoneNumber,
    createDate: req.body.createDate,
    insuranceType: req.body.insuranceType,
    testType: req.body.testType,
    doctorService: req.body.doctorService,
    labName: req.body.labName,
    sampleStatus: req.body.sampleStatus,
  });


  try {
    await patient.save();
    res.redirect('/dashboard/patientList');
  } catch (err) {
    console.log(err);
  }
};

exports.update_get = async function(req, res) {
  var patient = await Patient.findOne({ _id: req.query.id });
  console.log("This is from update_get: " + patient);
  res.render('patientUpdate', patient);
}

exports.update = async function(req, res) {
  const updateData = {
    creatorId: req.body.creatorId,
    creatorName: req.body.creatorName,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    birthdate: req.body.birthdate,
    zipcode: req.body.zipcode,
    state: req.body.state,
    phoneNumber: req.body.phoneNumber,
    createDate: req.body.createDate,
    insuranceType: req.body.insuranceType,
    testType: req.body.testType,
    doctorService: req.body.doctorService,
    labName: req.body.labName,
    sampleStatus: req.body.sampleStatus,
  };

  var result = await Patient.findOneAndUpdate({ _id: req.body.id }, updateData)
  console.log("In update method" + result)
  res.redirect('/dashboard/patientList');
}

exports.delete = async function(req, res) {
  console.log(req.query);
  await Patient.findOneAndDelete({ _id: req.query.id });
  res.redirect('/dashboard/patientList');

}

exports.getall = async function(req, res) {
  try {
    var returnedPatients = await Patient.find({});
    res.render('patientList', { patients: returnedPatients });
  } catch (err) {
    console.log(err);
  }
};