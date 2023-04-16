// let passport = require('passport');
var express = require('express');
var router = express.Router();

router.get('/', function (req, res) {
    // res.render('/src/views/login', { message: req.flash('loginMessage') });
    res.render('accounts');
});

// THIS STILL NEEDS TO BE IMPLEMENTED
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

module.exports = router;