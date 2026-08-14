// =====================================================
// MySQL Database Connection
// Student Performance & Career Guidance System
// Compatible with: Local, Render & Vercel Serverless
// =====================================================

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

dotenv.config({ path: path.join(__dirname, "..", "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", "..", ".env") });
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// =====================================================
// EXTRACT MYSQL CREDENTIALS
// =====================================================

let DB_HOST = process.env.DB_HOST;
let DB_PORT = Number(process.env.DB_PORT) || 3306;
let DB_USER = process.env.DB_USER;
let DB_PASSWORD = process.env.DB_PASSWORD;
let DB_NAME = process.env.DB_NAME;

// Fallback: Parse from DATABASE_URL if individual vars aren't set
if (process.env.DATABASE_URL) {
  try {
    const databaseUrl = new URL(process.env.DATABASE_URL);
    DB_HOST = databaseUrl.hostname || DB_HOST;
    DB_PORT = Number(databaseUrl.port) || DB_PORT;
    DB_USER = decodeURIComponent(databaseUrl.username) || DB_USER;
    DB_PASSWORD = decodeURIComponent(databaseUrl.password) || DB_PASSWORD;
    DB_NAME = decodeURIComponent(databaseUrl.pathname.replace("/", "")) || DB_NAME;
  } catch (error) {
    console.warn("⚠️ Could not parse DATABASE_URL, using individual environment variables.");
  }
}

// =====================================================
// CREATE MYSQL CONNECTION POOL
// =====================================================

const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,

  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,

  charset: "utf8mb4",

  // SSL for remote hosts (e.g., Aiven, PlanetScale, Railway)
  ssl: {
    rejectUnauthorized: false
  }
});

// =====================================================
// RUN CONNECTION TEST (Local only, non-blocking on Vercel)
// =====================================================

if (process.env.VERCEL !== "1" && process.env.NODE_ENV !== "production") {
  (async () => {
    let connection;
    try {
      connection = await pool.getConnection();
      console.log("✅ MySQL Database connected successfully!");
      console.log(`🗄️ Database: ${DB_NAME} on ${DB_HOST}:${DB_PORT}`);
    } catch (error) {
      console.error("❌ MySQL local connection failed:", error.message);
    } finally {
      if (connection) connection.release();
    }
  })();
}

// =====================================================
// EXPORT POOL
// =====================================================

module.exports = pool;