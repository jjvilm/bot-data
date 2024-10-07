function ensureAuthenticated(req, res, next) {
    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/accountRoute/login');
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