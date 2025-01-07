const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/user'); // Adjust the path to your User model
const bodyParser = require('body-parser');

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
  async function(req, email, password, done) {
    try {
      const user = await User.findOne({ 'email': email });
      if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Wrong password.'));

      // Check if the user is already logged in
      if (user.activeSession && user.activeSession !== req.sessionID) {
        return done(null, false, req.flash('loginMessage', 'User is already logged in from another device.'));
      }

      // Set the active session
      user.activeSession = req.sessionID;
      await user.save();

      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));

  // Local strategy for creating users
  passport.use('local-signup', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  async function(req, username, password, done) {
    try {
      const existingUser = await User.findOne({ 'username': username });
      if (existingUser) return done(null, false, req.flash('signupMessage', 'That username is already taken.'));

      // if there is no user with that email, create the user
      const newUser = new User();

      // set the user's local credentials
      newUser.username = username;
      newUser.password = newUser.generateHash(password);
      newUser.role = req.body.role;

      // save the user
      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err);
    }
  }));

  // Local strategy for login
  passport.use('local-login', new LocalStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true
  },
  async function(req, username, password, done) {
    try {
      const user = await User.findOne({ 'username': username });
      if (!user) return done(null, false, req.flash('loginMessage', 'No user found.'));
      if (!user.validPassword(password)) return done(null, false, req.flash('loginMessage', 'Wrong password.'));

      // Check if the user is already logged in
      if (user.activeSession && user.activeSession !== req.sessionID) {
        return done(null, false, req.flash('loginMessage', 'User is already logged in from another device.'));
      }

      // Set the active session
      user.activeSession = req.sessionID;
      await user.save();

      req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // Cookie expires after 30 days
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
};