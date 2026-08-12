// =====================================================
// MySQL Database Connection
// Student Performance & Career Guidance System
// =====================================================

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

// =====================================================
// LOAD ENVIRONMENT VARIABLES
// =====================================================

// Local development: load .env.local
// Render: environment variables are provided automatically
dotenv.config({
    path: path.join(__dirname, "..", ".env.local")
});

// =====================================================
// CHECK DATABASE_URL
// =====================================================

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined.");
    console.error("❌ Please add DATABASE_URL in Render Environment Variables.");
    process.exit(1);
}

// =====================================================
// PARSE DATABASE_URL
// =====================================================

let databaseUrl;

try {
    databaseUrl = new URL(process.env.DATABASE_URL);
} catch (error) {
    console.error("❌ Invalid DATABASE_URL.");
    console.error(
        "Example: mysql://username:password@host:3306/database"
    );
    process.exit(1);
}

// =====================================================
// EXTRACT MYSQL DETAILS
// =====================================================

const DB_HOST = databaseUrl.hostname;
const DB_PORT = Number(databaseUrl.port) || 3306;
const DB_USER = decodeURIComponent(databaseUrl.username);
const DB_PASSWORD = decodeURIComponent(databaseUrl.password);

const DB_NAME = decodeURIComponent(
    databaseUrl.pathname.replace("/", "")
);

// =====================================================
// DISPLAY CONFIGURATION
// =====================================================

console.log("");
console.log("🌐 Environment:", process.env.RENDER ? "Render" : "Development");
console.log(`🗄️ Database Host: ${DB_HOST}`);
console.log(`🗄️ Database Name: ${DB_NAME}`);
console.log(`👤 Database User: ${DB_USER}`);
console.log(`🔌 Database Port: ${DB_PORT}`);
console.log("🔐 Database Password: ********");
console.log("");

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

    charset: "utf8mb4",

    // Aiven requires SSL
    ssl: {
        rejectUnauthorized: false
    }
});

// =====================================================
// TEST MYSQL CONNECTION
// =====================================================

async function testConnection() {
    let connection;

    try {
        connection = await pool.getConnection();

        console.log("✅ MySQL connected successfully!");
        console.log(`🗄️ Connected Database: ${DB_NAME}`);
        console.log("");
    } catch (error) {
        console.error("");
        console.error("❌ MySQL connection failed");
        console.error("Error:", error.message);
        console.error("");

        if (error.code === "ER_ACCESS_DENIED_ERROR") {
            console.error("🔴 MySQL username/password is incorrect.");
        }

        if (error.code === "ER_BAD_DB_ERROR") {
            console.error(`🔴 Database "${DB_NAME}" does not exist.`);
        }

        if (error.code === "ENOTFOUND") {
            console.error("🔴 Database host could not be found.");
        }

        if (error.code === "ETIMEDOUT") {
            console.error("🔴 Database connection timed out.");
        }
    } finally {
        if (connection) {
            connection.release();
        }
    }
}

testConnection();

// =====================================================
// EXPORT POOL
// =====================================================

module.exports = pool;