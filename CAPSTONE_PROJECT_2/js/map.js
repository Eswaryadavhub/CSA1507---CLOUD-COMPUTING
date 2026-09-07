/**
 * TourPulse - Live Map Controller (Leaflet.js)
 * Connects geographic coordinates, crowd density pins, and origin-destination route corridors to live Oracle Database data.
 */

window.TourPulseMap = (function() {
    let map = null;
    let markersLayer = null;
    let pathsLayer = null;
    let activeCity = "All";

    // City center anchors for fast focus
    const cityCenters = {
        "All": { lat: 20.5937, lng: 78.9629, zoom: 5 },
        "Chennai": { lat: 13.0475, lng: 80.2824, zoom: 12 },
        "Bengaluru": { lat: 12.9716, lng: 77.5946, zoom: 12 },
        "Hyderabad": { lat: 17.3850, lng: 78.4867, zoom: 12 },
        "Mumbai": { lat: 18.9750, lng: 72.8258, zoom: 12 },
        "Delhi": { lat: 28.6139, lng: 77.2090, zoom: 12 },
        "Pune": { lat: 18.5204, lng: 73.8567, zoom: 12 }
    };

    function initMap() {
        if (map) return;
        const mapContainer = document.getElementById("map-element");
        if (!mapContainer) return;

        map = L.map("map-element", {
            center: [20.5937, 78.9629],
            zoom: 5,
            zoomControl: true,
            scrollWheelZoom: true
        });

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "© OpenStreetMap contributors | TourPulse Oracle Analytics"
        }).addTo(map);

        markersLayer = L.layerGroup().addTo(map);
        pathsLayer = L.layerGroup().addTo(map);
    }

    async function updateMap(city) {
        if (!map) initMap();
        if (!map) return;

        if (city) {
            activeCity = city;
        }

        const isAll = !activeCity || activeCity.toLowerCase() === "all";

        markersLayer.clearLayers();
        pathsLayer.clearLayers();

        try {
            // 1. Fetch attractions from live Oracle Database via FastAPI
            const attractions = await window.TourPulseAPI.getAttractions({ city: isAll ? "All" : activeCity });
            
            // 2. Fetch movement corridors from Oracle check-ins
            let routes = [];
            try {
                routes = await window.TourPulseAPI.getRoutes(isAll ? "All" : activeCity);
            } catch (rErr) {
                console.warn("Routes telemetry unavailable:", rErr);
            }

            // 3. Draw route corridors between known attractions
            drawRoutes(attractions, routes);

            // 4. Plot interactive pins for each Oracle destination
            const markerBoundsList = [];

            attractions.forEach(attr => {
                if (typeof attr.latitude !== "number" || typeof attr.longitude !== "number") return;

                let pinColor = "#10b981"; // Low / Safe crowd
                if (attr.current_crowd === "High") pinColor = "#ef4444";
                else if (attr.current_crowd === "Moderate") pinColor = "#f59e0b";

                const icon = L.divIcon({
                    className: "custom-pulse-pin",
                    html: `
                        <div style="
                            position: relative;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            width: 32px;
                            height: 32px;
                            border-radius: 50%;
                            background-color: ${pinColor}25;
                            border: 2px solid ${pinColor};
                            box-shadow: 0 0 10px ${pinColor}50;
                            cursor: pointer;
                        ">
                            <div style="
                                width: 10px;
                                height: 10px;
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
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });

                const marker = L.marker([attr.latitude, attr.longitude], { icon: icon });

                // Hover tooltip
                marker.bindTooltip(`
                    <div style="font-family: inherit; font-size: 0.8rem; padding: 0.2rem;">
                        <strong>${attr.name}</strong> (${attr.city})<br/>
                        Crowd Level: <span style="color:${pinColor}; font-weight:700;">${attr.current_crowd}</span><br/>
                        Verified Visits: <strong>${attr.current_visits.toLocaleString()}</strong>
                    </div>
                `);

                // Interactive Leaflet Popup on click
                const utilizationPct = Math.min(100, Math.round((attr.current_visits / Math.max(attr.capacity, 1)) * 100));
                const popupHtml = `
                    <div style="font-family: inherit; font-size: 0.82rem; min-width: 210px; color: #1e293b; padding: 4px 2px;">
                        <div style="border-bottom: 2px solid ${pinColor}; padding-bottom: 4px; margin-bottom: 6px;">
                            <strong style="font-size: 0.95rem; color: #0f172a;">${attr.name}</strong><br/>
                            <span style="font-size: 0.75rem; color: #64748b;">${attr.city} • ${attr.category}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; gap: 4px; font-size: 0.78rem;">
                            <div style="display:flex; justify-content:space-between;">
                                <span>Max Capacity:</span> <strong>${attr.capacity.toLocaleString()}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Verified Visits:</span> <strong>${attr.current_visits.toLocaleString()}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Crowd Level:</span> <span style="color:${pinColor}; font-weight:700;">${attr.current_crowd}</span>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Popularity Index:</span> <strong>${attr.popularity_index || attr.base_popularity || 75}%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>Capacity Load:</span> <strong>${utilizationPct}%</strong>
                            </div>
                        </div>
                    </div>
                `;
                marker.bindPopup(popupHtml);

                marker.on("click", function() {
                    openDetailPanel(attr.id);
                });

                markersLayer.addLayer(marker);
                markerBoundsList.push([attr.latitude, attr.longitude]);
            });

            // Adjust view to fit markers
            if (isAll && markerBoundsList.length > 0) {
                const group = L.latLngBounds(markerBoundsList);
                map.fitBounds(group.pad(0.1));
            } else if (!isAll && cityCenters[activeCity]) {
                map.setView([cityCenters[activeCity].lat, cityCenters[activeCity].lng], cityCenters[activeCity].zoom);
            }

        } catch (err) {
            console.error("Failed to update live map from Oracle:", err);
        }
    }

    function drawRoutes(attractions, routes) {
        if (!routes || routes.length === 0) return;
        const attrLookup = {};
        attractions.forEach(a => { attrLookup[a.name] = a; });

        routes.forEach(r => {
            const originName = r.origin || r.from;
            const destName = r.destination || r.to;
            const volume = r.weight || r.flow_volume || 1;

            const src = attrLookup[originName];
            const dst = attrLookup[destName];
            if (!src || !dst) return;

            const latlngs = [
                [src.latitude, src.longitude],
                [dst.latitude, dst.longitude]
            ];

            const weight = Math.max(2, Math.min(volume / 2, 6));
            const polyline = L.polyline(latlngs, {
                color: "#06b6d4",
                weight: weight,
                opacity: 0.65,
                dashArray: "6, 8",
                lineCap: "round"
            });

            polyline.bindTooltip(`
                <div style="font-size:0.75rem;">
                    <strong>O-D Movement Pathway</strong><br/>
                    ${originName} ➔ ${destName}<br/>
                    Corridor Volume: <strong>${volume} transfers</strong>
                </div>
            `);

            pathsLayer.addLayer(polyline);
        });
    }

    async function openDetailPanel(attractionId) {
        const placeholder = document.getElementById("map-panel-placeholder");
        const content = document.getElementById("map-panel-content");

        try {
            const detail = await window.TourPulseAPI.getAttractionDetail(attractionId);
            if (placeholder) placeholder.style.display = "none";
            if (content) {
                content.style.display = "block";

                const cap = detail.capacity || 1000;
                const visits = detail.total_visits || 0;
                const loadPct = Math.min(100, Math.round((visits / Math.max(cap, 1)) * 100));

                let badge = '<span class="badge badge-green">Low Crowd</span>';
                if (loadPct >= 80) badge = '<span class="badge badge-red">High Crowd</span>';
                else if (loadPct >= 50) badge = '<span class="badge badge-orange">Moderate</span>';

                content.innerHTML = `
                    <div class="panel-header">
                        <h3 class="panel-title">${detail.name}</h3>
                        <span class="panel-city">${detail.city} • ${detail.category}</span>
                    </div>

                    <div style="display:flex; flex-direction:column; gap:0.5rem; margin-top:1rem;">
                        <div class="detail-row">
                            <span class="detail-label">Real-time Density</span>
                            <span class="detail-value">${badge}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Verified Visits</span>
                            <span class="detail-value">${visits.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Max Capacity</span>
                            <span class="detail-value">${cap.toLocaleString()}</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Capacity Utilization</span>
                            <span class="detail-value" style="font-weight:700; color:var(--primary);">${loadPct}%</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Popularity Index</span>
                            <span class="detail-value">${detail.popularity_index || detail.base_popularity || 75}%</span>
                        </div>
                        <div class="detail-row">
                            <span class="detail-label">Peak Visiting Hours</span>
                            <span class="detail-value" style="color:var(--accent); font-weight:700;">${detail.peak_hours}</span>
                        </div>
                    </div>

                    <div style="margin-top:1.25rem;">
                        <h4 style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.5rem; text-transform:uppercase;">Telemetry Channels</h4>
                        <div style="display:flex; flex-direction:column; gap:0.35rem; font-size:0.75rem;">
                            <div style="display:flex; justify-content:space-between;">
                                <span>🛰️ GPS Device Telemetry:</span> <strong>${detail.source_percentages.gps}%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>📱 Travel App Feeds:</span> <strong>${detail.source_percentages.app}%</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span>📌 User Check-in Logs:</span> <strong>${detail.source_percentages.checkin}%</strong>
                            </div>
                        </div>
                    </div>

                    <div style="margin-top:1.25rem;">
                        <h4 style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:0.35rem; text-transform:uppercase;">Nearby Sites in ${detail.city}</h4>
                        <ul class="nearby-list">
                            ${(detail.nearby_attractions || []).map(n => `
                                <li class="nearby-item" onclick="window.TourPulseMap.focusAttraction(${n.id})">
                                    <span>${n.name}</span>
                                    <span style="font-size:0.75rem; color:var(--accent); font-weight:600;">Fly To ➔</span>
                                </li>
                            `).join('')}
                        </ul>
                    </div>
                `;
            }
        } catch (err) {
            console.error("Failed to load attraction detail:", err);
        }
    }

    return {
        init: initMap,
        update: updateMap,
        focusAttraction: async function(attractionId) {
            openDetailPanel(attractionId);
        },
        invalidateSize: function() {
            if (map) {
                setTimeout(() => { map.invalidateSize(); }, 150);
            }
        }
    };
})();
