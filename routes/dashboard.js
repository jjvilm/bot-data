var express = require('express');
var router = express.Router();
var patientController = require('../controllers/patientController'); 
var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('dashboard');
});
// Displays the list of customers in the database
router.get('/patientList', function (req, res, next) {
  patientController.getall(req, res);
});

router.get('/usercreate', function (req, res, next) {
  res.render('usercreate', { title: 'Express' });
});
router.post('/usercreate', userController.createUser);

router.get('/userList', userController.getAll);
router.get('/usercreate',function (req, res, next) {
  res.render('usercreate');
});

router.get('/userUpdate', userController.updateUser);
router.post('/userUpdate', userController.update)

router.get('/userDelete', function (req, res, next) {
  userController.userDelete(req,res)
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
