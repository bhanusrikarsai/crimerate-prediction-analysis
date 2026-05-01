// Global Variables
let map, chart, reportsDoughnutChart, yearlyChart, marker, heatLayer;

// --- INITIALIZATION ---
window.onload = function() {
    // Populate Year Dropdown
    const yearSelect = document.getElementById("yearSelect");
    for(let y = 2026; y >= 2015; y--) {
        let opt = document.createElement("option");
        opt.value = y;
        opt.text = y;
        yearSelect.add(opt);
    }

    // Initialize Map
    map = L.map("map", { zoomControl: false }).setView([39.8283, -98.5795], 4); // Center on US by default
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap"
    }).addTo(map);

    // Initialize Chart
    const ctx = document.getElementById("crimeChart").getContext('2d');
    
    // Set global chart defaults for dark theme
    Chart.defaults.color = '#94a3b8';
    if (Chart.defaults.font) {
        Chart.defaults.font.family = 'Outfit';
    } else {
        Chart.defaults.font = { family: 'Outfit' };
    }

    chart = new Chart(ctx, {
        type: "doughnut", // Doughnut looks more modern than pie
        data: {
            labels: ["Burglary", "Assault", "Robbery", "Theft", "Murder", "Rape"],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#3b82f6', // blue
                    '#ef4444', // red
                    '#f59e0b', // amber
                    '#10b981', // green
                    '#8b5cf6', // purple
                    '#ec4899'  // pink (for rape)
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });

    const reportsCtx = document.getElementById("reportsDoughnutChart").getContext('2d');
    reportsDoughnutChart = new Chart(reportsCtx, {
        type: "doughnut",
        data: {
            labels: ["Burglary", "Assault", "Robbery", "Theft", "Murder", "Rape"],
            datasets: [{
                data: [0, 0, 0, 0, 0, 0],
                backgroundColor: [
                    '#3b82f6', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899'
                ],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%',
            plugins: {
                legend: { position: 'right' }
            }
        }
    });

    const yearlyCtx = document.getElementById("yearlyChart").getContext('2d');
    yearlyChart = new Chart(yearlyCtx, {
        type: 'bar',
        data: {
            labels: [],
            datasets: [{
                label: 'Historical Cases',
                data: [],
                backgroundColor: '#3b82f6',
                borderRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' } },
                x: { grid: { display: false } }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    initAutocomplete();
};

// --- AUTHENTICATION UI ---
window.switchAuthTab = function(tab) {
    const tabs = document.querySelectorAll('.auth-tabs .tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(t => t.classList.remove('active'));
    forms.forEach(f => f.classList.remove('active'));

    if(tab === 'login') {
        tabs[0].classList.add('active');
        document.getElementById('loginForm').classList.add('active');
    } else {
        tabs[1].classList.add('active');
        document.getElementById('signupForm').classList.add('active');
    }
}

// --- AUTHENTICATION LOGIC ---
window.loginSendOtp = async function() {
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    if(!email || !password) return alert("Please fill all fields.");

    const btn = document.getElementById("loginBtn");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
    btn.disabled = true;

    try {
        const res = await fetch("/login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, password })
        });
        const data = await res.json();

        if(data.message === "OTP sent") {
            document.getElementById("loginStep1").style.display = "none";
            document.getElementById("loginStep2").style.display = "block";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Login error", error);
        alert("An error occurred during login.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-right-to-bracket"></i> Login';
        btn.disabled = false;
    }
}

window.verifyLogin = async function() {
    const email = document.getElementById("loginEmail").value;
    const otp = document.getElementById("loginOtp").value;

    if(!otp || otp.length !== 6) return alert("Please enter a valid 6-digit OTP.");

    const btn = document.getElementById("verifyLoginBtn");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
    btn.disabled = true;

    try {
        const res = await fetch("/verify-login", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, otp })
        });
        const data = await res.json();

        if(data.message === "Login success") {
            resetLogin();
            document.getElementById("authScreen").classList.remove("active");
            document.getElementById("dashboardScreen").classList.add("active");
            
            setTimeout(() => { if(map) map.invalidateSize(); }, 300);
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("Verification error", error);
        alert("An error occurred during verification.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Verify & Login';
        btn.disabled = false;
    }
}

window.resetLogin = function() {
    document.getElementById("loginStep1").style.display = "block";
    document.getElementById("loginStep2").style.display = "none";
    document.getElementById("loginOtp").value = "";
}

window.sendOtp = async function() {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;

    if(!email || !password) return alert("Please fill all fields.");

    const btn = document.getElementById("sendOtpBtn");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Sending...';
    btn.disabled = true;

    try {
        const res = await fetch("/send-otp", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email })
        });
        const data = await res.json();
        
        if(data.message === "OTP sent successfully") {
            document.getElementById("signupStep1").style.display = "none";
            document.getElementById("signupStep2").style.display = "block";
        } else {
            alert(data.message);
        }
    } catch (error) {
        console.error("OTP error", error);
        alert("Failed to send OTP.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-envelope-circle-check"></i> Send OTP';
        btn.disabled = false;
    }
}

window.verifySignup = async function() {
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const otp = document.getElementById("signupOtp").value;

    if(!otp || otp.length !== 6) return alert("Please enter a valid 6-digit OTP.");

    const btn = document.getElementById("verifySignupBtn");
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Verifying...';
    btn.disabled = true;

    try {
        const res = await fetch("/signup", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ email, password, otp })
        });
        const data = await res.json();
        alert(data.message);
        if(data.message === "Signup success") {
            resetSignup();
            document.getElementById("authScreen").classList.remove("active");
            document.getElementById("dashboardScreen").classList.add("active");
            setTimeout(() => { if(map) map.invalidateSize(); }, 300);
        }
    } catch (error) {
        console.error("Signup error", error);
        alert("Verification failed.");
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Create Account';
        btn.disabled = false;
    }
}

window.resetSignup = function() {
    document.getElementById("signupStep1").style.display = "block";
    document.getElementById("signupStep2").style.display = "none";
    document.getElementById("signupOtp").value = "";
}

window.logout = function() {
    location.reload();
}

// --- AUTOCOMPLETE LOGIC ---
function initAutocomplete() {
    function debounce(func, delay) {
        let timeout;
        return (...args) => {
            clearTimeout(timeout);
            timeout = setTimeout(() => func(...args), delay);
        };
    }

    const input = document.getElementById("cityInput");
    const suggestions = document.getElementById("suggestions");

    input.addEventListener("input", debounce(async () => {
        const q = input.value.trim();
        if (q.length < 3) {
            suggestions.style.display = "none";
            suggestions.innerHTML = "";
            return;
        }

        try {
            const res = await fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(q));
            const data = await res.json();

            suggestions.innerHTML = "";
            if (data.length > 0) {
                suggestions.style.display = "block";
                data.forEach(p => {
                    let div = document.createElement("div");
                    div.innerText = p.display_name;
                    div.onclick = () => {
                        input.value = p.display_name;
                        suggestions.style.display = "none";
                    };
                    suggestions.appendChild(div);
                });
            } else {
                suggestions.style.display = "none";
            }
        } catch (error) {
            console.error("Autocomplete error", error);
        }
    }, 300));
    
    // Hide suggestions when clicking outside
    document.addEventListener("click", (e) => {
        if(e.target !== input && e.target !== suggestions) {
            suggestions.style.display = "none";
        }
    });
}

// --- NAVIGATION LOGIC ---
window.switchNav = function(viewName) {
    // Update active nav link
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + viewName).classList.add('active');

    // Hide all main views
    document.querySelectorAll('.main-content > .main-view').forEach(el => {
        if(el.id !== 'dashboardGrid' && el.id !== 'view-dashboard') {
            el.style.display = 'none';
        }
    });

    const viewDashboard = document.getElementById('view-dashboard');
    const dashboardGrid = document.getElementById('dashboardGrid');

    if (viewName === 'dashboard') {
        viewDashboard.style.display = 'block';
        dashboardGrid.classList.remove('heatmap-mode');
        // Trigger map resize since container might have changed
        setTimeout(() => { if(map) map.invalidateSize(); }, 300);
    } else if (viewName === 'heatmaps') {
        viewDashboard.style.display = 'block';
        dashboardGrid.classList.add('heatmap-mode');
        // Trigger map resize since container might have changed
        setTimeout(() => { if(map) map.invalidateSize(); }, 300);
    } else if (viewName === 'reports') {
        viewDashboard.style.display = 'none';
        document.getElementById('view-reports').style.display = 'block';
    }
}

// --- ANALYSIS LOGIC ---
let lastAnalysisData = null;
let lastAnalysisCity = "";

window.runAnalysis = async function() {
    const city = document.getElementById("cityInput").value;
    const year = document.getElementById("yearSelect").value;
    const crimeType = document.getElementById("crimeSelect").value;

    if (!city) {
        alert("Please enter a city first.");
        return;
    }

    try {
        // 1. Get Location Coordinates
        const loc = await fetch("https://nominatim.openstreetmap.org/search?format=json&q=" + encodeURIComponent(city));
        const locData = await loc.json();

        if(locData.length === 0) {
            alert("City not found. Please try another query.");
            return;
        }

        const lat = parseFloat(locData[0].lat);
        const lon = parseFloat(locData[0].lon);

        // Fly to location
        map.flyTo([lat, lon], 12, { duration: 1.5 });

        // 2. Fetch Crime Data from Backend
        const res = await fetch("/crime", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ city, year })
        });
        const data = await res.json();

        // 3. Update Charts
        const chartDataArray = [
            data.Burglary, data.Assault, data.Robbery, data.Theft, data.Murder, data.Rape
        ];
        
        chart.data.datasets[0].data = chartDataArray;
        chart.update();

        reportsDoughnutChart.data.datasets[0].data = chartDataArray;
        reportsDoughnutChart.update();

        // 4. Update Stats Text
        const cityShortName = city.split(',')[0];
        document.getElementById("analysisText").innerHTML = `Analyzed <span style="color:#0ea5e9">${cityShortName}</span> for <span style="color:#0ea5e9">${year}</span>`;
        
        // Mock prediction calculation
        const baseValue = data[crimeType];
        const prediction = Math.floor(baseValue * 1.15); // +15% trend
        document.getElementById("predictionText").innerText = `Predicted ${crimeType} next year: ${prediction}`;

        // 5. Update Map Marker
        if (marker) map.removeLayer(marker);
        
        // Custom Leaflet icon styling for dark mode
        const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:#0ea5e9; width:15px; height:15px; border-radius:50%; border:2px solid white; box-shadow: 0 0 10px #0ea5e9;"></div>`,
            iconSize: [15, 15],
            iconAnchor: [7, 7]
        });
        marker = L.marker([lat, lon], {icon: customIcon}).addTo(map);

        // 6. Update Map Heatmap
        if (heatLayer) map.removeLayer(heatLayer);
        
        let heatPoints = [];
        // Generate random mock heatmap points around the city
        const intensityFactor = baseValue / 50; 
        for (let i = 0; i < Math.min(100, Math.max(20, intensityFactor)); i++) {
            heatPoints.push([
                lat + (Math.random() - 0.5) / 30, 
                lon + (Math.random() - 0.5) / 30, 
                Math.random() * 2 // Intensity
            ]);
        }
        
        // Add heatlayer with custom styling
        heatLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 20,
            maxZoom: 14,
            gradient: {0.4: '#3b82f6', 0.6: '#8b5cf6', 0.8: '#ef4444', 1.0: '#f59e0b'}
        }).addTo(map);

        // 7. Update Reports Table
        lastAnalysisData = data;
        lastAnalysisCity = cityShortName;
        updateReportsTable();

        // 8. Fetch and Update History Chart
        const histRes = await fetch("/crime/history", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({ city })
        });
        const historyData = await histRes.json();
        
        const labels = historyData.map(d => d.year);
        // Calculate total cases for all crime types per year
        const totalValues = historyData.map(d => 
            (d.Burglary || 0) + (d.Assault || 0) + (d.Robbery || 0) + 
            (d.Theft || 0) + (d.Murder || 0) + (d.Rape || 0)
        );
        
        yearlyChart.data.labels = labels;
        yearlyChart.data.datasets[0].data = totalValues;
        yearlyChart.data.datasets[0].label = `Total Crime Cases in ${cityShortName}`;
        yearlyChart.update();

    } catch(err) {
        console.error("Analysis Error:", err);
        alert("There was an error running the analysis.");
    }
}

function updateReportsTable() {
    if(!lastAnalysisData) return;
    
    document.getElementById("reportSubtitle").innerText = `Intelligence Report for ${lastAnalysisCity} (${lastAnalysisData.year})`;
    
    const tbody = document.getElementById("reportTableBody");
    tbody.innerHTML = "";
    
    const crimes = ["Burglary", "Assault", "Robbery", "Theft", "Murder", "Rape"];
    let totalValue = 0;
    let totalPrediction = 0;

    crimes.forEach(crime => {
        const value = lastAnalysisData[crime];
        const prediction = Math.floor(value * 1.15);
        totalValue += value;
        totalPrediction += prediction;
        let severity = "Low";
        let color = "#10b981"; // green
        
        if(value > 300) { severity = "Critical"; color = "#ef4444"; }
        else if (value > 100) { severity = "High"; color = "#f59e0b"; }
        else if (value > 50) { severity = "Medium"; color = "#3b82f6"; }
        
        tbody.innerHTML += `
            <tr>
                <td style="font-weight: 600;">${crime}</td>
                <td>${value}</td>
                <td>${prediction} <i class="fa-solid fa-arrow-trend-up" style="color:var(--danger); font-size: 0.8rem; margin-left: 5px;"></i></td>
                <td><span style="background: ${color}20; color: ${color}; padding: 4px 10px; border-radius: 20px; font-size: 0.85rem; font-weight: 600;">${severity}</span></td>
            </tr>
        `;
    });

    // Add Total Row
    tbody.innerHTML += `
        <tr style="background: rgba(255,255,255,0.05); border-top: 2px solid var(--glass-border);">
            <td style="font-weight: 800; color: #fff;">TOTAL CASES</td>
            <td style="font-weight: 800; color: #fff;">${totalValue}</td>
            <td style="font-weight: 800; color: #fff;">${totalPrediction} <i class="fa-solid fa-arrow-trend-up" style="color:var(--danger); font-size: 0.8rem; margin-left: 5px;"></i></td>
            <td>-</td>
        </tr>
    `;
}