// ===========================================
// GLOBAL VARIABLES & CONSTANTS
// ===========================================

// Data untuk Eco Calculator
const CARBON_FACTORS = {
    electricity: 0.85, // kg CO2 per kWh (Indonesia grid average)
    lpg: 2.95, // kg CO2 per kg LPG
    gasoline: 2.31, // kg CO2 per liter
    diesel: 2.68, // kg CO2 per liter
    motorcycle: 0.12, // kg CO2 per km
    car: 0.21, // kg CO2 per km
    bus: 0.08, // kg CO2 per km
    plane: 0.25, // kg CO2 per km (short haul)
    waste: 0.5, // kg CO2 per kg waste
    water: 0.3, // kg CO2 per m3
    diet: {
        vegetarian: 1.5,
        'low-meat': 2.0,
        average: 2.7,
        'high-meat': 3.5
    },
    shopping: {
        minimal: 100,
        moderate: 300,
        frequent: 600
    }
};

// Data untuk peta (sederhana untuk performa)
const MAP_DATA = {
    energi: [
        { id: 'e1', lat: -6.2088, lng: 106.8456, title: 'PLTS Atap Jakarta', type: 'solar', status: 'aktif', kapasitas: '50 kW' },
        { id: 'e2', lat: -7.7971, lng: 110.3688, title: 'Biogas Yogyakarta', type: 'biogas', status: 'aktif', kapasitas: '10 m³/hari' },
        { id: 'e3', lat: -8.5069, lng: 115.2625, title: 'PLTS Bali', type: 'solar', status: 'aktif', kapasitas: '100 kW' },
        { id: 'e4', lat: -3.5952, lng: 128.1666, title: 'Mikrohidro Maluku', type: 'hydro', status: 'aktif', kapasitas: '25 kW' },
        { id: 'e5', lat: 0.7893, lng: 113.9213, title: 'PLTB Kalimantan', type: 'wind', status: 'rencana', kapasitas: '150 kW' }
    ],
    kearifan: [
        { id: 'k1', lat: -8.5069, lng: 115.2625, title: 'Subak Bali', type: 'irigasi', status: 'aktif' },
        { id: 'k2', lat: -3.2388, lng: 130.1453, title: 'Sasi Maluku', type: 'laut', status: 'aktif' },
        { id: 'k3', lat: -7.0184, lng: 107.8853, title: 'Leuweung Larangan', type: 'hutan', status: 'aktif' },
        { id: 'k4', lat: -0.7893, lng: 113.9213, title: 'Rumah Betang', type: 'adat', status: 'aktif' },
        { id: 'k5', lat: 2.1157, lng: 99.5451, title: 'Mata Air Adat', type: 'air', status: 'aktif' }
    ]
};

// Data energi untuk kalkulator
const ENERGY_DATA = {
    solar: {
        capacity_factor: 0.18, // 18% capacity factor for Indonesia
        cost_per_kwp: 15000000, // Rp 15 juta per kWp
        lifetime: 25, // years
        maintenance: 0.01, // 1% per year
        co2_savings: 0.85 // kg CO2 per kWh saved
    },
    hydro: {
        capacity_factor: 0.4,
        cost_per_kw: 20000000,
        lifetime: 50,
        maintenance: 0.02,
        co2_savings: 0.85
    },
    wind: {
        capacity_factor: 0.25,
        cost_per_kw: 25000000,
        lifetime: 20,
        maintenance: 0.03,
        co2_savings: 0.85
    },
    biogas: {
        capacity_factor: 0.3,
        cost_per_m3: 5000000,
        lifetime: 15,
        maintenance: 0.05,
        co2_savings: 2.95 // per kg LPG replaced
    }
};

// Variabel global
let map = null;
let markerCluster = null;
let currentMapView = 'standard';
let currentCalcTab = 'personal';
let carbonChart = null;
let userCarbonFootprint = 0;

// ===========================================
// INITIALIZATION FUNCTIONS
// ===========================================

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Lestari Nusantara Platform Initializing...');
    
    // Initialize components
    initNavbar();
    initTheme();
    initScrollEffects();
    initCounters();
    initCharts();
    initMap();
    loadEnergyCards();
    loadWisdomCards();
    
    // Set up event listeners
    setupEventListeners();
    
    // Show welcome message
    setTimeout(() => {
        console.log('Platform ready!');
        updateLoadingState(false);
    }, 1000);
});

// Initialize navbar functionality
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('menu');
    
    // Toggle mobile menu
    hamburger.addEventListener('click', function() {
        menu.classList.toggle('active');
        this.innerHTML = menu.classList.contains('active') ? 
            '<i class="fas fa-times"></i>' : 
            '<i class="fas fa-bars"></i>';
    });
    
    // Close menu when clicking outside on mobile
    document.addEventListener('click', function(event) {
        if (window.innerWidth <= 992) {
            if (!menu.contains(event.target) && !hamburger.contains(event.target)) {
                menu.classList.remove('active');
                hamburger.innerHTML = '<i class="fas fa-bars"></i>';
            }
        }
    });
    
    // Update navbar on scroll
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        
        // Update active menu item
        updateActiveMenu();
    });
}

// Initialize theme functionality
function initTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('theme') || 'light';
    
    // Apply saved theme
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Toggle theme
    themeToggle.addEventListener('click', function() {
        document.body.classList.toggle('dark-mode');
        
        if (document.body.classList.contains('dark-mode')) {
            this.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        } else {
            this.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        }
    });
}

// Initialize scroll effects
function initScrollEffects() {
    // Progress bar
    window.addEventListener('scroll', function() {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        document.getElementById('progressBar').style.width = scrolled + '%';
        
        // Back to top button
        const backToTop = document.getElementById('backToTop');
        if (window.scrollY > 300) {
            backToTop.classList.add('show');
        } else {
            backToTop.classList.remove('show');
        }
    });
    
    // Back to top functionality
    document.getElementById('backToTop').addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// Initialize animated counters
function initCounters() {
    const counters = document.querySelectorAll('.stat-number[data-count]');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const counter = entry.target;
                const target = parseInt(counter.getAttribute('data-count'));
                const duration = 2000; // 2 seconds
                const step = target / (duration / 16); // 60fps
                let current = 0;
                
                const updateCounter = () => {
                    current += step;
                    if (current < target) {
                        counter.textContent = Math.floor(current);
                        requestAnimationFrame(updateCounter);
                    } else {
                        counter.textContent = target;
                    }
                };
                
                updateCounter();
                observer.unobserve(counter);
            }
        });
    }, { threshold: 0.5 });
    
    counters.forEach(counter => observer.observe(counter));
}

// Initialize charts
function initCharts() {
    // Initialize carbon comparison chart
    const ctx = document.getElementById('carbonChart').getContext('2d');
    carbonChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Anda', 'Indonesia', 'Global', 'Target 2030'],
            datasets: [{
                label: 'Jejak Karbon (ton/tahun)',
                data: [0, 2.4, 4.8, 2.0],
                backgroundColor: [
                    'rgba(76, 175, 80, 0.8)',
                    'rgba(33, 150, 243, 0.8)',
                    'rgba(255, 152, 0, 0.8)',
                    'rgba(156, 39, 176, 0.8)'
                ],
                borderColor: [
                    'rgba(76, 175, 80, 1)',
                    'rgba(33, 150, 243, 1)',
                    'rgba(255, 152, 0, 1)',
                    'rgba(156, 39, 176, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Ton CO₂ per tahun'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Initialize map
function initMap() {
    console.log('Initializing map...');
    
    // Show loading
    document.getElementById('mapLoading').style.display = 'flex';
    
    // Create map instance
    map = L.map('indonesiaMap').setView([-2.5489, 118.0149], 5);
    
    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);
    
    // Initialize marker cluster
    markerCluster = L.markerClusterGroup({
        maxClusterRadius: 80,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true
    });
    
    // Load map data
    loadMapData();
    
    // Hide loading
    setTimeout(() => {
        document.getElementById('mapLoading').style.display = 'none';
        updateMapStats();
    }, 1000);
    
    console.log('Map initialized successfully');
}

// ===========================================
// MAP FUNCTIONS
// ===========================================

// Load data to map
function loadMapData(filter = 'all') {
    if (!map || !markerCluster) return;
    
    // Clear existing markers
    markerCluster.clearLayers();
    
    // Combine data based on filter
    let dataToShow = [];
    
    if (filter === 'all' || filter === 'energi') {
        dataToShow = dataToShow.concat(MAP_DATA.energi.map(item => ({ ...item, category: 'energi' })));
    }
    
    if (filter === 'all' || filter === 'kearifan') {
        dataToShow = dataToShow.concat(MAP_DATA.kearifan.map(item => ({ ...item, category: 'kearifan' })));
    }
    
    // Filter by status if needed
    if (filter === 'aktif') {
        dataToShow = dataToShow.filter(item => item.status === 'aktif');
    } else if (filter === 'rencana') {
        dataToShow = dataToShow.filter(item => item.status === 'rencana');
    }
    
    // Add markers to cluster
    dataToShow.forEach(item => {
        const marker = createMapMarker(item);
        if (marker) {
            markerCluster.addLayer(marker);
        }
    });
    
    // Add cluster to map
    map.addLayer(markerCluster);
    
    // Update stats
    updateMapStats();
    
    // Fit bounds if we have data
    if (dataToShow.length > 0) {
        const bounds = markerCluster.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }
}

// Create map marker
function createMapMarker(item) {
    if (!item.lat || !item.lng) return null;
    
    // Determine marker color and icon
    let color, icon;
    if (item.category === 'energi') {
        color = item.status === 'aktif' ? '#4CAF50' : '#9C27B0';
        icon = 'fa-bolt';
    } else {
        color = '#FF9800';
        icon = 'fa-seedling';
    }
    
    // Create custom icon
    const customIcon = L.divIcon({
        html: `<div style="
            background-color: ${color};
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            border: 3px solid white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            cursor: pointer;
        ">
            <i class="fas ${icon}"></i>
        </div>`,
        className: 'custom-marker',
        iconSize: [40, 40],
        iconAnchor: [20, 40],
        popupAnchor: [0, -40]
    });
    
    // Create marker
    const marker = L.marker([item.lat, item.lng], { icon: customIcon });
    
    // Add popup
    marker.bindPopup(`
        <div class="map-popup">
            <h4>${item.title}</h4>
            <p><strong>Kategori:</strong> ${item.category === 'energi' ? 'Energi Terbarukan' : 'Kearifan Lokal'}</p>
            <p><strong>Status:</strong> ${item.status === 'aktif' ? 'Aktif' : 'Dalam Perencanaan'}</p>
            ${item.kapasitas ? `<p><strong>Kapasitas:</strong> ${item.kapasitas}</p>` : ''}
            <p><strong>Koordinat:</strong> ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</p>
            <button onclick="showLocationDetail('${item.id}', '${item.category}')" class="popup-btn">
                Lihat Detail
            </button>
        </div>
    `);
    
    // Add click event
    marker.on('click', function() {
        showSelectedLocation(item);
    });
    
    return marker;
}

// Show selected location in sidebar
function showSelectedLocation(item) {
    const selectedLocation = document.getElementById('selectedLocation');
    
    selectedLocation.innerHTML = `
        <div class="location-details">
            <h5>${item.title}</h5>
            <div class="location-info">
                <p><strong><i class="fas fa-tag"></i> Kategori:</strong> ${item.category === 'energi' ? 'Energi Terbarukan' : 'Kearifan Lokal'}</p>
                <p><strong><i class="fas fa-bolt"></i> Status:</strong> ${item.status === 'aktif' ? 'Aktif' : 'Dalam Perencanaan'}</p>
                ${item.kapasitas ? `<p><strong><i class="fas fa-chart-bar"></i> Kapasitas:</strong> ${item.kapasitas}</p>` : ''}
                <p><strong><i class="fas fa-map-marker-alt"></i> Koordinat:</strong> ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</p>
            </div>
            <div class="location-actions">
                <button onclick="zoomToLocation(${item.lat}, ${item.lng})" class="action-btn">
                    <i class="fas fa-search"></i> Zoom
                </button>
                <button onclick="shareLocation('${item.id}')" class="action-btn">
                    <i class="fas fa-share-alt"></i> Bagikan
                </button>
            </div>
        </div>
    `;
}

// Show location detail in modal
function showLocationDetail(id, category) {
    // Find the item
    let item;
    if (category === 'energi') {
        item = MAP_DATA.energi.find(e => e.id === id);
    } else {
        item = MAP_DATA.kearifan.find(k => k.id === id);
    }
    
    if (!item) return;
    
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="location-detail-modal">
            <h3>${item.title}</h3>
            <div class="detail-info">
                <div class="info-item">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <h5>Informasi Umum</h5>
                        <p>${category === 'energi' ? 'Proyek Energi Terbarukan' : 'Kearifan Lokal'} di Indonesia</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marked-alt"></i>
                    <div>
                        <h5>Lokasi</h5>
                        <p>Koordinat: ${item.lat.toFixed(4)}, ${item.lng.toFixed(4)}</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-bolt"></i>
                    <div>
                        <h5>Status</h5>
                        <p>${item.status === 'aktif' ? 'Beroperasi' : 'Dalam Pengembangan'}</p>
                    </div>
                </div>
                ${item.kapasitas ? `
                <div class="info-item">
                    <i class="fas fa-chart-line"></i>
                    <div>
                        <h5>Kapasitas</h5>
                        <p>${item.kapasitas}</p>
                    </div>
                </div>
                ` : ''}
            </div>
            <div class="modal-actions">
                <button onclick="closeModal()" class="btn-secondary">Tutup</button>
                <button onclick="navigateToLocation(${item.lat}, ${item.lng})" class="btn-primary">
                    <i class="fas fa-directions"></i> Navigasi
                </button>
            </div>
        </div>
    `;
    
    openModal();
}

// Update map statistics
function updateMapStats() {
    const totalMarkers = MAP_DATA.energi.length + MAP_DATA.kearifan.length;
    const energyMarkers = MAP_DATA.energi.length;
    const cultureMarkers = MAP_DATA.kearifan.length;
    
    document.getElementById('total-markers').textContent = totalMarkers;
    document.getElementById('energy-markers').textContent = energyMarkers;
    document.getElementById('culture-markers').textContent = cultureMarkers;
}

// Switch map view
function switchMapView(view) {
    if (currentMapView === view) return;
    
    // Update active button
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    currentMapView = view;
    
    // In a real implementation, you would switch map layers here
    console.log('Switching to view:', view);
    
    // For demo purposes, just reload data
    loadMapData();
}

// Filter map data
function filterMapData() {
    const filter = document.getElementById('map-filter').value;
    loadMapData(filter);
}

// Search on map
function searchOnMap() {
    const query = document.getElementById('map-search').value.toLowerCase().trim();
    
    if (!query) {
        loadMapData();
        return;
    }
    
    // Filter data based on search query
    const filteredEnergi = MAP_DATA.energi.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
    
    const filteredKearifan = MAP_DATA.kearifan.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
    );
    
    const filteredData = [
        ...filteredEnergi.map(item => ({ ...item, category: 'energi' })),
        ...filteredKearifan.map(item => ({ ...item, category: 'kearifan' }))
    ];
    
    // Clear and show filtered markers
    markerCluster.clearLayers();
    
    filteredData.forEach(item => {
        const marker = createMapMarker(item);
        if (marker) {
            markerCluster.addLayer(marker);
        }
    });
    
    // Update stats
    updateMapStats();
    
    // Zoom to results if any
    if (filteredData.length > 0) {
        const bounds = L.latLngBounds(filteredData.map(item => [item.lat, item.lng]));
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Zoom to province
function zoomToProvince(province) {
    const provinceCenters = {
        'jawa-barat': [-6.903, 107.610],
        'jawa-tengah': [-7.555, 110.832],
        'jawa-timur': [-7.536, 112.238],
        'bali': [-8.409, 115.188],
        'sumatera-utara': [2.115, 99.545],
        'sulawesi-selatan': [-3.848, 119.849],
        'kalimantan-timur': [-1.000, 117.000],
        'papua': [-4.000, 138.000]
    };
    
    if (provinceCenters[province]) {
        map.setView(provinceCenters[province], 8);
    }
}

// Zoom to specific location
function zoomToLocation(lat, lng) {
    if (map) {
        map.setView([lat, lng], 12);
    }
}

// Toggle sidebar
function toggleSidebar() {
    const sidebar = document.querySelector('.map-sidebar');
    const toggleBtn = document.querySelector('.sidebar-toggle i');
    
    sidebar.classList.toggle('collapsed');
    
    if (sidebar.classList.contains('collapsed')) {
        toggleBtn.className = 'fas fa-chevron-right';
    } else {
        toggleBtn.className = 'fas fa-chevron-left';
    }
}

// ===========================================
// ECO CALCULATOR FUNCTIONS
// ===========================================

// Switch calculator tab
function switchCalcTab(tab) {
    if (currentCalcTab === tab) return;
    
    // Update active tab
    document.querySelectorAll('.calc-tab').forEach(btn => btn.classList.remove('active'));
    document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
    
    // Show active content
    document.querySelectorAll('.calc-tab-content').forEach(content => content.classList.remove('active'));
    document.getElementById(`${tab}-calc`).classList.add('active');
    
    currentCalcTab = tab;
}

// Calculate personal carbon footprint
function calculateCarbonFootprint() {
    updateLoadingState(true);
    
    setTimeout(() => {
        try {
            // Get input values
            const electricity = parseFloat(document.getElementById('electricity').value) || 0;
            const transportType = document.getElementById('transport-type').value;
            const transportDistance = parseFloat(document.getElementById('transport-distance').value) || 0;
            const diet = document.getElementById('diet').value;
            const shopping = document.getElementById('shopping').value;
            const waste = document.getElementById('waste').value;
            
            // Calculate emissions
            let totalEmissions = 0;
            
            // Electricity
            totalEmissions += electricity * CARBON_FACTORS.electricity * 12; // Yearly
            
            // Transport
            let transportFactor = 0;
            switch(transportType) {
                case 'car': transportFactor = CARBON_FACTORS.car; break;
                case 'motorcycle': transportFactor = CARBON_FACTORS.motorcycle; break;
                case 'public': transportFactor = CARBON_FACTORS.bus; break;
                case 'bike': transportFactor = 0; break;
            }
            totalEmissions += transportDistance * 365 * transportFactor;
            
            // Diet
            totalEmissions += CARBON_FACTORS.diet[diet] * 365;
            
            // Shopping
            totalEmissions += CARBON_FACTORS.shopping[shopping] * 12;
            
            // Waste
            let wasteFactor = 0;
            switch(waste) {
                case 'low': wasteFactor = 0.1; break;
                case 'medium': wasteFactor = 0.3; break;
                case 'high': wasteFactor = 0.5; break;
            }
            totalEmissions += wasteFactor * 365 * CARBON_FACTORS.waste;
            
            // Convert to tons and round
            totalEmissions = totalEmissions / 1000; // Convert to tons
            totalEmissions = Math.round(totalEmissions * 10) / 10;
            
            // Save user footprint
            userCarbonFootprint = totalEmissions;
            
            // Update comparison chart
            updateCarbonChart(totalEmissions);
            
            // Display results
            displayPersonalResults(totalEmissions);
            
        } catch (error) {
            console.error('Error calculating carbon footprint:', error);
            alert('Terjadi kesalahan dalam perhitungan. Silakan coba lagi.');
        } finally {
            updateLoadingState(false);
        }
    }, 500);
}

// Display personal results
function displayPersonalResults(emissions) {
    const resultsDiv = document.getElementById('personal-results');
    
    // Determine rating
    let rating, color, suggestions;
    if (emissions < 2.0) {
        rating = "Sangat Baik";
        color = "#4CAF50";
        suggestions = ["Pertahankan gaya hidup ramah lingkungan Anda!", "Bagikan tips Anda ke orang lain"];
    } else if (emissions < 3.0) {
        rating = "Baik";
        color = "#8BC34A";
        suggestions = ["Coba gunakan transportasi umum lebih sering", "Kurangi konsumsi daging"];
    } else if (emissions < 4.5) {
        rating = "Sedang";
        color = "#FFC107";
        suggestions = ["Pertimbangkan panel surya untuk rumah", "Kurangi belanja online"];
    } else {
        rating = "Perlu Perbaikan";
        color = "#F44336";
        suggestions = ["Pertimbangkan perubahan signifikan", "Konsultasi dengan ahli lingkungan"];
    }
    
    resultsDiv.innerHTML = `
        <div class="carbon-results">
            <div class="result-header">
                <h4><i class="fas fa-leaf"></i> Hasil Jejak Karbon Anda</h4>
                <div class="result-rating" style="background: ${color}">${rating}</div>
            </div>
            
            <div class="result-main">
                <div class="emission-number">
                    <span class="number">${emissions}</span>
                    <span class="unit">ton CO₂/tahun</span>
                </div>
                <div class="emission-comparison">
                    <p>${emissions < 2.4 ? 'Lebih rendah' : 'Lebih tinggi'} dari rata-rata Indonesia (2.4 ton)</p>
                </div>
            </div>
            
            <div class="result-breakdown">
                <h5><i class="fas fa-chart-pie"></i> Rincian Emisi</h5>
                <div class="breakdown-items">
                    <div class="breakdown-item">
                        <span class="label">Listrik</span>
                        <span class="value">${Math.round(emissions * 0.35 * 10) / 10} ton</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Transportasi</span>
                        <span class="value">${Math.round(emissions * 0.3 * 10) / 10} ton</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Makanan</span>
                        <span class="value">${Math.round(emissions * 0.2 * 10) / 10} ton</span>
                    </div>
                    <div class="breakdown-item">
                        <span class="label">Lainnya</span>
                        <span class="value">${Math.round(emissions * 0.15 * 10) / 10} ton</span>
                    </div>
                </div>
            </div>
            
            <div class="result-suggestions">
                <h5><i class="fas fa-lightbulb"></i> Saran Pengurangan</h5>
                <ul>
                    ${suggestions.map(s => `<li>${s}</li>`).join('')}
                </ul>
            </div>
            
            <div class="result-actions">
                <button onclick="saveCarbonResult(${emissions})" class="btn-save">
                    <i class="fas fa-save"></i> Simpan Hasil
                </button>
                <button onclick="shareCarbonResult(${emissions})" class="btn-share">
                    <i class="fas fa-share-alt"></i> Bagikan
                </button>
            </div>
        </div>
    `;
}

// Calculate household footprint
function calculateHouseholdFootprint() {
    updateLoadingState(true);
    
    setTimeout(() => {
        try {
            const members = parseInt(document.getElementById('household-members').value) || 1;
            const electricity = parseFloat(document.getElementById('house-electricity').value) || 0;
            const lpg = parseFloat(document.getElementById('lpg-usage').value) || 0;
            const water = parseFloat(document.getElementById('water-usage').value) || 0;
            const waste = parseFloat(document.getElementById('house-waste').value) || 0;
            
            // Calculate emissions
            let emissions = 0;
            emissions += electricity * 12 * CARBON_FACTORS.electricity; // Yearly electricity
            emissions += lpg * 12 * 15 * CARBON_FACTORS.lpg; // LPG (15kg per tabung)
            emissions += water * 12 * CARBON_FACTORS.water; // Water
            emissions += waste * 365 * CARBON_FACTORS.waste; // Waste
            
            // Convert to tons per person
            emissions = (emissions / 1000) / members;
            emissions = Math.round(emissions * 10) / 10;
            
            // Display results
            displayHouseholdResults(emissions, members);
            
        } catch (error) {
            console.error('Error calculating household footprint:', error);
            alert('Terjadi kesalahan dalam perhitungan.');
        } finally {
            updateLoadingState(false);
        }
    }, 500);
}

// Display household results
function displayHouseholdResults(emissions, members) {
    const resultsDiv = document.getElementById('household-results');
    
    resultsDiv.innerHTML = `
        <div class="household-results">
            <h4><i class="fas fa-home"></i> Jejak Karbon Rumah Tangga</h4>
            
            <div class="household-stats">
                <div class="stat">
                    <div class="stat-value">${emissions}</div>
                    <div class="stat-label">Ton CO₂/orang/tahun</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${members}</div>
                    <div class="stat-label">Anggota Keluarga</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(emissions * members * 10) / 10}</div>
                    <div class="stat-label">Ton CO₂ total/tahun</div>
                </div>
            </div>
            
            <div class="household-tips">
                <h5><i class="fas fa-tips"></i> Tips untuk Rumah Tangga:</h5>
                <ul>
                    <li>Ganti 5 lampu dengan LED: hemat 0.5 ton/tahun</li>
                    <li>Pasang solar water heater: hemat 1 ton/tahun</li>
                    <li>Kompos sampah organik: hemat 0.3 ton/tahun</li>
                    <li>Rainwater harvesting: hemat 0.2 ton/tahun</li>
                </ul>
            </div>
        </div>
    `;
}

// Select transport mode
function selectTransportMode(mode) {
    document.querySelectorAll('.transport-mode').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
    
    // Update form based on mode
    const fuelTypeSelect = document.getElementById('fuel-type');
    const efficiencyInput = document.getElementById('fuel-efficiency');
    
    switch(mode) {
        case 'car':
            fuelTypeSelect.innerHTML = `
                <option value="pertalite">Pertalite</option>
                <option value="pertamax">Pertamax</option>
                <option value="solar">Solar</option>
                <option value="electric">Listrik</option>
            `;
            efficiencyInput.value = 10;
            break;
        case 'motorcycle':
            fuelTypeSelect.innerHTML = `
                <option value="pertalite">Pertalite</option>
                <option value="pertamax">Pertamax</option>
            `;
            efficiencyInput.value = 35;
            break;
        case 'public':
            fuelTypeSelect.innerHTML = `<option value="diesel">Solar</option>`;
            efficiencyInput.value = 5;
            break;
        case 'plane':
            fuelTypeSelect.innerHTML = `<option value="avtur">Avtur</option>`;
            efficiencyInput.value = 0.2;
            break;
    }
}

// Calculate transport footprint
function calculateTransportFootprint() {
    updateLoadingState(true);
    
    setTimeout(() => {
        try {
            const mode = document.querySelector('.transport-mode.active').dataset.mode;
            const distance = parseFloat(document.getElementById('travel-distance').value) || 0;
            const fuelType = document.getElementById('fuel-type').value;
            const efficiency = parseFloat(document.getElementById('fuel-efficiency').value) || 1;
            const days = parseInt(document.getElementById('travel-days').value) || 5;
            
            // Calculate fuel consumption
            const weeklyDistance = distance * days;
            const yearlyDistance = weeklyDistance * 52;
            const yearlyFuel = yearlyDistance / efficiency;
            
            // Calculate emissions based on fuel type
            let emissions = 0;
            switch(fuelType) {
                case 'pertalite':
                case 'pertamax':
                    emissions = yearlyFuel * CARBON_FACTORS.gasoline;
                    break;
                case 'solar':
                case 'diesel':
                    emissions = yearlyFuel * CARBON_FACTORS.diesel;
                    break;
                case 'electric':
                    emissions = yearlyFuel * 0.2 * CARBON_FACTORS.electricity; // Electric vehicles
                    break;
                case 'avtur':
                    emissions = yearlyDistance * CARBON_FACTORS.plane;
                    break;
                default:
                    emissions = yearlyDistance * 0.15; // Default factor
            }
            
            // Convert to tons
            emissions = emissions / 1000;
            emissions = Math.round(emissions * 10) / 10;
            
            // Display results
            displayTransportResults(emissions, mode, yearlyDistance);
            
        } catch (error) {
            console.error('Error calculating transport footprint:', error);
            alert('Terjadi kesalahan dalam perhitungan.');
        } finally {
            updateLoadingState(false);
        }
    }, 500);
}

// Display transport results
function displayTransportResults(emissions, mode, distance) {
    const resultsDiv = document.getElementById('transport-results');
    
    const modeNames = {
        car: 'Mobil Pribadi',
        motorcycle: 'Sepeda Motor',
        public: 'Transportasi Umum',
        plane: 'Pesawat'
    };
    
    resultsDiv.innerHTML = `
        <div class="transport-results">
            <h4><i class="fas fa-road"></i> Emisi Transportasi</h4>
            
            <div class="transport-stats">
                <div class="stat">
                    <div class="stat-value">${emissions}</div>
                    <div class="stat-label">Ton CO₂/tahun</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(distance)}</div>
                    <div class="stat-label">km/tahun</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${modeNames[mode]}</div>
                    <div class="stat-label">Moda Transportasi</div>
                </div>
            </div>
            
            <div class="transport-alternatives">
                <h5><i class="fas fa-exchange-alt"></i> Alternatif Ramah Lingkungan:</h5>
                <div class="alternatives-grid">
                    <div class="alternative">
                        <i class="fas fa-bus"></i>
                        <span>Transportasi Umum</span>
                        <small>Kurangi ${Math.round(emissions * 0.6 * 10) / 10} ton</small>
                    </div>
                    <div class="alternative">
                        <i class="fas fa-bicycle"></i>
                        <span>Sepeda</span>
                        <small>Kurangi ${Math.round(emissions * 0.9 * 10) / 10} ton</small>
                    </div>
                    <div class="alternative">
                        <i class="fas fa-car-alt"></i>
                        <span>Mobil Listrik</span>
                        <small>Kurangi ${Math.round(emissions * 0.7 * 10) / 10} ton</small>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Select energy option
function selectEnergyOption(option) {
    document.querySelectorAll('.energy-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`[data-energy="${option}"]`).classList.add('active');
}

// Calculate energy savings
function calculateEnergySavings() {
    updateLoadingState(true);
    
    setTimeout(() => {
        try {
            const energyType = document.querySelector('.energy-option.active').dataset.energy;
            const consumption = parseFloat(document.getElementById('current-consumption').value) || 0;
            const systemSize = parseFloat(document.getElementById('system-size').value) || 0;
            const location = document.getElementById('location-sunlight').value;
            const budget = parseFloat(document.getElementById('investment-budget').value) || 0;
            
            // Get energy data
            const energyData = ENERGY_DATA[energyType];
            if (!energyData) throw new Error('Invalid energy type');
            
            // Calculate potential generation
            let locationFactor = 1;
            switch(location) {
                case 'high': locationFactor = 1.2; break;
                case 'medium': locationFactor = 1.0; break;
                case 'low': locationFactor = 0.8; break;
            }
            
            const yearlyGeneration = systemSize * energyData.capacity_factor * 8760 * locationFactor; // kWh per year
            const monthlySavings = yearlyGeneration / 12; // kWh per month
            const coverage = Math.min(100, (monthlySavings / consumption) * 100);
            
            // Calculate financials
            const systemCost = systemSize * energyData.cost_per_kwp;
            const paybackYears = systemCost / (monthlySavings * 12 * 1500); // Assuming Rp 1500 per kWh
            const yearlyCO2Savings = yearlyGeneration * energyData.co2_savings / 1000; // tons
            
            // Check if budget is sufficient
            const budgetSufficient = budget * 1000000 >= systemCost * 0.8; // 80% of system cost
            
            // Display results
            displayEnergyResults({
                energyType,
                systemSize,
                monthlySavings: Math.round(monthlySavings),
                coverage: Math.round(coverage * 10) / 10,
                systemCost: Math.round(systemCost / 1000000 * 10) / 10,
                paybackYears: Math.round(paybackYears * 10) / 10,
                yearlyCO2Savings: Math.round(yearlyCO2Savings * 10) / 10,
                budgetSufficient,
                budget: budget
            });
            
        } catch (error) {
            console.error('Error calculating energy savings:', error);
            alert('Terjadi kesalahan dalam perhitungan.');
        } finally {
            updateLoadingState(false);
        }
    }, 500);
}

// Display energy results
function displayEnergyResults(results) {
    const resultsDiv = document.getElementById('energy-results');
    
    const energyNames = {
        solar: 'Panel Surya',
        biogas: 'Biogas',
        microhydro: 'Mikrohidro'
    };
    
    resultsDiv.innerHTML = `
        <div class="energy-results">
            <h4><i class="fas fa-solar-panel"></i> Potensi ${energyNames[results.energyType]}</h4>
            
            <div class="energy-stats-grid">
                <div class="energy-stat">
                    <div class="energy-stat-value">${results.monthlySavings} kWh</div>
                    <div class="energy-stat-label">Penghematan Listrik/Bulan</div>
                </div>
                <div class="energy-stat">
                    <div class="energy-stat-value">${results.coverage}%</div>
                    <div class="energy-stat-label">Cakupan Kebutuhan</div>
                </div>
                <div class="energy-stat">
                    <div class="energy-stat-value">${results.yearlyCO2Savings} ton</div>
                    <div class="energy-stat-label">Pengurangan CO₂/Tahun</div>
                </div>
            </div>
            
            <div class="energy-financials">
                <h5><i class="fas fa-money-bill-wave"></i> Analisis Finansial</h5>
                <div class="financial-details">
                    <p><strong>Perkiraan Biaya:</strong> Rp ${(results.systemCost * 1000000).toLocaleString('id-ID')}</p>
                    <p><strong>Anggaran Anda:</strong> Rp ${(results.budget * 1000000).toLocaleString('id-ID')}</p>
                    <p><strong>Periode ROI:</strong> ${results.paybackYears} tahun</p>
                    <p><strong>Status Anggaran:</strong> 
                        <span class="${results.budgetSufficient ? 'sufficient' : 'insufficient'}">
                            ${results.budgetSufficient ? 'Cukup' : 'Kurang'}
                        </span>
                    </p>
                </div>
            </div>
            
            <div class="energy-next-steps">
                <h5><i class="fas fa-forward"></i> Langkah Selanjutnya:</h5>
                <ul>
                    ${results.budgetSufficient ? 
                        '<li>Hubungi penyedia terdekat untuk survey</li>' : 
                        '<li>Pertimbangkan sistem yang lebih kecil</li>'
                    }
                    <li>Ajukan insentif pemerintah (jika tersedia)</li>
                    <li>Hitung kebutuhan spesifik lokasi Anda</li>
                </ul>
            </div>
        </div>
    `;
}

// Update carbon comparison chart
function updateCarbonChart(userFootprint) {
    if (!carbonChart) return;
    
    carbonChart.data.datasets[0].data[0] = userFootprint;
    carbonChart.update();
    
    // Update user footprint display
    document.getElementById('userFootprint').textContent = userFootprint;
}

// ===========================================
// ENERGY SECTION FUNCTIONS
// ===========================================

// Load energy cards
function loadEnergyCards() {
    const energiList = document.getElementById('energiList');
    
    const energyData = [
        {
            title: "Pembangkit Mikrohidro",
            description: "Memanfaatkan aliran sungai kecil untuk menghasilkan listrik bagi desa terpencil.",
            image: "data:image/jpeg;base64,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",
            category: "Hidro",
            capacity: "10-100 kW",
            location: "Papua, Kalimantan, Sumatra",
            co2Savings: "150 ton/tahun"
        },
        {
            title: "PLTS Komunal",
            description: "Panel surya skala komunitas untuk daerah tanpa akses listrik.",
            image: "data:image/jpeg;base64,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",
            category: "Surya",
            capacity: "5-50 kW",
            location: "NTT, NTB, Maluku",
            co2Savings: "80 ton/tahun"
        },
        {
            title: "Biogas Ternak",
            description: "Mengolah kotoran ternak menjadi biogas untuk memasak dan listrik.",
            image: "data:image/jpeg;base64,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",
            category: "Biomassa",
            capacity: "5-20 m³/hari",
            location: "Jawa, Bali, Lombok",
            co2Savings: "50 ton/tahun"
        },
        {
            title: "Pembangkit Bayu",
            description: "Turbin angin skala kecil untuk daerah pesisir berangin.",
            image: "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=800&q=80",
            category: "Angin",
            capacity: "1-10 kW",
            location: "Pantai Selatan Jawa, Sulawesi",
            co2Savings: "30 ton/tahun"
        }
    ];
    
    energiList.innerHTML = energyData.map(item => `
        <div class="card">
            <div class="card-image">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-category">${item.category}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-details">
                    <div class="detail">
                        <i class="fas fa-bolt"></i>
                        <span>${item.capacity}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-leaf"></i>
                        <span>${item.co2Savings}</span>
                    </div>
                </div>
                <button class="card-btn" onclick="showEnergyDetail('${item.title}')">
                    <i class="fas fa-info-circle"></i> Detail
                </button>
            </div>
        </div>
    `).join('');
}

// Calculate energy potential
function calculateEnergyPotential() {
    const type = document.getElementById('energy-type').value;
    const capacity = parseFloat(document.getElementById('energy-capacity').value) || 0;
    const location = document.getElementById('energy-location').value;
    
    // Calculate based on type and location
    let potential, savings, cost;
    
    switch(type) {
        case 'solar':
            potential = capacity * 4 * 30; // 4 hours sun/day * 30 days
            savings = potential * 1500; // Rp 1500 per kWh
            cost = capacity * 15000000; // Rp 15 juta per kW
            break;
        case 'hydro':
            potential = capacity * 24 * 30 * 0.4; // 40% capacity factor
            savings = potential * 1500;
            cost = capacity * 20000000;
            break;
        case 'wind':
            potential = capacity * 24 * 30 * 0.25; // 25% capacity factor
            savings = potential * 1500;
            cost = capacity * 25000000;
            break;
        case 'biomass':
            potential = capacity * 8 * 30; // 8 hours/day operation
            savings = potential * 1500;
            cost = capacity * 10000000;
            break;
    }
    
    // Adjust for location
    let locationFactor = 1;
    switch(location) {
        case 'java': locationFactor = 1.1; break;
        case 'sumatra': locationFactor = 1.0; break;
        case 'sulawesi': locationFactor = 0.9; break;
        case 'papua': locationFactor = 0.8; break;
    }
    
    potential = Math.round(potential * locationFactor);
    savings = Math.round(savings * locationFactor);
    cost = Math.round(cost * locationFactor);
    
    // Display results
    const resultsDiv = document.getElementById('energy-potential-results');
    resultsDiv.innerHTML = `
        <div class="potential-results">
            <h5><i class="fas fa-chart-line"></i> Hasil Perhitungan</h5>
            <div class="potential-stats">
                <div class="stat">
                    <div class="stat-value">${potential.toLocaleString('id-ID')} kWh</div>
                    <div class="stat-label">Produksi Bulanan</div>
                </div>
                <div class="stat">
                    <div class="stat-value">Rp ${savings.toLocaleString('id-ID')}</div>
                    <div class="stat-label">Penghematan Bulanan</div>
                </div>
                <div class="stat">
                    <div class="stat-value">Rp ${cost.toLocaleString('id-ID')}</div>
                    <div class="stat-label">Perkiraan Investasi</div>
                </div>
            </div>
            <p class="potential-note">
                <i class="fas fa-info-circle"></i>
                Perkiraan berdasarkan data rata-rata di ${location}. Konsultasi dengan ahli diperlukan untuk perhitungan akurat.
            </p>
        </div>
    `;
}

// Show energy detail
function showEnergyDetail(title) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="energy-detail-modal">
            <h3>${title}</h3>
            <p>Detail lengkap tentang teknologi energi terbarukan ini akan ditampilkan di sini.</p>
            <div class="detail-info">
                <div class="info-item">
                    <i class="fas fa-calculator"></i>
                    <div>
                        <h5>Kalkulator Potensi</h5>
                        <p>Gunakan kalkulator di atas untuk menghitung potensi di lokasi Anda</p>
                    </div>
                </div>
                <div class="info-item">
                    <i class="fas fa-map-marked-alt"></i>
                    <div>
                        <h5>Lokasi</h5>
                        <p>Lihat peta untuk menemukan proyek serupa di daerah Anda</p>
                    </div>
                </div>
            </div>
            <div class="modal-actions">
                <button onclick="scrollToSection('eco-calculator')" class="btn-primary">
                    <i class="fas fa-calculator"></i> Hitung Potensi
                </button>
                <button onclick="scrollToSection('peta-interaktif')" class="btn-secondary">
                    <i class="fas fa-map"></i> Lihat Peta
                </button>
            </div>
        </div>
    `;
    openModal();
}

// ===========================================
// WISDOM SECTION FUNCTIONS
// ===========================================

// Load wisdom cards
function loadWisdomCards() {
    const kearifanList = document.getElementById('kearifanList');
    
    const wisdomData = [
        {
            title: "Sasi - Maluku",
            description: "Sistem pengelolaan sumber daya laut berbasis kearifan lokal dengan periode buka-tutup.",
            image: "https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=800&q=80",
            category: "Laut",
            location: "Maluku, Papua",
            impact: "Melindungi 500+ spesies laut"
        },
        {
            title: "Subak - Bali",
            description: "Sistem irigasi tradisional yang mengatur pembagian air secara adil dan berkelanjutan.",
            image: "https://img.freepik.com/premium-photo/cultural-landscape-bali-subak-irrigation-sy-unesco-natural-trust-ecological-heritage_868611-10815.jpg",
            category: "Pertanian",
            location: "Bali",
            impact: "Warisan UNESCO sejak 2012"
        },
        {
            title: "Leuweung Larangan",
            description: "Hutan larangan adat yang dijaga turun-temurun dengan aturan ketat.",
            image: "https://assets-a1.kompasiana.com/items/album/2024/05/15/ilustrasi-leuweung-larangan-66446b6dde948f6e905e5ae2.jpeg?t=o&v=1200",
            category: "Hutan",
            location: "Jawa Barat, Banten",
            impact: "15 hektar hutan terlindungi"
        },
        {
            title: "Rumah Betang",
            description: "Rumah panjang Dayak yang mencerminkan harmoni dengan alam dan kehidupan komunal.",
            image: "data:image/jpeg;base64,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",
            category: "Adat",
            location: "Kalimantan",
            impact: "Arsitektur ramah lingkungan"
        }
    ];
    
    kearifanList.innerHTML = wisdomData.map(item => `
        <div class="card">
            <div class="card-image">
                <img src="${item.image}" alt="${item.title}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-category">${item.category}</div>
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <div class="card-details">
                    <div class="detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${item.location}</span>
                    </div>
                    <div class="detail">
                        <i class="fas fa-star"></i>
                        <span>${item.impact}</span>
                    </div>
                </div>
                <button class="card-btn" onclick="showWisdomDetail('${item.title}')">
                    <i class="fas fa-info-circle"></i> Pelajari
                </button>
            </div>
        </div>
    `).join('');
}

// Show wisdom detail
function showWisdomDetail(title) {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="wisdom-detail-modal">
            <h3>${title}</h3>
            <p>Kearifan lokal ini telah terbukti efektif dalam menjaga kelestarian lingkungan selama ratusan tahun.</p>
            
            <div class="wisdom-benefits">
                <h5><i class="fas fa-check-circle"></i> Manfaat Lingkungan:</h5>
                <ul>
                    <li>Melestarikan keanekaragaman hayati</li>
                    <li>Menjaga keseimbangan ekosistem</li>
                    <li>Mengurangi dampak perubahan iklim</li>
                    <li>Melestarikan pengetahuan tradisional</li>
                </ul>
            </div>
            
            <div class="wisdom-actions">
                <h5><i class="fas fa-hands-helping"></i> Bagaimana Anda Dapat Membantu:</h5>
                <div class="action-buttons">
                    <button onclick="scrollToSection('kontribusi')" class="btn-action">
                        <i class="fas fa-donate"></i> Kontribusi
                    </button>
                    <button onclick="sharePlatform()" class="btn-action">
                        <i class="fas fa-share-alt"></i> Sebarkan
                    </button>
                </div>
            </div>
        </div>
    `;
    openModal();
}

// ===========================================
// CONTRIBUTION SECTION FUNCTIONS
// ===========================================

// Select contribution type
function selectContribution(type) {
    document.querySelectorAll('.contribution-option').forEach(el => el.classList.remove('active'));
    document.querySelector(`[onclick="selectContribution('${type}')"]`).classList.add('active');
}

// Calculate contribution impact
function calculateContributionImpact() {
    const type = document.querySelector('.contribution-option.active').getAttribute('onclick').match(/'([^']+)'/)[1];
    const amount = parseFloat(document.getElementById('contribution-amount').value) || 0;
    const duration = document.getElementById('contribution-duration').value;
    
    // Calculate impact based on type
    let impact, unit, description;
    
    switch(type) {
        case 'tree':
            const trees = Math.floor(amount / 50000); // Rp 50,000 per tree
            impact = trees;
            unit = 'pohon tertanam';
            description = `Setiap pohon menyerap 21.77 kg CO₂ per tahun`;
            break;
        case 'solar':
            const solarCapacity = amount / 15000000; // Rp 15 juta per kWp
            impact = Math.round(solarCapacity * 100) / 100;
            unit = 'kWp panel surya';
            description = `Setiap kWp mengurangi 1.5 ton CO₂ per tahun`;
            break;
        case 'education':
            const students = Math.floor(amount / 200000); // Rp 200,000 per student workshop
            impact = students;
            unit = 'peserta edukasi';
            description = `Edukasi lingkungan untuk generasi mendatang`;
            break;
        case 'cleanup':
            const cleanups = Math.floor(amount / 1000000); // Rp 1 juta per cleanup
            impact = cleanups;
            unit = 'aksi bersih-bersih';
            description = `Membersihkan lingkungan dari sampah plastik`;
            break;
    }
    
    // Adjust for duration
    if (duration === 'monthly') {
        impact *= 12;
        description += ' (setiap tahun)';
    } else if (duration === 'yearly') {
        impact *= 5; // Assume 5 year commitment
        description += ' (selama 5 tahun)';
    }
    
    // Display results
    const resultsDiv = document.getElementById('contributionResults');
    resultsDiv.innerHTML = `
        <div class="contribution-impact">
            <h5><i class="fas fa-chart-line"></i> Dampak Kontribusi Anda</h5>
            <div class="impact-main">
                <div class="impact-number">
                    <span class="number">${Math.round(impact)}</span>
                    <span class="unit">${unit}</span>
                </div>
                <p class="impact-description">${description}</p>
            </div>
            <div class="impact-details">
                <div class="impact-item">
                    <i class="fas fa-leaf"></i>
                    <div>
                        <strong>Setara dengan</strong>
                        <p>${Math.round(impact * 0.5)} ton CO₂ berkurang</p>
                    </div>
                </div>
                <div class="impact-item">
                    <i class="fas fa-users"></i>
                    <div>
                        <strong>Membantu</strong>
                        <p>${Math.round(impact * 10)} orang</p>
                    </div>
                </div>
            </div>
            <div class="impact-actions">
                <button onclick="processContribution(${amount}, '${type}', '${duration}')" class="btn-donate">
                    <i class="fas fa-donate"></i> Lanjutkan Kontribusi
                </button>
            </div>
        </div>
    `;
}

// Process contribution (simulation)
function processContribution(amount, type, duration) {
    updateLoadingState(true);
    
    setTimeout(() => {
        alert(`Terima kasih! Kontribusi Rp ${amount.toLocaleString('id-ID')} untuk ${type} telah direkam.`);
        updateLoadingState(false);
    }, 1000);
}

// Open volunteer form
function openVolunteerForm() {
    const modalBody = document.getElementById('modalBody');
    modalBody.innerHTML = `
        <div class="volunteer-modal">
            <h3><i class="fas fa-hands-helping"></i> Jadi Relawan</h3>
            <p>Bergabunglah dengan komunitas relawan Lestari Nusantara untuk aksi lingkungan nyata.</p>
            
            <form id="volunteerForm">
                <div class="form-group">
                    <label for="volunteer-name">Nama Lengkap</label>
                    <input type="text" id="volunteer-name" required>
                </div>
                <div class="form-group">
                    <label for="volunteer-email">Email</label>
                    <input type="email" id="volunteer-email" required>
                </div>
                <div class="form-group">
                    <label for="volunteer-phone">Nomor Telepon</label>
                    <input type="tel" id="volunteer-phone" required>
                </div>
                <div class="form-group">
                    <label for="volunteer-location">Lokasi</label>
                    <select id="volunteer-location" required>
                        <option value="">Pilih Provinsi</option>
                        <option value="jakarta">DKI Jakarta</option>
                        <option value="jabar">Jawa Barat</option>
                        <option value="jateng">Jawa Tengah</option>
                        <option value="jatim">Jawa Timur</option>
                        <option value="bali">Bali</option>
                    </select>
                </div>
                <div class="form-group">
                    <label for="volunteer-interest">Minat Kegiatan</label>
                    <select id="volunteer-interest" multiple>
                        <option value="tree-planting">Penanaman Pohon</option>
                        <option value="cleanup">Bersih-bersih</option>
                        <option value="education">Edukasi</option>
                        <option value="research">Penelitian</option>
                    </select>
                </div>
                
                <div class="form-actions">
                    <button type="button" onclick="closeModal()" class="btn-secondary">Batal</button>
                    <button type="submit" class="btn-primary">Daftar Sekarang</button>
                </div>
            </form>
        </div>
    `;
    
    // Add form submission
    document.getElementById('volunteerForm').addEventListener('submit', function(e) {
        e.preventDefault();
        alert('Pendaftaran relawan berhasil! Tim kami akan menghubungi Anda.');
        closeModal();
    });
    
    openModal();
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

// Update loading state
function updateLoadingState(loading) {
    const loadingOverlay = document.getElementById('globalLoading');
    if (loading) {
        loadingOverlay.classList.add('active');
    } else {
        loadingOverlay.classList.remove('active');
    }
}

// Update active menu based on scroll
function updateActiveMenu() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.menu a');
    
    let current = '';
    const scrollPos = window.scrollY + 100;
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight) {
            current = section.getAttribute('id');
        }
    });
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// Scroll to section smoothly
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        window.scrollTo({
            top: section.offsetTop - 80,
            behavior: 'smooth'
        });
        
        // Update active menu
        updateActiveMenu();
    }
}

// Open modal
function openModal() {
    document.getElementById('infoModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close modal
function closeModal() {
    document.getElementById('infoModal').classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Share platform
function sharePlatform() {
    const shareData = {
        title: 'Lestari Nusantara',
        text: 'Platform energi terbarukan, kearifan lokal, dan kalkulator jejak karbon Indonesia',
        url: window.location.href
    };
    
    if (navigator.share) {
        navigator.share(shareData);
    } else {
        navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
        alert('Tautan platform telah disalin ke clipboard!');
    }
}

// Save carbon result (simulation)
function saveCarbonResult(emissions) {
    localStorage.setItem('carbonFootprint', emissions);
    alert(`Jejak karbon ${emissions} ton/tahun telah disimpan.`);
}

// Share carbon result
function shareCarbonResult(emissions) {
    const shareText = `Jejak karbon saya: ${emissions} ton CO₂ per tahun. #LestariNusantara`;
    if (navigator.share) {
        navigator.share({
            title: 'Jejak Karbon Saya',
            text: shareText,
            url: window.location.href
        });
    } else {
        navigator.clipboard.writeText(shareText);
        alert('Hasil telah disalin ke clipboard!');
    }
}

// Navigate to location (simulation)
function navigateToLocation(lat, lng) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, '_blank');
}

// Subscribe newsletter
function subscribeNewsletter() {
    const email = document.getElementById('newsletter-email').value;
    if (email && email.includes('@')) {
        updateLoadingState(true);
        setTimeout(() => {
            alert('Terima kasih telah berlangganan newsletter kami!');
            document.getElementById('newsletter-email').value = '';
            updateLoadingState(false);
        }, 1000);
    } else {
        alert('Silakan masukkan email yang valid.');
    }
}

// Setup all event listeners
function setupEventListeners() {
    // Update travel days value
    const travelDays = document.getElementById('travel-days');
    const daysValue = document.getElementById('days-value');
    travelDays.addEventListener('input', function() {
        daysValue.textContent = this.value;
    });
    
    // Close modal on outside click
    document.getElementById('infoModal').addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal();
        }
    });
    
    // Close modal on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && document.getElementById('infoModal').classList.contains('active')) {
            closeModal();
        }
    });
    
    // Update carbon chart when window resizes
    window.addEventListener('resize', function() {
        if (carbonChart) {
            carbonChart.resize();
        }
    });
}

// Initialize with loading state
updateLoadingState(true);
// ===========================================
// IMAGE OPTIMIZATION FUNCTIONS
// ===========================================

// Image URLs with optimized parameters
const OPTIMIZED_IMAGES = {
    // Hero images
    hero: {
        default: 'https://images.unsplash.com/photo-1501854140801-50d01698950b',
        optimized: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80',
        mobile: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=60',
        webp: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80&fm=webp'
    },
    
    // Energy category images (optimized for cards)
    energy: {
        hydro: {
            optimized: 'https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDIwMEg2MDBWMzAwSDBWMjAwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAzMDBINjAwVjQwMEgwVjMwMFoiIGZpbGw9IiNFMEU0RjciLz4KPHBhdGggZD0iTTMwMCAxNTBIMzUwVjI1MEgzMDBWMTUwWiIgZmlsbD0iI0Q5REFFNCIvPgo8L3N2Zz4K'
        },
        solar: {
            optimized: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRkZGRkZGIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iODAiIGZpbGw9IiNGRkUwQzAiLz4KPHBhdGggZD0iTTMwMCA4MFYzMjBNNDIwIDIwMEgxODBNMzg1IDM4NSAyMTUgMTVNNDE1IDE1IDIxNSAzODVNMTE1IDIwMEg0ODVNNTIwIDIwMEg4ME0zODUgMTUgMjE1IDM4NSIgc3Ryb2tlPSIjRkZCMDgwIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+'
        },
        biogas: {
            optimized: 'https://images.unsplash.com/photo-1589923186741-b7d59d6b2c4c?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMEYwIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iMTAwIiBmaWxsPSIjOEM5QzRBIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNzAiIGZpbGw9IiNBN0JDMzgiLz4KPHBhdGggZD0iTTMwMCAzMjBWMzgwTTMwMCAyMFY4ME0xODAgMjQwSDEyME00ODAgMjQwSDQyME0yNDAgMTIwSDI2ME0zNDAgMTIwSDM2MCIgc3Ryb2tlPSIjNkM3QzJCIiBzdHJva2Utd2lkdGg9IjMiLz4KPC9zdmc+'
        },
        wind: {
            optimized: 'https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxjaXJjbGUgY3g9IjMwMCIgY3k9IjIwMCIgcj0iNjAiIGZpbGw9IiNGRkZGRkYiLz4KPHBhdGggZD0iTTMwMCAyNjBMMzAwIDM0ME0zMDAgNjBMMzAwIDE0ME0xNDAgMjAwTDIyMCAyMDBMNDIwIDIwMEw1MDAgMjAwIiBzdHJva2U9IiNDQ0NDQ0MiIHN0cm9rZS13aWR0aD0iMiIvPgo8cGF0aCBkPSJNMzAwIDE0MEwzODAgMjYwTTMwMCAxNDBMMjIwIDI2ME0zMDAgMjYwTDIyMCAxNDBNMzAwIDI2MEwzODAgMTQxIiBzdHJva2U9IiNGRkJCQkIiIHN0cm9rZS13aWR0aD0iMyIvPgo8L3N2Zz4K'
        }
    },
    
    // Wisdom category images
    wisdom: {
        sasi: {
            optimized: 'https://images.unsplash.com/photo-1483683804023-6ccdb62f86ef?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDIwMEg2MDBWMzAwSDBWMjAwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAzMDBINjAwVjQwMEgwVjMwMFoiIGZpbGw9IiNFMEU0RjciLz4KPGNpcmNsZSBjeD0iMzAwIiBjeT0iMTAwIiByPSI2MCIgZmlsbD0iIzRDOEFGNSIvPgo8Y2lyY2xlIGN4PSIxNTAiIGN5PSIyNTAiIHI9IjQwIiBmaWxsPSIjRkZCMDgwIi8+CjxjaXJjbGUgY3g9IjQ1MCIgY3k9IjI1MCIgcj0iNDAiIGZpbGw9IiNGRkIwODAiLz4KPC9zdmc+'
        },
        subak: {
            optimized: 'https://images.unsplash.com/photo-1528164344705-47542687000d?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDIwMEg2MDBWMzAwSDBWMjAwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAzMDBINjAwVjQwMEgwVjMwMFoiIGZpbGw9IiNFMEU0RjciLz4KPHBhdGggZD0iTTAgMTUwSDEwMFYyNTBIMFYxNTBaTTE1MCAxNTBIMjUwVjI1MEgxNTBWMTUwWk0zMDAgMTUwSDQwMFYyNTBIMzAwVjE1MFpNNDUwIDE1MEg1NTBWMjUwSDQ1MFYxNTBaIiBmaWxsPSIjOEM5QzRBIi8+Cjwvc3ZnPg=='
        },
        leuweung: {
            optimized: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDIwMEg2MDBWMzAwSDBWMjAwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAzMDBINjAwVjQwMEgwVjMwMFoiIGZpbGw9IiNFMEU0RjciLz4KPHBhdGggZD0iTTEwMCAxMDBIMjAwVjIwMEgxMDBWMTAwWk0yNTAgNTBIMzUwVjE1MEgyNTBWNTBaTTQwMCAxMDAgNTAwIDEwMCA1MDAgMjAwIDQwMCAyMDAgNDAwIDEwMFoiIGZpbGw9IiMyRTdEMzIiLz4KPC9zdmc+'
        },
        betang: {
            optimized: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=600&h=400&q=80&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDIwMEg2MDBWMzAwSDBWMjAwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAzMDBINjAwVjQwMEgwVjMwMFoiIGZpbGw9IiNFMEU0RjciLz4KPHJlY3QgeD0iMTAwIiB5PSIxMDAiIHdpZHRoPSI0MDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjOEI1QjI0Ii8+CjxyZWN0IHg9IjEyMCIgeT0iMTIwIiB3aWR0aD0iMzYwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjRkZDMTAyIi8+Cjwvc3ZnPg=='
        }
    },
    
    // Gallery images (optimized for grid)
    gallery: [
        {
            id: 1,
            optimized: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=400&h=300&q=80&crop=entropy',
            thumbnail: 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=200&h=150&q=60&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDE1MEg0MDBWMjUwSDBWMTUwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAyNTBINDAwVjMwMEgwVjI1MFoiIGZpbGw9IiNFMEU0RjciLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iNzUiIHI9IjUwIiBmaWxsPSIjNEI4OUZGIi8+Cjwvc3ZnPg=='
        },
        {
            id: 2,
            optimized: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=400&h=300&q=80&crop=entropy',
            thumbnail: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?auto=format&fit=crop&w=200&h=150&q=60&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDE1MEg0MDBWMjUwSDBWMTUwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAyNTBINDAwVjMwMEgwVjI1MFoiIGZpbGw9IiNFMEU0RjciLz4KPHJlY3QgeD0iMTUwIiB5PSI1MCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxNTAiIGZpbGw9IiNGRkIwODAiLz4KPC9zdmc+'
        },
        {
            id: 3,
            optimized: 'https://images.unsplash.com/photo-1536152471326-642d74677bcc?auto=format&fit=crop&w=400&h=300&q=80&crop=entropy',
            thumbnail: 'https://images.unsplash.com/photo-1536152471326-642d74677bcc?auto=format&fit=crop&w=200&h=150&q=60&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDE1MEg0MDBWMjUwSDBWMTUwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAyNTBINDAwVjMwMEgwVjI1MFoiIGZpbGw9IiNFMEU0RjciLz4KPHBhdGggZD0iTTAgMTUwTDIwMCAzMDBMNDAwIDE1MCIgZmlsbD0iIzRDOEFGNSIvPgo8L3N2Zz4K'
        },
        {
            id: 4,
            optimized: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=400&h=300&q=80&crop=entropy',
            thumbnail: 'https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=200&h=150&q=60&crop=entropy',
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgdmlld0JveD0iMCAwIDQwMCAzMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI0MDAiIGhlaWdodD0iMzAwIiBmaWxsPSIjRjBGMUYyIi8+CjxwYXRoIGQ9Ik0wIDE1MEg0MDBWMjUwSDBWMTUwWiIgZmlsbD0iI0U1RTVGMSIvPgo8cGF0aCBkPSJNMCAyNTBINDAwVjMwMEgwVjI1MFoiIGZpbGw9IiNFMEU0RjciLz4KPGNpcmNsZSBjeD0iMjAwIiBjeT0iMTAwIiByPSI3NSIgZmlsbD0iIzJFN0QzMiIvPgo8L3N2Zz4K'
        }
    ]
};

// Initialize image optimization
function initImageOptimization() {
    console.log('Initializing image optimization...');
    
    // Check WebP support
    checkWebPSupport();
    
    // Initialize lazy loading
    initLazyLoading();
    
    // Optimize existing images
    optimizeExistingImages();
    
    // Preload critical images
    preloadCriticalImages();
    
    console.log('Image optimization initialized');
}

// Check WebP support
function checkWebPSupport() {
    const canvas = document.createElement('canvas');
    if (canvas.getContext && canvas.getContext('2d')) {
        // Check if WebP is supported
        const hasWebP = canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
        if (hasWebP) {
            document.documentElement.classList.add('webp');
        } else {
            document.documentElement.classList.add('no-webp');
        }
    }
}

// Initialize lazy loading
function initLazyLoading() {
    // Create Intersection Observer for lazy loading
    const lazyImageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const lazyImage = entry.target;
                loadLazyImage(lazyImage);
                lazyImageObserver.unobserve(lazyImage);
            }
        });
    }, {
        rootMargin: '50px 0px',
        threshold: 0.1
    });
    
    // Observe all lazy images
    document.querySelectorAll('img.lazy').forEach(img => {
        lazyImageObserver.observe(img);
    });
}

// Load lazy image
function loadLazyImage(img) {
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');
    
    if (src) {
        img.src = src;
    }
    
    if (srcset) {
        img.srcset = srcset;
    }
    
    img.classList.remove('lazy');
    img.classList.add('loaded');
    
    // Add error handling
    img.onerror = function() {
        this.src = this.getAttribute('data-fallback') || 'https://via.placeholder.com/600x400?text=Image+Not+Found';
        this.classList.add('error');
    };
}

// Optimize existing images
function optimizeExistingImages() {
    // Optimize hero background
    optimizeHeroBackground();
    
    // Optimize card images
    optimizeCardImages();
    
    // Optimize gallery images
    optimizeGalleryImages();
}

// Optimize hero background
function optimizeHeroBackground() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    
    // Remove inline background image if exists
    hero.style.backgroundImage = '';
    
    // Add optimized background based on screen size
    const isMobile = window.innerWidth < 768;
    const isRetina = window.devicePixelRatio > 1;
    
    let bgImage;
    if (document.documentElement.classList.contains('webp')) {
        bgImage = isMobile ? 
            'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=60&fm=webp")' :
            isRetina ?
                'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=3200&q=80&fm=webp&dpr=2")' :
                'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80&fm=webp")';
    } else {
        bgImage = isMobile ?
            'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=800&q=60")' :
            isRetina ?
                'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=3200&q=80&dpr=2")' :
                'url("https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1600&q=80")';
    }
    
    hero.style.backgroundImage = `linear-gradient(135deg, rgba(46, 125, 50, 0.9), rgba(33, 150, 243, 0.9)), ${bgImage}`;
}

// Optimize card images
function optimizeCardImages() {
    const cards = document.querySelectorAll('.card-image img');
    
    cards.forEach((img, index) => {
        if (!img.src || img.src.includes('placeholder')) {
            // Determine image type based on card content
            const card = img.closest('.card');
            const category = card?.querySelector('.card-category')?.textContent?.toLowerCase() || '';
            
            let imageData;
            if (category.includes('hidro') || category.includes('air')) {
                imageData = OPTIMIZED_IMAGES.energy.hydro;
            } else if (category.includes('surya') || category.includes('solar')) {
                imageData = OPTIMIZED_IMAGES.energy.solar;
            } else if (category.includes('bio')) {
                imageData = OPTIMIZED_IMAGES.energy.biogas;
            } else if (category.includes('angin') || category.includes('wind')) {
                imageData = OPTIMIZED_IMAGES.energy.wind;
            } else if (category.includes('sasi') || category.includes('laut')) {
                imageData = OPTIMIZED_IMAGES.wisdom.sasi;
            } else if (category.includes('subak') || category.includes('irigasi')) {
                imageData = OPTIMIZED_IMAGES.wisdom.subak;
            } else if (category.includes('leuweung') || category.includes('hutan')) {
                imageData = OPTIMIZED_IMAGES.wisdom.leuweung;
            } else if (category.includes('betang') || category.includes('adat')) {
                imageData = OPTIMIZED_IMAGES.wisdom.betang;
            }
            
            if (imageData) {
                // Set placeholder first
                img.src = imageData.placeholder;
                img.classList.add('lazy');
                
                // Set data-src for lazy loading
                img.setAttribute('data-src', imageData.optimized);
                img.setAttribute('data-fallback', imageData.placeholder);
                
                // Add error handling
                img.onerror = function() {
                    this.src = imageData.placeholder;
                    this.classList.remove('lazy');
                    this.classList.add('error');
                };
            }
        }
    });
}

// Optimize gallery images
function optimizeGalleryImages() {
    const galleryItems = document.querySelectorAll('.gallery-item img');
    
    galleryItems.forEach((img, index) => {
        if (!img.src || img.src.includes('placeholder')) {
            const imageData = OPTIMIZED_IMAGES.gallery[index % OPTIMIZED_IMAGES.gallery.length];
            
            if (imageData) {
                // Set thumbnail first
                img.src = imageData.thumbnail;
                img.classList.add('lazy');
                
                // Set data-src for full image
                img.setAttribute('data-src', imageData.optimized);
                img.setAttribute('data-fallback', imageData.placeholder);
                
                // Add click handler for lightbox
                img.addEventListener('click', () => {
                    openLightbox(imageData.optimized, `Gallery Image ${index + 1}`);
                });
            }
        }
    });
}

// Preload critical images
function preloadCriticalImages() {
    // Create preload links for critical images
    const preloadLinks = [
        OPTIMIZED_IMAGES.energy.hydro.optimized,
        OPTIMIZED_IMAGES.energy.solar.optimized,
        OPTIMIZED_IMAGES.wisdom.sasi.optimized,
        OPTIMIZED_IMAGES.wisdom.subak.optimized
    ];
    
    preloadLinks.forEach(url => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);
    });
}

// Image compression utility
function compressImage(url, options = {}) {
    const { width = 800, height = 600, quality = 80, format = 'auto' } = options;
    
    // For Unsplash images, we can use their built-in optimization
    if (url.includes('unsplash.com')) {
        const params = new URLSearchParams();
        if (width) params.append('w', width);
        if (height) params.append('h', height);
        if (quality) params.append('q', quality);
        if (format !== 'auto') params.append('fm', format);
        params.append('fit', 'crop');
        params.append('crop', 'entropy');
        
        return `${url.split('?')[0]}?${params.toString()}`;
    }
    
    // For other images, return original (in production, you'd use an image CDN)
    return url;
}

// Generate responsive image srcset
function generateSrcset(baseUrl, sizes = [400, 800, 1200, 1600]) {
    return sizes.map(size => `${compressImage(baseUrl, { width: size })} ${size}w`).join(', ');
}

// Update image loading with optimized versions
function updateImageOptimization() {
    // Update all images with data-optimize attribute
    document.querySelectorAll('img[data-optimize]').forEach(img => {
        const originalSrc = img.src;
        const width = img.clientWidth || 800;
        const height = img.clientHeight || 600;
        
        // Only optimize if image is visible and not already optimized
        if (originalSrc && !originalSrc.includes('unsplash.com/photo')) {
            const optimizedSrc = compressImage(originalSrc, { width, height, quality: 85 });
            
            // Use lazy loading
            img.classList.add('lazy');
            img.setAttribute('data-src', optimizedSrc);
            img.setAttribute('data-fallback', originalSrc);
            img.src = ''; // Clear src to trigger lazy loading
            
            // Add placeholder
            img.style.backgroundColor = '#f0f0f0';
        }
    });
}

// Monitor image loading performance
function monitorImagePerformance() {
    const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
            if (entry.initiatorType === 'img') {
                console.log(`Image loaded: ${entry.name}, size: ${Math.round(entry.encodedBodySize / 1024)}KB, time: ${Math.round(entry.duration)}ms`);
                
                // Track large images
                if (entry.encodedBodySize > 100000) { // > 100KB
                    console.warn(`Large image detected: ${entry.name} (${Math.round(entry.encodedBodySize / 1024)}KB)`);
                }
            }
        });
    });
    
    observer.observe({ entryTypes: ['resource'] });
}

// Handle image errors gracefully
function handleImageErrors() {
    document.addEventListener('error', function(e) {
        if (e.target.tagName === 'IMG') {
            const img = e.target;
            const fallback = img.getAttribute('data-fallback') || 
                           'data:image/svg+xml;base64,' + btoa(`
                                <svg xmlns="http://www.w3.org/2000/svg" width="${img.width || 600}" height="${img.height || 400}" viewBox="0 0 600 400">
                                    <rect width="600" height="400" fill="#f0f0f0"/>
                                    <text x="300" y="200" text-anchor="middle" fill="#666" font-family="Arial" font-size="16">
                                        Image not available
                                    </text>
                                </svg>
                           `);
            
            img.src = fallback;
            img.classList.add('error');
            img.classList.remove('lazy');
        }
    }, true);
}

// Responsive image loading based on viewport
function loadResponsiveImages() {
    const viewportWidth = window.innerWidth;
    
    // Update images based on viewport
    document.querySelectorAll('img[data-srcset]').forEach(img => {
        const srcset = img.getAttribute('data-srcset');
        if (!srcset) return;
        
        // Parse srcset
        const sources = srcset.split(',').map(src => {
            const [url, width] = src.trim().split(' ');
            return { url, width: parseInt(width) };
        });
        
        // Sort by width
        sources.sort((a, b) => a.width - b.width);
        
        // Find best source
        let bestSource = sources[0];
        for (const source of sources) {
            if (source.width >= viewportWidth * 0.8) {
                bestSource = source;
                break;
            }
        }
        
        // Load best source
        if (bestSource && (!img.src || img.src !== bestSource.url)) {
            img.classList.add('lazy');
            img.setAttribute('data-src', bestSource.url);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize image optimization
    initImageOptimization();
    
    // Handle window resize for responsive images
    let resizeTimeout;
    window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(loadResponsiveImages, 250);
    });
    
    // Start performance monitoring
    if ('PerformanceObserver' in window) {
        monitorImagePerformance();
    }
    
    // Handle image errors
    handleImageErrors();
});

// Export functions for use in other modules
window.ImageOptimizer = {
    compressImage,
    generateSrcset,
    updateImageOptimization,
    loadResponsiveImages
};
function getOptimizationParams() {
    const connection = navigator.connection;
    let quality = 80;
    let width = 800;
    
    if (connection) {
        if (connection.effectiveType === '4g') {
            quality = 85;
            width = 1200;
        } else if (connection.effectiveType === '3g') {
            quality = 70;
            width = 600;
        } else {
            quality = 60;
            width = 400;
        }
        
        // Save data mode
        if (connection.saveData) {
            quality = 50;
            width = 300;
        }
    }
    
    return { quality, width };
}
// Contoh dengan Cloudinary/Imgix
function getCDNUrl(url, options) {
    if (url.includes('cloudinary.com') || url.includes('imgix.net')) {
        const params = new URLSearchParams();
        if (options.width) params.append('w', options.width);
        if (options.height) params.append('h', options.height);
        if (options.quality) params.append('q', options.quality);
        params.append('auto', 'format,compress');
        params.append('fit', 'crop');
        
        return `${url}?${params.toString()}`;
    }
    return url;
}
