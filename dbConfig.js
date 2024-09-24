require("dotenv").config();
const { Pool } = require("pg");

const isProduction = process.env.NODE_ENV == "production";
const connectionString = `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

const pool = new Pool({
  connectionString: isProduction ? process.env.DATABASE_URL : connectionString,
});
//pool.connect();
console.log("connected to Postgres DB");
// pool.query("SELECT * FROM users", (err, result) => {
//   if (err) {
//     console.error("Error running query", err);
//   } else {
//     console.log("Query result:", result.rows);
//   }
// });

module.exports = { pool };
