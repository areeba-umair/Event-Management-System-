-- ============================================================
-- Project   : Event Management System
-- Script    : 06_PLSQL.sql
-- Group     : Event Management Team
-- Members   : Geniusdevelopers
-- Date      : 2026-05-09
-- Purpose   : PL/SQL Implementation - Procedures, Functions, Triggers, Cursors, Packages
-- ============================================================

SET SERVEROUTPUT ON;

-- ============================================================
-- SECTION 1: STORED PROCEDURES (Minimum 3)
-- ============================================================

-- Procedure 1: procAddEvent (Procedure with IN and OUT parameters)
-- Adds a new event and returns the generated event_id
CREATE OR REPLACE PROCEDURE procAddEvent(
    p_event_name     IN VARCHAR2,
    p_event_date     IN DATE,
    p_event_time     IN VARCHAR2,
    p_event_type     IN VARCHAR2,
    p_budget         IN NUMBER,
    p_venue_id       IN NUMBER,
    p_organizer_id   IN NUMBER,
    p_event_id       OUT NUMBER
)
AS
    v_event_id NUMBER;
BEGIN
    -- Generate new event_id
    SELECT NVL(MAX(event_id), 0) + 1 INTO v_event_id FROM Event;
    
    -- Insert new event
    INSERT INTO Event (event_id, event_name, event_date, event_time, event_type, budget, venue_id, organizer_id)
    VALUES (v_event_id, p_event_name, p_event_date, p_event_time, p_event_type, p_budget, p_venue_id, p_organizer_id);
    
    -- Set output parameter
    p_event_id := v_event_id;
    
    DBMS_OUTPUT.PUT_LINE('Event added successfully with ID: ' || v_event_id);
    COMMIT;
    
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        DBMS_OUTPUT.PUT_LINE('Error: Event ID already exists.');
        RAISE;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error adding event: ' || SQLERRM);
        RAISE;
END procAddEvent;
/

-- Procedure 2: procRegisterParticipant (Procedure with Exception Handling)
-- Registers a new participant with validation
CREATE OR REPLACE PROCEDURE procRegisterParticipant(
    p_full_name    IN VARCHAR2,
    p_gender       IN CHAR,
    p_email        IN VARCHAR2,
    p_phone        IN VARCHAR2,
    p_address      IN VARCHAR2
)
AS
    v_invalid_gender EXCEPTION;
    v_duplicate_email EXCEPTION;
BEGIN
    -- Validate gender
    IF p_gender NOT IN ('M', 'F') THEN
        RAISE v_invalid_gender;
    END IF;
    
    -- Check if email already exists
    IF EXISTS (SELECT 1 FROM Participant WHERE email = p_email) THEN
        RAISE v_duplicate_email;
    END IF;
    
    -- Insert participant
    INSERT INTO Participant (participant_id, full_name, gender, email, phone_number, address)
    VALUES (
        NVL((SELECT MAX(participant_id) FROM Participant), 0) + 1,
        p_full_name,
        p_gender,
        p_email,
        p_phone,
        p_address
    );
    
    DBMS_OUTPUT.PUT_LINE('Participant registered successfully: ' || p_full_name);
    COMMIT;
    
EXCEPTION
    WHEN v_invalid_gender THEN
        DBMS_OUTPUT.PUT_LINE('Error: Invalid gender. Must be M or F.');
        ROLLBACK;
    WHEN v_duplicate_email THEN
        DBMS_OUTPUT.PUT_LINE('Error: Email already registered.');
        ROLLBACK;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error registering participant: ' || SQLERRM);
        ROLLBACK;
END procRegisterParticipant;
/

-- Procedure 3: procProcessPayment (Procedure with Nested Call & Exception Handling)
-- Processes payment and calls another procedure
CREATE OR REPLACE PROCEDURE procProcessPayment(
    p_participant_id  IN NUMBER,
    p_amount          IN NUMBER,
    p_payment_method  IN VARCHAR2,
    p_ticket_id       IN NUMBER,
    p_status          OUT VARCHAR2
)
AS
    v_payment_id NUMBER;
    v_event_id NUMBER;
    v_error EXCEPTION;
BEGIN
    -- Get event_id from ticket
    SELECT event_id INTO v_event_id FROM Ticket WHERE ticket_id = p_ticket_id;
    
    -- Generate payment_id
    SELECT NVL(MAX(payment_id), 0) + 1 INTO v_payment_id FROM Payment;
    
    -- Validate payment method
    IF p_payment_method NOT IN ('Card', 'Cash', 'Online') THEN
        RAISE v_error;
    END IF;
    
    -- Insert payment
    INSERT INTO Payment (payment_id, participant_id, amount, payment_method, payment_date, payment_status)
    VALUES (v_payment_id, p_participant_id, p_amount, p_payment_method, SYSDATE, 'Paid');
    
    -- Call nested procedure to update ticket booking
    procUpdateTicketBooking(p_ticket_id, p_participant_id);
    
    p_status := 'Success';
    DBMS_OUTPUT.PUT_LINE('Payment processed successfully. Payment ID: ' || v_payment_id);
    COMMIT;
    
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        p_status := 'Failed';
        DBMS_OUTPUT.PUT_LINE('Error: Ticket not found.');
        ROLLBACK;
    WHEN v_error THEN
        p_status := 'Failed';
        DBMS_OUTPUT.PUT_LINE('Error: Invalid payment method.');
        ROLLBACK;
    WHEN OTHERS THEN
        p_status := 'Failed';
        DBMS_OUTPUT.PUT_LINE('Error processing payment: ' || SQLERRM);
        ROLLBACK;
END procProcessPayment;
/

-- Procedure 4: procUpdateTicketBooking (Nested Procedure called by procProcessPayment)
-- Updates booking date when payment is processed
CREATE OR REPLACE PROCEDURE procUpdateTicketBooking(
    p_ticket_id      IN NUMBER,
    p_participant_id IN NUMBER
)
AS
BEGIN
    -- Update ticket booking date
    UPDATE Ticket 
    SET participant_id = p_participant_id
    WHERE ticket_id = p_ticket_id;
    
    DBMS_OUTPUT.PUT_LINE('Ticket booking updated for Ticket ID: ' || p_ticket_id);
END procUpdateTicketBooking;
/

-- ============================================================
-- SECTION 2: FUNCTIONS (Minimum 2)
-- ============================================================

-- Function 1: fnCalculateTotalEventRevenue
-- Returns computed value: total revenue for an event
CREATE OR REPLACE FUNCTION fnCalculateTotalEventRevenue(
    p_event_id IN NUMBER
) RETURN NUMBER
AS
    v_total_revenue NUMBER := 0;
BEGIN
    SELECT NVL(SUM(t.price), 0)
    INTO v_total_revenue
    FROM Ticket t
    WHERE t.event_id = p_event_id;
    
    RETURN v_total_revenue;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
    WHEN OTHERS THEN
        DBMS_OUTPUT.PUT_LINE('Error calculating revenue: ' || SQLERRM);
        RETURN 0;
END fnCalculateTotalEventRevenue;
/

-- Function 2: fnGetEventOrganizerName
-- Returns computed value: organizer name for given event
CREATE OR REPLACE FUNCTION fnGetEventOrganizerName(
    p_event_id IN NUMBER
) RETURN VARCHAR2
AS
    v_organizer_name VARCHAR2(100);
BEGIN
    SELECT o.organizer_name
    INTO v_organizer_name
    FROM Event e
    JOIN Organizer o ON e.organizer_id = o.organizer_id
    WHERE e.event_id = p_event_id;
    
    RETURN v_organizer_name;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'Unknown Organizer';
    WHEN OTHERS THEN
        RETURN 'Error retrieving organizer';
END fnGetEventOrganizerName;
/

-- Function 3: fnGetParticipantTicketCount
-- Returns computed value: number of tickets for a participant
CREATE OR REPLACE FUNCTION fnGetParticipantTicketCount(
    p_participant_id IN NUMBER
) RETURN NUMBER
AS
    v_ticket_count NUMBER;
BEGIN
    SELECT COUNT(*)
    INTO v_ticket_count
    FROM Ticket
    WHERE participant_id = p_participant_id;
    
    RETURN v_ticket_count;
EXCEPTION
    WHEN OTHERS THEN
        RETURN 0;
END fnGetParticipantTicketCount;
/

-- ============================================================
-- SECTION 3: TRIGGERS (Minimum 3)
-- ============================================================

-- Table for audit log (for AFTER UPDATE trigger)
CREATE TABLE AuditLog (
    audit_id        NUMBER PRIMARY KEY,
    table_name      VARCHAR2(50),
    operation       VARCHAR2(20),
    old_value       VARCHAR2(500),
    new_value       VARCHAR2(500),
    modified_by     VARCHAR2(50),
    modified_date   DATE
);
/

-- Trigger 1: trgBeforeEventInsert
-- BEFORE INSERT trigger to auto-generate event_id and set default values
CREATE OR REPLACE TRIGGER trgBeforeEventInsert
BEFORE INSERT ON Event
FOR EACH ROW
BEGIN
    IF :NEW.event_id IS NULL THEN
        SELECT NVL(MAX(event_id), 0) + 1 INTO :NEW.event_id FROM Event;
    END IF;
    
    -- Set default budget if not provided
    IF :NEW.budget IS NULL THEN
        :NEW.budget := 100000;
    END IF;
    
    DBMS_OUTPUT.PUT_LINE('Before Insert Trigger: Event ID ' || :NEW.event_id || ' will be created.');
END trgBeforeEventInsert;
/

-- Trigger 2: trgAfterPaymentUpdate
-- AFTER UPDATE trigger to log payment updates in audit log
CREATE OR REPLACE TRIGGER trgAfterPaymentUpdate
AFTER UPDATE ON Payment
FOR EACH ROW
DECLARE
    v_audit_id NUMBER;
BEGIN
    SELECT NVL(MAX(audit_id), 0) + 1 INTO v_audit_id FROM AuditLog;
    
    -- Log the update
    INSERT INTO AuditLog (audit_id, table_name, operation, old_value, new_value, modified_by, modified_date)
    VALUES (
        v_audit_id,
        'Payment',
        'UPDATE',
        'Status: ' || :OLD.payment_status || ', Amount: ' || :OLD.amount,
        'Status: ' || :NEW.payment_status || ', Amount: ' || :NEW.amount,
        USER,
        SYSDATE
    );
    
    DBMS_OUTPUT.PUT_LINE('Payment ' || :NEW.payment_id || ' updated. Status: ' || :NEW.payment_status);
END trgAfterPaymentUpdate;
/

-- Trigger 3: trgAfterTicketDelete
-- AFTER DELETE trigger to archive deleted tickets
CREATE TABLE DeletedTickets (
    ticket_id       NUMBER PRIMARY KEY,
    participant_id  NUMBER,
    event_id        NUMBER,
    ticket_type     VARCHAR2(30),
    price           NUMBER,
    booking_date    DATE,
    deleted_date    DATE
);
/

CREATE OR REPLACE TRIGGER trgAfterTicketDelete
AFTER DELETE ON Ticket
FOR EACH ROW
BEGIN
    -- Archive deleted ticket
    INSERT INTO DeletedTickets (ticket_id, participant_id, event_id, ticket_type, price, booking_date, deleted_date)
    VALUES (:OLD.ticket_id, :OLD.participant_id, :OLD.event_id, :OLD.ticket_type, :OLD.price, :OLD.booking_date, SYSDATE);
    
    DBMS_OUTPUT.PUT_LINE('Ticket ' || :OLD.ticket_id || ' archived in DeletedTickets.');
END trgAfterTicketDelete;
/

-- ============================================================
-- SECTION 4: CURSORS (Minimum 2)
-- ============================================================

-- Cursor 1: Explicit Cursor with OPEN, FETCH, CLOSE
-- fnProcessEventParticipants - Process all participants for an event
CREATE OR REPLACE PROCEDURE procProcessEventParticipants(
    p_event_id IN NUMBER
)
AS
    CURSOR c_participants IS
        SELECT p.participant_id, p.full_name, p.email, t.ticket_type
        FROM Participant p
        JOIN Ticket t ON p.participant_id = t.participant_id
        WHERE t.event_id = p_event_id;
    
    v_participant_id NUMBER;
    v_full_name VARCHAR2(100);
    v_email VARCHAR2(100);
    v_ticket_type VARCHAR2(30);
BEGIN
    DBMS_OUTPUT.PUT_LINE('Processing Participants for Event ID: ' || p_event_id);
    DBMS_OUTPUT.PUT_LINE('-------------------------------------------');
    
    OPEN c_participants;
    LOOP
        FETCH c_participants INTO v_participant_id, v_full_name, v_email, v_ticket_type;
        EXIT WHEN c_participants%NOTFOUND;
        
        DBMS_OUTPUT.PUT_LINE('Participant: ' || v_full_name || ' | Email: ' || v_email || ' | Ticket Type: ' || v_ticket_type);
    END LOOP;
    CLOSE c_participants;
    
    DBMS_OUTPUT.PUT_LINE('-------------------------------------------');
    DBMS_OUTPUT.PUT_LINE('Processing Complete.');
    COMMIT;
END procProcessEventParticipants;
/

-- Cursor 2: Parameterized Cursor
-- procGenerateVenueOccupancyReport - Get occupancy for specific date range
CREATE OR REPLACE PROCEDURE procGenerateVenueOccupancyReport(
    p_start_date IN DATE,
    p_end_date   IN DATE
)
AS
    CURSOR c_venue_occupancy(p_start DATE, p_end DATE) IS
        SELECT v.venue_id, v.venue_name, v.capacity, COUNT(DISTINCT e.event_id) as booked_events
        FROM Venue v
        LEFT JOIN Event e ON v.venue_id = e.venue_id 
            AND e.event_date BETWEEN p_start AND p_end
        GROUP BY v.venue_id, v.venue_name, v.capacity
        ORDER BY booked_events DESC;
    
    v_venue_id NUMBER;
    v_venue_name VARCHAR2(100);
    v_capacity NUMBER;
    v_booked_events NUMBER;
BEGIN
    DBMS_OUTPUT.PUT_LINE('Venue Occupancy Report from ' || p_start_date || ' to ' || p_end_date);
    DBMS_OUTPUT.PUT_LINE('==================================================');
    
    FOR rec IN c_venue_occupancy(p_start_date, p_end_date) LOOP
        DBMS_OUTPUT.PUT_LINE('Venue: ' || rec.venue_name || ' | Capacity: ' || rec.capacity || ' | Booked Events: ' || rec.booked_events);
    END LOOP;
    
    DBMS_OUTPUT.PUT_LINE('==================================================');
END procGenerateVenueOccupancyReport;
/

-- ============================================================
-- SECTION 5: PACKAGE (Minimum 1)
-- ============================================================

-- Package: pkgEventManagement
-- Contains procedures, functions, and package-level variables
CREATE OR REPLACE PACKAGE pkgEventManagement AS
    -- Package-level variable to track total events processed
    g_total_events_processed NUMBER := 0;
    
    -- Package-level constant
    MAX_EVENTS_PER_VENUE CONSTANT NUMBER := 100;
    
    -- Package procedures
    PROCEDURE procGetEventSummary(p_event_id IN NUMBER);
    PROCEDURE procBulkTicketGeneration(p_event_id IN NUMBER, p_num_tickets IN NUMBER);
    
    -- Package function
    FUNCTION fnCalculateEventProfit(p_event_id IN NUMBER) RETURN NUMBER;
    
END pkgEventManagement;
/

-- Package Body Implementation
CREATE OR REPLACE PACKAGE BODY pkgEventManagement AS

    -- Procedure 1: Get Event Summary
    PROCEDURE procGetEventSummary(p_event_id IN NUMBER)
    AS
        v_event_name VARCHAR2(100);
        v_event_date DATE;
        v_total_tickets NUMBER;
        v_total_revenue NUMBER;
        v_organizer_name VARCHAR2(100);
    BEGIN
        SELECT e.event_name, e.event_date, e.organizer_id
        INTO v_event_name, v_event_date, v_organizer_name
        FROM Event e
        WHERE e.event_id = p_event_id;
        
        SELECT COUNT(*) INTO v_total_tickets FROM Ticket WHERE event_id = p_event_id;
        SELECT NVL(SUM(price), 0) INTO v_total_revenue FROM Ticket WHERE event_id = p_event_id;
        
        DBMS_OUTPUT.PUT_LINE('=== Event Summary ===');
        DBMS_OUTPUT.PUT_LINE('Event: ' || v_event_name);
        DBMS_OUTPUT.PUT_LINE('Date: ' || v_event_date);
        DBMS_OUTPUT.PUT_LINE('Total Tickets: ' || v_total_tickets);
        DBMS_OUTPUT.PUT_LINE('Total Revenue: PKR ' || v_total_revenue);
        
        g_total_events_processed := g_total_events_processed + 1;
    END procGetEventSummary;
    
    -- Procedure 2: Bulk Ticket Generation
    PROCEDURE procBulkTicketGeneration(p_event_id IN NUMBER, p_num_tickets IN NUMBER)
    AS
        v_ticket_id NUMBER;
        v_participant_id NUMBER;
        v_price NUMBER;
        i NUMBER := 1;
    BEGIN
        DBMS_OUTPUT.PUT_LINE('Generating ' || p_num_tickets || ' tickets for Event ' || p_event_id);
        
        FOR i IN 1..p_num_tickets LOOP
            SELECT NVL(MAX(ticket_id), 0) + 1 INTO v_ticket_id FROM Ticket;
            SELECT NVL(MAX(participant_id), 0) + 1 INTO v_participant_id FROM Participant;
            v_price := 2000 + (i * 100);
            
            INSERT INTO Ticket (ticket_id, participant_id, event_id, ticket_type, price, booking_date)
            VALUES (v_ticket_id, v_participant_id, p_event_id, 'Regular', v_price, SYSDATE);
        END LOOP;
        
        COMMIT;
        DBMS_OUTPUT.PUT_LINE(p_num_tickets || ' tickets generated successfully.');
    END procBulkTicketGeneration;
    
    -- Function: Calculate Event Profit
    FUNCTION fnCalculateEventProfit(p_event_id IN NUMBER) RETURN NUMBER
    AS
        v_revenue NUMBER;
        v_budget NUMBER;
        v_profit NUMBER;
    BEGIN
        SELECT budget INTO v_budget FROM Event WHERE event_id = p_event_id;
        SELECT NVL(SUM(price), 0) INTO v_revenue FROM Ticket WHERE event_id = p_event_id;
        
        v_profit := v_revenue - v_budget;
        RETURN v_profit;
    EXCEPTION
        WHEN OTHERS THEN
            RETURN 0;
    END fnCalculateEventProfit;
    
END pkgEventManagement;
/

-- ============================================================
-- SECTION 6: ANONYMOUS PL/SQL BLOCKS (Minimum 2)
-- ============================================================

-- Anonymous Block 1: IF-ELSIF-ELSE, Loop, and Exception Handling
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Anonymous Block 1: Event Status Report ===');
    
    DECLARE
        v_total_events NUMBER;
        v_total_participants NUMBER;
        v_event_status VARCHAR2(50);
    BEGIN
        SELECT COUNT(*) INTO v_total_events FROM Event;
        SELECT COUNT(*) INTO v_total_participants FROM Participant;
        
        -- IF-ELSIF-ELSE demonstration
        IF v_total_events > 10 THEN
            v_event_status := 'High Activity';
        ELSIF v_total_events > 5 THEN
            v_event_status := 'Medium Activity';
        ELSE
            v_event_status := 'Low Activity';
        END IF;
        
        DBMS_OUTPUT.PUT_LINE('Total Events: ' || v_total_events);
        DBMS_OUTPUT.PUT_LINE('Total Participants: ' || v_total_participants);
        DBMS_OUTPUT.PUT_LINE('Event Status: ' || v_event_status);
        
        -- FOR loop demonstration
        DBMS_OUTPUT.PUT_LINE('Event IDs: ');
        FOR i IN 1..v_total_events LOOP
            DBMS_OUTPUT.PUT(i || ' ');
        END LOOP;
        DBMS_OUTPUT.NEW_LINE;
        
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error in Anonymous Block 1: ' || SQLERRM);
    END;
END;
/

-- Anonymous Block 2: Call Stored Procedures and Demonstrate Output
BEGIN
    DBMS_OUTPUT.PUT_LINE('=== Anonymous Block 2: Calling Stored Procedures ===');
    
    DECLARE
        v_event_id NUMBER;
        v_payment_status VARCHAR2(50);
    BEGIN
        -- Call procAddEvent
        procAddEvent(
            'Tech Innovation Summit',
            DATE '2025-11-15',
            '10:00 AM',
            'Conference',
            750000,
            1,
            1,
            v_event_id
        );
        
        -- Call procRegisterParticipant
        procRegisterParticipant(
            'Khalid Ahmad',
            'M',
            'khalid.ahmad@gmail.com',
            '03451234567',
            'Block A, DHA, Lahore'
        );
        
        -- Call procProcessPayment
        procProcessPayment(
            1,
            5000,
            'Card',
            1,
            v_payment_status
        );
        
        DBMS_OUTPUT.PUT_LINE('Payment Status: ' || v_payment_status);
        
    EXCEPTION
        WHEN OTHERS THEN
            DBMS_OUTPUT.PUT_LINE('Error in Anonymous Block 2: ' || SQLERRM);
    END;
END;
/

-- ============================================================
-- SECTION 7: TEST DEMONSTRATIONS
-- ============================================================

-- Test 1: Call function within SQL query
DBMS_OUTPUT.PUT_LINE('=== Test 1: Functions Used in SELECT Query ===');
SELECT 
    event_id,
    event_name,
    fnCalculateTotalEventRevenue(event_id) AS total_revenue,
    fnGetEventOrganizerName(event_id) AS organizer_name
FROM Event
WHERE event_id <= 3;
/

-- Test 2: Call package procedure
DBMS_OUTPUT.PUT_LINE('=== Test 2: Package Procedure Call ===');
BEGIN
    pkgEventManagement.procGetEventSummary(1);
END;
/

-- Test 3: Call package function
DBMS_OUTPUT.PUT_LINE('=== Test 3: Package Function Call ===');
DECLARE
    v_profit NUMBER;
BEGIN
    v_profit := pkgEventManagement.fnCalculateEventProfit(1);
    DBMS_OUTPUT.PUT_LINE('Event 1 Profit: PKR ' || v_profit);
END;
/

-- Test 4: Process Event Participants (Cursor Test)
DBMS_OUTPUT.PUT_LINE('=== Test 4: Cursor Processing ===');
BEGIN
    procProcessEventParticipants(1);
END;
/

-- Test 5: Generate Venue Occupancy Report (Parameterized Cursor)
DBMS_OUTPUT.PUT_LINE('=== Test 5: Parameterized Cursor Report ===');
BEGIN
    procGenerateVenueOccupancyReport(DATE '2025-05-01', DATE '2025-10-31');
END;
/

COMMIT;
DBMS_OUTPUT.PUT_LINE('=== PL/SQL Implementation Complete ===');
