var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
// packages for passport
var passport = require('passport');
var flash = require('connect-flash');
var bodyParser = require('body-parser');
require('dotenv').config()


// our routes
var indexRouter = require('./routes/index');
var accountRouter = require('./routes/accountRoute');
var adminRouter = require('./routes/adminRoute');
var deRouter = require('./routes/deRoute');
var qcRouter = require('./routes/qcRoute');

var app = express();

// database connection
const mongoose = require('mongoose');
// Set strictQuery to false to prepare for the Mongoose 7 change
mongoose.set('strictQuery', false);

try {
  const SECRET = process.env['DATABASE']
  mongoose.connect(SECRET, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to the database.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

// Passport needed code
app.use(bodyParser.urlencoded({
  extended: true,
}));
app.use(bodyParser.json());
var session = require('express-session');
require('./config/passport')(passport);
app.use(cookieParser()); // read cookies (needed for auth)

app.use(session({
  secret: 'devkey',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use(function(req, res, next) {
  res.locals.user = req.user;
  next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
// our map routing
app.use('/accountRoute', accountRouter);
app.use('/adminRoute', adminRouter);
app.use('/deRoute', deRouter);
app.use('/qcRoute', qcRouter);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
