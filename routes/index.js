var express = require('express');
var router = express.Router();
var userController = require('../controllers/userController'); 

/* GET home page. */
router.get('/', function (req, res, next) {
   res.redirect('/account/login');
});


module.exports = router;
