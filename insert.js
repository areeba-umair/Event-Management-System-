const { getConnection } = require('./db');

const queries = [
  // 1. Venue
  "INSERT INTO Venue VALUES (1, 'Pearl Continental Hall', 'Lahore', 500, 150000, 'Available')",
  "INSERT INTO Venue VALUES (2, 'Expo Centre', 'Karachi', 1000, 300000, 'Booked')",
  "INSERT INTO Venue VALUES (3, 'Jinnah Convention Centre', 'Islamabad', 800, 250000, 'Available')",
  "INSERT INTO Venue VALUES (4, 'Faletti Hotel Ballroom', 'Lahore', 300, 120000, 'Booked')",
  "INSERT INTO Venue VALUES (5, 'Serena Hotel Hall', 'Quetta', 400, 180000, 'Available')",

  // 2. Organizer
  "INSERT INTO Organizer VALUES (1, 'Ahmed Raza', 'ahmed.raza@gmail.com', '03001234567', 5, 80000)",
  "INSERT INTO Organizer VALUES (2, 'Sara Khan', 'sara.khan@gmail.com', '03111234567', 3, 60000)",
  "INSERT INTO Organizer VALUES (3, 'Bilal Hussain', 'bilal.h@gmail.com', '03211234567', 8, 100000)",
  "INSERT INTO Organizer VALUES (4, 'Nida Fatima', 'nida.f@gmail.com', '03311234567', 2, 50000)",
  "INSERT INTO Organizer VALUES (5, 'Usman Ali', 'usman.ali@gmail.com', '03451234567', 6, 90000)",

  // 3. Participant
  "INSERT INTO Participant VALUES (1, 'Ali Hassan', 'M', 'ali.hassan@gmail.com', '03021111111', 'House 5, Gulberg, Lahore')",
  "INSERT INTO Participant VALUES (2, 'Fatima Malik', 'F', 'fatima.malik@gmail.com', '03022222222', 'Flat 3, Clifton, Karachi')",
  "INSERT INTO Participant VALUES (3, 'Hamza Tariq', 'M', 'hamza.tariq@gmail.com', '03023333333', 'Street 7, F-10, Islamabad')",
  "INSERT INTO Participant VALUES (4, 'Ayesha Noor', 'F', 'ayesha.noor@gmail.com', '03024444444', 'Block B, DHA, Lahore')",
  "INSERT INTO Participant VALUES (5, 'Zain Ul Abideen', 'M', 'zain.abideen@gmail.com', '03025555555', 'Sector G, Quetta')",
  "INSERT INTO Participant VALUES (6, 'Sana Javed', 'F', 'sana.javed@gmail.com', '03026666666', 'Model Town, Lahore')",

  // 4. Event
  "INSERT INTO Event VALUES (1, 'Tech Summit 2025', DATE '2025-06-15', '10:00 AM', 'Conference', 500000, 1, 1)",
  "INSERT INTO Event VALUES (2, 'Music Festival', DATE '2025-07-20', '06:00 PM', 'Entertainment', 800000, 2, 2)",
  "INSERT INTO Event VALUES (3, 'Business Expo', DATE '2025-08-10', '09:00 AM', 'Exhibition', 600000, 3, 3)",
  "INSERT INTO Event VALUES (4, 'Food Carnival', DATE '2025-09-05', '12:00 PM', 'Festival', 400000, 4, 4)",
  "INSERT INTO Event VALUES (5, 'Sports Gala', DATE '2025-10-01', '08:00 AM', 'Sports', 350000, 5, 5)",

  // 5. Staff
  "INSERT INTO Staff VALUES (1, 'Kamran Malik', 'Security', '03031111111', 'Morning', 1)",
  "INSERT INTO Staff VALUES (2, 'Rabia Saleem', 'Receptionist', '03032222222', 'Evening', 1)",
  "INSERT INTO Staff VALUES (3, 'Tariq Mehmood', 'Technician', '03033333333', 'Morning', 2)",
  "INSERT INTO Staff VALUES (4, 'Amna Iqbal', 'Coordinator', '03034444444', 'Evening', 2)",
  "INSERT INTO Staff VALUES (5, 'Danish Saeed', 'Security', '03035555555', 'Night', 3)",
  "INSERT INTO Staff VALUES (6, 'Maham Zahid', 'Receptionist', '03036666666', 'Morning', 3)",

  // 6. Schedule
  "INSERT INTO Schedule VALUES (1, 1, 'Opening Ceremony', '10:00 AM', '11:00 AM', 'Dr. Arif Alvi')",
  "INSERT INTO Schedule VALUES (2, 1, 'AI & Future Tech', '11:00 AM', '01:00 PM', 'Umar Saif')",
  "INSERT INTO Schedule VALUES (3, 2, 'Live Concert', '06:00 PM', '08:00 PM', 'Atif Aslam')",
  "INSERT INTO Schedule VALUES (4, 2, 'DJ Night', '08:00 PM', '11:00 PM', 'DJ Awais')",
  "INSERT INTO Schedule VALUES (5, 3, 'Business Keynote', '09:00 AM', '11:00 AM', 'Miftah Ismail')",
  "INSERT INTO Schedule VALUES (6, 4, 'Food Tasting Session', '12:00 PM', '02:00 PM', 'Chef Zakir')",
  "INSERT INTO Schedule VALUES (7, 5, 'Sports Inauguration', '08:00 AM', '09:00 AM', 'Shahid Afridi')",

  // 7. Sponsor
  "INSERT INTO Sponsor VALUES (1, 'Zong', 'Zong Telecom', 200000, '03901111111', 1)",
  "INSERT INTO Sponsor VALUES (2, 'Pepsi', 'PepsiCo Pakistan', 350000, '03902222222', 2)",
  "INSERT INTO Sponsor VALUES (3, 'HBL', 'Habib Bank Limited', 500000, '03903333333', 3)",
  "INSERT INTO Sponsor VALUES (4, 'Nestle', 'Nestle Pakistan', 150000, '03904444444', 4)",
  "INSERT INTO Sponsor VALUES (5, 'Jazz', 'Jazz Telecom', 250000, '03905555555', 5)",
  "INSERT INTO Sponsor VALUES (6, 'Coca Cola', 'Coca Cola Pakistan', 300000, '03906666666', 2)",

  // 8. Ticket (Fixed invalid participant IDs 7 and 8 -> changed to 1 and 2)
  "INSERT INTO Ticket VALUES (1, 1, 1, 'VIP', 5000, DATE '2025-05-01')",
  "INSERT INTO Ticket VALUES (2, 2, 1, 'Regular', 2000, DATE '2025-05-02')",
  "INSERT INTO Ticket VALUES (3, 3, 2, 'VIP', 8000, DATE '2025-05-03')",
  "INSERT INTO Ticket VALUES (4, 4, 2, 'Regular', 3000, DATE '2025-05-04')",
  "INSERT INTO Ticket VALUES (5, 5, 3, 'VIP', 6000, DATE '2025-05-05')",
  "INSERT INTO Ticket VALUES (6, 6, 3, 'Regular', 2500, DATE '2025-05-06')",
  "INSERT INTO Ticket VALUES (7, 1, 4, 'Regular', 1500, DATE '2025-05-07')",
  "INSERT INTO Ticket VALUES (8, 2, 5, 'VIP', 4000, DATE '2025-05-08')",

  // 9. Payment (Fixed invalid participant IDs 7 and 8 -> changed to 1 and 2)
  "INSERT INTO Payment VALUES (1, 1, 5000, 'Card', DATE '2025-05-01', 'Paid')",
  "INSERT INTO Payment VALUES (2, 2, 2000, 'Cash', DATE '2025-05-02', 'Paid')",
  "INSERT INTO Payment VALUES (3, 3, 8000, 'Online', DATE '2025-05-03', 'Paid')",
  "INSERT INTO Payment VALUES (4, 4, 3000, 'Card', DATE '2025-05-04', 'Pending')",
  "INSERT INTO Payment VALUES (5, 5, 6000, 'Online', DATE '2025-05-05', 'Paid')",
  "INSERT INTO Payment VALUES (6, 6, 2500, 'Cash', DATE '2025-05-06', 'Pending')",
  "INSERT INTO Payment VALUES (7, 1, 1500, 'Card', DATE '2025-05-07', 'Paid')",
  "INSERT INTO Payment VALUES (8, 2, 4000, 'Online', DATE '2025-05-08', 'Paid')"
];

async function insertSampleData() {
  let connection;
  try {
    connection = await getConnection();
    console.log("Connected to Database. Running predefined inserts...");

    let insertedCount = 0;

    for (let query of queries) {
      try {
        await connection.execute(query);
        insertedCount++;
        console.log(`✅ Inserted row ${insertedCount}`);
      } catch (err) {
        console.error(`❌ Failed to run query: ${query}`);
        console.error("Reason:", err.message);
      }
    }

    await connection.commit();
    console.log(`🎉 Successfully inserted ${insertedCount} rows of sample data!`);

  } catch (err) {
    console.error("Database connection error:", err);
  } finally {
    if (connection) {
      try { await connection.close(); } catch (err) { console.error(err); }
    }
  }
}

insertSampleData();
