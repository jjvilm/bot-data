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
    res.redirect('/dashboard');
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

  await Patient.findOneAndUpdate({ _id: req.body.id }, updateData);

  const patients = await Patient.find();
  res.render('patientList', { patients: patients });
}


exports.delete = async function(req, res) {
  
  await Patient.findOneAndDelete({ _id: req.query.id });
  const patients = await Patient.find();
  res.render('patientList', { patients: patients });

}

exports.getall = async function(req, res) {
  try {
    var returnedPatients = await Patient.find({});
    res.render('patientList', { patients: returnedPatients });
  } catch (err) {
    console.log(err);
  }
};