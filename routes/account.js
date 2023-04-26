let passport = require('passport');
var express = require('express');
var router = express.Router();


router.get('/login', function (req, res) {
    res.render('../views/account/login', { message: req.flash('loginMessage') });
});

router.post('/login', passport.authenticate('local-login', {
    successRedirect: '/dashboard', //redirect to the home page
    failureRedirect: '/account/login', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages, 
}));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/signup', function (req, res) {
    res.render('../views/userCreate',
        { message: req.flash('signupMessage') });
});

router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/account/login', //redirect to the secure home page
    failureRedirect: '/account/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));



// makes sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


module.exports = router;