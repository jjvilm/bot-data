const Patient = require('../models/patient');
const excel = require('exceljs');
// packages used for importing data
const csv = require('csv-parser');
const fs = require('fs');


// methods for importing data
exports.importCsv = async function(req, res) {
  console.log("Inside import CSV");
  // Open and parse the CSV file
  const results = [];
  if (req.file) {
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        // Map the CSV data to Patient model fields
        const patients = results.map((row) => {
          return {
            creatorId: row.creatorId,
            creatorName: row.creatorName,
            firstName: row.firstName,
            lastName: row.lastName,
            birthdate: row.birthdate,
            zipcode: row.zipcode,
            state: row.state,
            phoneNumber: row.phoneNumber,
            createDate: row.createDate,
            insuranceType: row.insuranceType,
            testType: row.testType,
            doctorService: row.doctorService,
            labName: row.labName,
            sampleStatus: row.sampleStatus
          };
        });

        // Save each patient to the database
        for (let patientData of patients) {
          const patient = new Patient(patientData);
          await patient.save();
        }

        // Redirect to the patient list page
        res.redirect('/deDashboard/patientList');
      });
  } else {
    console.log("File object is not defined");
    res.redirect('/deDashboard/importCsv');
  }
};


// Methods for exporting data
exports.exportExcel = async function(req, res) {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet('Patients');

  let patients = await Patient.find({});
  worksheet.columns = [
    { header: 'creatorId', key: 'creatorId', width: 10 },
    { header: 'creatorName', key: 'creatorName', width: 10 },
    { header: 'First Name', key: 'firstName', width: 10 },
    { header: 'Last Name', key: 'lastName', width: 10 },
    { header: 'Birth Date', key: 'birthdate', width: 10 },
    { header: 'zipcode', key: 'zipcode', width: 10 },
    { header: 'state', key: 'state', width: 10 },
    { header: 'phoneNumber', key: 'phoneNumber', width: 10 },
    { header: 'createDate', key: 'createDate', width: 10 },
    { header: 'insuranceType', key: 'insuranceType', width: 10 },
    { header: 'testType', key: 'testType', width: 10 },
    { header: 'doctorService', key: 'doctorService', width: 10 },
    { header: 'labName', key: 'labName', width: 10 },
    { header: 'sampleStatus', key: 'sampleStatus', width: 10 },
  ]
  worksheet.addRows(patients);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + 'patients.xlsx',
  );
  return workbook.xlsx.write(res).then(function() {
    res.status(200).end();
  });
}

exports.exportCsv = async function(req, res) {
  let patients = await Patient.find({});

  let csv = 'creatorId, creatorName, firstName, lastName, birthdate, zipcode, state, phoneNumber, createDate, insuranceType, testType, doctorService, labName, sampleStatus\r\n';
  patients.forEach((patient) => {
    csv += patient.creatorId + ',';
    csv += patient.creatorName + ',';
    csv += patient.firstName + ',';
    csv += patient.lastName + ',';
    csv += patient.birthdate + ',';
    csv += patient.zipcode + ',';
    csv += patient.state + ',';
    csv += patient.phoneNumber + ',';
    csv += patient.createDate + ',';
    csv += patient.insuranceType + ',';
    csv += patient.testType + ',';
    csv += patient.doctorService + ',';
    csv += patient.labName + ',';
    csv += patient.sampleStatus + '\r\n';    
  })

  res.header('Content-Type', 'text/csv');
  res.attachment('patients.csv');
  return res.send(csv);
}


// Patient Model methods
exports.create = async function(req, res) {
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
    res.redirect('/deDashboard/patientList');
  } catch (err) {
    console.log(err);
  }
};

exports.update_get = async function(req, res) {
  var patient = await Patient.findOne({ _id: req.query.id });
  res.render('../views/dataEntry/patientUpdate', patient);
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
  res.redirect('/deDashboard/patientList');
}


exports.delete = async function(req, res) {
  
  await Patient.findOneAndDelete({ _id: req.query.id });

  res.redirect('/deDashboard/patientList');

}

exports.getall = async function(req, res) {
  try {
    var returnedPatients = await Patient.find({});
    res.render('../views/dataEntry/patientList', { patients: returnedPatients });
  } catch (err) {
    console.log(err);
  }
  
};