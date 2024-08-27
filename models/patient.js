const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for a single kill entry
const KillSchema = new Schema({
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

const Patient = mongoose.model('bot_kills', BotSchema);

module.exports = Patient;