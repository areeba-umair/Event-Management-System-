const { getConnection } = require('./db');

async function resetDatabase() {
  let connection;
  try {
    connection = await getConnection();
    console.log("Connected to Database. Starting reset process...");

    // Step 1: Disable triggers that interfere with DELETE
    const triggersToDisable = [
      'trgAfterTicketDelete'
    ];

    for (let trigger of triggersToDisable) {
      try {
        await connection.execute(`ALTER TRIGGER ${trigger} DISABLE`);
        console.log(`⏸  Disabled trigger: ${trigger}`);
      } catch (err) {
        // Trigger might not exist, that's fine
        console.log(`⚠  Trigger ${trigger} not found or already disabled`);
      }
    }

    // Step 2: Clear all tables in correct dependency order (child → parent)
    const tables = [
      'DeletedTickets',
      'AuditLog',
      'Payment',
      'Ticket',
      'Schedule',
      'Sponsor',
      'Staff',
      'Event',
      'Participant',
      'Organizer',
      'Venue'
    ];

    for (let table of tables) {
      try {
        await connection.execute(`DELETE FROM ${table}`);
        console.log(`✅ Emptied table: ${table}`);
      } catch (err) {
        if (err.message.includes('table or view does not exist')) {
          console.log(`⚠  Table ${table} does not exist, skipping`);
        } else {
          console.error(`❌ Failed to empty table ${table}:`, err.message);
        }
      }
    }

    // Step 3: Re-enable triggers
    for (let trigger of triggersToDisable) {
      try {
        await connection.execute(`ALTER TRIGGER ${trigger} ENABLE`);
        console.log(`▶  Re-enabled trigger: ${trigger}`);
      } catch (err) {
        console.log(`⚠  Could not re-enable trigger ${trigger}`);
      }
    }

    // Commit changes
    await connection.commit();
    console.log("🎉 Database has been completely reset!");

  } catch (err) {
    console.error("Error connecting to database:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
}

resetDatabase();
