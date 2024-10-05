const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for a single kill entry
const EquipmentSchema = new Schema({
  set_name: {
    type: String,
    default: '', // Default empty string if no comments
  },
  head: {
    type: String,
    default: '', // Default empty string if no comments
  },
  torso: {
    type: String,
    default: '', // Default empty string if no comments
  },
  legs: {
    type: String,
    default: '', // Default empty string if no comments
  },
  neck: {
    type: String,
    default: '', // Default empty string if no comments
  },
  right_hand: {
    type: String,
    default: '', // Default empty string if no comments
  },
  left_hand: {
    type: String,
    default: '', // Default empty string if no comments
  },
  feet: {
    type: String,
    default: '', // Default empty string if no comments
  },
  cape: {
    type: String,
    default: '', // Default empty string if no comments
  },
  jewelry: {
    type: String,
    default: '', // Default empty string if no comments
  },
});

const Equipment = mongoose.model('bot_kills', EquipmentSchema);

module.exports = Equipment;