const Patient = require('../models/patient');
const excel = require('exceljs');
// packages used for importing data
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment'); // Import moment for date manipulation



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
  // console.log("In update method" + result)
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
 
// shows the data for the selected bot
exports.get_world_kills = async function(req, res) {
  var patients = await Patient.findOne({ _id: req.query.id });
  res.render('../views/dataEntry/botKills', {patients: patients});
  
};

exports.getRecentKills = async function (req, res) {
  try {
    // Calculate the date 7 days ago from now
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    // console.log(sevenDaysAgo);

    
    // Perform aggregation to find recent kills
    const recentKills = await Patient.aggregate([
      {
        $project: {
          bot_name: 1,
          combat_lv:1,
          recent_kill_data: {
            $reduce: {
              input: {
                $map: {
                  input: { $objectToArray: "$worlds" },
                  as: "world",
                  in: {
                    world_number: "$$world.k",
                    kills: {
                      $filter: {
                        input: "$$world.v.kills",
                        as: "kill",
                        cond: { $gte: ["$$kill.kill_date", sevenDaysAgo] }
                      }
                    }
                  }
                }
              },
              initialValue: [],
              in: {
                $concatArrays: ["$$value", {
                  $map: {
                    input: "$$this.kills",
                    as: "kill",
                    in: {
                      world_number: "$$this.world_number",
                      kill_date: "$$kill.kill_date",
                      kill_time: "$$kill.kill_time",
                      loot_amount: "$$kill.loot_amount"
                    }
                  }
                }]
              }
            }
          }
        }
      },
      {
        $addFields: {
          most_recent_kill: {
            $arrayElemAt: [
              {
                $sortArray: {
                  input: "$recent_kill_data",
                  sortBy: {
                    kill_date: -1,
                    kill_time: -1
                  }
                }
              },
              0
            ]
          }
        }
      },
      {
        $match: {
          most_recent_kill: { $ne: null }
        }
      },
      {
        $project: {
          bot_name: 1,
          combat_lv:1,
          most_recent_kill: 1
        }
      }
    ]);
    
    // console.log(recentKills[0]);

    // Sort recentKills array by 'kill_date' and 'kill_time' descending
  recentKills.sort((a, b) => {
    const dateA = new Date(a.most_recent_kill.kill_date);
    const dateB = new Date(b.most_recent_kill.kill_date);
    if (dateA > dateB) return -1;
    if (dateA < dateB) return 1;

    // If the dates are the same, sort by time
    const timeA = a.most_recent_kill.kill_time;
    const timeB = b.most_recent_kill.kill_time;
    return timeA > timeB ? -1 : timeA < timeB ? 1 : 0;
  });
    
    
    

    // console.log(recentKills);
    // res.render('../views/qualityControl/weekKills', { bots: recentKills });
    res.json(recentKills);
    // return recentKills;
  } catch (error) {
    console.error('Error getting recent kills:', error);
  }
};