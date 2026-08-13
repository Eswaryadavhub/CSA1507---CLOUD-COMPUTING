// TourPulse - Core Application Coordinator & Router
// Manages global state, hooks filters, persists local preferences, triggers exports, and manages timelines.

window.TourPulseApp = (function() {
    // 1. GLOBAL CENTRAL STATE
    const state = {
        city: "Chennai",
        dateOption: "today",
        customStart: "2026-08-10",
        customEnd: "2026-08-12",
        crowdFilter: "all",
        sourceFilter: "all",
        theme: "midnight",
        attractionId: null, // Selected attraction detail
        
        // Settings persisted locally
        cloudConfig: {
            provider: "Google Cloud Platform",
            projectId: "tourpulse-analytics-4210",
            bucket: "gs://tourpulse-checkins-raw",
            dataset: "tourpulse_flows_us",
            region: "us-central1",
            cluster: "tourpulse-mapreduce-spark",
            apiStatus: "Demo Mode"
        },
        notificationPrefs: {
            crowd: true,
            highCrowd: true,
            summary: true,
            prediction: true,
            reports: true,
            system: true
        },
        notifications: [
            { id: 1, type: "system", title: "🟢 Ingestion Completed", text: "BigQuery warehouse updated with 5,842 check-ins.", time: "10 mins ago", read: false },
            { id: 2, type: "reports", title: "📁 Q3 Popularity Report Ready", text: "Executive crowd summary PDF has been compiled.", time: "1 hour ago", read: true },
            { id: 3, type: "highCrowd", title: "🔴 Overcrowding Warning", text: "Marina Beach is experiencing heavy bottleneck load (> 90%).", time: "2 hours ago", read: false }
        ]
    };

    // Reports database
    const reportsList = [
        { id: 1, name: "Monthly Tourist Flow Analysis", period: "August 2026", status: "Generated", info: "PDF – 2.4 MB" },
        { id: 2, name: "Quarterly Attraction Popularity Summary", period: "Q3 2026", status: "Generated", info: "CSV – 1.1 MB" },
        { id: 3, name: "Crowd Density & Resource Allocation", period: "August 2026", status: "Pending", info: "N/A" }
    ];

    // Sidebar view router
    let currentView = "overview";
    let isSidebarOpen = false;
    let isNotifOpen = false;

    // Attraction Detail Grid Pagination
    let attrTablePage = 1;
    const attrTablePageSize = 5;

    // Initializer
    function init() {
        // Load saved variables
        loadSavedSettings();

        // Initialize theme
        applyThemeStyles();

        // Setup filter dropdown selections
        populateDateOptions();
        syncFilterUI();

        // Setup active tabs
        navigateTo(currentView);

        // System monitoring numbers
        updateSystemHealthMonitors();

        // Render notification dropdown badge
        renderNotificationBadge();
        
        // Add random simulated alert after a short delay
        setTimeout(() => {
            triggerRandomAlert();
        }, 6000);
    }

    // Persist settings
    function loadSavedSettings() {
        const savedTheme = localStorage.getItem('tourpulse_theme');
        if (savedTheme) state.theme = savedTheme;

        const savedCloud = localStorage.getItem('tourpulse_cloud_config');
        if (savedCloud) state.cloudConfig = JSON.parse(savedCloud);

        const savedNotifPrefs = localStorage.getItem('tourpulse_notif_prefs');
        if (savedNotifPrefs) state.notificationPrefs = JSON.parse(savedNotifPrefs);

        const savedNotifs = localStorage.getItem('tourpulse_logs');
        if (savedNotifs) state.notifications = JSON.parse(savedNotifs);

        const savedCity = localStorage.getItem('tourpulse_default_city');
        if (savedCity) state.city = savedCity;
    }

    function persistTheme() {
        localStorage.setItem('tourpulse_theme', state.theme);
    }

    function persistCloudConfig() {
        localStorage.setItem('tourpulse_cloud_config', JSON.stringify(state.cloudConfig));
    }

    function persistNotifPrefs() {
        localStorage.setItem('tourpulse_notif_prefs', JSON.stringify(state.notificationPrefs));
    }

    function persistNotifications() {
        localStorage.setItem('tourpulse_logs', JSON.stringify(state.notifications));
    }

    // Theme systems
    function applyThemeStyles() {
        const body = document.body;
        if (state.theme === "light") {
            body.classList.add('light-theme');
        } else {
            body.classList.remove('light-theme');
        }

        // Set Settings form selector values
        const themePicker = document.getElementById('set-theme-picker');
        if (themePicker) themePicker.value = state.theme;
    }

    function toggleTheme() {
        state.theme = state.theme === "midnight" ? "light" : "midnight";
        persistTheme();
        applyThemeStyles();
        
        // Re-render current view charts
        refreshAllViews();
        showToast("Theme Updated", `Switched interface to ${state.theme.toUpperCase()} mode.`, "success");
    }

    // Populate dynamic date selector in navbar
    function populateDateOptions() {
        const dateSelect = document.getElementById('date-selector');
        if (!dateSelect) return;

        // Date dropdown not used anymore since we have presets selector
        // We synchronize presets selector and start/end dates instead.
    }

    function populateCityDropdown() {
        const citySelector = document.getElementById('city-selector');
        const defaultCitySelector = document.getElementById('set-default-city');
        if (!citySelector) return;
        
        const cities = window.TourPulseData.getAllCitiesList();
        const currentSel = state.city;
        
        citySelector.innerHTML = '';
        cities.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c;
            opt.textContent = c;
            if (c === currentSel) opt.selected = true;
            citySelector.appendChild(opt);
        });

        if (defaultCitySelector) {
            defaultCitySelector.innerHTML = '';
            cities.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c;
                opt.textContent = c;
                if (c === currentSel) opt.selected = true;
                defaultCitySelector.appendChild(opt);
            });
        }

        if (!cities.includes(state.city) && cities.length > 0) {
            state.city = cities[0];
        }
    }

    function syncFilterUI() {
        populateCityDropdown();
        document.getElementById('city-selector').value = state.city;
        document.getElementById('date-range-preset').value = state.dateOption;
        
        const startInput = document.getElementById('custom-start-date');
        const endInput = document.getElementById('custom-end-date');

        if (state.dateOption === "custom") {
            startInput.style.display = "inline-block";
            endInput.style.display = "inline-block";
            startInput.value = state.customStart;
            endInput.value = state.customEnd;
        } else {
            startInput.style.display = "none";
            endInput.style.display = "none";
        }
    }

    function enterDashboard(viewId) {
        const landing = document.getElementById('landing-page');
        const app = document.getElementById('app-container');
        if (landing) landing.style.display = 'none';
        if (app) app.style.display = 'flex';
        navigateTo(viewId || 'overview');
    }

    function changeFlowPeriod(period) {
        // Legacy period toggle support
    }

    // SPA Router Page Navigation
    function navigateTo(viewId) {
        currentView = viewId;

        // Sidebar indicator focus
        const menus = document.querySelectorAll('.sidebar-menu li');
        menus.forEach(li => li.classList.remove('active'));
        const activeMenu = document.getElementById(`menu-${viewId}`);
        if (activeMenu) activeMenu.classList.add('active');

        // View display blocks
        const sections = document.querySelectorAll('.view-section');
        sections.forEach(s => s.classList.remove('active'));
        const activeSection = document.getElementById(`view-${viewId}`);
        if (activeSection) activeSection.classList.add('active');

        // Update headers titles
        const titleEl = document.getElementById('view-page-title');
        const subtitleEl = document.getElementById('view-page-subtitle');
        
        let titleText = "Overview";
        let subtitleText = "Real-time tourist activity and attraction intelligence.";

        switch(viewId) {
            case "overview":
                titleText = "Tourism Overview";
                subtitleText = "Real-time tourist activity and attraction intelligence.";
                break;
            case "live-map":
                titleText = "Live Tourist Flow Map";
                subtitleText = "Geographical overlays, density indexes, and movement paths.";
                window.TourPulseMap.invalidateSize();
                break;
            case "attractions":
                titleText = "Attraction Analytics";
                subtitleText = "Popularity metrics, category distributions, and details for registered sites.";
                break;
            case "tourist-flow":
                titleText = "Tourist Flow";
                subtitleText = "Hourly check-in intensity curves, custom weekly grids, and transfer routes.";
                break;
            case "ai-insights":
                titleText = "AI Insights & Prediction";
                subtitleText = "Select parameters to forecast crowd distributions (BigQuery ML simulation).";
                break;
            case "recommendations":
                titleText = "Smart Recommendations";
                subtitleText = "Bypass bottlenecks. Discover optimal locations matching visitor preferences.";
                break;
            case "reports":
                titleText = "Executive Reports";
                subtitleText = "Downloadable analytical summaries, crowd forecasts, and exports.";
                break;
            case "data-upload":
                titleText = "Data Ingestion & Upload";
                subtitleText = "Upload CSV files locally and review MapReduce batch workflows.";
                break;
            case "architecture":
                titleText = "System Cloud Architecture";
                subtitleText = "Pipeline detailing Cloud Storage, MapReduce, BigQuery and prediction layers.";
                break;
            case "settings":
                titleText = "Platform Settings";
                subtitleText = "Configure default focus cities, notification presets, and cloud storage.";
                break;
        }

        if (titleEl) titleEl.innerText = titleText;
        if (subtitleEl) subtitleEl.innerText = subtitleText;

        // Perform view-specific data refresh
        refreshActiveViewData();

        // Close sidebar on mobile
        if (isSidebarOpen) toggleSidebar();
    }

    // Refresh only the data visible on the active view
    function refreshActiveViewData() {
        const filters = getFilterParams();

        switch(currentView) {
            case "overview":
                renderOverviewKPIs(filters);
                renderPopularityBars(filters);
                renderOverviewTrendChart(filters);
                break;
            case "live-map":
                window.TourPulseMap.update(filters);
                break;
            case "attractions":
                attrTablePage = 1;
                renderAttractionsGrid();
                break;
            case "tourist-flow":
                renderTouristFlowSection(filters);
                break;
            case "ai-insights":
                populatePredictionDropdown();
                break;
            case "recommendations":
                generateSmartRecommendations();
                break;
            case "reports":
                renderReportsTable();
                break;
            case "settings":
                populateSettingsForm();
                break;
        }
    }

    // General global redraw called when filters update
    function refreshAllViews() {
        const filters = getFilterParams();
        updateSystemHealthMonitors();

        renderOverviewKPIs(filters);
        renderPopularityBars(filters);
        renderOverviewTrendChart(filters);
        
        if (currentView === 'live-map') {
            window.TourPulseMap.update(filters);
        } else if (currentView === 'attractions') {
            renderAttractionsGrid();
        } else if (currentView === 'tourist-flow') {
            renderTouristFlowSection(filters);
        } else if (currentView === 'ai-insights') {
            populatePredictionDropdown();
        } else if (currentView === 'recommendations') {
            generateSmartRecommendations();
        } else if (currentView === 'reports') {
            renderReportsTable();
        }
    }

    // Compile filter parameters from central state
    function getFilterParams() {
        return {
            city: state.city,
            dateOption: state.dateOption,
            customStart: state.customStart,
            customEnd: state.customEnd,
            crowdFilter: document.getElementById('map-crowd-filter') ? document.getElementById('map-crowd-filter').value : "all",
            sourceFilter: document.getElementById('map-source-filter') ? document.getElementById('map-source-filter').value : "all"
        };
    }

    // Event hooks for dropdown selection changes
    function handleFilterChange() {
        state.city = document.getElementById('city-selector').value;
        
        const start = document.getElementById('custom-start-date').value;
        const end = document.getElementById('custom-end-date').value;
        if (start) state.customStart = start;
        if (end) state.customEnd = end;

        refreshAllViews();
    }

    function handleDatePresetChange() {
        state.dateOption = document.getElementById('date-range-preset').value;
        syncFilterUI();
        refreshAllViews();
    }

    // Overview KPIs Rendering
    function renderOverviewKPIs(filters) {
        const kpis = window.TourPulseData.getOverviewKPIs(filters);
        
        document.getElementById('kpi-total-visits').innerText = kpis.totalVisits;
        document.getElementById('kpi-active-locations').innerText = kpis.activeLocations;
        document.getElementById('kpi-top-attraction').innerText = kpis.topAttraction;
        document.getElementById('kpi-avg-crowd').innerText = kpis.avgCrowd;
        document.getElementById('kpi-peak-hour').innerText = kpis.peakHour;
        document.getElementById('kpi-daily-average').innerText = kpis.dailyAverage;

        // Set KPI visits trend text and colors
        const visitsTrendEl = document.getElementById('kpi-visits-trend');
        if (visitsTrendEl) {
            visitsTrendEl.innerText = kpis.trendVisits;
            if (kpis.trendVisits.startsWith('+')) {
                visitsTrendEl.className = "trend-up";
            } else {
                visitsTrendEl.className = "trend-down";
            }
        }

        // Set crowd level indicator color
        const crowdTrendEl = document.getElementById('kpi-avg-crowd-trend');
        if (crowdTrendEl) {
            const rawCrowdVal = parseInt(kpis.avgCrowd);
            if (rawCrowdVal > 75) {
                crowdTrendEl.className = "kpi-footer trend-up"; // red alert
                crowdTrendEl.innerHTML = `<span style="color: var(--crowd-high); font-weight:700;">🔴 High</span> overcrowding risk`;
            } else if (rawCrowdVal > 45) {
                crowdTrendEl.className = "kpi-footer trend-neutral";
                crowdTrendEl.innerHTML = `<span style="color: var(--crowd-moderate); font-weight:700;">🟡 Moderate</span> load warnings`;
            } else {
                crowdTrendEl.className = "kpi-footer trend-down";
                crowdTrendEl.innerHTML = `<span style="color: var(--crowd-low); font-weight:700;">🟢 Low</span> crowd pressure`;
            }
        }
    }

    // Popularity custom bars
    function renderPopularityBars(filters) {
        const list = document.getElementById('overview-popularity-list');
        if (!list) return;

        const data = window.TourPulseData.getAttractionPopularity(filters).slice(0, 4);

        if (data.length === 0) {
            list.innerHTML = '<div style="color: var(--text-secondary); padding: 2rem; text-align: center;">No check-ins match filters.</div>';
            return;
        }

        let html = '';
        data.forEach(item => {
            let color = 'var(--primary)';
            if (item.crowd === 'High') color = 'var(--crowd-high)';
            else if (item.crowd === 'Moderate') color = 'var(--crowd-moderate)';
            else color = 'var(--crowd-low)';

            html += `
                <div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-bottom: 0.25rem;">
                        <span style="font-weight: 600; color: var(--text-primary);">${item.name}</span>
                        <strong style="color: var(--text-secondary);">${item.visits.toLocaleString()} visits</strong>
                    </div>
                    <div style="width: 100%; height: 8px; background-color: var(--border-color); border-radius: 4px; overflow: hidden; display: flex;">
                        <div style="width: ${item.popularity}%; height: 100%; background-color: ${color}; border-radius: 4px; transition: width 0.6s ease-out;"></div>
                    </div>
                </div>
            `;
        });

        list.innerHTML = html;
    }

    function renderOverviewTrendChart(filters) {
        const flowData = window.TourPulseData.getTouristFlowData(filters);
        window.TourPulseCharts.renderOverviewChart('overview-trend-chart', flowData);
    }

    // Attractions grid with pagination and side panel clicks
    function renderAttractionsGrid() {
        const tableBody = document.getElementById('attraction-table-body');
        const sortVal = document.getElementById('attraction-sort').value;
        const catFilter = document.getElementById('attraction-cat-filter').value;
        
        if (!tableBody) return;

        const filters = getFilterParams();
        let data = window.TourPulseData.getAttractionPopularity(filters);

        // Filter by category
        if (catFilter !== "all") {
            data = data.filter(a => a.category.toLowerCase() === catFilter.toLowerCase());
        }

        // Apply sorts
        if (sortVal === "visits-desc") data.sort((a, b) => b.visits - a.visits);
        else if (sortVal === "visits-asc") data.sort((a, b) => a.visits - b.visits);
        else if (sortVal === "popularity-desc") data.sort((a, b) => b.popularity - a.popularity);
        else if (sortVal === "popularity-asc") data.sort((a, b) => a.popularity - b.popularity);

        // Paginate table rows
        const total = data.length;
        const startIdx = (attrTablePage - 1) * attrTablePageSize;
        const endIdx = startIdx + attrTablePageSize;
        const paginatedData = data.slice(startIdx, endIdx);

        // Update indicators
        document.getElementById('table-page-info').innerText = total > 0 
            ? `Showing ${startIdx + 1} to ${Math.min(endIdx, total)} of ${total} entries`
            : `Showing 0 to 0 of 0 entries`;

        const btnPrev = document.getElementById('btn-prev-page');
        const btnNext = document.getElementById('btn-next-page');

        if (btnPrev && btnNext) {
            btnPrev.disabled = attrTablePage === 1;
            btnPrev.onclick = () => { attrTablePage--; renderAttractionsGrid(); };
            btnNext.disabled = endIdx >= total;
            btnNext.onclick = () => { attrTablePage++; renderAttractionsGrid(); };
        }

        if (paginatedData.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem; color: var(--text-secondary);">No attractions matching criteria.</td></tr>';
            return;
        }

        let html = '';
        paginatedData.forEach(item => {
            let crowdBadge = `<span class="badge badge-green">Low</span>`;
            if (item.crowd === 'High') crowdBadge = `<span class="badge badge-red">High</span>`;
            else if (item.crowd === 'Moderate') crowdBadge = `<span class="badge badge-orange">Moderate</span>`;

            html += `
                <tr style="cursor: pointer;" onclick="window.TourPulseApp.selectAttractionDetail('${item.id}')">
                    <td style="font-weight: 700; color: var(--accent);">${item.name}</td>
                    <td>${item.category}</td>
                    <td>${item.visits.toLocaleString()}</td>
                    <td><strong>${item.popularity}%</strong></td>
                    <td>${crowdBadge}</td>
                    <td style="text-transform: capitalize; color: ${item.trend === 'increasing' ? 'var(--crowd-high)' : 'var(--text-secondary)'}; font-weight:600;">
                        ${item.trend === 'increasing' ? '▲ Increasing' : '● Stable'}
                    </td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;

        // Auto select first row detail
        const detailsPlaceholder = document.getElementById('attractions-detail-placeholder');
        if (detailsPlaceholder && detailsPlaceholder.style.display !== 'none' && paginatedData.length > 0) {
            selectAttractionDetail(paginatedData[0].id);
        }
    }

    function selectAttractionDetail(attractionId) {
        const filters = getFilterParams();
        const detail = window.TourPulseData.getAttractionDetail(attractionId, filters);
        if (!detail) return;

        state.attractionId = attractionId;

        const placeholder = document.getElementById('attractions-detail-placeholder');
        const content = document.getElementById('attractions-detail-content');

        if (placeholder) placeholder.style.display = 'none';
        if (content) {
            content.style.display = 'flex';
            
            let badgeClass = "badge-green";
            if (detail.metadata.basePopularity > 85) badgeClass = "badge-red";
            else if (detail.metadata.basePopularity > 55) badgeClass = "badge-orange";

            content.innerHTML = `
                <div style="border-bottom: 1px solid var(--border-color); padding-bottom: 0.75rem;">
                    <h3 style="font-size: 1.2rem; font-weight: 700; color: var(--text-primary);">${detail.metadata.name}</h3>
                    <span style="font-size: 0.8rem; color: var(--text-secondary);">${detail.city} | ${detail.metadata.category}</span>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem;">
                    <div style="background-color: var(--bg-card-hover); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight:600;">Range Visits</span>
                        <div style="font-size: 1.25rem; font-weight: 800; margin-top: 0.15rem;">${detail.totalVisits.toLocaleString()}</div>
                    </div>
                    <div style="background-color: var(--bg-card-hover); padding: 0.75rem; border-radius: 6px; border: 1px solid var(--border-color);">
                        <span style="font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight:600;">Density Status</span>
                        <div style="margin-top: 0.25rem;"><span class="badge ${badgeClass}">${detail.metadata.basePopularity > 85 ? 'High' : (detail.metadata.basePopularity > 55 ? 'Moderate' : 'Low')}</span></div>
                    </div>
                </div>

                <div>
                    <h4 style="font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.02em;">Peak Hour Distribution</h4>
                    <div style="height: 120px; position: relative;">
                        <canvas id="attraction-detail-bar-chart"></canvas>
                    </div>
                </div>

                <div>
                    <h4 style="font-size: 0.8rem; margin-bottom: 0.5rem; color: var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.02em;">Telemetry Channels Breakdown</h4>
                    <div style="display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>🛰️ GPS Tracker Logs:</span> <strong>${detail.sourcePercentages.gps}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>📱 App Booking Logs:</span> <strong>${detail.sourcePercentages.app}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between; font-size: 0.75rem;">
                            <span>📌 Social Check-ins:</span> <strong>${detail.sourcePercentages.checkin}%</strong>
                        </div>
                    </div>
                </div>

                <div style="background-color: var(--primary-light); padding: 0.75rem; border-radius: 8px; border: 1px dashed rgba(37,99,235,0.25);">
                    <div style="font-size: 0.75rem; color: var(--accent); font-weight: 700; text-transform:uppercase;">Seeded BigQuery ML Forecast</div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.8rem; margin-top: 0.5rem;">
                        <span>Predicted Tomorrow:</span> <strong>${detail.expectedTomorrow.toLocaleString()} visits</strong>
                    </div>
                </div>
            `;

            window.TourPulseCharts.renderAttractionDetailChart('attraction-detail-bar-chart', detail.hourlyDistribution);
        }
    }

    // Tourist Flow view re-render
    function renderTouristFlowSection(filters) {
        const flowData = window.TourPulseData.getTouristFlowData(filters);
        
        // Rerender Flow Chart
        window.TourPulseCharts.renderFlowChart('flow-intensity-chart', flowData);

        // Rerender weekly custom Heatmap
        window.TourPulseCharts.renderCustomHeatmap('flow-heatmap-grid', flowData.heatmap);

        // Movement routes list
        const pathsList = document.getElementById('flow-movement-list');
        if (pathsList) {
            if (flowData.movementFlows.length === 0) {
                pathsList.innerHTML = '<div style="color: var(--text-secondary); text-align: center; margin: auto;">Insufficient coordinates correlation.</div>';
                return;
            }

            let html = '';
            flowData.movementFlows.forEach(flow => {
                html += `
                    <div style="background-color: var(--bg-main); padding: 0.75rem; border-radius: 8px; display: flex; align-items: center; justify-content: space-between; border: 1px solid var(--border-color); transition: border-color 0.2s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-color)'">
                        <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 600;">
                            <span style="color: var(--text-primary); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${flow.from}</span>
                            <span style="color: var(--accent);">➔</span>
                            <span style="color: var(--text-primary); max-width: 140px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${flow.to}</span>
                        </div>
                        <span style="background-color: var(--primary-light); color: var(--accent); padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">
                            ${flow.weight} transfers
                        </span>
                    </div>
                `;
            });
            pathsList.innerHTML = html;
        }
    }

    // AI Predictions populate selectors
    function populatePredictionDropdown() {
        const predictAttrSelect = document.getElementById('predict-attraction');
        if (!predictAttrSelect) return;

        const cityAttrs = window.TourPulseData.getAttractions(state.city);
        let html = '';
        cityAttrs.forEach(a => {
            html += `<option value="${a.id}">${a.name}</option>`;
        });
        predictAttrSelect.innerHTML = html;
    }

    // AI Prediction triggers
    function runFlowPrediction() {
        const attractionId = document.getElementById('predict-attraction').value;
        const targetDate = document.getElementById('predict-date').value;
        const targetTime = document.getElementById('predict-time').value;

        if (!attractionId || !targetDate || !targetTime) {
            alert("Configure prediction dates/times first.");
            return;
        }

        const filters = getFilterParams();
        const pred = window.TourPulseData.getFlowPrediction(filters, attractionId, targetDate, targetTime);
        if (!pred) return;

        // Set visible details
        document.getElementById('prediction-outcome').style.display = 'grid';
        document.getElementById('pred-comparison-card').style.display = 'block';

        document.getElementById('pred-visitors').innerText = pred.predictedVisitors.toLocaleString();
        
        let crowdHtml = `<span style="color: var(--crowd-low); font-weight:700;">🟢 Low Load</span>`;
        if (pred.predictedCrowd === 'High') {
            crowdHtml = `<span style="color: var(--crowd-high); font-weight:700;">🔴 High Overcrowding</span>`;
        } else if (pred.predictedCrowd === 'Moderate') {
            crowdHtml = `<span style="color: var(--crowd-moderate); font-weight:700;">🟡 Moderate Load</span>`;
        }
        
        document.getElementById('pred-crowd').innerHTML = crowdHtml;
        document.getElementById('pred-trend').innerText = pred.trend;
        
        let confColor = 'var(--crowd-low)';
        if (pred.confidence === 'Medium') confColor = 'var(--crowd-moderate)';
        else if (pred.confidence === 'Low') confColor = 'var(--crowd-high)';

        document.getElementById('pred-confidence').innerHTML = `
            <span style="color: ${confColor}; font-weight:700;">${pred.confidence} Confidence (${pred.confidenceScore}%)</span>
        `;
        document.getElementById('pred-rec-time').innerText = pred.recommendedTime;

        // Draw Comparison Chart inside Prediction view
        window.TourPulseCharts.renderComparisonChart('prediction-comparison-chart', pred.historicalVisitors, pred.predictedVisitors);

        showToast("Model Calculated", "BigQuery ML forecast compiled successfully.", "success");
    }

    // Smart Recommendations View
    function generateSmartRecommendations() {
        const crowdPref = document.getElementById('rec-crowd-pref') ? document.getElementById('rec-crowd-pref').value : "any";
        const container = document.getElementById('recommendations-container');
        
        if (!container) return;

        const filters = getFilterParams();
        const recs = window.TourPulseData.getSmartRecommendations(filters, crowdPref);
        
        document.getElementById('rec-result-title').innerText = `Recommendations in ${state.city} (Preference: ${crowdPref.toUpperCase()})`;

        if (recs.length === 0) {
            container.innerHTML = '<div style="color: var(--text-secondary); text-align: center; grid-column: span 3; padding: 2rem;">No recommendations matching filters.</div>';
            return;
        }

        let html = '';
        recs.forEach(item => {
            let badgeClass = "badge-green";
            if (item.predictedCrowd === "High") badgeClass = "badge-red";
            else if (item.predictedCrowd === "Moderate") badgeClass = "badge-orange";

            html += `
                <div class="rec-card">
                    <div>
                        <span class="rec-category">${item.category}</span>
                        <h4 class="rec-title">${item.name}</h4>
                    </div>
                    <div style="font-size: 0.8rem; display: flex; flex-direction: column; gap: 0.25rem;">
                        <div style="display: flex; justify-content: space-between;">
                            <span>Popularity Index:</span> <strong>${item.popularity}%</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Expected Visitors:</span> <strong>${item.expectedVisitors.toLocaleString()}</strong>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Estimated Crowd:</span> <span class="badge ${badgeClass}">${item.predictedCrowd}</span>
                        </div>
                        <div style="display: flex; justify-content: space-between;">
                            <span>Optimal Slot:</span> <strong style="color: var(--accent);">${item.bestTime}</strong>
                        </div>
                    </div>
                    <p class="rec-reason">${item.reason}</p>
                </div>
            `;
        });

        container.innerHTML = html;
    }

    // Reports View lists
    function renderReportsTable() {
        const tableBody = document.getElementById('reports-table-body');
        if (!tableBody) return;

        let html = '';
        reportsList.forEach(rep => {
            let badge = `<span class="badge badge-green">Generated</span>`;
            let actions = `<button class="btn-tab active" onclick="window.TourPulseApp.downloadMockReport('${rep.name}')">Download File</button>`;

            if (rep.status === "Pending") {
                badge = `<span class="badge badge-orange">Pending Job</span>`;
                actions = `<span style="font-size:0.75rem; color:var(--text-secondary)">Awaiting aggregation</span>`;
            }

            html += `
                <tr>
                    <td style="font-weight: 700;">${rep.name}</td>
                    <td>${rep.period}</td>
                    <td>${badge}</td>
                    <td><code>${rep.info}</code></td>
                    <td>${actions}</td>
                </tr>
            `;
        });

        tableBody.innerHTML = html;
    }

    function downloadMockReport(reportName) {
        showToast("Downloading", `Transferring ${reportName} file...`, "info");
        const blob = new Blob([`TourPulse Analytical Summary: ${reportName}\nSimulated Demo Data Export`], {type: "text/plain"});
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `${reportName.toLowerCase().replace(/[^a-z0-9]/g, '_')}_export.txt`;
        link.click();
    }

    // Trigger local connection tests
    function testCloudConnection() {
        showToast("Testing connection", "Querying BigQuery endpoints...", "info");
        
        const statusEl = document.getElementById('cloud-api-status-text');
        if (statusEl) {
            statusEl.innerText = "Connecting...";
            statusEl.style.color = "var(--crowd-moderate)";
        }

        setTimeout(() => {
            showToast("Connection Sandbox", "Credentials verified in simulation sandbox mode.", "warning");
            if (statusEl) {
                statusEl.innerText = "✓ Configured (Demo Mode Sandbox Active)";
                statusEl.style.color = "var(--crowd-low)";
            }
        }, 1500);
    }

    function saveCloudConfig() {
        state.cloudConfig.provider = document.getElementById('cloud-provider').value;
        state.cloudConfig.projectId = document.getElementById('cloud-project-id').value;
        state.cloudConfig.bucket = document.getElementById('cloud-bucket').value;
        state.cloudConfig.dataset = document.getElementById('cloud-dataset').value;
        state.cloudConfig.region = document.getElementById('cloud-region').value;
        state.cloudConfig.cluster = document.getElementById('cloud-cluster').value;

        persistCloudConfig();
        showToast("Configuration Saved", "Google Cloud pipeline credentials saved locally.", "success");
    }

    function resetCloudConfig() {
        state.cloudConfig = {
            provider: "Google Cloud Platform",
            projectId: "",
            bucket: "",
            dataset: "",
            region: "us-central1",
            cluster: "",
            apiStatus: "Demo Mode"
        };
        
        document.getElementById('cloud-provider').value = state.cloudConfig.provider;
        document.getElementById('cloud-project-id').value = "";
        document.getElementById('cloud-bucket').value = "";
        document.getElementById('cloud-dataset').value = "";
        document.getElementById('cloud-region').value = "us-central1";
        document.getElementById('cloud-cluster').value = "";

        const statusEl = document.getElementById('cloud-api-status-text');
        if (statusEl) {
            statusEl.innerText = "⚠ Reset Complete - Sandbox Mode Active";
            statusEl.style.color = "var(--crowd-moderate)";
        }

        persistCloudConfig();
        showToast("Settings Reset", "Default connection preferences restored.", "info");
    }

    // Save Notifications subscriptions
    function saveNotificationPrefs() {
        state.notificationPrefs.crowd = document.getElementById('pref-notif-crowd').checked;
        state.notificationPrefs.highCrowd = document.getElementById('pref-notif-high-crowd').checked;
        state.notificationPrefs.summary = document.getElementById('pref-notif-summary').checked;
        state.notificationPrefs.prediction = document.getElementById('pref-notif-prediction').checked;
        state.notificationPrefs.reports = document.getElementById('pref-notif-reports').checked;
        state.notificationPrefs.system = document.getElementById('pref-notif-system').checked;

        persistNotifPrefs();
        showToast("Alert Preferences", "Your broadcast subscriptions have been saved.", "success");
    }

    function saveGeneralSettings() {
        const focusCity = document.getElementById('set-default-city').value;
        localStorage.setItem('tourpulse_default_city', focusCity);
        state.city = focusCity;
        syncFilterUI();
        refreshAllViews();
        showToast("Preferences Updated", "General analytics parameters saved.", "success");
    }

    // Populate forms when settings page loads
    function populateSettingsForm() {
        document.getElementById('set-default-city').value = state.city;
        
        // Tab 2 Cloud
        document.getElementById('cloud-provider').value = state.cloudConfig.provider;
        document.getElementById('cloud-project-id').value = state.cloudConfig.projectId;
        document.getElementById('cloud-bucket').value = state.cloudConfig.bucket;
        document.getElementById('cloud-dataset').value = state.cloudConfig.dataset;
        document.getElementById('cloud-region').value = state.cloudConfig.region;
        document.getElementById('cloud-cluster').value = state.cloudConfig.cluster;

        // Tab 3 Notifs
        document.getElementById('pref-notif-crowd').checked = state.notificationPrefs.crowd;
        document.getElementById('pref-notif-high-crowd').checked = state.notificationPrefs.highCrowd;
        document.getElementById('pref-notif-summary').checked = state.notificationPrefs.summary;
        document.getElementById('pref-notif-prediction').checked = state.notificationPrefs.prediction;
        document.getElementById('pref-notif-reports').checked = state.notificationPrefs.reports;
        document.getElementById('pref-notif-system').checked = state.notificationPrefs.system;
    }

    function switchSettingsTab(tabKey) {
        const tabs = ['general', 'cloud', 'notifications'];
        tabs.forEach(t => {
            const btn = document.getElementById(`set-btn-${t}`);
            const pane = document.getElementById(`set-tab-${t}`);
            if (btn) btn.classList.remove('active');
            if (pane) pane.style.display = 'none';
        });

        const activeBtn = document.getElementById(`set-btn-${tabKey}`);
        const activePane = document.getElementById(`set-tab-${tabKey}`);
        if (activeBtn) activeBtn.classList.add('active');
        if (activePane) activePane.style.display = 'flex';
    }

    // In-App Notification Center drop downs
    function toggleNotifDropdown() {
        const notifPane = document.getElementById('notif-dropdown');
        if (!notifPane) return;
        isNotifOpen = !isNotifOpen;
        notifPane.style.display = isNotifOpen ? 'flex' : 'none';
        
        if (isNotifOpen) {
            renderNotificationsList();
        }
    }

    function renderNotificationsList() {
        const list = document.getElementById('notif-dropdown-list');
        if (!list) return;

        if (state.notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty-state">No active notifications.</div>';
            return;
        }

        let html = '';
        state.notifications.forEach(n => {
            const unreadClass = n.read ? '' : 'unread';
            html += `
                <div class="notif-item ${unreadClass}" onclick="window.TourPulseApp.markNotifRead(${n.id})">
                    <span class="notif-item-title">${n.title}</span>
                    <span class="notif-item-text">${n.text}</span>
                    <span class="notif-item-time">${n.time}</span>
                </div>
            `;
        });

        list.innerHTML = html;
        renderNotificationBadge();
    }

    function renderNotificationBadge() {
        const badge = document.getElementById('bell-badge');
        if (!badge) return;

        const unreadCount = state.notifications.filter(n => !n.read).length;
        if (unreadCount > 0) {
            badge.style.display = 'block';
        } else {
            badge.style.display = 'none';
        }
    }

    function markNotifRead(id) {
        const target = state.notifications.find(n => n.id === id);
        if (target) {
            target.read = true;
            persistNotifications();
            renderNotificationsList();
        }
    }

    function clearAllNotifications() {
        state.notifications = [];
        persistNotifications();
        renderNotificationsList();
        showToast("Alerts Cleared", "Notification center logs wiped.", "info");
    }

    function appendNotification(type, title, text) {
        // Only append if matching preferences
        if (type === "crowd" && !state.notificationPrefs.crowd) return;
        if (type === "highCrowd" && !state.notificationPrefs.highCrowd) return;
        if (type === "summary" && !state.notificationPrefs.summary) return;
        if (type === "prediction" && !state.notificationPrefs.prediction) return;
        if (type === "reports" && !state.notificationPrefs.reports) return;
        if (type === "system" && !state.notificationPrefs.system) return;

        const id = state.notifications.length + 1;
        state.notifications.unshift({
            id: id,
            type: type,
            title: title,
            text: text,
            time: "Just now",
            read: false
        });

        // Limit logs to max 8 items
        if (state.notifications.length > 8) {
            state.notifications.pop();
        }

        persistNotifications();
        renderNotificationBadge();
        
        // Trigger Toast Alerts
        let toastClass = "success";
        if (type === "highCrowd") toastClass = "error";
        else if (type === "system") toastClass = "info";

        showToast(title, text, toastClass);
    }

    // Slide-in toast alerts creator
    function showToast(title, desc, type = "success") {
        const mount = document.getElementById('toast-alerts-mount');
        if (!mount) return;

        const alertEl = document.createElement('div');
        alertEl.className = `toast-alert toast-${type}`;
        
        let emoji = "✔️";
        if (type === "error") emoji = "⚠️";
        else if (type === "info") emoji = "ℹ️";

        alertEl.innerHTML = `
            <div style="font-size: 1.25rem;">${emoji}</div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-desc">${desc}</span>
            </div>
        `;

        mount.appendChild(alertEl);

        // Slide out and remove
        setTimeout(() => {
            alertEl.style.animation = "toastSlideIn 0.3s reverse forwards";
            setTimeout(() => {
                alertEl.remove();
            }, 300);
        }, 3500);
    }

    // Trigger random alerts representing real-time telemetry changes
    function triggerRandomAlert() {
        const cityAttrs = window.TourPulseData.getAttractions(state.city);
        if (cityAttrs.length === 0) return;

        const index = Math.floor(Math.random() * cityAttrs.length);
        const target = cityAttrs[index];

        const states = ["moderate", "high"];
        const nextState = states[Math.floor(Math.random() * states.length)];

        if (nextState === "high") {
            appendNotification("highCrowd", "🔴 Overcrowding Alert", `${target.name} crowd status has exceeded warning threshold.`);
        } else {
            appendNotification("crowd", "🟡 Density Alert", `${target.name} is experiencing moderate visitor volume.`);
        }

        // Loop recursively
        setTimeout(() => {
            triggerRandomAlert();
        }, 22000);
    }

    // Update Dashboard Monitors
    function updateSystemHealthMonitors() {
        const count = window.TourPulseData.getRawRecordsCount();
        const countEl = document.getElementById('mon-records');
        if (countEl) countEl.innerText = count.toLocaleString();
    }

    // Interactive Architecture nodes selection
    function selectArchNode(nodeKey) {
        const nodes = document.querySelectorAll('.arch-node');
        nodes.forEach(n => n.classList.remove('active'));

        const targetNode = document.getElementById(`node-${nodeKey}`);
        if (targetNode) targetNode.classList.add('active');

        const details = {
            "sources": {
                title: "📡 Telemetry Streams (Sources)",
                role: "Ingests raw telemetry coordinates and check-in logs from external devices.",
                input: "Raw longitude/latitude streams, device headers, user IDs, timestamp indexes.",
                output: "Batched JSON/CSV files sent via IoT channels.",
                purpose: "Simulates high-velocity datasets representing active tourist flows in cities."
            },
            "gcs": {
                title: "📦 Google Cloud Storage (GCS)",
                role: "Serves as the raw, scalable Landing Zone for files before aggregation.",
                input: "Aggregated raw check-in batches.",
                output: "gs://tourpulse-checkins-raw/ files accessed by computing nodes.",
                purpose: "Provides secure, high-availability object storage to hold terabytes of unstructured tourism logs."
            },
            "dataproc": {
                title: "⚙️ Google Dataproc (MapReduce Jobs)",
                role: "Orchestrates Apache Hadoop/Spark computation to compress and clean data.",
                input: "Raw files from GCS.",
                output: "Structured, clean counts partitioned by hour, day, and attraction.",
                purpose: "Filters invalid inputs, maps coordinates to known attraction boundary boxes, and aggregates visit volumes."
            },
            "bigquery": {
                title: "🗄️ Google BigQuery Data Warehouse",
                role: "Stores structured aggregated datasets, serving as the core query ledger.",
                input: "Aggregated summaries from Dataproc.",
                output: "SQL-queryable data representations for dashboard interfaces and ML pipelines.",
                purpose: "Allows microsecond query returns for active maps, tables, and historical overlays."
            },
            "ml": {
                title: "🔮 BigQuery ML (Prediction Model)",
                role: "Trains predictive models directly inside the database using SQL statements.",
                input: "Historical visitor patterns and weekend/weekday distributions.",
                output: "ML model prediction scores with probability confidence logs.",
                purpose: "Enables TourPulse to forecast tourist density for locations without needing external Python engines."
            },
            "dashboard": {
                title: "💻 Visualization & Dashboard Client",
                role: "Front-end interface showing metrics to tourism administrators.",
                input: "BigQuery query tables.",
                output: "Interactive maps, Leaflet markers, trend line graphs, heatmaps, and downloadable PDFs.",
                purpose: "Translates big-data complexity into actionable crowd and resource decisions."
            }
        }[nodeKey];

        const placeholder = document.getElementById('arch-panel-placeholder');
        const content = document.getElementById('arch-panel-content');

        if (placeholder) placeholder.style.display = 'none';
        if (content && details) {
            content.style.display = 'block';
            content.innerHTML = `
                <h3 style="font-size: 1.1rem; font-weight: 700; color: var(--accent); margin-bottom: 0.5rem;">${details.title}</h3>
                <p style="font-size: 0.85rem; color: var(--text-primary); margin-bottom: 1rem;"><strong>Role:</strong> ${details.role}</p>
                
                <div style="background-color: var(--bg-main); padding: 0.75rem; border-radius: 6px; font-size: 0.75rem; margin-bottom: 0.75rem; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.65rem; margin-bottom: 0.25rem;">Data Inputs</div>
                    <code>${details.input}</code>
                </div>

                <div style="background-color: var(--bg-main); padding: 0.75rem; border-radius: 6px; font-size: 0.75rem; margin-bottom: 0.75rem; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; color: var(--text-secondary); text-transform: uppercase; font-size: 0.65rem; margin-bottom: 0.25rem;">Data Outputs</div>
                    <code>${details.output}</code>
                </div>

                <p style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;"><strong>Architectural Purpose:</strong> ${details.purpose}</p>
            `;
        }
    }

    // CSV Data Uploader processing simulator
    function handleFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        if (!file.name.endsWith('.csv')) {
            alert("Please select a valid CSV file.");
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const csvText = e.target.result;
            runSimulatedUploadPipeline(csvText);
        };
        reader.readAsText(file);
    }

    function resetPipelineTimeline() {
        const steps = ["upload", "validation", "gcs", "dataproc", "bigquery"];
        steps.forEach(step => {
            const el = document.getElementById(`step-${step}`);
            if (el) {
                el.className = "pipeline-step";
                el.querySelector('.step-status-icon').innerText = "-";
            }
        });
        document.getElementById('upload-success-panel').style.display = 'none';
    }

    function updateStepState(stepId, stateClass, iconHtml) {
        const el = document.getElementById(`step-${stepId}`);
        if (el) {
            el.className = `pipeline-step ${stateClass}`;
            const iconEl = el.querySelector('.step-status-icon');
            if (iconEl) iconEl.innerHTML = iconHtml;
        }
    }

    function runSimulatedUploadPipeline(csvText) {
        resetPipelineTimeline();
        showToast("Upload Started", "Aggregating file streams...", "info");

        const delay = 1200; // Simulated latency

        // 1. Uploading
        updateStepState("upload", "active", '<span class="spinner"></span>');

        setTimeout(() => {
            updateStepState("upload", "completed", "✔️ Done");
            
            // 2. Validation Schema
            updateStepState("validation", "active", '<span class="spinner"></span>');

            setTimeout(() => {
                try {
                    const result = window.TourPulseData.parseUploadedCSV(csvText);
                    updateStepState("validation", "completed", "✔️ Done");

                    // 3. Staging GCS
                    updateStepState("gcs", "active", '<span class="spinner"></span>');

                    setTimeout(() => {
                        updateStepState("gcs", "completed", "✔️ Done");

                        // 4. MapReduce Jobs
                        updateStepState("dataproc", "active", '<span class="spinner"></span>');

                        setTimeout(() => {
                            updateStepState("dataproc", "completed", "✔️ Done");

                            // 5. BigQuery Data Catalog
                            updateStepState("bigquery", "active", '<span class="spinner"></span>');

                            setTimeout(() => {
                                updateStepState("bigquery", "completed", "✔️ Done");

                                // Display summary success pane
                                document.getElementById('upload-success-panel').style.display = 'block';
                                document.getElementById('up-count').innerText = result.recordsCount.toLocaleString();
                                document.getElementById('up-cities').innerText = result.uniqueCities;
                                document.getElementById('up-dates').innerText = result.dateRange.join(', ');

                                // Refresh app states
                                refreshAllViews();
                                appendNotification("system", "🟢 Ingestion Completed", `MapReduce parsed ${result.recordsCount} check-in entries into warehouse.`);

                            }, delay);
                        }, delay);
                    }, delay);

                } catch (err) {
                    updateStepState("validation", "completed", "❌ Failed");
                    showToast("Schema Failure", err.message, "error");
                }
            }, delay);
        }, 600);
    }

    // Settings General page theme drop picker update
    function handleThemePickerChange(selectEl) {
        state.theme = selectEl.value;
        persistTheme();
        applyThemeStyles();
        refreshAllViews();
    }

    // Sidebar Hamburger toggle
    function toggleSidebar() {
        const sidebar = document.getElementById('sidebar-menu');
        if (!sidebar) return;
        isSidebarOpen = !isSidebarOpen;
        if (isSidebarOpen) {
            sidebar.classList.add('open');
        } else {
            sidebar.classList.remove('open');
        }
    }

    // Structured CSV download trigger representing active filters
    function downloadStructuredCSV() {
        const filters = getFilterParams();
        const records = window.TourPulseData.getDownloadableRawRecords(filters);

        if (records.length === 0) {
            alert("No records found matching filters.");
            return;
        }

        // CSV compiler
        const headers = Object.keys(records[0]).join(',');
        const rows = records.map(r => 
            Object.values(r).map(val => `"${val}"`).join(',')
        );
        const csvContent = [headers, ...rows].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `tourpulse_${state.city.toLowerCase()}_${state.dateOption}_checkins.csv`;
        link.click();

        appendNotification("reports", "📁 CSV Report Generated", `Check-in logs extracted for ${state.city}.`);
    }

    // Structured Microsoft Excel multi-sheet XML download
    function downloadExcelXML() {
        const filters = getFilterParams();
        const kpis = window.TourPulseData.getOverviewKPIs(filters);
        const popularity = window.TourPulseData.getAttractionPopularity(filters);
        const flow = window.TourPulseData.getTouristFlowData(filters);
        const raw = window.TourPulseData.getDownloadableRawRecords(filters).slice(0, 150); // limit to 150 for file optimization

        let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#2563EB" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center"/>
  </Style>
  <Style ss:ID="Title">
   <Font ss:Size="14" ss:Bold="1"/>
  </Style>
 </Styles>
`;

        // Sheet 1: Executive Summary
        xml += `
 <Worksheet ss:Name="Executive Summary">
  <Table>
   <Row><Cell ss:StyleID="Title"><Data ss:Type="String">TourPulse Executive Analytics Summary</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">City: ${state.city}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Period: ${state.dateOption}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String">Generated: ${new Date().toLocaleString()}</Data></Cell></Row>
   <Row></Row>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Metric KPI Key</Data></Cell>
    <Cell><Data ss:Type="String">Value</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Total Tourist Visits</Data></Cell>
    <Cell><Data ss:Type="String">${kpis.totalVisits}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Active Locations</Data></Cell>
    <Cell><Data ss:Type="Number">${kpis.activeLocations}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Average Crowd Level</Data></Cell>
    <Cell><Data ss:Type="String">${kpis.avgCrowd}</Data></Cell>
   </Row>
   <Row>
    <Cell><Data ss:Type="String">Peak Visiting Window</Data></Cell>
    <Cell><Data ss:Type="String">${kpis.peakHour}</Data></Cell>
   </Row>
  </Table>
 </Worksheet>
`;

        // Sheet 2: Attraction Analytics
        xml += `
 <Worksheet ss:Name="Attraction Popularity">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Attraction Name</Data></Cell>
    <Cell><Data ss:Type="String">Category</Data></Cell>
    <Cell><Data ss:Type="String">Range Visits</Data></Cell>
    <Cell><Data ss:Type="String">Popularity Score</Data></Cell>
    <Cell><Data ss:Type="String">Predicted Crowd Level</Data></Cell>
   </Row>
   ${popularity.map(a => `
   <Row>
    <Cell><Data ss:Type="String">${a.name}</Data></Cell>
    <Cell><Data ss:Type="String">${a.category}</Data></Cell>
    <Cell><Data ss:Type="Number">${a.visits}</Data></Cell>
    <Cell><Data ss:Type="String">${a.popularity}%</Data></Cell>
    <Cell><Data ss:Type="String">${a.crowd}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
`;

        // Sheet 3: Daily Flow Counts
        xml += `
 <Worksheet ss:Name="Flow Aggregates">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Time period Interval</Data></Cell>
    <Cell><Data ss:Type="String">Visits Count</Data></Cell>
   </Row>
   ${flow.labels.map((lbl, idx) => `
   <Row>
    <Cell><Data ss:Type="String">${lbl || `Interval ${idx}`}</Data></Cell>
    <Cell><Data ss:Type="Number">${flow.values[idx]}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
`;

        // Sheet 4: Raw Logs Sample
        xml += `
 <Worksheet ss:Name="Raw Checkins Sample">
  <Table>
   <Row ss:StyleID="Header">
    <Cell><Data ss:Type="String">Tourist ID</Data></Cell>
    <Cell><Data ss:Type="String">Attraction</Data></Cell>
    <Cell><Data ss:Type="String">Date</Data></Cell>
    <Cell><Data ss:Type="String">Time</Data></Cell>
    <Cell><Data ss:Type="String">Telemetry Channel</Data></Cell>
    <Cell><Data ss:Type="String">Duration (mins)</Data></Cell>
   </Row>
   ${raw.map(r => `
   <Row>
    <Cell><Data ss:Type="String">${r.tourist_id}</Data></Cell>
    <Cell><Data ss:Type="String">${r.attraction}</Data></Cell>
    <Cell><Data ss:Type="String">${r.date}</Data></Cell>
    <Cell><Data ss:Type="String">${r.time}</Data></Cell>
    <Cell><Data ss:Type="String">${r.source}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.visit_duration}</Data></Cell>
   </Row>
   `).join('')}
  </Table>
 </Worksheet>
</Workbook>
`;

        const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `tourpulse_${state.city.toLowerCase()}_report_workbook.xls`;
        link.click();

        appendNotification("reports", "📁 Excel Workbook Compiled", `Analytical spreadsheet generated for ${state.city}.`);
    }

    function generatePDFConclusion(kpis, popularity) {
        const topAttr = popularity[0] || { name: 'N/A', popularity: 0, category: 'N/A' };
        let recText = "";
        
        if (topAttr.popularity > 85) {
            recText += `The primary traffic driver for this range is <strong>${topAttr.name}</strong>, which holds a peak Popularity Index of <strong>${topAttr.popularity}%</strong>. Due to high congestion risk, operators should enforce pre-booking policies. `;
        } else {
            recText += `Overall traffic load is well distributed, with <strong>${topAttr.name}</strong> leading visits in the ${topAttr.category} category. `;
        }

        recText += `Based on historical patterns, we suggest routing tourists during off-peak slots. Specifically, the optimal visit times are:
            <ul>
                <li><strong>Morning Low-Crowd Slot:</strong> 07:30 AM – 10:00 AM (average crowd levels drop by 35%)</li>
                <li><strong>Late Afternoon Slot:</strong> 02:00 PM – 04:00 PM (optimal balance of density and weather comfort)</li>
            </ul>
            Resource management teams should allocate higher cleaning and safety patrols during the peak interval of <strong>${kpis.peakHour}</strong>, when check-ins reach maximum density.`;
        
        return recText;
    }

    // High fidelity print layout PDF report generator
    function generateReportNow() {
        const filters = getFilterParams();
        const kpis = window.TourPulseData.getOverviewKPIs(filters);
        const popularity = window.TourPulseData.getAttractionPopularity(filters);
        const flow = window.TourPulseData.getTouristFlowData(filters);

        const printArea = document.getElementById('print-report-container');
        if (!printArea) return;

        printArea.innerHTML = `
            <div class="print-page">
                <div class="print-header">
                    <div>
                        <h1 class="print-title">TourPulse Report</h1>
                        <span class="print-subtitle">Tourist Flow & Destination Intelligence Executive Report</span>
                    </div>
                    <div style="text-align: right; font-size: 0.8rem; color: #64748b;">
                        <div>SIMULATED DEMO DATA</div>
                        <div>Generated: ${new Date().toLocaleDateString()}</div>
                    </div>
                </div>

                <div class="print-meta-grid">
                    <div class="print-meta-item"><strong>Target City:</strong> ${state.city}</div>
                    <div class="print-meta-item"><strong>Report Range:</strong> ${state.dateOption.toUpperCase()}</div>
                    <div class="print-meta-item"><strong>Active Filters:</strong> Crowd: ${filters.crowdFilter} | Source: ${filters.sourceFilter}</div>
                    <div class="print-meta-item"><strong>Telemetry Warehouse:</strong> BigQuery Production Sandbox</div>
                </div>

                <h3 class="print-section-title">1. Executive Summary Metrics</h3>
                <div class="print-kpi-grid">
                    <div class="print-kpi-card">
                        <div style="font-size: 0.75rem; color:#64748b; text-transform:uppercase;">Visits Index</div>
                        <div class="print-kpi-val">${kpis.totalVisits}</div>
                    </div>
                    <div class="print-kpi-card">
                        <div style="font-size: 0.75rem; color:#64748b; text-transform:uppercase;">Active Monitored Sites</div>
                        <div class="print-kpi-val">${kpis.activeLocations}</div>
                    </div>
                    <div class="print-kpi-card">
                        <div style="font-size: 0.75rem; color:#64748b; text-transform:uppercase;">Avg Crowd Index</div>
                        <div class="print-kpi-val">${kpis.avgCrowd}</div>
                    </div>
                </div>

                <div class="print-kpi-grid">
                    <div class="print-kpi-card">
                        <div style="font-size: 0.75rem; color:#64748b; text-transform:uppercase;">Peak Flow Slot</div>
                        <div class="print-kpi-val" style="font-size: 1.15rem; margin-top:0.35rem;">${kpis.peakHour}</div>
                    </div>
                    <div class="print-kpi-card" style="grid-column: span 2;">
                        <div style="font-size: 0.75rem; color:#64748b; text-transform:uppercase;">Top Popular Attraction</div>
                        <div class="print-kpi-val" style="font-size: 1.15rem; margin-top:0.35rem;">${kpis.topAttraction}</div>
                    </div>
                </div>

                <h3 class="print-section-title" style="margin-top:1.5rem;">2. Attraction Popularity & Crowds Index</h3>
                <table class="print-table">
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Location Name</th>
                            <th>Category</th>
                            <th>Total Visits</th>
                            <th>Popularity Index</th>
                            <th>Crowd Density</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${popularity.slice(0, 10).map((a, idx) => `
                        <tr>
                            <td>#${idx + 1}</td>
                            <td style="font-weight:700;">${a.name}</td>
                            <td>${a.category}</td>
                            <td>${a.visits.toLocaleString()}</td>
                            <td>${a.popularity}%</td>
                            <td>${a.crowd}</td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="print-footer">
                    Page 1 | TourPulse - Generated from simulated demonstration data
                </div>
            </div>

            <div class="print-page">
                <h3 class="print-section-title">3. Graphical Popularity Comparison</h3>
                <div class="print-chart-box" style="display: flex !important; justify-content: center !important; align-items: center !important;">
                    <canvas id="print-popularity-chart" width="550" height="200"></canvas>
                </div>
                
                <h3 class="print-section-title" style="margin-top:2.5rem;">4. Flow Analysis & Intensity Over Time</h3>
                <p style="font-size: 0.8rem; margin-bottom: 1rem;">Aggregated coordinates transfers grouped by active date intervals:</p>
                <div class="print-chart-box" style="display: flex !important; justify-content: center !important; align-items: center !important;">
                    <canvas id="print-flow-chart" width="550" height="200"></canvas>
                </div>

                <div class="print-footer">
                    Page 2 | TourPulse - Big Data Processing Pipeline
                </div>
            </div>

            <div class="print-page">
                <h3 class="print-section-title">5. Movement Pathways (Transfer Flows)</h3>
                <div style="display: grid; grid-template-columns: 1fr; gap: 0.5rem; margin-bottom: 1.5rem;">
                    ${flow.movementFlows.map(f => `
                        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 0.55rem; border-radius: 4px; display: flex; justify-content: space-between; font-size: 0.8rem;">
                            <span><strong>${f.from}</strong> ➔ <strong>${f.to}</strong></span>
                            <span style="color: #2563eb; font-weight:700;">${f.weight} transfers</span>
                        </div>
                    `).join('')}
                </div>

                <h3 class="print-section-title">6. Data-Driven Insights & Recommended Visiting Times</h3>
                <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 1rem; border-radius: 4px; font-size: 0.85rem; line-height: 1.5; color: #1e3a8a; margin-bottom: 1.5rem;">
                    ${generatePDFConclusion(kpis, popularity)}
                </div>

                <h3 class="print-section-title">7. Analytical Validation Conclusion</h3>
                <p style="font-size: 0.8rem; line-height: 1.45; color: #334155;">
                    This report represents clean telemetry logs aggregated from three data channels (GPS feeds, app check-ins, and booking check-ins). MapReduce execution validated that all records lie within target city boundary polygons with a 99.8% coordinate accuracy rating. Predictive modeling estimates steady visitor volume for the next 48-hour cycle.
                </p>

                <div class="print-footer">
                    Page 3 | TourPulse - End of Executive Summary
                </div>
            </div>
        `;

        // Render PDF report charts using fixed non-animated elements
        setTimeout(() => {
            const popCanvas = document.getElementById('print-popularity-chart');
            const flowCanvas = document.getElementById('print-flow-chart');

            if (popCanvas && flowCanvas) {
                new Chart(popCanvas, {
                    type: 'bar',
                    data: {
                        labels: popularity.slice(0, 5).map(p => p.name),
                        datasets: [{
                            data: popularity.slice(0, 5).map(p => p.visits),
                            backgroundColor: 'rgba(6, 182, 212, 0.75)',
                            borderRadius: 4
                        }]
                    },
                    options: {
                        responsive: false,
                        animation: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { font: { size: 9 } } },
                            y: { beginAtZero: true, ticks: { font: { size: 9 } } }
                        }
                    }
                });

                new Chart(flowCanvas, {
                    type: 'line',
                    data: {
                        labels: flow.labels,
                        datasets: [{
                            data: flow.values,
                            borderColor: '#4f46e5',
                            backgroundColor: 'rgba(79, 70, 229, 0.1)',
                            borderWidth: 2,
                            tension: 0.35,
                            fill: true,
                            pointRadius: 3
                        }]
                    },
                    options: {
                        responsive: false,
                        animation: false,
                        plugins: { legend: { display: false } },
                        scales: {
                            x: { ticks: { font: { size: 9 } } },
                            y: { beginAtZero: true, ticks: { font: { size: 9 } } }
                        }
                    }
                });
            }

            // Small delay to let canvas draw synchronously before firing print
            setTimeout(() => {
                window.print();
                appendNotification("reports", "📁 PDF Summary Printed", `Executive report compiled for ${state.city}.`);
            }, 100);
        }, 50);
    }

    // Click tabs general set connections
    document.addEventListener('DOMContentLoaded', () => {
        init();
    });

    return {
        enterDashboard: enterDashboard,
        navigateTo: navigateTo,
        changeFlowPeriod: changeFlowPeriod,
        selectAttractionDetail: selectAttractionDetail,
        runFlowPrediction: runFlowPrediction,
        generateSmartRecommendations: generateSmartRecommendations,
        handleFilterChange: handleFilterChange,
        handleDatePresetChange: handleDatePresetChange,
        handleFileSelected: handleFileSelected,
        selectArchNode: selectArchNode,
        toggleSidebar: toggleSidebar,
        toggleTheme: toggleTheme,
        handleThemePickerChange: handleThemePickerChange,
        toggleNotifDropdown: toggleNotifDropdown,
        clearAllNotifications: clearAllNotifications,
        markNotifRead: markNotifRead,
        saveCloudConfig: saveCloudConfig,
        testCloudConnection: testCloudConnection,
        resetCloudConfig: resetCloudConfig,
        saveNotificationPrefs: saveNotificationPrefs,
        saveGeneralSettings: saveGeneralSettings,
        switchSettingsTab: switchSettingsTab,
        downloadStructuredCSV: downloadStructuredCSV,
        downloadExcelXML: downloadExcelXML,
        generateReportNow: generateReportNow,
        renderAttractionsGrid: renderAttractionsGrid,
        downloadMockReport: downloadMockReport
    };
})();
