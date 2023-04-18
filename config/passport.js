const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./data/users.db', (err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
  }
  //console.log('Connected to the database.');
});

module.exports = function (passport) {
  // Local Strategy
  passport.use(
    'login',
    new LocalStrategy(
      {
        usernameField: 'email',
        passwordField: 'password',
      },
      async (email, password, done) => {
        try {
          // Find the user associated with the email provided by the user
          const user = await new Promise(function (resolve, reject) {
            db.get(
              'SELECT * FROM users WHERE email = ?',
              [email],
              function (err, rows) {
                if (err) {
                  return reject(err);
                }
                resolve(rows);
              }
            );
          });
          if (!user) {
            return done(null, false, { message: 'User not found' });
          }
          // Validate password and make sure it matches with the corresponding hash stored in the database
          const validate = await bcrypt.compare(password, user.password);
          if (!validate) {
            return done(null, false, { message: 'Wrong Password' });
          }
          return done(null, user, { message: 'Logged in Successfully' });
        } catch (error) {
          return done(error);
        }
      }
    )
  );
  // JWT Strategy
  passport.use(
    'jwt',
    new JwtStrategy(
      {
        jwtFromRequest: ExtractJwt.fromExtractors([
          (req) => {
            return req.cookies.jwt || null;
          },
        ]),
        secretOrKey: process.env.ACCESS_TOKEN_SECRET,
      },
      async (jwt_payload, done) => {
        // jwt_payload is the token payload
        try {
          const user = await new Promise(function (resolve, reject) {
            db.get(
              'SELECT * FROM users WHERE id = ?',
              [jwt_payload.user.id],
              function (err, rows) {
                if (err) {
                  return reject(err);
                }
                resolve(rows);
              }
            );
          });
          if (user) {
            return done(null, user);
          } else {
            return done(null, false);
          }
        } catch (error) {
          return done(error, false);
        }
      }
    )
  );
};
