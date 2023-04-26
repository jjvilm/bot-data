var express = require('express');
var router = express.Router();
var patientController = require('../controllers/patientController'); 
const authMiddleware = require('../middleware/auth');
// var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', authMiddleware.ensureAuthenticated,function (req, res, next) {
  res.render('../views/dataEntry/dashboard');
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
router.post('/patientUpdate',authMiddleware.ensureAuthenticated, function(req, res, next) {
  patientController.update(req, res);
});

router.get('/patientDelete',authMiddleware.ensureAuthenticated,function(req, res, next) {
  patientController.delete(req, res);
});



module.exports = router;
