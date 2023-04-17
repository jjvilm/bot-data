var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session= require('express-session');
var passport = require('passport');
var flash=require('connect-flash');
var bodyParser = require('body-parser');

var indexRouter = require('./routes/index');
// our routes
var accountsRouter = require('./routes/accounts');
var dashboardRouter = require('./routes/dashboard');
var detailsRouter = require('./routes/details');


var app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(cookieParser()); // read cookies (needed for auth)

// required for passport
app.use(session({
  secret: 'devkey',
  resave: true,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// connect-flash middleware
app.use(flash());

// middleware to expose user object to views
app.use(function (req, res, next) {
  res.locals.user = req.user;
  next();
});


// database connection
const mongoose = require('mongoose');
const SECRET = process.env['DATABASE'];
try {
  mongoose.connect(SECRET, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to the database.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

require('./config/passport')(passport);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// connect-flash error handling
app.use(function(req, res, next) {
  res.locals.flash = {
    success: req.flash('success'),
    info: req.flash('info'),
    warning: req.flash('warning'),
    error: req.flash('error')
  };
  next();
});

app.use('/', indexRouter);
// our map routing
app.use('/accounts', accountsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/details', detailsRouter);


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
