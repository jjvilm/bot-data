const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for a single kill entry
const KillSchema = new Schema({
  kill_date: {
    type: Date, // Use String if you store dates as strings
    required: false, // Set to true if you want to make it a mandatory field
  },
  kill_time: {
    type: String,
    required: true,
  },
  loot_amount: {
    type: Number,
    required: true,
  },
});

// Define the schema for world data
const WorldSchema = new Schema({
  kill_frequency: {
    type: Number,
    default: 0,
  },
  kills: [KillSchema], // An array of kills using the KillSchema
});

// Define the schema for the bot
const BotSchema = new Schema({
  bot_name: {
    type: String,
    required: true,
    unique: true, // Each bot_name should be unique
  },
  combat_lv: {
    type: Number,
    default: 0,
  },
  worlds: {
    type: Map,
    of: WorldSchema, // The world number is the key, and its value follows WorldSchema
  },
  comments: {
    type: String,
    default: '', // Default empty string if no comments
  },
});

// Connect to your MongoDB
mongoose.connect("mongodb+srv://admin:sZEXUWEnzc639EAa@cluster0.wtmk0jr.mongodb.net/bot_hunting", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Define your Bot model (adjust schema as needed)
const BotKill = mongoose.model('bot_kills', BotSchema);

async function updateKillDates() {
try {

    const sampleDoc = await BotKill.findOne();
    console.log(JSON.stringify(sampleDoc, null, 2));

    const directQueryResult = await BotKill.find({
        $or: [
          { "worlds.kills.kill_date": { $type: "string" } },
          { "worlds.kills.kill_date": { $exists: false } }
        ]
      });
      
      console.log(directQueryResult);
      

    // Find all documents where `kill_date` is a string or does not exist
    // const botKills = await BotKill.aggregate([
    //     { $unwind: "$worlds" },
    //     { $unwind: "$worlds.kills" },
    //     {
    //       $match: {
    //         $or: [
    //           { "worlds.kills.kill_date": { $type: "string" } },
    //           { "worlds.kills.kill_date": { $exists: false } }
    //         ]
    //       }
    //     }
    //   ]);
    //   console.log(botKills);
  
    //   for (const bot of botKills) {
    //     let updated = false; // Track if we make any updates to avoid unnecessary save operations
  
    //     // Iterate through worlds and kills
    //     for (const [world, worldData] of bot.worlds.entries()) {
    //       worldData.kills.forEach(kill => {
    //         if (typeof kill.kill_date === 'string') {
    //           // Convert string to Date object
    //           kill.kill_date = new Date(kill.kill_date);
    //           updated = true;
    //         } else if (!kill.kill_date) {
    //           // Handle the case where kill_date is missing
    //           kill.kill_date = null; // Set to null or a default date
    //           updated = true;
    //         }
    //       });
    //     }
  
    //     if (updated) {
    //       // Save only if changes were made
    //       await BotKill.updateOne({ _id: bot._id }, { $set: { worlds: bot.worlds } });
    //       console.log(`Updated bot with ID: ${bot._id}`);
    //     }
    //   }
  
      console.log('All eligible documents have been updated.');
    } catch (err) {
      console.error('Error updating kill dates:', err);
    } finally {
      // Close the connection after the operation is complete
      mongoose.connection.close();
    }
  }
  
  // Execute the update function
  updateKillDates();
