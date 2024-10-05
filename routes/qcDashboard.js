var express = require('express');
var router = express.Router();
var botController = require('../controllers/botController'); 
const authMiddleware = require('../middleware/auth');

// Gets QCs Dashboard menu
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/qualityControl/weekKills');
});

// Displays the list of customers in the database
router.get('/botList',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.getall(req, res);
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
  botController.update_from_recently_killed(req, res);
});

router.get('/botDelete',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.delete(req, res);
});
// used for fetching bots killing within the recent week
router.get('/latest-bots',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.getRecentKills(req,res);
});
router.get('/player-latest-bots',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.getPlayerKills(req,res);
  
});
router.get('/commonlyVisitedWorlds',authMiddleware.ensureAuthenticated,function(req, res, next) {
  botController.getCommonlyVistedWorlds(req,res);
});



module.exports = router;
