var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
// our routes
var accountsRouter = require('./routes/accounts');
var dashboardRouter = require('./routes/dashboard');
var detailsRouter = require('./routes/details');
var loginRouter = require('./routes/login');

var app = express();

// database connection
// require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');

try {
  
const SECRET = process.env['DATABASE']
  mongoose.connect(SECRET, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to the database.');
} catch (error) {
  console.error('Unable to connect to the database:', error);
}

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
app.use('/accounts', accountsRouter);
app.use('/dashboard', dashboardRouter);
app.use('/details', detailsRouter);
app.use('/login', loginRouter);

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
