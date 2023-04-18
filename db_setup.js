const sqlite3 = require('sqlite3').verbose();

const createUsersTable = (db) => {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL
    );
  `;

  db.run(createTableSQL, (err) => {
    if (err) {
      console.error('Error creating users table:', err);
    } else {
      console.log('Users table managed successfully');
    }
  });
};

module.exports = { createUsersTable };