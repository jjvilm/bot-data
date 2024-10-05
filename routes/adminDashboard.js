let passport = require('passport');
var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 
var patientController = require('../controllers/patientController'); 
const authMiddleware = require('../middleware/auth');

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
//   userController.createUser(req,res);
// });
router.post('/userCreate',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), passport.authenticate('local-signup', {
    successRedirect: '/adminDashboard/userList', //redirect to the secure home page
    failureRedirect: '/adminDashboard/userCreate', // redirect back to the signup page if there is an error
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
    await patientController.setBannedBot(req, res);
  } catch (error) {
    console.error('Error in /banned:', error);
    res.status(500).json({ message: 'Error in /adminDashboard/banned', error: error.message });
  }
});

// only used to get combat level from aliases
router.post('/get_player_combat_level', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), async (req, res, next) => {
  try {
    // Fetch the combat level and let the controller send the response
    await patientController.fetchPlayerCombatLevel(req, res);

    // No need to send a separate response here, as it's already handled in the controller
  } catch (error) {
    console.error('Error in fetching combat level:', error);
    res.status(500).json({ message: 'Error fetching combat level', error: error.message });
  }
});


router.get('/updateBotLevels',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  // res.render('../views/admin/updateBotCombat.ejs');
  patientController.updateRecentKilledBotsCBLevel(req,res)
});

module.exports = router;
