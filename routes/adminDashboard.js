let passport = require('passport');
var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 
const authMiddleware = require('../middleware/auth');

/* GET home page. */
router.get('/', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  res.render('../views/admin/dashboard');
});

router.get('/userList',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  userController.getAll(req,res);
});

// router.get('/usercreate', function (req, res, next) {
//   res.render('usercreate', { title: 'Express' });
// });
router.get('/userCreate',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  res.render('../views/admin/userCreate');
});

// router.post('/userCreate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
//   userController.createUser(req,res);
// });
router.post('/userCreate',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), passport.authenticate('local-signup', {
    successRedirect: '/adminDashboard/userList', //redirect to the secure home page
    failureRedirect: '/adminDashboard/userCreate', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));


// router.get('/userUpdate', userController.update_get);
router.get('/userUpdate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function(req, res, next) {
  userController.update_get(req, res);
});

// router.post('/userUpdate', userController.update)
router.post('/userUpdate', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function(req, res, next) {
  userController.update(req, res);
});

router.get('/userDelete',authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res, next) {
  userController.userDelete(req,res)
});

module.exports = router;
