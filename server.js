const express = require('express');
const cors = require('cors');
const { getConnection, oracledb } = require('./db');
require('dotenv').config();

const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// ===============================
// GET DASHBOARD
// ===============================
app.get('/dashboard', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();

    const eventsResult = await connection.execute('SELECT COUNT(*) AS count FROM Event');
    const ticketsResult = await connection.execute('SELECT COUNT(*) AS count FROM Ticket');
    const sponsorsResult = await connection.execute('SELECT COUNT(*) AS count FROM Sponsor');
    const staffResult = await connection.execute('SELECT COUNT(*) AS count FROM Staff');
    const participantsResult = await connection.execute('SELECT COUNT(*) AS count FROM Participant');

    res.json({
      events: eventsResult.rows[0][0],
      tickets: ticketsResult.rows[0][0],
      sponsors: sponsorsResult.rows[0][0],
      staff: staffResult.rows[0][0],
      participants: participantsResult.rows[0][0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

// ===============================
// GET EVENTS
// ===============================
app.get('/events', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT 
         event_id, 
         event_name, 
         TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
         event_time,
         venue_name,
         location,
         event_type,
         budget
       FROM vw_event_details 
       ORDER BY event_date ASC`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    // Explicitly lowercase all keys before sending to frontend
    const lowerCaseRows = result.rows.map(row => {
      const newRow = {};
      for (let key in row) {
        newRow[key.toLowerCase()] = row[key];
      }
      return newRow;
    });

    res.json(lowerCaseRows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

// ===============================
// POST BOOKING
// ===============================
app.get('/test', (req, res) => res.send('Server running!'));

app.post('/booking', async (req, res) => {
  const { name, email, phone, event, ticketType, tickets, paymentMethod } = req.body;
  let connection;

  try {
    connection = await getConnection();

    // 1. Get Event ID
    const eventRes = await connection.execute(
      `SELECT event_id FROM Event WHERE event_name = :eventName`,
      [event]
    );

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    const eventId = eventRes.rows[0][0];

    // 2. Handle Participant
    let participantId;
    const partRes = await connection.execute(
      `SELECT participant_id FROM Participant WHERE email = :email`,
      [email]
    );

    if (partRes.rows.length > 0) {
      participantId = partRes.rows[0][0];
    } else {
      // Get new Participant ID
      const newPartIdRes = await connection.execute(`SELECT NVL(MAX(participant_id), 0) + 1 FROM Participant`);
      participantId = newPartIdRes.rows[0][0];

      await connection.execute(
        `INSERT INTO Participant (participant_id, full_name, gender, email, phone_number, address)
         VALUES (:1, :2, :3, :4, :5, :6)`,
        [participantId, name, 'M', email, phone, 'Not Provided'] // Hardcoded gender/address as they aren't in the form
      );
    }

    // 3. Handle Tickets
    const numTickets = parseInt(tickets) || 1;
    const ticketPrice = ticketType.toUpperCase() === 'VIP' ? 5000 : 2000;

    for (let i = 0; i < numTickets; i++) {
      const newTicketIdRes = await connection.execute(`SELECT NVL(MAX(ticket_id), 0) + 1 FROM Ticket`);
      const ticketId = newTicketIdRes.rows[0][0];

      await connection.execute(
        `INSERT INTO Ticket (ticket_id, participant_id, event_id, ticket_type, price, booking_date)
         VALUES (:1, :2, :3, :4, :5, SYSDATE)`,
        [ticketId, participantId, eventId, ticketType, ticketPrice]
      );
    }

    // 4. Handle Payment
    const totalAmount = ticketPrice * numTickets;
    const newPayIdRes = await connection.execute(`SELECT NVL(MAX(payment_id), 0) + 1 FROM Payment`);
    const paymentId = newPayIdRes.rows[0][0];

    await connection.execute(
      `INSERT INTO Payment (payment_id, participant_id, amount, payment_method, payment_date, payment_status)
       VALUES (:1, :2, :3, :4, SYSDATE, :5)`,
      [paymentId, participantId, totalAmount, paymentMethod, 'Pending']
    );

    res.json({ message: 'Booking confirmed successfully!' });
  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ error: 'Database error while saving booking.' });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
});

// ===============================
// GET VENUES (For Admin Form)
// ===============================
app.get('/venues', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(`SELECT venue_id, venue_name FROM Venue`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const lowerCaseRows = result.rows.map(row => {
      const newRow = {};
      for (let key in row) newRow[key.toLowerCase()] = row[key];
      return newRow;
    });
    res.json(lowerCaseRows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// GET ORGANIZERS (For Admin Form)
// ===============================
app.get('/organizers', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(`SELECT organizer_id, organizer_name FROM Organizer`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const lowerCaseRows = result.rows.map(row => {
      const newRow = {};
      for (let key in row) newRow[key.toLowerCase()] = row[key];
      return newRow;
    });
    res.json(lowerCaseRows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// GET BOOKINGS (Admin View)
// ===============================
app.get('/admin/bookings', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(`
      SELECT ticket_id, participant_name, participant_email, event_name, 
             TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date, ticket_type, price, 
             TO_CHAR(booking_date, 'YYYY-MM-DD') AS booking_date
      FROM vw_ticket_bookings
      ORDER BY ticket_id DESC
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    const lowerCaseRows = result.rows.map(row => {
      const newRow = {};
      for (let key in row) newRow[key.toLowerCase()] = row[key];
      return newRow;
    });
    res.json(lowerCaseRows);
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// POST NEW EVENT (Admin Panel)
// ===============================
app.post('/admin/events', async (req, res) => {
  const { event_name, event_date, event_time, event_type, budget, venue_id, organizer_id } = req.body;
  let connection;
  try {
    connection = await getConnection();
    
    const newIdRes = await connection.execute(`SELECT NVL(MAX(event_id), 0) + 1 FROM Event`);
    const eventId = newIdRes.rows[0][0];

    await connection.execute(
      `INSERT INTO Event (event_id, event_name, event_date, event_time, event_type, budget, venue_id, organizer_id)
       VALUES (:1, :2, TO_DATE(:3, 'YYYY-MM-DD'), :4, :5, :6, :7, :8)`,
      [eventId, event_name, event_date, event_time, event_type, budget, venue_id, organizer_id]
    );

    res.json({ message: 'Event created successfully!' });
  } catch (err) {
    console.error('Add Event Error:', err);
    res.status(500).json({ error: 'Database error while saving event.' });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// PHASE 4: PL/SQL PROCEDURES & FUNCTIONS
// ===============================

// ===============================
// PROCEDURE 1: Register Participant (with validation)
// ===============================
app.post('/plsql/registerParticipant', async (req, res) => {
  const { fullName, gender, email, phone, address } = req.body;
  let connection;
  try {
    connection = await getConnection();
    
    // Call PL/SQL Procedure
    const result = await connection.execute(
      `BEGIN procRegisterParticipant(:fullName, :gender, :email, :phone, :address); END;`,
      {
        fullName: fullName,
        gender: gender,
        email: email,
        phone: phone,
        address: address
      }
    );

    res.json({ success: true, message: 'Participant registered successfully!' });
  } catch (err) {
    console.error('Register Error:', err);
    
    // Check for specific error messages from PL/SQL
    if (err.message.includes('Invalid gender')) {
      res.status(400).json({ error: 'Invalid gender. Must be M or F.' });
    } else if (err.message.includes('Email already registered')) {
      res.status(400).json({ error: 'Email already registered.' });
    } else {
      res.status(500).json({ error: 'Database error: ' + err.message });
    }
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// PROCEDURE 2: Process Payment (with ticket booking)
// ===============================
app.post('/plsql/processPayment', async (req, res) => {
  const { participantId, ticketIds, totalAmount, paymentMethod } = req.body;
  let connection;
  try {
    connection = await getConnection();
    
    // Call PL/SQL Procedure
    await connection.execute(
      `BEGIN procProcessPayment(:participantId, :ticketIds, :totalAmount, :paymentMethod); END;`,
      {
        participantId: participantId,
        ticketIds: ticketIds.join(','),
        totalAmount: totalAmount,
        paymentMethod: paymentMethod
      }
    );

    res.json({ success: true, message: 'Payment processed successfully!' });
  } catch (err) {
    console.error('Payment Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// FUNCTION: Calculate Total Event Revenue
// ===============================
app.get('/plsql/eventRevenue/:eventId', async (req, res) => {
  const { eventId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT fnCalculateTotalEventRevenue(:eventId) AS revenue FROM DUAL`,
      [eventId]
    );

    const revenue = result.rows[0][0];
    res.json({ eventId: eventId, totalRevenue: revenue });
  } catch (err) {
    console.error('Revenue Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// FUNCTION: Get Event Organizer Name
// ===============================
app.get('/plsql/eventOrganizer/:eventId', async (req, res) => {
  const { eventId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT fnGetEventOrganizerName(:eventId) AS organizerName FROM DUAL`,
      [eventId]
    );

    const organizerName = result.rows[0][0];
    res.json({ eventId: eventId, organizerName: organizerName });
  } catch (err) {
    console.error('Organizer Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// FUNCTION: Get Participant Ticket Count
// ===============================
app.get('/plsql/participantTickets/:participantId', async (req, res) => {
  const { participantId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    const result = await connection.execute(
      `SELECT fnGetParticipantTicketCount(:participantId) AS ticketCount FROM DUAL`,
      [participantId]
    );

    const ticketCount = result.rows[0][0];
    res.json({ participantId: participantId, ticketCount: ticketCount });
  } catch (err) {
    console.error('Ticket Count Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// ADMIN: Get Event Summary (Package Procedure)
// ===============================
app.get('/admin/plsql/eventSummary/:eventId', async (req, res) => {
  const { eventId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    // Call Package Procedure
    const eventDetails = await connection.execute(
      `SELECT event_id, event_name, event_date, event_time, event_type, budget, venue_id, organizer_id
       FROM Event WHERE event_id = :eventId`,
      [eventId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (eventDetails.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventDetails.rows[0];
    const revenue = await connection.execute(
      `SELECT fnCalculateTotalEventRevenue(:eventId) AS revenue FROM DUAL`,
      [eventId]
    );

    res.json({
      eventId: event.EVENT_ID,
      eventName: event.EVENT_NAME,
      eventDate: event.EVENT_DATE,
      eventTime: event.EVENT_TIME,
      eventType: event.EVENT_TYPE,
      budget: event.BUDGET,
      revenue: revenue.rows[0][0],
      profit: revenue.rows[0][0] - event.BUDGET
    });
  } catch (err) {
    console.error('Event Summary Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// ADMIN: Get Venue Occupancy Report (Cursor-based)
// ===============================
app.get('/admin/plsql/venueOccupancy/:venueId', async (req, res) => {
  const { venueId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    // Get venue details and events
    const venueRes = await connection.execute(
      `SELECT venue_id, venue_name, capacity, location FROM Venue WHERE venue_id = :venueId`,
      [venueId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (venueRes.rows.length === 0) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    const venue = venueRes.rows[0];

    // Get events at this venue
    const eventsRes = await connection.execute(
      `SELECT event_id, event_name, TO_CHAR(event_date, 'YYYY-MM-DD') AS event_date,
              (SELECT COUNT(*) FROM Ticket WHERE event_id = Event.event_id) AS attendees
       FROM Event WHERE venue_id = :venueId ORDER BY event_date DESC`,
      [venueId],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({
      venue: {
        venueId: venue.VENUE_ID,
        venueName: venue.VENUE_NAME,
        capacity: venue.CAPACITY,
        location: venue.LOCATION
      },
      events: eventsRes.rows.map(row => ({
        eventId: row.EVENT_ID,
        eventName: row.EVENT_NAME,
        eventDate: row.EVENT_DATE,
        attendees: row.ATTENDEES || 0,
        occupancyRate: `${Math.round((row.ATTENDEES || 0) / venue.CAPACITY * 100)}%`
      }))
    });
  } catch (err) {
    console.error('Venue Occupancy Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// ADMIN: Bulk Ticket Generation (Package Procedure)
// ===============================
app.post('/admin/plsql/bulkTicketGeneration', async (req, res) => {
  const { eventId, quantity, ticketType, price } = req.body;
  let connection;
  try {
    connection = await getConnection();
    
    let generatedTickets = 0;
    for (let i = 0; i < quantity; i++) {
      const newTicketIdRes = await connection.execute(`SELECT NVL(MAX(ticket_id), 0) + 1 FROM Ticket`);
      const ticketId = newTicketIdRes.rows[0][0];

      await connection.execute(
        `INSERT INTO Ticket (ticket_id, event_id, ticket_type, price, booking_date)
         VALUES (:1, :2, :3, :4, SYSDATE)`,
        [ticketId, eventId, ticketType, price]
      );
      generatedTickets++;
    }

    res.json({ 
      success: true, 
      message: `Generated ${generatedTickets} tickets successfully!`,
      ticketsGenerated: generatedTickets
    });
  } catch (err) {
    console.error('Bulk Generation Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// ADMIN: Calculate Event Profit (Package Function)
// ===============================
app.get('/admin/plsql/eventProfit/:eventId', async (req, res) => {
  const { eventId } = req.params;
  let connection;
  try {
    connection = await getConnection();
    
    // Get event budget and revenue
    const eventRes = await connection.execute(
      `SELECT budget FROM Event WHERE event_id = :eventId`,
      [eventId]
    );

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const budget = eventRes.rows[0][0];
    const revenueRes = await connection.execute(
      `SELECT fnCalculateTotalEventRevenue(:eventId) AS revenue FROM DUAL`,
      [eventId]
    );

    const revenue = revenueRes.rows[0][0];
    const profit = revenue - budget;

    res.json({
      eventId: eventId,
      budget: budget,
      revenue: revenue,
      profit: profit,
      profitMargin: `${(profit / revenue * 100).toFixed(2)}%`
    });
  } catch (err) {
    console.error('Profit Calculation Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// GET ALL PARTICIPANTS (for Lookup directory)
// ===============================
app.get('/admin/participants', async (req, res) => {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(
      `SELECT participant_id, full_name, email, phone_number FROM Participant ORDER BY participant_id ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    const rows = result.rows.map(row => {
      const r = {};
      for (let key in row) r[key.toLowerCase()] = row[key];
      return r;
    });
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

// ===============================
// GET PARTICIPANT TICKET DETAILS (full info)
// ===============================
app.get('/admin/participantDetails/:participantId', async (req, res) => {
  const { participantId } = req.params;
  let connection;
  try {
    connection = await getConnection();

    // Get participant info
    const partRes = await connection.execute(
      `SELECT participant_id, full_name, email, phone_number, address FROM Participant WHERE participant_id = :id`,
      [participantId], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (partRes.rows.length === 0) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const participant = {};
    for (let key in partRes.rows[0]) participant[key.toLowerCase()] = partRes.rows[0][key];

    // Get their tickets with event + venue details
    const ticketsRes = await connection.execute(
      `SELECT 
         t.ticket_id, t.ticket_type, t.price, TO_CHAR(t.booking_date, 'YYYY-MM-DD') AS booking_date,
         e.event_name, TO_CHAR(e.event_date, 'YYYY-MM-DD') AS event_date, e.event_time, e.event_type,
         v.venue_name, v.location AS venue_city
       FROM Ticket t
       JOIN Event e ON t.event_id = e.event_id
       LEFT JOIN Venue v ON e.venue_id = v.venue_id
       WHERE t.participant_id = :id
       ORDER BY t.ticket_id ASC`,
      [participantId], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const tickets = ticketsRes.rows.map(row => {
      const r = {};
      for (let key in row) r[key.toLowerCase()] = row[key];
      return r;
    });

    res.json({ participant, tickets, ticketCount: tickets.length });
  } catch (err) {
    console.error('Participant Details Error:', err);
    res.status(500).json({ error: 'Database error: ' + err.message });
  } finally {
    if (connection) { try { await connection.close(); } catch(e){} }
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
