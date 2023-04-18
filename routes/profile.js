const express = require('express');
const passport = require('passport');
const router = express.Router();

const isNotAuthorized = (req, res, next) => {
  passport.authenticate('jwt', (err, user, info) => {
    if (user) {
      req.user = user;
      next();
    } else {
      // this should go an error page
      res.redirect('/login');
    }
  })(req, res, next);
};

router.get('/user', isNotAuthorized, (req, res, next) => {
  const user = req.user;
  return res.render('profile.ejs', { username: user.username });
});

module.exports = router;
