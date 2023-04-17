var express = require('express');
var router = express.Router();
var patientController = require('../controllers/patientController'); 

/* GET home page. */
router.get('/dashboard', function (req, res, next) {
  res.render('dashboard');
});
// Displays the list of customers in the database
router.get('/patientList', function (req, res, next) {
  patientController.getall(req, res);
});

// Used to create a patient and added to the database
router.get('/patientCreate', function (req, res, next) {
  res.render('patientcreate', { title: 'Express' });
});
router.post('/patientCreate', function(req,res,next){
  console.log("get into the /patientcreate post");
  patientController.create(req,res);
  
});

router.get('/patientUpdate', function(req, res, next) {
  patientController.update_get(req, res);
});
router.post('/patientUpdate', function(req, res, next) {
  patientController.update(req, res);
});

router.get('/patientDelete', function(req, res, next) {
  patientController.delete(req, res);
});


module.exports = router;
