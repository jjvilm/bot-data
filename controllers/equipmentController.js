const Equipment = require('../models/equipment');
const Bot = require('../models/bot')

exports.createEquipmentSet= async function(req, res) {
    let equipmentSet = new Equipment({
        set_name: req.body.set_name,
        head: req.body.head,
        torso: req.body.torso,
        legs: req.body.legs,
        neck: req.body.neck,
        right_hand: req.body.right_hand,
        left_hand: req.body.left_hand,
        cape: req.body.cape,
        jewelry: req.body.jewelry,
        feet: req.body.feet,
        hands: req.body.hands,
        ammunition: req.body.ammunition,
    });
  
    try {
        await equipmentSet.save();
        res.status(200).json({ message: 'Equipment set created successfully!' }); // Send success response
    } catch (err) {
        // console.log(err);
        res.status(500).json({ message: 'Error creating the equipment set' }); // Send error response
    }
  };
  exports.getEquipmentSets = async function(req, res) {
    try {
      const EquipmentSets = await Equipment.find({});
      res.json(EquipmentSets);
    } catch (err) {
      console.log(err);
    }
    
  };

exports.getEquipmentSetByName = async function(req, res) {
    try {
      const EquipmentSet = await Equipment.findOne({set_name: req.query.set_name});
      res.json(EquipmentSet);
    } catch (err) {
      console.log(err);
      res.status(500).json({ message: 'Error fetching equipment set' });
    }
    
  };
exports.updateEquipmentSet = async function(req, res) {
    try {
        const updateData = {
            head: req.body.head,
            torso: req.body.torso,
            legs: req.body.legs,
            neck: req.body.neck,
            right_hand: req.body.right_hand,
            left_hand: req.body.left_hand,
            cape: req.body.cape,
            jewelry: req.body.jewelry,
            ammunition: req.body.ammunition,
            feet: req.body.feet,
            hands: req.body.hands,
          };
        
          await Equipment.findOneAndUpdate({ _id: req.body._id }, updateData)
    } catch (err) {
      console.log(err);
    }
    
  };
exports.updateEquipmentSetName = async function(req, res) {
  try {
    const updateData = {
      set_name: req.body.set_name,
    };
    // Update the equipment set by _id
    await Equipment.findOneAndUpdate({ _id: req.body._id }, updateData);

    // Optionally, you can add logic here to update the set_name within the bots data if needed
    await Bot.updateMany({ equipment_set_name: req.body.previous_set_name }, {$set: {equipment_set_name: req.body.set_name} });
    // need all _id from bot who have set_name as their equipment_set_name

    res.status(200).send('Equipment set name updated successfully.');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating equipment set name.');
  }
    
  };
exports.deleteEquipmentSet = async function(req, res) {
  try {
    await Equipment.findOneAndDelete({ _id: req.body._id });  // Get _id from params
    res.status(200).send('Equipment set deleted successfully.');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting equipment set.');
  }
};
  
