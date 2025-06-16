var express = require('express');
var router = express.Router();
// packages used for file uploading
var botController = require('../controllers/botController'); 
var equipmentController = require('../controllers/equipmentController'); 
const authMiddleware = require('../middleware/auth');
const EventEmitter = require('events');

// Create a singleton event emitter for bot hunts
const botHuntEmitter = new EventEmitter();
// Increase max listeners to avoid memory leak warnings
botHuntEmitter.setMaxListeners(100);

// Debug: Log when event listeners are added/removed
botHuntEmitter.on('newListener', (event, listener) => {
    console.log(`New listener added for event: ${event}`);
});

botHuntEmitter.on('removeListener', (event, listener) => {
    console.log(`Listener removed for event: ${event}`);
});

// Data entry Dashboard
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/dataEntry/dashboard');
});

// Displays the list of customers in the database
router.get('/botList',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.getRecent10(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/botKills',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.get_world_kills(req, res);
});

// Displays the list of worlds for a specific bot by name
router.get('/getBotNameHunts',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.getBotNameHunts(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/topWorlds',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.getTopWorlds(req, res);
});

// API endpoint to search bots by name or alias
router.get('/api/search-bots', authMiddleware.ensureAuthenticated, function(req, res, next) {
  botController.searchBots(req, res);
});

// API endpoint to apply an equipment set to a bot
router.post('/api/apply-equipment-set', authMiddleware.ensureAuthenticated, function(req, res, next) {
  botController.applyEquipmentSetToBot(req, res);
});

// Used to create a bot and added to the database
router.get('/botCreate',authMiddleware.ensureAuthenticated, function (req, res, next) {
  res.render('../views/dataEntry/botCreate');
});

router.post('/botCreate',authMiddleware.ensureAuthenticated, function(req,res,next){
  botController.create(req,res);
  
});
// update bot
router.get('/botUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  botController.update_get(req, res);
});
router.post('/botUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  botController.update(req, res);
});
// delete
router.get('/botDelete',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.delete(req, res);
});
// file exports 
router.get('/exportCsv',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.exportCsv(req, res);
});
router.get('/exportExcel',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.exportExcel(req, res);
});
// file imports
router.post('/importCsv', authMiddleware.ensureAuthenticated, function(req, res, next) {
  upload(req, res, function(err) {
    if (err) {
      return res.status(400).send({ message: 'Error uploading file' });
    }
    botController.importCsv(req, res);
  });
});
// update bot
router.get('/EquipmentSets',authMiddleware.ensureAuthenticated, function(req, res, next) {
  res.render('../views/dataEntry/equipmentSetCreate');
});
// get equipment set
router.get('/getEquipmentSetByName',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.getEquipmentSetByName(req, res);
});

// Get all equipment sets
router.get('/getEquipmentSets', authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.getEquipmentSets(req, res);
});

// Update equipment set name
router.put('/updateEquipmentSetName/:setId', authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.updateEquipmentSetName(req, res);
});

// get equipment sets
router.get('/getEquipmentSets',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.getEquipmentSets(req, res);
});
// update bot
router.post('/createEquipmentSet',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.createEquipmentSet(req, res);
});
// update equipment set
router.put('/updateEquipmentSet/:setId', authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.updateEquipmentSet(req, res);
});

// delete equipment set
router.delete('/deleteEquipmentSet/:setId', authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.deleteEquipmentSet(req, res);
});


// Endpoint to emit new bot kill event
router.post('/emitBotHunt', async function(req, res, next) {
  try {
    const botHunt = req.body;
    console.log('Received bot hunt data:', botHunt);

    if (!botHunt || !botHunt.bot_name) {
      console.log('Invalid bot hunt data');
      return res.status(400).json({ error: 'Invalid bot hunt data' });
    }

    // Format the bot hunt data to match expected structure
    const formattedBotHunt = {
      _id: new Date().getTime().toString(), // Generate a temporary ID
      bot_name: botHunt.bot_name,
      combat_lv: botHunt.combat_lv || 0,
      equipment_set_name: botHunt.equipment_set_name || '',
      most_recent_kill: {
        hunter_name: botHunt.hunter_name || 'Unknown',
        world_number: botHunt.world || 'Unknown',
        kill_date: new Date().toISOString(),
        loot_amount: botHunt.loot_value || 0
      }
    };

    console.log('Formatted bot hunt data:', formattedBotHunt);

    // Emit the event immediately
    botHuntEmitter.emit('newBotHunt', formattedBotHunt);
    console.log('Event emitted');

    res.status(200).json({ success: true, message: 'Event emitted successfully' });
  } catch (error) {
    console.error('Error emitting bot hunt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Endpoint to get the latest bot entries
router.get('/latestBotEntries', function(req, res, next) {
    botController.latestBotEntries(req, res);
});

// Handle SSE connections
router.get("/stream", authMiddleware.ensureAuthenticated, (req, res) => {
  console.log('New client connected to SSE stream');

  // Set headers for SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Function to send events to the client
  const sendEvent = (data) => {
    try {
      if (!res.writableEnded) {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      }
    } catch (error) {
      console.error('Error sending event:', error);
      cleanup();
    }
  };

  // Handle new bot hunt events
  const onBotHunt = (botHunt) => {
    console.log('Sending bot hunt event:', botHunt);
    sendEvent(botHunt);
  };

  // Cleanup function to remove event listeners and close connection
  const cleanup = () => {
    console.log('Cleaning up SSE connection');
    botHuntEmitter.off('newBotHunt', onBotHunt);
    clearInterval(pingInterval);
    if (!res.writableEnded) {
      res.end();
    }
  };

  // Add listener for new bot hunts
  botHuntEmitter.on('newBotHunt', onBotHunt);
  console.log('Added event listener for newBotHunt');

  // Keep the connection alive with a ping every 30 seconds
  const pingInterval = setInterval(() => {
    try {
      if (!res.writableEnded) {
        sendEvent({ type: 'ping' });
      } else {
        clearInterval(pingInterval);
      }
    } catch (error) {
      console.error('Error sending ping:', error);
      cleanup();
    }
  }, 30000);

  // Handle client disconnect and errors
  req.on('close', () => {
    console.log('Client disconnected from SSE stream');
    cleanup();
  });

  req.on('end', () => {
    console.log('SSE connection ended');
    cleanup();
  });

  req.on('error', (error) => {
    console.error('SSE connection error:', error);
    cleanup();
  });

  // Send initial connection success
  sendEvent({ type: 'connected' });
});

module.exports = router;
