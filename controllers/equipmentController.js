const Equipment = require('../models/equipment');

exports.getEquipmentSets = async function(req, res) {
    try {
      const EquipmentSets = await Equipment.find({});
      res.json(EquipmentSets);
    } catch (err) {
      console.log(err);
    }
    
  };


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