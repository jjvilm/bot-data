var express = require('express');
var router = express.Router();
var patientController = require('../controllers/patientController'); 
const authMiddleware = require('../middleware/auth');

// Gets QCs Dashboard menu
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/qualityControl/weekKills');
  // patientController.getRecentKills(req,res);
  // res.render('../views/dataEntry/patientList', { patients: returnedPatients });
  // patientController.getall(req, res);
  // res.render('../views/qualityControl/dashboard');
});

// Displays the list of customers in the database
router.get('/patientList',authMiddleware.ensureAuthenticated, function (req, res, next) {
  patientController.getall(req, res);
});

// Used to create a patient and added to the database
router.get('/patientCreate',authMiddleware.ensureAuthenticated, function (req, res, next) {
  res.render('../views/dataEntry/patientCreate');
});

router.post('/patientCreate',authMiddleware.ensureAuthenticated, function(req,res,next){
  patientController.create(req,res);
  
});
// update patient
router.get('/patientUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  patientController.update_get(req, res);
});
router.post('/botUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  patientController.update_from_recently_killed(req, res);
});

router.get('/patientDelete',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.delete(req, res);
});
// used for fetching bots killing within the recent week
router.get('/latest-bots',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.getRecentKills(req,res);
});
router.get('/player-latest-bots',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.getPlayerKills(req,res);
  
});
router.get('/commonlyVisitedWorlds',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.getCommonlyVistedWorlds(req,res);
});



module.exports = router;
