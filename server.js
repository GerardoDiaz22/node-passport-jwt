require('dotenv').config();
const express = require('express');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const path = require('path');
const authRoutes = require('./routes/auth');
const profileRoutes = require('./routes/profile');
const sqlite3 = require('sqlite3').verbose();
const app = express();

// parse application/json
app.use(express.json());

// parse application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }));

// parse cookies
app.use(cookieParser());

// Initialize the SQLite database connection
const { createUsersTable } = require('./db_setup');
const db = new sqlite3.Database('./data/users.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  } else {
    console.log('Connected to the SQLite database');
    // Call the createUsersTable function after connecting to the database
    createUsersTable(db);
  }
});

// initialize passport
app.use(passport.initialize());

// include passport strategies
require('./config/passport')(passport);

// set view engine
app.set('view engine', 'ejs');

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// include routes
app.get('/', (req, res) => {
  res.redirect('/login');
});
app.use('/', authRoutes);
app.use('/', profileRoutes);

// start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
