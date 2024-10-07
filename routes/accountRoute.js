let passport = require('passport');
var express = require('express');
var router = express.Router();
const authMiddleware = require('../middleware/auth');


router.get('/login', function (req, res) {
    res.render('../views/account/login', { message: req.flash('loginMessage') });
});

// After log on, Roles will determine the landing page
router.post('/login', passport.authenticate('local-login', {
    failureRedirect: '/accountRoute/login',
    failureFlash: true
}), (req, res) => {
    if (req.user.role === 'Admin') {
        res.redirect('/adminRoute');
    } else if (req.user.role === 'DataEntry') {
        res.redirect('/deRoute');
    } else {
      res.redirect('/qcRoute');
    }
});


router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/signup', authMiddleware.ensureAuthenticated,authMiddleware.hasRole('Admin'), function (req, res) {
    // res.render('../views/userCreate',
    res.render('../views/account/signup',
        { message: req.flash('signupMessage') });
});

router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/accountRoute/login', //redirect to the secure home page
    failureRedirect: '/accountRoute/signup', // redirect back to the signup page if there is an error
    failureFlash: true // allow flash messages
}));

// router.post('/signup', passport.authenticate('local-signup', {
//     failureRedirect: '/accountRoute/signup', // redirect back to the signup page if there is an error
//     failureFlash: true // allow flash messages
// }), (req, res) => {
//   /// if already logged in and creating user, do not redirct to login screen
//     if (req.user) {
//         res.redirect('/adminRoute/userList');
//     } else {
//         res.redirect('/account/login');
//     }
// });



// makes sure a user is logged in
function isLoggedIn(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}


module.exports = router;