const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const { Sequelize } = require('sequelize');

dotenv.config();

try {
  const dbUrl = new URL(process.env.DATABASE_URL);

  // const pool = mysql.createPool({
  //   host: dbUrl.hostname,
  //   user: dbUrl.username,
  //   password: dbUrl.password,
  //   database: dbUrl.pathname.slice(1),
  //   port: dbUrl.port,
  //   waitForConnections: true,
  //   connectionLimit: 10,
  //   queueLimit: 0
  // });

  const pool = new Sequelize(
    dbUrl.pathname.slice(1),   // Your MySQL database name
    dbUrl.username,   // Your MySQL username
    dbUrl.password,   // Your MySQL password
    {
      host: dbUrl.hostname,   // e.g., 'localhost' or Railway host
      port: dbUrl.port,   // usually 3306
      dialect: 'mysql',            // Tells Sequelize you're using MySQL
    }
  );
  console.log('MySQL pool created successfully');
  module.exports = pool;
} catch (err) {
  console.error('Failed to create MySQL pool:', err);
  process.exit(1); // Exit the app if DB connection fails
}
