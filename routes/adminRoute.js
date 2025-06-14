let passport = require('passport');
var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 
var botController = require('../controllers/botController'); 
var equipmentController = require('../controllers/equipmentController'); 
const authMiddleware = require('../middleware/auth');
const User = require('../models/user');

// Bot Combat Update Routes
router.get('/api/eligible-bots', 
  authMiddleware.ensureAuthenticated, 
  authMiddleware.hasRole('Admin'), 
  botController.getEligibleBotsApi
);

router.get('/update-bot-combat', 
  authMiddleware.ensureAuthenticated, 
  authMiddleware.hasRole('Admin'), 
  botController.getEligibleBots
);

router.post('/update-bot-combat-alias', 
  authMiddleware.ensureAuthenticated, 
  authMiddleware.hasRole('Admin'), 
  botController.updateBotCombatAndAlias
);

router.post('/update-alias-and-fetch-combat', 
  authMiddleware.ensureAuthenticated, 
  authMiddleware.hasRole('Admin'), 
  botController.updateAliasAndFetchCombat
);

/* GET home page. */
router.get('/', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  res.render('../views/admin/dashboard');
});

router.get('/userList',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  userController.getAll(req,res);
});

// router.get('/usercreate', function (req, res, next) {
//   res.render('usercreate', { title: 'Express' });
// });
router.get('/userCreate',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  res.render('../views/admin/userCreate');
});

// router.post('/userCreate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  // userController.createUser(req,res);
  // });

  router.post('/userCreate',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), passport.authenticate('local-signup', {
    
    successRedirect: '/adminRoute/userList', //redirect to the secure home page
    failureRedirect: '/adminRoute/userCreate', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));


// router.get('/userUpdate', userController.update_get);
router.get('/userUpdate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function(req, res, next) {
  userController.update_get(req, res);
});

// router.post('/userUpdate', userController.update)
router.post('/userUpdate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function(req, res, next) {
  userController.update(req, res);
});

router.get('/userDelete',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  userController.userDelete(req,res)
});

// sets comments on bot as BANNED when cannot find their combat level even with the right alias
router.post('/banned', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), async (req, res, next) => {
  try {
    await botController.setBannedBot(req, res);
  } catch (error) {
    console.error('Error in /banned:', error);
    res.status(500).json({ message: 'Error in /adminRoute/banned', error: error.message });
  }
});

// Check hiscores for a bot name
router.post('/check_hiscores', authMiddleware.ensureAuthenticated, authMiddleware.hasRole('Admin'), async (req, res) => {
  try {
    const { botName } = req.body;
    if (!botName) {
      return res.status(400).json({ error: 'Bot name is required' });
    }

    // Use the existing getPlayerCombatLevel function
    const combatLevel = await botController.getPlayerCombatLevel(botName);
    
    if (combatLevel) {
      return res.json({
        success: true,
        botName,
        combatLevel
      });
    } else {
      return res.status(404).json({
        success: false,
        message: 'Player not found in hiscores'
      });
    }
  } catch (error) {
    console.error('Error checking hiscores:', error);
    return res.status(500).json({
      success: false,
      message: 'Error checking hiscores',
      error: error.message
    });
  }
});

// Update bot's combat level
router.post('/update_bot_combat', authMiddleware.ensureAuthenticated, authMiddleware.hasRole('Admin'), async (req, res) => {
  try {
    const { botName, combatLevel } = req.body;
    
    if (!botName || !combatLevel) {
      return res.status(400).json({
        success: false,
        message: 'Bot name and combat level are required'
      });
    }

    // Find and update the bot
    const updatedBot = await Bot.findOneAndUpdate(
      { bot_name: botName },
      { $set: { combat_lv: parseInt(combatLevel) } },
      { new: true }
    );

    if (!updatedBot) {
      return res.status(404).json({
        success: false,
        message: 'Bot not found in database'
      });
    }


    return res.json({
      success: true,
      message: 'Combat level updated successfully',
      bot: updatedBot
    });
  } catch (error) {
    console.error('Error updating bot combat level:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating bot combat level',
      error: error.message
    });
  }
});

// only used to get combat level from aliases
router.post('/get_player_combat_level', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), async (req, res, next) => {
  try {
    // Fetch the combat level and let the controller send the response
    await botController.fetchPlayerCombatLevel(req, res);
  } catch (error) {
    console.error('Error in fetching combat level:', error);
    res.status(500).json({ message: 'Error fetching combat level', error: error.message });
  }
});


router.post('/deleteEquipmentSet/',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  try {
    equipmentController.deleteEquipmentSet(req,res);
  } catch (error) {
    console.error('Error in deleting equipment set:', error);
    res.status(500).json({message: 'Error deleting equpment set', error:error.message});
  }
});

router.get('/updateBotLevels',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  // res.render('../views/admin/updateBotCombat.ejs');
  botController.updateRecentKilledBotsCBLevel(req,res)
});
router.post('/updateEquipmentSetName',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  equipmentController.updateEquipmentSetName(req,res)
});

// Route to clear the active session
router.post('/clearSession', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), async (req, res, next) => {
  try {
    await userController.clearSession(req, res);
  } catch (error) {
    console.error('Error in /clearSession:', error);
    res.status(500).json({ message: 'Error in /adminRoute/clearSession', error: error.message });
  }
});

module.exports = router;
