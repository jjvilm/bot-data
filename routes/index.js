var express = require('express');
var router = express.Router();
let passport = require('passport');
var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('login', { message: req.flash('loginMessage') });
});


router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/dashboard', //redirect to the home page
    failureRedirect: '/dashboard', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));





router.get('/usercreate', function (req, res, next) {
  res.render('usercreate',  { message: req.flash('signupMessage') });
});

router.post('/usercreate', passport.authenticate('local-signup', {
    successRedirect: '/', //redirect to the secure home page
    failureRedirect: '/usercreate', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

//
// router.get('/login', function (req, res) {
//     res.render('../views/account/login', { message: req.flash('loginMessage') });
// });

// router.get('/signup', function (req, res) {
//     res.render('../views/account/signup',
//         { message: req.flash('signupMessage') });
// });

// router.get('/logout', function (req, res) {
//     req.logout();
//     res.redirect('/');
// });

// router.post('/signup', passport.authenticate('local-signup', {
//     successRedirect: '/', //redirect to the secure home page
//     failureRedirect: '/account/signup', // redirect back to the signup page if there is an error
//     failureFlash: true // allow flash messages
// }));

// router.post('/login', passport.authenticate('local-login', {
//     successRedirect: '/', //redirect to the home page
//     failureRedirect: '/account/login', // redirect back to the signup page if there is an error
//     failureFlash: true // allow flash messages
// }));

// makes sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}

module.exports = router;
