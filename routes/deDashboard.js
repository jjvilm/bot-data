var express = require('express');
var router = express.Router();
// packages used for file uploading
const multer = require('multer');
const upload = multer().single('csvFile'); // specify the field name of the file upload


var patientController = require('../controllers/patientController'); 
const authMiddleware = require('../middleware/auth');
// var userController = require('../controllers/userController'); 

// Data entry Dashboard
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/dataEntry/dashboard');
});

// Displays the list of customers in the database
router.get('/patientList',authMiddleware.ensureAuthenticated, function (req, res, next) {
  patientController.getall(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/botKills',authMiddleware.ensureAuthenticated, function (req, res, next) {
  // patientController.getRecentKills(req,res);
  patientController.get_world_kills(req, res);
});

// Displays the list of worlds for a specific bot in the database
router.get('/topWorlds',authMiddleware.ensureAuthenticated, function (req, res, next) {
  // patientController.getRecentKills(req,res);
  patientController.getTopWorlds(req, res);
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
router.post('/patientUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  patientController.update(req, res);
});
// delete
router.get('/patientDelete',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.delete(req, res);
});
// file exports 
router.get('/exportCsv',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.exportCsv(req, res);
});
router.get('/exportExcel',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.exportExcel(req, res);
});
// file imports
router.post('/importCsv', authMiddleware.ensureAuthenticated, function(req, res, next) {
  upload(req, res, function(err) {
    if (err) {
      return res.status(400).send({ message: 'Error uploading file' });
    }
    patientController.importCsv(req, res);
  });
});



module.exports = router;
