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
    dbUrl.pathname.slice(1),   
    dbUrl.username,   
    dbUrl.password,   
    {
      host: dbUrl.hostname,   
      port: dbUrl.port,   
      dialect: 'mysql',           
    }
  );
  console.log('MySQL pool created successfully');
  module.exports = pool;
} catch (err) {
  console.error('Failed to create MySQL pool:', err);
  process.exit(1); 
}
