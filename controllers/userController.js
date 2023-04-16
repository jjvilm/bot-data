const User = require('../models/user');

exports.createUser = (req, res, next) => {
  const user = new User({
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role
  });

  user.save()
    .then(result => {
      res.status(201).json({
        message: 'User created successfully',
        user: result
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({
        error: err
      });
    });
};
