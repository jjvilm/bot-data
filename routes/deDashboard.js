var express = require('express');
var router = express.Router();
// packages used for file uploading
const multer = require('multer');
const upload = multer().single('csvFile'); // specify the field name of the file upload


var botController = require('../controllers/botController'); 
const authMiddleware = require('../middleware/auth');
// var userController = require('../controllers/userController'); 

// Data entry Dashboard
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/dataEntry/dashboard');
});

// Displays the list of customers in the database
router.get('/botList',authMiddleware.ensureAuthenticated, function (req, res, next) {
  botController.getall(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/botKills',authMiddleware.ensureAuthenticated, function (req, res, next) {
  // botController.getRecentKills(req,res);
  botController.get_world_kills(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/topWorlds',authMiddleware.ensureAuthenticated, function (req, res, next) {
  // botController.getRecentKills(req,res);
  botController.getTopWorlds(req, res);
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



module.exports = router;
