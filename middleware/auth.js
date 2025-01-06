const User = require('../models/user');

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  // Check for remember_me cookie
  if (req.cookies.remember_me) {
    User.findById(req.cookies.remember_me, function(err, user) {
      if (err || !user) {
        res.redirect('/accountRoute/login');
      } else {
        req.login(user, function(err) {
          if (err) {
            res.redirect('/accountRoute/login');
          } else {
            return next();
          }
        });
      }
    });
  } else {
    res.redirect('/accountRoute/login');
  }
}

// Middleware to check if authenticated user has required role
function hasRole(role) {
  return function(req, res, next) {
    if (req.isAuthenticated() && req.user.role === role) {
      return next();
    }
    res.redirect('/accountRoute/login');
  }
}

module.exports = {
  ensureAuthenticated: ensureAuthenticated,
  hasRole: hasRole,
}