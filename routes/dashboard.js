var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('dashboard');
});

router.get('/create', function (req, res, next) {
  res.render('patientcreate');
  // res.render('patientcreate');
});

router.get('/update', function (req, res, next) {
  res.render('patientedit');
  // res.render('patientcreate');
});


module.exports = router;
