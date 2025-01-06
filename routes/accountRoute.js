let passport = require('passport');
var express = require('express');
var router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/user');

router.get('/login', function (req, res) {
  res.render('../views/account/login', { message: req.flash('loginMessage') });
});

// After log on, Roles will determine the landing page
router.post('/login', passport.authenticate('local-login', {
  failureRedirect: '/accountRoute/login',
  failureFlash: true
}), (req, res) => {
  req.session.cookie.maxAge = 7 * 24 * 60 * 60 * 1000; // 1 week
  res.cookie('remember_me', req.user.id, { path: '/', httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 }); // 1 week
  if (req.user.role === 'Admin') {
    res.redirect('/adminRoute');
  } else if (req.user.role === 'DataEntry') {
    res.redirect('/deRoute');
  } else {
    res.redirect('/qcRoute');
  }
});

router.get('/logout', async function (req, res) {
  if (req.user) {
    req.user.activeSession = null;
    await req.user.save();
  }
  res.clearCookie('remember_me');
  req.logout();
  res.redirect('/');
});

router.get('/signup', authMiddleware.ensureAuthenticated, authMiddleware.hasRole('Admin'), function (req, res) {
  res.render('../views/account/signup', { message: req.flash('signupMessage') });
});

router.post('/signup', passport.authenticate('local-signup', {
  successRedirect: '/accountRoute/login', // redirect to the secure home page
  failureRedirect: '/accountRoute/signup', // redirect back to the signup page if there is an error
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