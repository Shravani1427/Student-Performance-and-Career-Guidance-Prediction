// =====================================================
// MySQL Database Connection
// Student Performance & Career Guidance System
// =====================================================

const mysql = require("mysql2/promise");
const dotenv = require("dotenv");
const path = require("path");

// Load .env.local from the backend folder
dotenv.config({
    path: path.join(__dirname, "..", ".env.local")
});

// -----------------------------------------------------
// Check DATABASE_URL
// -----------------------------------------------------

if (!process.env.DATABASE_URL) {
    console.error("❌ DATABASE_URL is not defined.");
    console.error("❌ Please check: backend/.env.local");
    process.exit(1);
}

// -----------------------------------------------------
// Parse DATABASE_URL
// -----------------------------------------------------

let databaseUrl;

try {
    databaseUrl = new URL(process.env.DATABASE_URL);
} catch (error) {
    console.error("❌ Invalid DATABASE_URL.");
    console.error("Example:");
    console.error(
        "DATABASE_URL=mysql://root:password@localhost:3306/student_career_system"
    );
    process.exit(1);
}

// -----------------------------------------------------
// Extract MySQL details
// -----------------------------------------------------

const DB_HOST = databaseUrl.hostname;
const DB_PORT = Number(databaseUrl.port) || 3306;
const DB_USER = decodeURIComponent(databaseUrl.username);
const DB_PASSWORD = decodeURIComponent(databaseUrl.password);
const DB_NAME = decodeURIComponent(
    databaseUrl.pathname.replace("/", "")
);

// -----------------------------------------------------
// Display configuration
// -----------------------------------------------------

console.log("");
console.log("📁 Environment: development");
console.log(`🗄️ Database Host: ${DB_HOST}`);
console.log(`🗄️ Database Name: ${DB_NAME}`);
console.log(`👤 Database User: ${DB_USER}`);
console.log(`🔌 Database Port: ${DB_PORT}`);
console.log("🔐 Database Password: ********");
console.log("");

// -----------------------------------------------------
// Create MySQL connection pool
// -----------------------------------------------------

const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,

    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,

    charset: "utf8mb4"
});

// -----------------------------------------------------
// Test MySQL connection
// -----------------------------------------------------

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
            console.error("Check DATABASE_URL in backend/.env.local");
        }

        if (error.code === "ER_BAD_DB_ERROR") {
            console.error(`🔴 Database "${DB_NAME}" does not exist.`);
            console.error("Create it in MySQL first.");
        }

    } finally {
        if (connection) {
            connection.release();
        }
    }
}

testConnection();

// -----------------------------------------------------
// Export pool
// -----------------------------------------------------

module.exports = pool;