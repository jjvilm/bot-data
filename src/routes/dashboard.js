var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  // res.render('login', { title: 'Express' });
  res.send('This will be dashboard page');
});

module.exports = router;
