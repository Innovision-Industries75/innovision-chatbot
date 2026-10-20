
const Database = require("better-sqlite3");
const path = require("path");

// Create the database file inside the backend folder.
const dbPath = path.join(__dirname, "enquiries.db");
const db = new Database(dbPath);

// Create the enquiries table if it doesn't exist.
db.exec(`
  CREATE TABLE IF NOT EXISTS enquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    product TEXT NOT NULL,
    enquiry_details TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

// Prepare a reusable statement for saving enquiries.
const insertEnquiry = db.prepare(`
  INSERT INTO enquiries (
    customer_name,
    company_name,
    email,
    phone,
    product,
    enquiry_details
  )
  VALUES (
    @customer_name,
    @company_name,
    @email,
    @phone,
    @product,
    @enquiry_details
  )
`);

function saveEnquiry(enquiry) {
  return insertEnquiry.run(enquiry);
}

const selectAllEnquiries = db.prepare(`
  SELECT
    id,
    customer_name AS customerName,
    company_name AS companyName,
    email,
    phone,
    product,
    enquiry_details AS enquiryDetails,
    created_at AS createdAt
  FROM enquiries
  ORDER BY id DESC
`);

function getAllEnquiries() {
  return selectAllEnquiries.all();
}

module.exports = {
  saveEnquiry,
  getAllEnquiries,
};
