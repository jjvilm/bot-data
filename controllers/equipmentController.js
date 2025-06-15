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
    console.log('Fetching all equipment sets');
    try {
      const EquipmentSets = await Equipment.find({});
      console.log(`Found ${EquipmentSets.length} equipment sets`);
      res.json(EquipmentSets);
    } catch (err) {
      console.error('Error fetching equipment sets:', err);
      res.status(500).json({ error: 'Failed to fetch equipment sets', details: err.message });
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
        const { setId } = req.params;
        const { set_name, ...equipmentData } = req.body;
        
        // Prepare the update data
        const updateData = {
            ...equipmentData,
            ...(set_name && { set_name }) // Include set_name if provided
        };
        
        // Update the equipment set
        const updatedSet = await Equipment.findByIdAndUpdate(
            setId,
            { $set: updateData },
            { new: true, runValidators: true }
        );
        
        if (!updatedSet) {
            return res.status(404).json({ 
                success: false, 
                message: 'Equipment set not found' 
            });
        }
        
        // Send success response
        res.status(200).json({
            success: true,
            message: 'Equipment set updated successfully',
            set: updatedSet
        });
        
    } catch (err) {
        console.error('Error updating equipment set:', err);
        res.status(500).json({
            success: false,
            message: 'Failed to update equipment set',
            error: err.message
        });
    }
};
exports.updateEquipmentSetName = async function(req, res) {
  try {
    const { name } = req.body;
    const { setId } = req.params;
    
    if (!name || !setId) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    // Find the current set to get the previous name
    const currentSet = await Equipment.findById(setId);
    if (!currentSet) {
      return res.status(404).json({ success: false, message: 'Equipment set not found' });
    }
    
    const previousName = currentSet.set_name;
    
    // Update the equipment set name
    const updatedSet = await Equipment.findByIdAndUpdate(
      setId,
      { set_name: name },
      { new: true, runValidators: true }
    );
    
    if (!updatedSet) {
      throw new Error('Failed to update equipment set');
    }
    
    // Update any bots that were using this equipment set
    if (previousName && previousName !== name) {
      await Bot.updateMany(
        { equipment_set_name: previousName },
        { $set: { equipment_set_name: name } }
      );
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Equipment set name updated successfully',
      data: updatedSet
    });
    
  } catch (error) {
    console.error('Error updating equipment set name:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating equipment set name',
      error: error.message 
    });
  }
};
exports.deleteEquipmentSet = async function(req, res) {
  try {
    const { setId } = req.params;
    if (!setId) {
      return res.status(400).json({ success: false, message: 'Equipment set ID is required' });
    }
    
    const result = await Equipment.findByIdAndDelete(setId);
    if (!result) {
      return res.status(404).json({ success: false, message: 'Equipment set not found' });
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Equipment set deleted successfully',
      data: result 
    });
  } catch (error) {
    console.error('Error deleting equipment set:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error deleting equipment set',
      error: error.message 
    });
  }
};
  
