require('dotenv').config();
const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const router = express.Router();

const db = new sqlite3.Database('./data/users.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  }
  //console.log('Connected to the database.');
});

const isAuthorized = (req, res, next) => {
  passport.authenticate('jwt', (err, user, info) => {
    if (user) {
      req.user = user;
      res.redirect('/user');
    } else {
      next();
    }
  })(req, res, next);
};

router.post('/logout', (req, res) => {
  res.clearCookie('jwt');
  res.redirect('/');
});

router.get('/login', isAuthorized, (req, res) => {
  const error = req.query.error ? decodeURIComponent(req.query.error) : null;
  res.render('login.ejs', { messages: error });
});

router.get('/register', isAuthorized, (req, res) => {
  const error = req.query.error ? decodeURIComponent(req.query.error) : null;
  res.render('register.ejs', { messages: error });
});

router.post('/login', (req, res, next) => {
  // This call the local strategy first
  passport.authenticate('login', { session: false }, (err, user, info) => {
    if (err || !user) {
      const message = info ? info.message : 'Login failed';
      return res.redirect(`/login?error=${encodeURIComponent(message)}`);
    }
    // This creates a session for the user
    req.login(user, { session: false }, async (err) => {
      if (err) {
        res.send(err);
      }
      // Generate and return JWT token
      const id = await new Promise(function (resolve, reject) {
        db.get(
          'SELECT id FROM users WHERE email = ?',
          [user.email],
          function (err, rows) {
            if (err) {
              return reject(err);
            }
            resolve(rows);
          }
        );
      });
      const token = jwt.sign({ user: id }, process.env.ACCESS_TOKEN_SECRET);
      res.cookie('jwt', token, { httpOnly: true });
      // return res.json({ token });
      return res.redirect('/user');
    });
  })(req, res, next);
});

router.post('/register', async (req, res, next) => {
  const existingUser = await new Promise(function (resolve, reject) {
    db.get(
      'SELECT * FROM users WHERE email = ?',
      [req.body.email],
      function (err, rows) {
        if (err) {
          return reject(err);
        }
        resolve(rows);
      }
    );
  });
  if (existingUser) {
    const message = 'Email already exists';
    return res.redirect(`/register?error=${encodeURIComponent(message)}`);
  }
  const username = req.body.name;
  const email = req.body.email;
  const password = await bcrypt.hash(req.body.password, 10);
  // Save user to database
  const id = await new Promise(function (resolve, reject) {
    db.run(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, password],
      function (err) {
        if (err) {
          return reject(err);
        }
        resolve(this.lastID);
      }
    );
  });
  // Generate and return JWT token
  const token = jwt.sign({ user: id }, process.env.ACCESS_TOKEN_SECRET);
  // res.cookie('jwt', token, { httpOnly: true });
  // return res.json({ token });
  return res.redirect('/login');
});

module.exports = router;
