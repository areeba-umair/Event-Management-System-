const ADMIN_PASSWORD = "admin";

// ===============================
// LOGIN
// ===============================
function checkLogin() {
    const pwd = document.getElementById('adminPassword').value;
    if (pwd === ADMIN_PASSWORD) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('adminContent').style.display = 'block';
        loadAdminData();
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('adminPassword').style.borderColor = '#ff1744';
        setTimeout(() => {
            document.getElementById('loginError').style.display = 'none';
            document.getElementById('adminPassword').style.borderColor = '';
        }, 3000);
    }
}

// ===============================
// PAGE NAVIGATION
// ===============================
function showPage(pageName) {
    // Hide all pages
    document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
    // Show selected page
    const target = document.getElementById('page-' + pageName);
    if (target) {
        target.classList.add('active');
        // Re-trigger animation
        target.style.animation = 'none';
        target.offsetHeight; // force reflow
        target.style.animation = '';
    }
    // Update sidebar active state
    document.querySelectorAll('.sidebar-nav a').forEach(a => a.classList.remove('active'));
    event.currentTarget.classList.add('active');
}

// ===============================
// LOAD ALL ADMIN DATA
// ===============================
function loadAdminData() {
    loadDashboardStats();
    loadVenues();
    loadOrganizers();
    loadBookings();
    loadOverviewBookings();
    loadAnalyticsEvents();
    loadVenuesForOccupancy();
    loadEventsForBulkTickets();
    loadParticipantDirectory();
}

// ===============================
// DASHBOARD STATS
// ===============================
function loadDashboardStats() {
    fetch("http://localhost:3000/dashboard")
        .then(res => res.json())
        .then(data => {
            animateCounter('statEvents', data.events);
            animateCounter('statTickets', data.tickets);
            animateCounter('statSponsors', data.sponsors);
            animateCounter('statStaff', data.staff);
            animateCounter('statParticipants', data.participants);
        })
        .catch(err => console.error(err));
}

// Counter animation
function animateCounter(elementId, target) {
    const el = document.getElementById(elementId);
    const duration = 1000;
    const startTime = Date.now();
    const start = 0;

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // Ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(start + (target - start) * ease);
        el.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}

// ===============================
// OVERVIEW BOOKINGS (Recent 5)
// ===============================
function loadOverviewBookings() {
    fetch("http://localhost:3000/admin/bookings")
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('overviewBookingsBody');
            tbody.innerHTML = '';
            const recent = data.slice(0, 5);
            if (recent.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; color:var(--text-muted);">No bookings yet</td></tr>';
                return;
            }
            recent.forEach(b => {
                const badgeClass = b.ticket_type === 'VIP' ? 'badge-vip' : 'badge-regular';
                tbody.innerHTML += `
                    <tr>
                        <td>${b.ticket_id}</td>
                        <td>${b.participant_name}</td>
                        <td>${b.event_name}</td>
                        <td><span class="badge-pill ${badgeClass}">${b.ticket_type}</span></td>
                        <td class="price-tag">${Number(b.price).toLocaleString()} PKR</td>
                        <td>${b.booking_date}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error(err));
}

// ===============================
// VENUES DROPDOWN
// ===============================
function loadVenues() {
    fetch("http://localhost:3000/venues")
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('eventVenue');
            select.innerHTML = '<option value="">Select Venue</option>';
            data.forEach(v => {
                select.innerHTML += `<option value="${v.venue_id}">${v.venue_name}</option>`;
            });
        })
        .catch(err => console.error(err));
}

// ===============================
// ORGANIZERS DROPDOWN
// ===============================
function loadOrganizers() {
    fetch("http://localhost:3000/organizers")
        .then(res => res.json())
        .then(data => {
            const select = document.getElementById('eventOrganizer');
            select.innerHTML = '<option value="">Select Organizer</option>';
            data.forEach(o => {
                select.innerHTML += `<option value="${o.organizer_id}">${o.organizer_name}</option>`;
            });
        })
        .catch(err => console.error(err));
}

// ===============================
// ALL BOOKINGS TABLE
// ===============================
function loadBookings() {
    fetch("http://localhost:3000/admin/bookings")
        .then(res => res.json())
        .then(data => {
            const tbody = document.getElementById('bookingsTableBody');
            tbody.innerHTML = '';
            if (data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--text-muted);">No bookings found</td></tr>';
                return;
            }
            data.forEach(b => {
                const badgeClass = b.ticket_type === 'VIP' ? 'badge-vip' : 'badge-regular';
                tbody.innerHTML += `
                    <tr>
                        <td>${b.ticket_id}</td>
                        <td>${b.participant_name}</td>
                        <td>${b.participant_email}</td>
                        <td>${b.event_name}</td>
                        <td>${b.event_date}</td>
                        <td><span class="badge-pill ${badgeClass}">${b.ticket_type}</span></td>
                        <td class="price-tag">${Number(b.price).toLocaleString()} PKR</td>
                        <td>${b.booking_date}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error(err));
}

// ===============================
// ADD EVENT
// ===============================
document.getElementById('addEventForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        event_name: document.getElementById('eventName').value,
        event_date: document.getElementById('eventDate').value,
        event_time: document.getElementById('eventTime').value,
        event_type: document.getElementById('eventType').value,
        budget: document.getElementById('eventBudget').value,
        venue_id: document.getElementById('eventVenue').value,
        organizer_id: document.getElementById('eventOrganizer').value
    };

    fetch("http://localhost:3000/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        showToast('eventMessage', '✅ ' + response.message, 'success');
        document.getElementById('addEventForm').reset();
    })
    .catch(err => {
        console.error(err);
        showToast('eventMessage', '❌ Failed to create event.', 'error');
    });
});

// ===============================
// REGISTER PARTICIPANT
// ===============================
document.getElementById('registerParticipantForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        fullName: document.getElementById('participantName').value,
        gender: document.getElementById('participantGender').value,
        email: document.getElementById('participantEmail').value,
        phone: document.getElementById('participantPhone').value,
        address: document.getElementById('participantAddress').value
    };

    fetch("http://localhost:3000/plsql/registerParticipant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        if(response.success) {
            showToast('participantMessage', '✅ ' + response.message, 'success');
            document.getElementById('registerParticipantForm').reset();
        } else {
            throw new Error(response.error);
        }
    })
    .catch(err => {
        console.error(err);
        showToast('participantMessage', '❌ ' + err.message, 'error');
    });
});

// ===============================
// EVENT ANALYTICS
// ===============================
function loadAnalyticsEvents() {
    fetch("http://localhost:3000/events")
    .then(res => res.json())
    .then(events => {
        const select = document.getElementById('analyticsEventSelect');
        select.innerHTML = '<option value="">Select an Event</option>';
        events.forEach(e => {
            select.innerHTML += `<option value="${e.event_id}">${e.event_name}</option>`;
        });
    })
    .catch(err => console.error(err));
}

function loadEventAnalytics() {
    const eventId = document.getElementById('analyticsEventSelect').value;
    if(!eventId) { alert('Please select an event'); return; }

    fetch(`http://localhost:3000/admin/plsql/eventSummary/${eventId}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById('analyticsEventName').innerText = '📊 ' + data.eventName;
        document.getElementById('eventBudgetDisplay').innerText = `PKR ${data.budget.toLocaleString()}`;
        document.getElementById('eventRevenueDisplay').innerText = `PKR ${data.revenue.toLocaleString()}`;
        
        const profit = data.profit;
        const profitEl = document.getElementById('eventProfitDisplay');
        profitEl.innerText = `PKR ${profit.toLocaleString()}`;
        profitEl.className = 'metric-value ' + (profit >= 0 ? 'green' : 'danger');
        
        const margin = data.revenue > 0 ? ((profit / data.revenue) * 100).toFixed(1) : 0;
        document.getElementById('eventMarginDisplay').innerText = `${margin}%`;
        document.getElementById('analyticsContainer').style.display = 'block';
    })
    .catch(err => {
        console.error(err);
        alert('Error loading analytics');
    });
}

// ===============================
// VENUE OCCUPANCY
// ===============================
function loadVenuesForOccupancy() {
    fetch("http://localhost:3000/venues")
    .then(res => res.json())
    .then(data => {
        const select = document.getElementById('venueSelect');
        select.innerHTML = '<option value="">Select a Venue</option>';
        data.forEach(v => {
            select.innerHTML += `<option value="${v.venue_id}">${v.venue_name}</option>`;
        });
    })
    .catch(err => console.error(err));
}

function loadVenueOccupancy() {
    const venueId = document.getElementById('venueSelect').value;
    if(!venueId) { alert('Please select a venue'); return; }

    fetch(`http://localhost:3000/admin/plsql/venueOccupancy/${venueId}`)
    .then(res => res.json())
    .then(data => {
        document.getElementById('venueNameDisplay').innerText = '🏛 ' + data.venue.venueName;
        document.getElementById('venueDetailsDisplay').innerText = 
            `Capacity: ${data.venue.capacity} seats  |  Location: ${data.venue.location}`;
        
        const tbody = document.getElementById('occupancyTableBody');
        tbody.innerHTML = '';
        
        if(data.events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No events at this venue</td></tr>';
        } else {
            data.events.forEach(event => {
                tbody.innerHTML += `
                    <tr>
                        <td>${event.eventName}</td>
                        <td>${event.eventDate}</td>
                        <td style="text-align:center;">${event.attendees}</td>
                        <td class="price-tag" style="text-align:right;">${event.occupancyRate}</td>
                    </tr>
                `;
            });
        }
        document.getElementById('occupancyContainer').style.display = 'block';
    })
    .catch(err => {
        console.error(err);
        alert('Error loading occupancy report');
    });
}

// ===============================
// BULK TICKETS
// ===============================
function loadEventsForBulkTickets() {
    fetch("http://localhost:3000/events")
    .then(res => res.json())
    .then(events => {
        const select = document.getElementById('bulkEventSelect');
        select.innerHTML = '<option value="">Select an Event</option>';
        events.forEach(e => {
            select.innerHTML += `<option value="${e.event_id}">${e.event_name}</option>`;
        });
    })
    .catch(err => console.error(err));
}

document.getElementById('bulkTicketForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const data = {
        eventId: document.getElementById('bulkEventSelect').value,
        ticketType: document.getElementById('bulkTicketType').value,
        price: document.getElementById('bulkTicketPrice').value,
        quantity: document.getElementById('bulkQuantity').value
    };

    fetch("http://localhost:3000/admin/plsql/bulkTicketGeneration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(response => {
        showToast('bulkTicketMessage', '✅ ' + response.message, 'success');
        document.getElementById('bulkTicketForm').reset();
    })
    .catch(err => {
        console.error(err);
        showToast('bulkTicketMessage', '❌ Failed to generate tickets.', 'error');
    });
});

// ===============================
// PARTICIPANT DIRECTORY
// ===============================
function loadParticipantDirectory() {
    fetch("http://localhost:3000/admin/participants")
    .then(res => res.json())
    .then(data => {
        const tbody = document.getElementById('participantDirectoryBody');
        tbody.innerHTML = '';
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:var(--text-muted);">No participants found</td></tr>';
            return;
        }
        data.forEach(p => {
            tbody.innerHTML += `
                <tr>
                    <td>${p.participant_id}</td>
                    <td>${p.full_name}</td>
                    <td>${p.email}</td>
                    <td>${p.phone_number}</td>
                    <td><button class="btn-primary" style="padding:6px 14px; font-size:12px;" onclick="lookupParticipant(${p.participant_id})">View</button></td>
                </tr>
            `;
        });
    })
    .catch(err => console.error(err));
}

function lookupParticipant(id) {
    document.getElementById('participantCheckId').value = id;
    checkParticipantTickets();
}

// ===============================
// PARTICIPANT LOOKUP (Enhanced)
// ===============================
function checkParticipantTickets() {
    const participantId = document.getElementById('participantCheckId').value;
    if(!participantId) { alert('Please enter a Participant ID'); return; }

    fetch(`http://localhost:3000/admin/participantDetails/${participantId}`)
    .then(res => {
        if (!res.ok) throw new Error('Participant not found');
        return res.json();
    })
    .then(data => {
        const p = data.participant;
        document.getElementById('participantResultName').innerText = p.full_name;
        document.getElementById('participantResultEmail').innerText = p.email;
        document.getElementById('ticketCountResult').innerText = data.ticketCount;

        const tbody = document.getElementById('participantTicketDetailsBody');
        tbody.innerHTML = '';

        if (data.tickets.length === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center; color:var(--text-muted);">No tickets found for this participant</td></tr>';
        } else {
            data.tickets.forEach(t => {
                const badgeClass = t.ticket_type === 'VIP' ? 'badge-vip' : 'badge-regular';
                tbody.innerHTML += `
                    <tr>
                        <td>${t.ticket_id}</td>
                        <td>${t.event_name}</td>
                        <td>${t.event_date}</td>
                        <td>${t.event_time}</td>
                        <td>${t.venue_name || '—'}</td>
                        <td>${t.venue_city || '—'}</td>
                        <td><span class="badge-pill ${badgeClass}">${t.ticket_type}</span></td>
                        <td class="price-tag">${Number(t.price).toLocaleString()} PKR</td>
                        <td>${t.booking_date}</td>
                    </tr>
                `;
            });
        }

        document.getElementById('participantTicketsResult').style.display = 'block';
    })
    .catch(err => {
        console.error(err);
        alert('Participant not found or error occurred');
    });
}

// ===============================
// TOAST HELPER
// ===============================
function showToast(elementId, message, type) {
    const el = document.getElementById(elementId);
    el.textContent = message;
    el.className = 'msg-toast ' + type;
    setTimeout(() => {
        el.className = 'msg-toast';
    }, 5000);
}
