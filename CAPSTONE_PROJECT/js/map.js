// TourPulse - Map Controller
// Coordinates Leaflet.js mapping markers, density colors, path corridors, and focus flies.

window.TourPulseMap = (function() {
    let map = null;
    let markersLayer = null;
    let pathsLayer = null;
    let activeCity = "Chennai";
    let currentFilters = null;

    function initMap() {
        if (map) return;

        const cities = window.TourPulseData.getCities();
        const center = cities[activeCity];

        // Initialize leaflet map
        map = L.map('map-element', {
            center: [center.lat, center.lng],
            zoom: center.zoom,
            zoomControl: true,
            scrollWheelZoom: true
        });

        // Add standard tile layer (OSM)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        pathsLayer = L.layerGroup().addTo(map);
    }

    function updateMap(filters) {
        activeCity = filters.city || "Chennai";
        currentFilters = filters;

        if (!map) {
            initMap();
        }
        if (!map) return;

        const cities = window.TourPulseData.getCities();
        const center = cities[activeCity];
        if (center) {
            // Smooth pan to city center
            map.panTo([center.lat, center.lng]);
        }

        // Clear existing markers & paths
        markersLayer.clearLayers();
        pathsLayer.clearLayers();

        const popularityData = window.TourPulseData.getAttractionPopularity(filters);
        const flowData = window.TourPulseData.getTouristFlowData(filters);

        // Filter and plot paths
        drawFlowLines(activeCity, flowData.movementFlows);

        // Add pins for each attraction
        popularityData.forEach(item => {
            const allCityAttrs = window.TourPulseData.getAttractions(activeCity);
            const attrObj = allCityAttrs.find(a => a.name === item.name);
            if (!attrObj) return;

            // Crowd-specific colors
            let pinColor = '#10b981'; // Green
            if (item.crowd === 'High') pinColor = '#ef4444'; // Red
            else if (item.crowd === 'Moderate') pinColor = '#f59e0b'; // Amber

            // Custom Circular pulsing divIcon matching density colors
            const icon = L.divIcon({
                className: 'custom-pulse-pin',
                html: `
                    <div style="
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        background-color: ${pinColor}25;
                        border: 2px solid ${pinColor};
                        box-shadow: 0 0 12px ${pinColor}40;
                        cursor: pointer;
                        transition: transform 0.2s ease-in-out;
                    " class="map-pulse-node">
                        <div style="
                            width: 12px;
                            height: 12px;
                            border-radius: 50%;
                            background-color: ${pinColor};
                            border: 2px solid #ffffff;
                        "></div>
                        <div style="
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            border-radius: 50%;
                            border: 1px solid ${pinColor};
                            animation: markerPulse 1.8s infinite ease-out;
                            pointer-events: none;
                        "></div>
                    </div>
                `,
                iconSize: [34, 34],
                iconAnchor: [17, 17]
            });

            const marker = L.marker([attrObj.lat, attrObj.lng], { icon: icon });
            
            // Marker tooltip detailing visitor metrics
            marker.bindTooltip(`
                <div style="font-family: inherit; font-size: 0.8rem; padding: 0.25rem;">
                    <strong>${item.name}</strong><br/>
                    Predicted crowd: <span style="color: ${pinColor}; font-weight: 700;">${item.crowd}</span><br/>
                    Simulated Range Visits: <strong>${item.visits.toLocaleString()}</strong>
                </div>
            `);

            // Marker click handler
            marker.on('click', function() {
                openMapDetailPanel(item.id, filters);
                map.flyTo([attrObj.lat, attrObj.lng], 13.5, { animate: true, duration: 1.0 });
            });

            markersLayer.addLayer(marker);
        });
    }

    // Draws movement paths
    function drawFlowLines(city, movementFlows) {
        if (!movementFlows || movementFlows.length === 0) return;

        const allAttrs = window.TourPulseData.getAttractions(city);
        
        movementFlows.forEach(flow => {
            const fromAttr = allAttrs.find(a => a.name === flow.from);
            const toAttr = allAttrs.find(a => a.name === flow.to);
            
            if (!fromAttr || !toAttr) return;

            const latlngs = [
                [fromAttr.lat, fromAttr.lng],
                [toAttr.lat, toAttr.lng]
            ];

            const weight = Math.max(Math.min(flow.weight / 18, 7), 2);

            const polyline = L.polyline(latlngs, {
                color: '#06b6d4', // Cyan accent
                weight: weight,
                opacity: 0.55,
                dashArray: '6, 8',
                lineCap: 'round'
            });

            polyline.bindTooltip(`
                <div style="font-size: 0.75rem;">
                    <strong>Movement Pathway</strong><br/>
                    ${flow.from} ➔ ${flow.to}<br/>
                    Density: ${flow.weight} transfers
                </div>
            `);

            pathsLayer.addLayer(polyline);
        });
    }

    // Open slide detail panel inside Live Map view
    function openMapDetailPanel(attractionId, filters) {
        const detail = window.TourPulseData.getAttractionDetail(attractionId, filters);
        if (!detail) return;

        const placeholder = document.getElementById('map-panel-placeholder');
        const content = document.getElementById('map-panel-content');
        
        if (placeholder) placeholder.style.display = 'none';
        if (content) {
            content.style.display = 'block';

            let crowdBadge = '<span class="badge badge-green">Low</span>';
            if (detail.metadata.basePopularity > 85) {
                crowdBadge = '<span class="badge badge-red">High</span>';
            } else if (detail.metadata.basePopularity > 60) {
                crowdBadge = '<span class="badge badge-orange">Moderate</span>';
            }

            content.innerHTML = `
                <div class="panel-header">
                    <h3 class="panel-title">${detail.metadata.name}</h3>
                    <span class="panel-city">${detail.city} | ${detail.metadata.category}</span>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 1rem;">
                    <div class="detail-row">
                        <span class="detail-label">Current Density</span>
                        <span class="detail-value">${crowdBadge}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Simulated Visits</span>
                        <span class="detail-value">${detail.totalVisits.toLocaleString()}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Popularity Index</span>
                        <span class="detail-value">${detail.metadata.basePopularity}%</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Avg Visit Duration</span>
                        <span class="detail-value">${detail.metadata.basePopularity > 85 ? '135 mins' : '75 mins'}</span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Forecast Tomorrow</span>
                        <span class="detail-value" style="color: var(--accent); font-weight: 700;">${detail.expectedTomorrow.toLocaleString()} visits</span>
                    </div>
                </div>

                <div style="margin-top: 1.25rem;">
                    <h4 style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Feeds Channels Distribution</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>🛰️ GPS Tracker Logs:</span> <strong>${detail.sourcePercentages.gps}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>📱 App Booking Feeds:</span> <strong>${detail.sourcePercentages.app}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>📌 App Check-ins:</span> <strong>${detail.sourcePercentages.checkin}%</strong>
                        </div>
                    </div>
                </div>

                <div style="margin-top: 1.25rem;">
                    <h4 style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.35rem;">Nearby Focus Destinations</h4>
                    <ul class="nearby-list">
                        ${detail.nearby.map(n => `
                            <li class="nearby-item" onclick="window.TourPulseMap.focusAttraction('${n.id}')">
                                <span>${n.name}</span>
                                <span style="font-size: 0.75rem; color: var(--accent); font-weight: 600;">Fly To ➔</span>
                            </li>
                        `).join('')}
                    </ul>
                </div>
            `;
        }
    }

    return {
        init: function() {
            initMap();
        },
        update: function(filters) {
            updateMap(filters);
        },
        focusAttraction: function(attractionId) {
            let targetAttr = null;
            const cityAttrs = window.TourPulseData.getAttractions(activeCity);
            targetAttr = cityAttrs.find(a => a.id === attractionId);

            if (targetAttr && map) {
                map.setView([targetAttr.lat, targetAttr.lng], 14, { animate: true, duration: 1.2 });
                openMapDetailPanel(attractionId, currentFilters);
            }
        },
        invalidateSize: function() {
            if (map) {
                setTimeout(() => {
                    map.invalidateSize();
                }, 150);
            }
        }
    };
})();

// Append custom map pin pulse keyframes animation directly to document header
const styleSheet = document.createElement("style");
styleSheet.innerText = `
@keyframes markerPulse {
    0% { transform: scale(1); opacity: 0.8; }
    100% { transform: scale(1.8); opacity: 0; }
}
`;
document.head.appendChild(styleSheet);
