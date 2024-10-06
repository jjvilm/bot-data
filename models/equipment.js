const mongoose = require('mongoose');

const { Schema } = mongoose;

// Define the schema for a single kill entry
const EquipmentSchema = new Schema({
  set_name: {
    type: String,
    unique: true, // Each bot_name should be unique
    default: '', 
  },
  head: {
    type: String,
    default: '', 
  },
  cape: {
    type: String,
    default: '', 
  },
  neck: {
    type: String,
    default: '', 
  },
  ammunition: {
    type: String,
    default: '', 
  },
  left_hand: {
    type: String,
    default: '',
    default: '', 
  },
  torso: {
    type: String,
    default: '', 
  },
  right_hand: {
    type: String,
    default: '', 
  },
  legs: {
    type: String,
    default: '', 
  },
  hands: {
    type: String,
    default: '', 
  },
  feet: {
    type: String,
    default: '', 
  },
  jewelry: {
    type: String,
    default: '', 
  },
  
});

const Equipment = mongoose.model('equipment_sets', EquipmentSchema);

module.exports = Equipment;