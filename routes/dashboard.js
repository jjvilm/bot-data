var express = require('express');
var router = express.Router();
var patientController = require('../controllers/patientController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('dashboard');
});
router.get('/create', function (req, res, next) {
  res.render('patientcreate', { title: 'Express' });
});
router.post('/patientcreate', function(req,res,next){
  console.log("get into the /patientcreate post");
  patientController.create(req,res);
  
});

router.get('/update', function (req, res, next) {
  res.render('patientedit');
  // res.render('patientcreate');
});


module.exports = router;
