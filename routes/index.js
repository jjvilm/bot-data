var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('patientlist', { title: 'Express' });
  res.render('login', { title: 'Express' });
  // res.send('This will be main page: /login page');
});
router.get('/usercreate', function (req, res, next) {
  res.render('usercreate', { title: 'Express' });
});
router.post('/usercreate', userController.createUser);

module.exports = router;
