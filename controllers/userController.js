const User = require('../models/user');

exports.createUser = async (req, res, next) => {
  const user = new User({
    usernmae: req.body.username,
    password: req.body.password,
    role: req.body.role
  });

  
    
    const result = await user.save();
    const users = await User.find({});
    
    res.render('../views/admin/userList', { users: users });
  
};



exports.getAll = async function(req, res) {
  try {
    const users = await User.find({});
    res.render('../views/admin/userList', { users: users });
    // res.render('userList', { users: users });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
}
exports.update_get = async function(req, res) {
  try {
    const userId = req.query.id;
    const user = await User.findById(userId);
    res.render('../views/admin/userEdit', { user: user });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
};
exports.update = async function(req, res) {
  try {
    const userId = req.query.id;
    console.log(userId);
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).send('User not found');
    }

    user.username = req.body.username;
    user.role = req.body.role;

    if (req.body.updatePassword) {
      user.password = user.generateHash(req.body.password);
    }
    else {
      user.password = req.body.password;
    }

    
  

    await user.save();

    const users = await User.find({});
    res.render('../views/admin/userList', { users: users });
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
};


exports.userDelete = async function(req, res) {
  try {
    const userId = req.query.id;
    await User.findByIdAndDelete(userId);
    // res.redirect('/dashboard/userList');
    // res.redirect('/adminDashboard/userList');
    res.redirect('/adminDashboard/userList');
  } catch (err) {
    console.log(err);
    res.status(500).send('Internal server error');
  }
}

