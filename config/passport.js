const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user'); // Adjust the path to your User model

module.exports = function(passport) {
  // Serialize user for the session
  passport.serializeUser(function(user, done) {
    done(null, user.id);
  });

  // Deserialize user from the session
  passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
      done(err, user);
    });
  });

  // Local strategy for login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    User.findOne({ 'email': email }, function(err, user) {
      if (err) return done(err);
      if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Wrong password.'));
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
      return done(null, user);
    });
  }));

  // Local strategy for signup
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, email, password, done) {
    User.findOne({ 'email': email }, function(err, user) {
      if (err) return done(err);
      if (user) return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
      
      // if there is no user with that email, create the user
      var newUser = new User();

      // set the user's local credentials
      newUser.email = email;
      newUser.password = newUser.generateHash(password);
      newUser.role = req.body.role;
      
      // save the user
      newUser.save(function(err) {
        if (err) throw err;
        return done(null, newUser);
      });
    });
  }));

  // Local strategy for login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  function(req, username, password, done) {
    User.findOne({ 'username': username }, function(err, user) {
      if (err) return done(err);
      if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Wrong password.'));
      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
      return done(null, user);
    });
  }));
};