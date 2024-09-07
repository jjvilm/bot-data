const Patient = require('../models/patient');
const excel = require('exceljs');
// packages used for importing data
const csv = require('csv-parser');
const fs = require('fs');
const moment = require('moment'); // Import moment for date manipulation
const { NONAME } = require('dns');



// methods for importing data
exports.importCsv = async function(req, res) {
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
};

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
};


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
};

exports.update = async function(req, res) {
  const updateData = {
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
  };


  var result = await Patient.findOneAndUpdate({ _id: req.body.id }, updateData)
  // console.log("In update method" + result)
  res.redirect('/deDashboard/patientList');
};
exports.update_from_recently_killed = async function(req, res) {
  const updateData = {
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
  };


  var result = await Patient.findOneAndUpdate({ _id: req.body.id }, updateData)
  // console.log("In update method" + result)
  res.redirect('/qcDashboard');
};

exports.delete = async function(req, res) {
  
  await Patient.findOneAndDelete({ _id: req.query.id });

  res.redirect('/deDashboard/patientList');

};

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

// Helper function to get recent kills data
async function fetchRecentKills() {
  try {
    const sevenDaysAgo = moment().subtract(7, 'days').toDate();
    const recentKills = await Patient.aggregate([
      {
        $project: {
          bot_name: 1,
          combat_lv: 1,
          comments: 1,
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
                      loot_amount: "$$kill.loot_amount",
                      hunter_name: "$$kill.hunter_name"
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
          combat_lv: 1,
          comments: 1,
          most_recent_kill: 1
        }
      }
    ]);

    recentKills.sort((a, b) => {
      const dateA = new Date(a.most_recent_kill.kill_date);
      const dateB = new Date(b.most_recent_kill.kill_date);
      if (dateA > dateB) return -1;
      if (dateA < dateB) return 1;

      const timeA = a.most_recent_kill.kill_time;
      const timeB = b.most_recent_kill.kill_time;
      return timeA > timeB ? -1 : timeA < timeB ? 1 : 0;
    });

    return recentKills;
  } catch (error) {
    console.error('Error getting recent kills:', error);
    throw error; // Rethrow the error for handling in calling function
  }
};

// Route handler for fetching recent kills
exports.getRecentKills = async function (req, res) {
  try {
    const recentKills = await fetchRecentKills();
    res.json(recentKills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent kills' });
  }
};

// Method to get recent kills data without sending a response
exports.getRecentKillsData = async function () {
  try {
    return await fetchRecentKills();
  } catch (error) {
    console.error('Error getting recent kills data:', error);
    throw error;
  }
};

// Used for the kills frequencies per world
exports.getTopWorlds = async function (req, res) {
  try {
    const topWorlds = await Patient.aggregate([
      { $project: { worlds: { $objectToArray: "$worlds" } } }, // Convert worlds object to array of key-value pairs
      { $unwind: "$worlds" }, // Unwind the worlds array
      { $group: { _id: "$worlds.k", totalFrequency: { $sum: "$worlds.v.kill_frequency" } } }, // Group by world_number and sum the kill_frequency
      { $sort: { totalFrequency: -1 } }, // Sort by totalFrequency in descending order
      { $limit: 25 } // Limit to top 10 results
    ]);

    // console.log(topWorlds)
    // res.json(topWorlds);
    res.render('../views/qualityControl/topWorlds', {topWorlds: topWorlds});
  } catch (error) {
    console.error('Error fetching top worlds:', error);
    res.status(500).json({ error: 'Failed to fetch top worlds' });
  }
};

exports.getCommonlyVistedWorlds = async function (req, res) {
  try {
    const topWorldsAggregation = [
      {
        '$project': {
          'worlds': {
            '$objectToArray': '$worlds'
          }
        }
      },
      {
        '$unwind': '$worlds'
      },
      {
        '$group': {
          '_id': '$worlds.k',
          'count': {
            '$sum': 1
          }
        }
      },
      {
        '$sort': {
          'count': -1
        }
      },
      {
        '$limit': 20
      }
    ];
    
    // Running top aggregation
    const commonlyVisitedWorlds = await Patient.aggregate(topWorldsAggregation);
    // Extract the top worlds into an array of world keys
    const worldKeys = commonlyVisitedWorlds.map(world => world._id);

    const botsPerWorldAggregation = [
      {
        '$match': {
          '$or': worldKeys.map(world => ({
            [`worlds.${world}`]: {
              '$exists': true,
              '$ne': null
            }
          }))
        }
      },
      {
        '$project': {
          'bot_name': 1,
          'worlds': 1
        }
      },
      {
        '$addFields': {
          'matchedWorlds': {
            '$filter': {
              'input': {
                '$objectToArray': '$worlds'
              },
              'as': 'world',
              'cond': {
                '$in': ['$$world.k', worldKeys]
              }
            }
          }
        }
      },
      {
        '$unwind': '$matchedWorlds'
      },
      {
        '$group': {
          '_id': '$matchedWorlds.k',
          'bot_names': {
            '$addToSet': '$bot_name'
          }
        }
      }
    ];
  // Fetch bots per world
  const botsPerWorld = await Patient.aggregate(botsPerWorldAggregation);
  
  // Fetch the latest bot data
  const recentKills = await exports.getRecentKillsData(); // Use the data-returning function

  const botsWithinTheWeek = recentKills.map(bot => bot.bot_name);

  // Filter bot names in each world
  const filteredBotsPerWorld = botsPerWorld.map(world => {
    return {
        _id: world._id,
        bot_names: world.bot_names.filter(name => botsWithinTheWeek.includes(name))
    };
  });


  res.render('../views/qualityControl/commonlyVisitedWorlds', {commonlyVisitedWorlds: commonlyVisitedWorlds, botsPerWorld: filteredBotsPerWorld });


  } catch (error) {
    console.error('Error fetching commonly visited worlds:', error);
    res.status(500).json({ error: 'Failed to fetch commonly visited worlds' });
  }
};