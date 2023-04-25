var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('adminDashboard');
});

router.get('/userList', userController.getAll);

// router.get('/usercreate', function (req, res, next) {
//   res.render('usercreate', { title: 'Express' });
// });
router.get('/userCreate',function (req, res, next) {
  res.render('userCreate');
});

router.post('/userCreate', userController.createUser);



router.get('/userUpdate', userController.updateUser);

router.post('/userUpdate', userController.update)

router.get('/userDelete', function (req, res, next) {
  userController.userDelete(req,res)
});

module.exports = router;
