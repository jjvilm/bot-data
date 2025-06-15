const Bot = require('../models/bot');
const moment = require('moment'); // Import moment for date manipulation
const { NONAME } = require('dns');
const axios = require('axios');

// Search bots by name or alias
exports.searchBots = async function(req, res) {
  try {
    const searchTerm = req.query.q || '';
    
    if (!searchTerm || searchTerm.length < 2) {
      return res.json([]);
    }
    
    const regex = new RegExp(searchTerm, 'i');
    
    const bots = await Bot.find({
      $or: [
        { bot_name: { $regex: regex } },
        { alias: { $regex: regex } }
      ]
    })
    .select('_id bot_name alias combat_lv status')
    .limit(10)
    .lean();
    
    res.json(bots);
  } catch (error) {
    console.error('Error searching bots:', error);
    res.status(500).json({ success: false, message: 'Error searching bots' });
  }
};

// API endpoint to get eligible bots (combat level 0 and not banned)
exports.getEligibleBotsApi = async function(req, res) {
  try {
    const eligibleBots = await Bot.find({ 
      combat_lv: 0,
      status: { $ne: 'BANNED' }
    })
    .select('_id bot_name combat_lv status alias')
    .sort({ bot_name: 1 })
    .lean();
    
    res.json(eligibleBots);
  } catch (error) {
    console.error('Error fetching eligible bots:', error);
    res.status(500).json({ success: false, message: 'Error fetching eligible bots' });
  }
};

// Get eligible bots for combat level update (combat_lv === 0 and status !== 'BANNED')
exports.getEligibleBots = async function(req, res, next) {
  try {
    const eligibleBots = await Bot.find({ 
      combat_lv: 0,
      status: { $ne: 'BANNED' }
    }).sort({ bot_name: 1 });
    
    // If called from a route that renders a view
    if (res.render) {
      res.render('admin/updateBotCombat', { 
        eligibleBots,
        title: 'Update Bot Combat Level'
      });
    } else {
      // If called as a helper function
      return eligibleBots;
    }
  } catch (error) {
    console.error('Error fetching eligible bots:', error);
    if (res.status) {
      res.status(500).json({ success: false, message: 'Error fetching eligible bots' });
    }
    return [];
  }
};

// Update bot alias and fetch combat level
exports.updateAliasAndFetchCombat = async function(req, res) {
  try {
    const { botId, alias } = req.body;
    
    if (!botId || !alias) {
      return res.status(400).json({ 
        success: false, 
        message: 'Bot ID and alias are required' 
      });
    }

    // Get combat level for the alias from OSRS Hiscores
    const combatLevel = await exports.getPlayerCombatLevel(alias);
    
    if (!combatLevel) {
      return res.status(400).json({ 
        success: false, 
        message: 'Could not fetch combat level for the provided alias. Please check the name and try again.' 
      });
    }

    // Find and update the bot
    const bot = await Bot.findById(botId);
    if (!bot) {
      return res.status(404).json({ 
        success: false, 
        message: 'Bot not found' 
      });
    }

    // Update bot with new alias and combat level
    bot.alias = alias;
    bot.combat_lv = combatLevel;
    
    await bot.save();
    
    return res.json({ 
      success: true, 
      message: 'Bot updated successfully',
      bot: {
        id: bot._id,
        alias: bot.alias,
        combat_lv: bot.combat_lv
      }
    });
    
  } catch (error) {
    console.error('Error updating bot alias and combat level:', error);
    
    // Handle duplicate key error (unique alias constraint)
    if (error.code === 11000) {
      return res.status(400).json({ 
        success: false, 
        message: 'This alias is already in use by another bot' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      message: 'An error occurred while updating the bot' 
    });
  }
};

// Update bot combat level and add alias
exports.updateBotCombatAndAlias = async function(req, res) {
  try {
    const { selectedBotId, searchedNameToAlias, newCombatLevel } = req.body;
    
    if (!selectedBotId || !searchedNameToAlias || !newCombatLevel) {
      req.flash('error_msg', 'Missing required fields');
      return res.redirect('/admin/update-bot-combat');
    }

    const bot = await Bot.findById(selectedBotId);
    if (!bot) {
      req.flash('error_msg', 'Bot not found');
      return res.redirect('/admin/update-bot-combat');
    }

    // Update alias and combat level
    bot.alias = searchedNameToAlias;
    bot.combat_lv = parseInt(newCombatLevel, 10);
    
    await bot.save();
    
    req.flash('success_msg', `Successfully updated ${bot.bot_name} - Alias: ${searchedNameToAlias}, Combat level: ${newCombatLevel}`);
    res.redirect('/admin/update-bot-combat');
  } catch (error) {
    console.error('Error updating bot combat and alias:', error);
    req.flash('error_msg', 'Error updating bot. Please try again.');
    res.redirect('/admin/update-bot-combat');
  }
};

// Constants for pagination
const PAGE_SIZE = 10;
let currentPage = 0;

// Bot Model methods
exports.create = async function(req, res) {
  let bot = new Bot({
    bot_name: req.body.bot_name,
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
  });


  try {
    await bot.save();
    res.redirect('/deRoute/botList');
  } catch (err) {
    console.log(err);
  }
};

exports.update_get = async function(req, res) {
  var bot = await Bot.findOne({ _id: req.query.id });
  res.render('../views/dataEntry/botUpdate', bot);
};

exports.update = async function(req, res) {
  const updateData = {
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
  };


  var result = await Bot.findOneAndUpdate({ _id: req.body.id }, updateData)
  res.redirect('/deRoute/botList');
};
exports.updateEquipmentSetName = async function(req, res) {
  try {
    const { botId, equipmentSetName } = req.body;
    const updateData = {
      equipment_set_name: equipmentSetName ,
    };
    
    // Update bot and check for success
    const updatedBot = await Bot.findOneAndUpdate({ _id: botId }, updateData, { new: true });

    // If the bot was not found, respond accordingly
    if (!updatedBot) {
      return res.status(404).json({ error: 'Bot not found.' });
    }

    // Respond with success message
    return res.status(200).json({ message: 'Equipment set name updated successfully.' });

  } catch (error) {
    console.error('Error updating equipment set:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
exports.update_from_recently_killed = async function(req, res) {
  const updateData = {
    combat_lv: req.body.combat_lv,
    comments: req.body.comments,
  };


  var result = await Bot.findOneAndUpdate({ _id: req.body.id }, updateData)
  res.redirect('/qcRoute');
};
exports.update_combat_alias = async function(req, res) {
  const updateData = {
    alias: req.body.alias,
    combat_lv: req.body.combat_lv,
  };


  var result = await Bot.findOneAndUpdate({ _id: req.body.id }, updateData)
};

exports.delete = async function(req, res) {
  
  await Bot.findOneAndDelete({ _id: req.query.id });

  res.redirect('/deRoute/botList');

};

exports.getall = async function(req, res) {
  try {
    var returnedBots = await Bot.find({});
    res.render('../views/dataEntry/botList', { bots: returnedBots });
  } catch (err) {
    console.log(err);
  }
  
};

exports.getRecent10 = async function(req, res) {
  try {
    const next = req.query.next === 'true';
    if (next) {
      currentPage++;
    } else if (currentPage > 0) {
      currentPage--;
    }
    const latestBots = await Bot.find()
      .sort({ _id: -1 })
      .skip(currentPage * PAGE_SIZE)
      .limit(PAGE_SIZE);
    res.render('../views/dataEntry/botList', { bots: latestBots });
  } catch (err) {
    console.log(err);
  }
};
 
// shows the data for the selected bot
exports.get_world_kills = async function(req, res) {
  var bots = await Bot.findOne({ _id: req.query.id });
  res.render('../views/dataEntry/botKills', {bots: bots, formatNumber});
  
};
// shows the data for the selected bot by name
exports.getBotNameHunts = async function(req, res) {
  try {
    var bot = await Bot.findOne({ bot_name: req.query.name });
    if (!bot) {
      return res.status(204).send(); // No content, clear the search bar
    }
    res.render('../views/dataEntry/botKills', { bots: bot, formatNumber });
  } catch (err) {
    console.log(err);
    res.status(500).send('Server error');
  }
};

function formatNumber(number) {
  if (number >= 1000000) {
      return (number / 1000000).toFixed(1) + 'M'; // For millions
  } else if (number >= 1000) {
      return (number / 1000).toFixed(1) + 'K'; // For thousands
  } else {
      return number.toString(); // For numbers below 1000
  }
}

// Helper function to get recent kills data
async function fetchRecentKills(quantity = 7, time = 'days') {
  try {
    const sevenDaysAgo = moment().subtract(quantity, time).toDate();
    const recentKills = await Bot.aggregate([
      {
        $project: {
          bot_name: 1,
          alias: 1,
          combat_lv: 1,
          comments: 1,
          equipment_set_name: 1,
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
        $limit: 10
      }
      ,
      {
        $project: {
          bot_name: 1,
          alias: 1,
          combat_lv: 1,
          comments: 1,
          equipment_set_name: 1,
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
// Helper function to get recent kills data
async function fetchPlayerKills(hunter_name) {
  try {
    const playerKills = await Bot.aggregate([
      // Step 1: Unwind the worlds object to deal with individual world entries
  {
    '$project': {
      'bot_name': 1,
      'worlds': {
        '$objectToArray': '$worlds'  // Convert worlds object to array for easier processing
      }
    }
  },
  // Step 2: Unwind the worlds array to handle each world individually
  {
    '$unwind': '$worlds'
  },
  // Step 3: Filter kills by hunter_name
  {
    '$project': {
      'bot_name': 1,
      'worlds.k': 1,  // World number
      'worlds.v.kill_frequency': 1,
      'kills': {
        '$filter': {
          'input': '$worlds.v.kills',
          'as': 'kill',
          'cond': {
            '$eq': ['$$kill.hunter_name', hunter_name]  // Filter kills by hunter name
          }
        }
      }
    }
  },
  // Step 4: Filter out worlds with no kills by the hunter
  {
    '$match': {
      'kills': { '$ne': [] }  // Keep only records where kills are not empty
    }
  },
  // Step 5: Group the data back to consolidate kills for each bot
  {
    '$group': {
      '_id': '$_id',
      'bot_name': { '$first': '$bot_name' },
      'worlds': {
        '$push': {
          'world': '$worlds.k',
          'kill_frequency': '$worlds.v.kill_frequency',
          'kills': '$kills'
        }
      }
    }
  }
    ]);

    return playerKills;
  } catch (error) {
    console.error('Error getting player kills:', error);
    throw error;
  }
};


// Route handler for fetching recent kills
exports.getRecentKills = async function (req, res) {
  try {
    const recentKills = await fetchRecentKills(quantity=3, time='hours');
    res.json(recentKills);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent kills' });
  }
};
// Route handler for fetching recent kills
exports.getPlayerKills = async function (req, res) {
  let hunter_name = req.query.hunter_name
  try {
    const playerKills = await fetchPlayerKills(hunter_name);
    res.render('../views/qualityControl/playerKills', {hunter_name: hunter_name, playerKills: playerKills, formatNumber});
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch recent kills' });
  }
};

// Method to get recent kills data without sending a response
exports.getRecentKillsData = async function () {
  try {
    return await fetchRecentKills(quantity=7, time='days');
  } catch (error) {
    console.error('Error getting recent kills data:', error);
    throw error;
  }
};

// Method to get recent kills data without sending a response
exports.latestBotEntries = async function (req, res) {
  try {
    const recentKills = await fetchRecentKills(7, 'days');
    console.log("Getting latest bot entries");
    
    // Format the kills data for the table
    const formattedKills = recentKills.slice(0, 10).map(kill => ({
      _id: kill._id,
      bot_name: kill.bot_name,
      combat_lv: kill.combat_lv || 0,
      equipment_set_name: kill.equipment_set_name || '',
      most_recent_kill: {
        hunter_name: kill.hunter_name || 'Unknown',
        world_number: kill.world || 'Unknown',
        kill_date: kill.createdAt,
        loot_amount: kill.loot_value || 0
      }
    }));

    console.log('Formatted kills:', formattedKills);
    res.json(formattedKills);
  } catch (error) {
    console.error('Error getting recent kills data:', error);
    res.status(500).json({ error: 'Failed to fetch latest kills' });
  }
};

// Used for the kills frequencies per world
exports.getTopWorlds = async function (req, res) {
  try {
    const topWorlds = await Bot.aggregate([
      { $project: { worlds: { $objectToArray: "$worlds" } } }, // Convert worlds object to array of key-value pairs
      { $unwind: "$worlds" }, // Unwind the worlds array
      { $group: { _id: "$worlds.k", totalFrequency: { $sum: "$worlds.v.kill_frequency" } } }, // Group by world_number and sum the kill_frequency
      { $sort: { totalFrequency: -1 } }, // Sort by totalFrequency in descending order
      { $limit: 25 } // Limit to top 10 results
    ]);

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
    const commonlyVisitedWorlds = await Bot.aggregate(topWorldsAggregation);
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
  const botsPerWorld = await Bot.aggregate(botsPerWorldAggregation);
  
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

// Function to fetch player skills from OSRS Hiscores API
async function getPlayerSkills(playerName) {
  const url = `https://secure.runescape.com/m=hiscore_oldschool/index_lite.json?player=${playerName}`;

  try {
    const response = await axios.get(url);

    // If the response is already in JSON format
    const data = response.data;

    // Helper function to find skill level by name
    const getSkillLevel = (skillsArray, skillName) => {
      const skill = skillsArray.find(s => s.name === skillName);
      return skill ? skill.level : 0;
    };

    return {
      Attack: getSkillLevel(data.skills, 'Attack'),     // Attack skill
      Defence: getSkillLevel(data.skills, 'Defence'),   // Defence skill
      Strength: getSkillLevel(data.skills, 'Strength'), // Strength skill
      Hitpoints: getSkillLevel(data.skills, 'Hitpoints'), // Hitpoints skill
      Ranged: getSkillLevel(data.skills, 'Ranged'),     // Ranged skill
      Prayer: getSkillLevel(data.skills, 'Prayer'),     // Prayer skill
      Magic: getSkillLevel(data.skills, 'Magic')        // Magic skill
    };
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn(`Player ${playerName} not found (404). Skipping...`);
      return 0; // Return 0 if player not found (404 error)
    } else {
      console.error(`Error fetching data for ${playerName}:`, error);
      return 0; // Return 0 for other errors
    }
  }
}

// Function to calculate the combat level using the player's skills
function calculateCombatLevel({ Attack, Defence, Strength, Hitpoints, Ranged, Prayer, Magic }) {
  const base = 0.25 * (Defence + Hitpoints + Prayer / 2);
  const melee = 0.325 * (Attack + Strength);
  const rangedLvl = 0.325 * (Ranged * 1.5);
  const magicLvl = 0.325 * (Magic * 1.5);
  const combatLevel = base + Math.max(melee, rangedLvl, magicLvl);
  return Math.floor(combatLevel); // Return the combat level as an integer
}

// Main function to get player's combat level
exports.getPlayerCombatLevel = async function(playerName) {
  try {
    const skills = await getPlayerSkills(playerName);
    if (!skills || skills === 0) {
      return null; // Return null if unable to fetch skills
    }
    
    const combatLevel = calculateCombatLevel(skills);
    return combatLevel;
  } catch (error) {
    console.error('Error in getPlayerCombatLevel:', error);
    return null;
  }
}


// Function to update bot as banned
exports.setBannedBot = async function (req, res) {
  try {
    const botId = req.body.id;

      // Update the bot's alias and combat level in the database
      await Bot.updateOne(
        { _id: botId }, // Find the bot by _id
        { 
          $set: { 
            comments: "BANNED", // Update combat level
          } 
        }
      );
      res.json({ message: 'Bot banned successfully' });

  } catch (error) {
    console.error('Error in setBannedBot:', error);
    // Send the error response if something went wrong
    return res.status(500).json({ message: 'Error updating comments in document for bot', error: error.message });
  }
};

// Function to update recent killed bots' combat levels from admin/updateBotCombat.ejs
exports.fetchPlayerCombatLevel = async function (req, res) {
  try {
    const alias = req.body.alias;
    const botId = req.body.id;

    // Fetch the new combat level
    const combatLevel = await exports.getPlayerCombatLevel(alias);

    // Check if the combat level is valid and not 0
    if (combatLevel !== 0) {
      // Update the bot's alias and combat level in the database
      await Bot.updateOne(
        { _id: botId }, // Find the bot by _id
        { 
          $set: { 
            combat_lv: combatLevel, // Update combat level
            alias: alias // Update alias (if needed)
          } 
        }
      );

      // Respond with the updated combat level
      return res.json({ combatLevel });
    } else {
      return res.status(400).json({ message: 'Combat level is 0, no update performed.' });
    }
  } catch (error) {
    console.error('Error in fetching combat level:', error);
    // Send the error response if something went wrong
    return res.status(500).json({ message: 'Error updating combat level', error: error.message });
  }
};


// Function to update recent killed bots' combat levels. it is called by pressing button from adming dashboard
exports.updateRecentKilledBotsCBLevel = async function (req, res) {
  try {
    const recentKills = await fetchRecentKills(); // Assuming this fetches a list of recent kills
    const botsWithZeroCombatLevel = [];

    for (const kill of recentKills) {
      let bot_name = kill.bot_name

      // ignore banned bots
      if (kill.comments === 'BANNED') {
        continue
      }
      //check alias first; This ensures that the code only assigns bot_name to kill.alias when alias exists in document and is non-empty.
      if (kill.alias && kill.alias != '') {
        bot_name = kill.alias
      }
      console.log("Retrieving level for", bot_name);
      const combatLevel = await getPlayerCombatLevel(bot_name);
      console.log("Retrived level:", combatLevel);
      
      // avoid writing to db if combat lv not found
      if (combatLevel === 0) {
        botsWithZeroCombatLevel.push(kill);
        continue
      }
      if (combatLevel === kill.combat_lv) {
        continue
      }
      // Update each bot's combat level
      const updateData = {
        combat_lv: combatLevel
      };
    
      // Updates database
      await Bot.findOneAndUpdate({ _id: kill._id }, updateData)
    }

    // Render the table with bots whose combat level is 0
    res.render('../views/admin/updateBotCombat', { botsWithZeroCombatLevel});

  } catch (error) {
    console.error('Error updating recent kills data:', error);
    res.status(500).json({
      message: 'Error updating combat levels',
      error: error.message
    });
  }
};