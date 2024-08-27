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
  const worksheet = workbook.addWorksheet('Bots');

  let patients = await Patient.find({});
  worksheet.columns = [
    { header: 'Bot Name', key: 'bot_name', width: 10 },
    { header: 'Combat Level', key: 'combat_lv', width: 10 },
    { header: 'Comments', key: 'comments', width: 10 },
  ]
  worksheet.addRows(patients);

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
  res.setHeader(
    'Content-Disposition',
    'attachment; filename=' + 'knownBots.xlsx',
  );
  return workbook.xlsx.write(res).then(function() {
    res.status(200).end();
  });
}

exports.exportCsv = async function(req, res) {
  let patients = await Patient.find({});

  let csv = 'Bot Name, Combat Level, Comments\r\n';
  patients.forEach((patient) => {
    csv += patient.bot_name + ',';
    csv += patient.combat_lv + ',';
    csv += patient.comments + '\r\n';
  })

  res.header('Content-Type', 'text/csv');
  res.attachment('patients.csv');
  return res.send(csv);
}


// Patient Model methods
exports.create = async function(req, res) {
  let patient = new Patient({
    bot_name: req.body.bot_name,
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
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
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
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