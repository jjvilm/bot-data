var express = require('express');
var router = express.Router();
// packages used for file uploading
const multer = require('multer');
const upload = multer().single('csvFile'); // specify the field name of the file upload


var botController = require('../controllers/botController'); 
var equipmentController = require('../controllers/equipmentController'); 
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
// update bot
router.get('/EquipmentSets',authMiddleware.ensureAuthenticated, function(req, res, next) {
  res.render('../views/dataEntry/equipmentSetCreate');
});
// get equipment set
router.get('/getEquipmentSetByName',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.getEquipmentSetByName(req, res);
});

// get equipment sets
router.get('/getEquipmentSets',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.getEquipmentSets(req, res);
});
// update bot
router.post('/createEquipmentSet',authMiddleware.ensureAuthenticated, function(req, res, next) {
  equipmentController.createEquipmentSet(req, res);
});
// save set
router.post('/updateEquipmentSet', authMiddleware.ensureAuthenticated, function(req, res, next) {
   // Assuming you update the set here successfully
   const updateResult = equipmentController.updateEquipmentSet(req,res); // Pseudo-code for your database update logic
  
   if (updateResult.success) {
     return res.json({ success: true });
   } else {
     return res.json({ success: false, message: 'Failed to update equipment set' });
   }
});



module.exports = router;
