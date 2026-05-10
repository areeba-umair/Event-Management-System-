// ===============================
// 🔹 SCROLL TO EVENTS
// ===============================
function scrollToEvents() {
    document.getElementById('events').scrollIntoView({
        behavior: 'smooth'
    });
}


// ===============================
// 🔹 AUTO SELECT EVENT
// ===============================
function selectEvent(eventName) {

    document.getElementById('eventSelect').value = eventName;

    document.getElementById('booking').scrollIntoView({
        behavior: 'smooth'
    });
}


// ===============================
// 🔹 BOOKING FORM → DATABASE
// ===============================
document.getElementById('bookingForm')
.addEventListener('submit', function(e){

    e.preventDefault();

    const customerName = document.getElementById('customerName').value;
    const email = document.querySelector('input[type="email"]').value;
    const phone = document.querySelector('input[type="tel"]').value;
    const eventName = document.getElementById('eventSelect').value;

    const selects = document.querySelectorAll('select');

    const ticketType = selects[2].value;
    const tickets = document.querySelector('input[type="number"]').value;
    const paymentMethod = selects[3].value;

    const data = {
        name: customerName,
        email: email,
        phone: phone,
        event: eventName,
        ticketType: ticketType,
        tickets: tickets,
        paymentMethod: paymentMethod
    };

    fetch("http://localhost:3000/booking", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(() => {

        document.getElementById('bookingMessage').innerHTML = `
        🎉 Booking Confirmed & Saved in Database 🎉
        <br><br>
        Customer: <b>${customerName}</b>
        <br>
        Event: <b>${eventName}</b>
        `;

        document.getElementById('bookingForm').reset();
    })
    .catch(err => {
        console.log(err);
        document.getElementById('bookingMessage').innerHTML =
        " Error saving booking";
    });
});


// ===============================
// 🔹 LOAD DASHBOARD DATA
// ===============================
function loadDashboard(){

    fetch("http://localhost:3000/dashboard")
    .then(res => res.json())
    .then(data => {

        const cards = document.querySelectorAll('.card h3');

        if(cards.length >= 5){
            animateCounter(cards[0], data.events);
            animateCounter(cards[1], data.tickets);
            animateCounter(cards[2], data.sponsors);
            animateCounter(cards[3], data.staff);
            animateCounter(cards[4], data.participants);
        }
    })
    .catch(err => console.log(err));
}


// ===============================
// 🔹 COUNTER ANIMATION
// ===============================
function animateCounter(element, target) {
    const duration = 1200;
    const startTime = Date.now();

    function update() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic
        const ease = 1 - Math.pow(1 - progress, 3);
        const current = Math.round(target * ease);
        element.textContent = current.toLocaleString();
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    requestAnimationFrame(update);
}


// ===============================
// 🔹 LOAD EVENTS FROM DB
// ===============================
function loadEventsFromDB(){

    fetch("http://localhost:3000/events")
    .then(res => res.json())
    .then(data => {

        const container = document.querySelector('.events-container');

        if(!container) return;

        container.innerHTML = "";

        data.forEach((e, i) => {

            const delay = i < 5 ? `reveal-delay-${i}` : '';

            container.innerHTML += `
            <div class="event-card reveal ${delay}">
                <h3>${e.event_name}</h3>
                <p><b>Date:</b> ${e.event_date}</p>
                <p><b>Time:</b> ${e.event_time}</p>
                <p><b>Venue:</b> ${e.venue_name}</p>
                <p><b>City:</b> ${e.location}</p>
                <p><b>Type:</b> ${e.event_type}</p>
                <p><b>Budget:</b> ${Number(e.budget).toLocaleString()} PKR</p>
                <button onclick="selectEvent('${e.event_name}')">
                    Book Now
                </button>
            </div>
            `;
        });

        // Re-init scroll observer for new cards
        initScrollReveal();
    })
    .catch(err => console.log(err));
}


// ===============================
// 🔹 SCROLL REVEAL (Intersection Observer)
// ===============================
function initScrollReveal() {
    const reveals = document.querySelectorAll('.reveal');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    reveals.forEach(el => {
        // Reset so re-added elements can animate
        el.classList.remove('visible');
        observer.observe(el);
    });
}


// ===============================
// 🔹 NAVBAR SCROLL EFFECT
// ===============================
function initNavbarScroll() {
    const nav = document.getElementById('mainNav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 80) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    });
}


// ===============================
// 🔹 PAGE LOAD
// ===============================
window.onload = function(){

    loadDashboard();
    loadEventsFromDB();
    initScrollReveal();
    initNavbarScroll();

};
