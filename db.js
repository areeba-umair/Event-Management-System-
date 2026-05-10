const oracledb = require('oracledb');
require('dotenv').config();

// Auto-commit for DML statements
oracledb.autoCommit = true;

// Oracle 11g requires Thick mode
// Usually, we would call oracledb.initOracleClient({ libDir: 'C:\\path\\to\\instantclient' });
// But if it's in the system PATH, we can just call it without args or it might initialize automatically if available.
try {
  oracledb.initOracleClient();
} catch (err) {
  console.error('Whoops! Error initializing Oracle Client.');
  console.error(err.message);
  console.error('Make sure Oracle Instant Client is installed and in your system PATH.');
}

async function getConnection() {
  try {
    const connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_CONNECTION_STRING,
    });
    return connection;
  } catch (err) {
    console.error('Failed to get connection to Oracle DB:', err);
    throw err;
  }
}

module.exports = {
  getConnection,
  oracledb,
};
