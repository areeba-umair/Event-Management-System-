CREATE TABLE Venue (
    venue_id            NUMBER(10)    PRIMARY KEY,
    venue_name          VARCHAR2(100) NOT NULL,
    location            VARCHAR2(150) NOT NULL,
    capacity            NUMBER(5)     CHECK (capacity > 0),
    booking_cost        NUMBER(10)    CHECK (booking_cost > 0),
    availability_status VARCHAR2(20)  CHECK (availability_status IN ('Available', 'Booked'))
);
CREATE TABLE Organizer (
    organizer_id   NUMBER(10)    PRIMARY KEY,
    organizer_name VARCHAR2(100) NOT NULL,
    email          VARCHAR2(100) UNIQUE,
    phone_number   VARCHAR2(15)  UNIQUE,
    experience     NUMBER(2)     CHECK (experience >= 0),
    salary         NUMBER(10)    CHECK (salary > 0)
);
CREATE TABLE Event (
    event_id     NUMBER(10)    PRIMARY KEY,
    event_name   VARCHAR2(100) NOT NULL,
    event_date   DATE          NOT NULL,
    event_time   VARCHAR2(20)  NOT NULL,
    event_type   VARCHAR2(50)  NOT NULL,
    budget       NUMBER(10)    CHECK (budget > 0),
    venue_id     NUMBER(10)    REFERENCES Venue(venue_id) ON DELETE SET NULL,
    organizer_id NUMBER(10)    REFERENCES Organizer(organizer_id) ON DELETE SET NULL
);
CREATE TABLE Participant (
    participant_id NUMBER(10)    PRIMARY KEY,
    full_name      VARCHAR2(100) NOT NULL,
    gender         CHAR(1)       CHECK (gender IN ('M', 'F')),
    email          VARCHAR2(100) UNIQUE,
    phone_number   VARCHAR2(15)  UNIQUE,
    address        VARCHAR2(200) NOT NULL
);
CREATE TABLE Ticket (
    ticket_id      NUMBER(10)   PRIMARY KEY,
    participant_id NUMBER(10)   NOT NULL REFERENCES Participant(participant_id) ON DELETE CASCADE,
    event_id       NUMBER(10)   NOT NULL REFERENCES Event(event_id) ON DELETE CASCADE,
    ticket_type    VARCHAR2(30) NOT NULL,
    price          NUMBER(8)    CHECK (price > 0),
    booking_date   DATE         NOT NULL
);
CREATE TABLE Payment (
    payment_id     NUMBER(10)   PRIMARY KEY,
    participant_id NUMBER(10)   REFERENCES Participant(participant_id) ON DELETE SET NULL,
    amount         NUMBER(10)   CHECK (amount > 0),
    payment_method VARCHAR2(30) NOT NULL,
    payment_date   DATE         NOT NULL,
    payment_status VARCHAR2(20) CHECK (payment_status IN ('Paid', 'Pending'))
);
CREATE TABLE Staff (
    staff_id     NUMBER(10)    PRIMARY KEY,
    full_name    VARCHAR2(100) NOT NULL,
    role         VARCHAR2(50)  NOT NULL,
    phone_number VARCHAR2(15)  UNIQUE,
    shift_time   VARCHAR2(30)  NOT NULL,
    organizer_id NUMBER(10)    REFERENCES Organizer(organizer_id) ON DELETE SET NULL
);
CREATE TABLE Schedule (
    schedule_id  NUMBER(10)    PRIMARY KEY,
    event_id     NUMBER(10)    NOT NULL REFERENCES Event(event_id) ON DELETE CASCADE,
    session_name VARCHAR2(100) NOT NULL,
    start_time   VARCHAR2(20)  NOT NULL,
    end_time     VARCHAR2(20)  NOT NULL,
    speaker_name VARCHAR2(100) NOT NULL
);
CREATE TABLE Sponsor (
    sponsor_id     NUMBER(10)    PRIMARY KEY,
    sponsor_name   VARCHAR2(100) NOT NULL,
    company_name   VARCHAR2(100) NOT NULL,
    amount         NUMBER(10)    CHECK (amount > 0),
    contact_number VARCHAR2(15)  UNIQUE,
    event_id       NUMBER(10)    REFERENCES Event(event_id) ON DELETE CASCADE
);
CREATE INDEX idx_event_date ON Event(event_date);
CREATE INDEX idx_participant_email ON Participant(email);
CREATE INDEX idx_payment_status ON Payment(payment_status);
CREATE INDEX idx_ticket_event ON Ticket(event_id);
CREATE OR REPLACE VIEW vw_event_details AS
SELECT 
    e.event_id, e.event_name, e.event_date, e.event_time, e.event_type, e.budget,
    v.venue_name, v.location, v.capacity,
    o.organizer_name, o.phone_number AS organizer_phone
FROM Event e
LEFT JOIN Venue v ON e.venue_id = v.venue_id
LEFT JOIN Organizer o ON e.organizer_id = o.organizer_id;
CREATE OR REPLACE VIEW vw_ticket_bookings AS
SELECT 
    t.ticket_id,
    p.full_name AS participant_name,
    p.email AS participant_email,
    e.event_name, e.event_date,
    t.ticket_type, t.price, t.booking_date
FROM Ticket t
JOIN Participant p ON t.participant_id = p.participant_id
JOIN Event e ON t.event_id = e.event_id;
CREATE OR REPLACE VIEW vw_payment_summary AS
SELECT 
    pay.payment_id,
    p.full_name AS participant_name,
    p.email,
    pay.amount, pay.payment_method, pay.payment_date, pay.payment_status
FROM Payment pay
LEFT JOIN Participant p ON pay.participant_id = p.participant_id;
INSERT INTO Venue VALUES (1, 'Pearl Continental Hall', 'Lahore', 500, 150000, 'Available');
INSERT INTO Venue VALUES (2, 'Expo Centre', 'Karachi', 1000, 300000, 'Booked');
INSERT INTO Venue VALUES (3, 'Jinnah Convention Centre', 'Islamabad', 800, 250000, 'Available');
INSERT INTO Venue VALUES (4, 'Faletti Hotel Ballroom', 'Lahore', 300, 120000, 'Booked');
INSERT INTO Venue VALUES (5, 'Serena Hotel Hall', 'Quetta', 400, 180000, 'Available');
COMMIT;
INSERT INTO Organizer VALUES (1, 'Ahmed Raza', 'ahmed.raza@gmail.com', '03001234567', 5, 80000);
INSERT INTO Organizer VALUES (2, 'Sara Khan', 'sara.khan@gmail.com', '03111234567', 3, 60000);
INSERT INTO Organizer VALUES (3, 'Bilal Hussain', 'bilal.h@gmail.com', '03211234567', 8, 100000);
INSERT INTO Organizer VALUES (4, 'Nida Fatima', 'nida.f@gmail.com', '03311234567', 2, 50000);
INSERT INTO Organizer VALUES (5, 'Usman Ali', 'usman.ali@gmail.com', '03451234567', 6, 90000);
COMMIT;
INSERT INTO Event VALUES (1, 'Tech Summit 2025', DATE '2025-06-15', '10:00 AM', 'Conference', 500000, 1, 1);
INSERT INTO Event VALUES (2, 'Music Festival', DATE '2025-07-20', '06:00 PM', 'Entertainment', 800000, 2, 2);
INSERT INTO Event VALUES (3, 'Business Expo', DATE '2025-08-10', '09:00 AM', 'Exhibition', 600000, 3, 3);
INSERT INTO Event VALUES (4, 'Food Carnival', DATE '2025-09-05', '12:00 PM', 'Festival', 400000, 4, 4);
INSERT INTO Event VALUES (5, 'Sports Gala', DATE '2025-10-01', '08:00 AM', 'Sports', 350000, 5, 5);
COMMIT;
INSERT INTO Participant VALUES (1, 'Ali Hassan', 'M', 'ali.hassan@gmail.com', '03021111111', 'House 5, Gulberg, Lahore');
INSERT INTO Participant VALUES (2, 'Fatima Malik', 'F', 'fatima.malik@gmail.com', '03022222222', 'Flat 3, Clifton, Karachi');
INSERT INTO Participant VALUES (3, 'Hamza Tariq', 'M', 'hamza.tariq@gmail.com', '03023333333', 'Street 7, F-10, Islamabad');
INSERT INTO Participant VALUES (4, 'Ayesha Noor', 'F', 'ayesha.noor@gmail.com', '03024444444', 'Block B, DHA, Lahore');
INSERT INTO Participant VALUES (5, 'Zain Ul Abideen', 'M', 'zain.abideen@gmail.com', '03025555555', 'Sector G, Quetta');
INSERT INTO Participant VALUES (6, 'Sana Javed', 'F', 'sana.javed@gmail.com', '03026666666', 'Model Town, Lahore');
COMMIT;
INSERT INTO Ticket VALUES (1, 1, 1, 'VIP', 5000, DATE '2025-05-01');
INSERT INTO Ticket VALUES (2, 2, 1, 'Regular', 2000, DATE '2025-05-02');
INSERT INTO Ticket VALUES (3, 3, 2, 'VIP', 8000, DATE '2025-05-03');
INSERT INTO Ticket VALUES (4, 4, 2, 'Regular', 3000, DATE '2025-05-04');
INSERT INTO Ticket VALUES (5, 5, 3, 'VIP', 6000, DATE '2025-05-05');
INSERT INTO Ticket VALUES (6, 6, 3, 'Regular', 2500, DATE '2025-05-06');
INSERT INTO Ticket VALUES (7, 7, 4, 'Regular', 1500, DATE '2025-05-07');
INSERT INTO Ticket VALUES (8, 8, 5, 'VIP', 4000, DATE '2025-05-08');
COMMIT;
INSERT INTO Payment VALUES (1, 1, 5000, 'Card', DATE '2025-05-01', 'Paid');
INSERT INTO Payment VALUES (2, 2, 2000, 'Cash', DATE '2025-05-02', 'Paid');
INSERT INTO Payment VALUES (3, 3, 8000, 'Online', DATE '2025-05-03', 'Paid');
INSERT INTO Payment VALUES (4, 4, 3000, 'Card', DATE '2025-05-04', 'Pending');
INSERT INTO Payment VALUES (5, 5, 6000, 'Online', DATE '2025-05-05', 'Paid');
INSERT INTO Payment VALUES (6, 6, 2500, 'Cash', DATE '2025-05-06', 'Pending');
INSERT INTO Payment VALUES (7, 7, 1500, 'Card', DATE '2025-05-07', 'Paid');
INSERT INTO Payment VALUES (8, 8, 4000, 'Online', DATE '2025-05-08', 'Paid');
COMMIT;
INSERT INTO Staff VALUES (1, 'Kamran Malik', 'Security', '03031111111', 'Morning', 1);
INSERT INTO Staff VALUES (2, 'Rabia Saleem', 'Receptionist', '03032222222', 'Evening', 1);
INSERT INTO Staff VALUES (3, 'Tariq Mehmood', 'Technician', '03033333333', 'Morning', 2);
INSERT INTO Staff VALUES (4, 'Amna Iqbal', 'Coordinator', '03034444444', 'Evening', 2);
INSERT INTO Staff VALUES (5, 'Danish Saeed', 'Security', '03035555555', 'Night', 3);
INSERT INTO Staff VALUES (6, 'Maham Zahid', 'Receptionist', '03036666666', 'Morning', 3);
COMMIT;
INSERT INTO Schedule VALUES (1, 1, 'Opening Ceremony', '10:00 AM', '11:00 AM', 'Dr. Arif Alvi');
INSERT INTO Schedule VALUES (2, 1, 'AI & Future Tech', '11:00 AM', '01:00 PM', 'Umar Saif');
INSERT INTO Schedule VALUES (3, 2, 'Live Concert', '06:00 PM', '08:00 PM', 'Atif Aslam');
INSERT INTO Schedule VALUES (4, 2, 'DJ Night', '08:00 PM', '11:00 PM', 'DJ Awais');
INSERT INTO Schedule VALUES (5, 3, 'Business Keynote', '09:00 AM', '11:00 AM', 'Miftah Ismail');
INSERT INTO Schedule VALUES (6, 4, 'Food Tasting Session', '12:00 PM', '02:00 PM', 'Chef Zakir');
INSERT INTO Schedule VALUES (7, 5, 'Sports Inauguration', '08:00 AM', '09:00 AM', 'Shahid Afridi');
COMMIT;
INSERT INTO Sponsor VALUES (1, 'Zong', 'Zong Telecom', 200000, '03901111111', 1);
INSERT INTO Sponsor VALUES (2, 'Pepsi', 'PepsiCo Pakistan', 350000, '03902222222', 2);
INSERT INTO Sponsor VALUES (3, 'HBL', 'Habib Bank Limited', 500000, '03903333333', 3);
INSERT INTO Sponsor VALUES (4, 'Nestle', 'Nestle Pakistan', 150000, '03904444444', 4);
INSERT INTO Sponsor VALUES (5, 'Jazz', 'Jazz Telecom', 250000, '03905555555', 5);
INSERT INTO Sponsor VALUES (6, 'Coca Cola', 'Coca Cola Pakistan', 300000, '03906666666', 2);
COMMIT;
SELECT * FROM vw_event_details;
SELECT * FROM vw_ticket_bookings;
SELECT * FROM vw_payment_summary;
