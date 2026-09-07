/**
 * TourPulse - Main Application Coordinator & SPA Router
 * Academic Capstone Edition: Cloud-Based Tourist Flow and Attraction Analytics
 */

window.TourPulseApp = (function() {
    const state = {
        city: "All",
        datePreset: "30days",
        customStart: "",
        customEnd: "",
        crowdFilter: "all",
        sourceFilter: "all",
        currentView: "overview",
        theme: localStorage.getItem("tourpulse_theme") || "midnight",
        attractionPage: 1,
        attractionPageSize: 6,
        cachedAttractions: [],
        currentBatchId: null,
        currentBatchStats: null,
        oracleConnected: false
    };

    async function init() {
        applyTheme();
        setupEventListeners();

        // 1. Check Oracle Database connection status first
        await loadDatabaseStatus();

        // 2. Check existing login session
        await checkUserAuth();

        // 3. Load System Viva info & dataset audit
        await loadSystemInfo();

        // 4. Populate city dropdowns from backend
        await populateCities();

        // 5. Navigate to initial view
        navigateTo(state.currentView);
    }

    // ----------------- Oracle Database Status -----------------
    async function loadDatabaseStatus() {
        const pill = document.getElementById("oracle-status-pill");
        const pillText = document.getElementById("oracle-status-text");
        const errorBanner = document.getElementById("db-error-banner");
        const errorText = document.getElementById("db-error-text");
        const settingsStatusEl = document.getElementById("set-info-db-status");

        try {
            const status = await window.TourPulseAPI.getDatabaseStatus();
            state.oracleConnected = !!status.connected;

            if (status.connected) {
                if (pill) {
                    pill.className = "oracle-status-pill connected";
                    pill.title = `Oracle Database ● Connected (${status.version || 'XE'})`;
                }
                if (pillText) {
                    pillText.innerText = "Oracle Database ● Connected";
                }
                const vivaDbStatus = document.getElementById("viva-db-status");
                if (vivaDbStatus) {
                    vivaDbStatus.innerText = "Oracle Database ● Connected";
                    vivaDbStatus.style.background = "rgba(16,185,129,0.15)";
                    vivaDbStatus.style.color = "#10b981";
                    vivaDbStatus.style.border = "1px solid rgba(16,185,129,0.3)";
                }
                if (errorBanner) {
                    errorBanner.style.display = "none";
                }
                if (settingsStatusEl) {
                    settingsStatusEl.innerHTML = `<span style="color:#10b981;">● Connected (${status.version || 'XE'})</span>`;
                }
            } else {
                if (pill) {
                    pill.className = "oracle-status-pill disconnected";
                    pill.title = "Oracle Database — Not Connected";
                }
                if (pillText) {
                    pillText.innerText = "Oracle Database — Not Connected";
                }
                const vivaDbStatus = document.getElementById("viva-db-status");
                if (vivaDbStatus) {
                    vivaDbStatus.innerText = "Oracle Database — Not Connected";
                    vivaDbStatus.style.background = "rgba(239,68,68,0.15)";
                    vivaDbStatus.style.color = "#ef4444";
                    vivaDbStatus.style.border = "1px solid rgba(239,68,68,0.3)";
                }
                if (errorBanner) {
                    errorBanner.style.display = "flex";
                    if (errorText) {
                        errorText.innerText = status.message || "Oracle Database is unreachable. Verify Oracle service XE and credentials in .env.";
                    }
                }
                if (settingsStatusEl) {
                    settingsStatusEl.innerHTML = `<span style="color:#ef4444;">● Not Connected</span>`;
                }
            }
            return status;
        } catch (err) {
            state.oracleConnected = false;
            if (pill) pill.className = "oracle-status-pill disconnected";
            if (pillText) pillText.innerText = "Oracle Database — Not Connected";
            const vivaDbStatus = document.getElementById("viva-db-status");
            if (vivaDbStatus) {
                vivaDbStatus.innerText = "Oracle Database — Not Connected";
                vivaDbStatus.style.background = "rgba(239,68,68,0.15)";
                vivaDbStatus.style.color = "#ef4444";
                vivaDbStatus.style.border = "1px solid rgba(239,68,68,0.3)";
            }
            if (errorBanner) {
                errorBanner.style.display = "flex";
                if (errorText) errorText.innerText = "Backend API unavailable or network error.";
            }
            if (settingsStatusEl) {
                settingsStatusEl.innerHTML = `<span style="color:#ef4444;">● Backend Unreachable</span>`;
            }
            return null;
        }
    }

    // ----------------- Auth State -----------------
    async function checkUserAuth() {
        const user = await window.TourPulseAPI.getMe();
        updateUserUI(user);
    }

    function updateUserUI(user) {
        const profileContainer = document.getElementById("sidebar-profile");
        const loginBtn = document.getElementById("btn-nav-login");
        const logoutBtn = document.getElementById("btn-nav-logout");
        const userBadge = document.getElementById("viva-user-role");

        if (user) {
            if (profileContainer) {
                profileContainer.innerHTML = `
                    <div class="profile-avatar">${user.name.substring(0, 2).toUpperCase()}</div>
                    <div class="profile-info">
                        <span class="profile-name">${user.name}</span>
                        <span class="profile-role">${user.role.toUpperCase()}</span>
                    </div>
                `;
                profileContainer.style.display = "flex";
            }
            if (loginBtn) loginBtn.style.display = "none";
            if (logoutBtn) logoutBtn.style.display = "inline-block";
            if (userBadge) userBadge.innerText = `${user.role.toUpperCase()} (${user.name})`;

            // Role-based visibility
            const adminElements = document.querySelectorAll(".admin-only");
            adminElements.forEach(el => el.style.display = user.role === "admin" ? "" : "none");

            const analystElements = document.querySelectorAll(".analyst-only");
            analystElements.forEach(el => el.style.display = (user.role === "admin" || user.role === "analyst") ? "" : "none");
        } else {
            if (profileContainer) profileContainer.style.display = "none";
            if (loginBtn) loginBtn.style.display = "inline-block";
            if (logoutBtn) logoutBtn.style.display = "none";
            if (userBadge) userBadge.innerText = "GUEST / DEMO";
        }
    }

    // ----------------- System Info & Viva Bar -----------------
    async function loadSystemInfo() {
        try {
            const sys = await window.TourPulseAPI.getSystemInfo();
            const badgeEl = document.getElementById("viva-app-mode");
            if (badgeEl) {
                badgeEl.innerText = sys.application_mode;
                badgeEl.className = sys.gcp_connected ? "viva-badge gcp" : "viva-badge local";
            }

            const dbTypeEl = document.getElementById("viva-db-type");
            if (dbTypeEl) dbTypeEl.innerText = sys.database_type;

            const procEl = document.getElementById("viva-proc-engine");
            if (procEl) procEl.innerText = sys.processing_engine;

            const mlEl = document.getElementById("viva-ml-model");
            if (mlEl) mlEl.innerText = sys.prediction_model;

            const countEl = document.getElementById("viva-record-count");
            if (countEl) countEl.innerText = sys.total_records_in_db.toLocaleString();

            const disclaimerEl = document.getElementById("dataset-disclaimer-text");
            if (disclaimerEl) disclaimerEl.innerText = sys.dataset_disclaimer;

        } catch (e) {
            console.warn("Could not load system info:", e);
        }
    }

    // ----------------- Cities & Filters -----------------
    async function populateCities() {
        try {
            const cities = await window.TourPulseAPI.getCities();
            const selectors = ["city-selector", "rec-city-select", "attr-modal-city", "edit-attr-city"];
            selectors.forEach(id => {
                const sel = document.getElementById(id);
                if (!sel) return;
                const currentVal = sel.value;
                sel.innerHTML = id === "city-selector" ? '<option value="All">All Cities</option>' : '';
                cities.forEach(c => {
                    const opt = document.createElement("option");
                    opt.value = c;
                    opt.textContent = c;
                    sel.appendChild(opt);
                });
                if (currentVal && cities.includes(currentVal)) sel.value = currentVal;
            });
        } catch (e) {
            console.error("Failed to load cities:", e);
        }
    }

    function handleFilterChange() {
        state.city = document.getElementById("city-selector").value;
        state.datePreset = document.getElementById("date-range-preset").value;

        const customInputs = document.getElementById("custom-date-inputs");
        if (state.datePreset === "custom") {
            if (customInputs) customInputs.style.display = "flex";
            state.customStart = document.getElementById("custom-start-date").value;
            state.customEnd = document.getElementById("custom-end-date").value;
        } else {
            if (customInputs) customInputs.style.display = "none";
        }

        refreshActiveView();
    }

    // ----------------- SPA Router -----------------
    function navigateTo(viewId) {
        state.currentView = viewId;

        // Sidebar active class
        document.querySelectorAll(".sidebar-menu li").forEach(li => li.classList.remove("active"));
        const activeMenu = document.getElementById(`menu-${viewId}`);
        if (activeMenu) activeMenu.classList.add("active");

        // Section active class
        document.querySelectorAll(".view-section").forEach(sec => sec.classList.remove("active"));
        const activeSec = document.getElementById(`view-${viewId}`);
        if (activeSec) activeSec.classList.add("active");

        // Header titles
        const titles = {
            "overview": ["Tourism Analytics Dashboard", "Real-time tourist check-in intelligence and capacity monitoring."],
            "live-map": ["Live Tourist Density Map", "Geospatial overlays, crowd indicators, and origin-destination routes."],
            "attractions": ["Attraction Management & Analytics", "Monitor, search, and manage registered destination capacity."],
            "tourist-flow": ["Tourist Flow & Route Analytics", "Hourly flow intensity, movement corridors, and weekly heatmap grid."],
            "prediction": ["Prediction & Demand Forecasting", "Machine Learning models forecasting upcoming crowd density."],
            "recommendations": ["Smart Destination Recommendations", "Congestion prevention and crowd dispersal recommendation engine."],
            "data-upload": ["Data Ingestion & Cleaning (Module 1 & 2)", "Upload CSV batches, clean errors, deduplicate, and store."],
            "pipeline": ["Data Processing Pipeline (MapReduce)", "Stage-by-stage pipeline execution metrics and processing audit."],
            "reports": ["Executive Analytics Reports", "Generate academic reports in PDF, CSV, and multi-sheet Excel."],
            "architecture": ["Cloud & Big Data Architecture", "End-to-end data pipeline flow: GCS ➔ Dataproc ➔ BigQuery ➔ Dashboard."],
            "project-info": ["Academic Project Documentation", "Capstone problem statement, four modules, and methodology."],
            "settings": ["Platform Settings & Diagnostics", "Role management, theme configurations, and system health."]
        };

        const titleEl = document.getElementById("view-page-title");
        const subtitleEl = document.getElementById("view-page-subtitle");
        if (titleEl && titles[viewId]) titleEl.innerText = titles[viewId][0];
        if (subtitleEl && titles[viewId]) subtitleEl.innerText = titles[viewId][1];

        refreshActiveView();
    }

    async function refreshActiveView() {
        const filterParams = {
            city: state.city,
            date_preset: state.datePreset,
            start_date: state.customStart,
            end_date: state.customEnd,
            crowd: state.crowdFilter,
            source: state.sourceFilter
        };

        switch (state.currentView) {
            case "overview":
                await renderOverview(filterParams);
                break;
            case "live-map":
                window.TourPulseMap.update(state.city);
                window.TourPulseMap.invalidateSize();
                break;
            case "attractions":
                await renderAttractionsView();
                break;
            case "tourist-flow":
                await renderTouristFlow(filterParams);
                break;
            case "prediction":
                await populatePredictionAttractions();
                break;
            case "recommendations":
                await renderRecommendations();
                break;
            case "data-upload":
                await loadIngestionHistory();
                break;
            case "reports":
                await renderReportsView();
                break;
            case "architecture":
                loadSystemInfo();
                break;
            case "settings":
                await renderSettingsView();
                await loadDatabaseStatus();
                break;
        }
    }

    // ----------------- View 1: Overview -----------------
    async function renderOverview(filters) {
        try {
            const kpis = await window.TourPulseAPI.getKPIs(filters);
            const elTotal = document.getElementById("kpi-total-visits");
            if (elTotal) elTotal.innerText = kpis.total_visits != null ? kpis.total_visits.toLocaleString() : "0";
            
            const elActive = document.getElementById("kpi-active-locations");
            if (elActive) elActive.innerText = kpis.active_attractions != null ? kpis.active_attractions : "0";
            
            const elTop = document.getElementById("kpi-top-attraction");
            if (elTop) elTop.innerText = kpis.top_attraction || "N/A";
            
            const elAvgCrowd = document.getElementById("kpi-avg-crowd");
            if (elAvgCrowd) elAvgCrowd.innerText = `${kpis.avg_crowd_level_pct || 0}%`;
            
            const elPeak = document.getElementById("kpi-peak-hour");
            if (elPeak) elPeak.innerText = kpis.peak_visiting_hour || "N/A";
            
            const elDailyAvg = document.getElementById("kpi-predicted-visitors") || document.getElementById("kpi-daily-average");
            if (elDailyAvg) elDailyAvg.innerText = kpis.daily_average_visitors != null ? kpis.daily_average_visitors.toLocaleString() : "-";
            
            const crowdWarningEl = document.getElementById("kpi-high-crowd-warning");
            if (crowdWarningEl) {
                if (kpis.high_crowd_attractions_count > 0) {
                    crowdWarningEl.innerHTML = `<span style="color:var(--crowd-high); font-weight:700;">⚠ ${kpis.high_crowd_attractions_count} Bottlenecks Active</span>`;
                } else {
                    crowdWarningEl.innerHTML = `<span style="color:var(--crowd-low);">✓ Stable Traffic Flow</span>`;
                }
            }

            // Trend line chart
            const overlay = document.getElementById("chart-loading-overlay");
            if (overlay) overlay.style.display = "none";
            const flowData = await window.TourPulseAPI.getTouristFlow(filters);
            if (window.TourPulseCharts && window.TourPulseCharts.renderOverviewChart) {
                window.TourPulseCharts.renderOverviewChart("overview-trend-chart", flowData);
            }

            // Popularity progress bars
            const popList = await window.TourPulseAPI.getPopularity(state.city);
            const popContainer = document.getElementById("overview-popularity-list");
            if (popContainer) {
                if (!popList || popList.length === 0) {
                    popContainer.innerHTML = `<div style="color:var(--text-secondary); text-align:center; padding:1.5rem;">No tourist-flow data available for this selection.</div>`;
                } else {
                    popContainer.innerHTML = popList.slice(0, 5).map(item => {
                        let barColor = "var(--primary)";
                        if (item.crowd === "High") barColor = "var(--crowd-high)";
                        else if (item.crowd === "Moderate") barColor = "var(--crowd-moderate)";
                        else barColor = "var(--crowd-low)";

                        return `
                            <div>
                                <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:0.25rem;">
                                    <span style="font-weight:600;">${item.name}</span>
                                    <span style="color:var(--text-secondary);">${item.visits.toLocaleString()} visits</span>
                                </div>
                                <div style="width:100%; height:7px; background-color:var(--border-color); border-radius:4px; overflow:hidden;">
                                    <div style="width:${item.percentage}%; height:100%; background-color:${barColor}; border-radius:4px;"></div>
                                </div>
                            </div>
                        `;
                    }).join('');
                }
            }
        } catch (err) {
            console.error("Overview render error:", err);
        }
    }

    // ----------------- View 3: Attractions -----------------
    async function renderAttractionsView() {
        try {
            const cat = document.getElementById("attraction-cat-filter").value;
            const sort = document.getElementById("attraction-sort").value;
            const search = document.getElementById("attraction-search-input") ? document.getElementById("attraction-search-input").value : "";

            const attractions = await window.TourPulseAPI.getAttractions({
                city: state.city,
                category: cat,
                sort_by: sort,
                search: search
            });

            state.cachedAttractions = attractions;
            const total = attractions.length;
            const startIdx = (state.attractionPage - 1) * state.attractionPageSize;
            const paginated = attractions.slice(startIdx, startIdx + state.attractionPageSize);

            const tbody = document.getElementById("attraction-table-body");
            if (tbody) {
                if (paginated.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:2rem; color:var(--text-secondary);">No attractions matching criteria.</td></tr>`;
                } else {
                    tbody.innerHTML = paginated.map(a => {
                        let badge = `<span class="badge badge-green">Low</span>`;
                        if (a.current_crowd === "High") badge = `<span class="badge badge-red">High</span>`;
                        else if (a.current_crowd === "Moderate") badge = `<span class="badge badge-orange">Moderate</span>`;

                        return `
                            <tr style="cursor:pointer;" onclick="window.TourPulseApp.selectAttractionRow(${a.id})">
                                <td style="font-weight:700; color:var(--accent);">${a.name}</td>
                                <td>${a.city}</td>
                                <td>${a.category}</td>
                                <td>${a.current_visits.toLocaleString()}</td>
                                <td><strong>${a.popularity_index}%</strong></td>
                                <td>${badge}</td>
                                <td>${a.capacity}</td>
                                <td style="text-align:center; white-space:nowrap;">
                                    <button class="btn-secondary" style="padding:0.2rem 0.45rem; font-size:0.72rem; margin-right:4px;" onclick="event.stopPropagation(); window.TourPulseApp.openEditAttractionModal(${a.id})">✏️ Edit</button>
                                    <button class="btn-secondary" style="padding:0.2rem 0.45rem; font-size:0.72rem; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="event.stopPropagation(); window.TourPulseApp.handleDeleteAttraction(${a.id}, '${a.name.replace(/'/g, "\\'")}')">🗑️ Delete</button>
                                </td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            // Pagination text
            const pageInfo = document.getElementById("table-page-info");
            if (pageInfo) {
                pageInfo.innerText = total > 0 ? `Showing ${startIdx + 1} to ${Math.min(startIdx + state.attractionPageSize, total)} of ${total} entries` : "0 entries";
            }

            const btnPrev = document.getElementById("btn-prev-page");
            const btnNext = document.getElementById("btn-next-page");
            if (btnPrev) btnPrev.disabled = state.attractionPage <= 1;
            if (btnNext) btnNext.disabled = startIdx + state.attractionPageSize >= total;

            // Auto-select first row
            if (paginated.length > 0) {
                selectAttractionRow(paginated[0].id);
            }
        } catch (err) {
            console.error("Attractions view error:", err);
        }
    }

    async function selectAttractionRow(attractionId) {
        const placeholder = document.getElementById("attractions-detail-placeholder");
        const content = document.getElementById("attractions-detail-content");

        try {
            const d = await window.TourPulseAPI.getAttractionDetail(attractionId);
            if (placeholder) placeholder.style.display = "none";
            if (content) {
                content.style.display = "flex";
                content.innerHTML = `
                    <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border-color); padding-bottom:0.75rem;">
                        <div>
                            <h3 style="font-size:1.15rem; font-weight:700; color:var(--text-primary);">${d.name}</h3>
                            <span style="font-size:0.8rem; color:var(--text-secondary);">${d.city} • ${d.category}</span>
                        </div>
                        <div style="display:flex; gap:4px;">
                            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.72rem;" onclick="window.TourPulseApp.openEditAttractionModal(${d.id})">✏️ Edit</button>
                            <button class="btn-secondary" style="padding:0.2rem 0.5rem; font-size:0.72rem; color:#ef4444; border-color:rgba(239,68,68,0.3);" onclick="window.TourPulseApp.handleDeleteAttraction(${d.id}, '${d.name.replace(/'/g, "\\'")}')">🗑️</button>
                        </div>
                    </div>

                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.5rem;">
                        <div style="background:var(--bg-card-hover); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color);">
                            <span style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase;">Verified Visits</span>
                            <div style="font-size:1.15rem; font-weight:800;">${d.total_visits.toLocaleString()}</div>
                        </div>
                        <div style="background:var(--bg-card-hover); padding:0.6rem; border-radius:6px; border:1px solid var(--border-color);">
                            <span style="font-size:0.65rem; color:var(--text-secondary); text-transform:uppercase;">Max Capacity</span>
                            <div style="font-size:1.15rem; font-weight:800;">${d.capacity}</div>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; margin-bottom:0.4rem;">Peak Visiting Window: <span style="color:var(--accent); font-weight:700;">${d.peak_hours}</span></h4>
                        <div style="height:110px;">
                            <canvas id="attraction-detail-bar-chart"></canvas>
                        </div>
                    </div>

                    <div>
                        <h4 style="font-size:0.75rem; color:var(--text-secondary); text-transform:uppercase; margin-bottom:0.35rem;">Telemetry Channels</h4>
                        <div style="display:flex; flex-direction:column; gap:0.25rem; font-size:0.75rem;">
                            <div style="display:flex; justify-content:space-between;"><span>🛰️ GPS Device Telemetry:</span> <strong>${d.source_percentages.gps}%</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>📱 Travel App Feeds:</span> <strong>${d.source_percentages.app}%</strong></div>
                            <div style="display:flex; justify-content:space-between;"><span>📌 User Check-in Logs:</span> <strong>${d.source_percentages.checkin}%</strong></div>
                        </div>
                    </div>
                `;

                window.TourPulseCharts.renderAttractionDetailChart("attraction-detail-bar-chart", d.hourly_distribution);
            }
        } catch (e) {
            console.error("Detail error:", e);
        }
    }

    // ----------------- View 4: Tourist Flow -----------------
    async function renderTouristFlow(filters) {
        try {
            const flowData = await window.TourPulseAPI.getTouristFlow(filters);
            window.TourPulseCharts.renderFlowChart("flow-intensity-chart", flowData);

            const heatmapCells = await window.TourPulseAPI.getWeeklyHeatmap(state.city, state.datePreset);
            window.TourPulseCharts.renderCustomHeatmap("flow-heatmap-grid", heatmapCells);

            const routes = await window.TourPulseAPI.getRoutes(state.city);
            const routesList = document.getElementById("flow-movement-list");
            if (routesList) {
                if (routes.length === 0) {
                    routesList.innerHTML = `<div style="color:var(--text-secondary); text-align:center; margin:auto;">No multi-stop routes found in dataset.</div>`;
                } else {
                    routesList.innerHTML = routes.map(r => `
                        <div style="background:var(--bg-main); padding:0.65rem 0.85rem; border-radius:6px; display:flex; justify-content:space-between; align-items:center; border:1px solid var(--border-color);">
                            <div style="display:flex; align-items:center; gap:0.4rem; font-size:0.8rem; font-weight:600;">
                                <span>${r.origin}</span>
                                <span style="color:var(--accent);">➔</span>
                                <span>${r.destination}</span>
                            </div>
                            <span style="background:var(--primary-light); color:var(--accent); padding:0.2rem 0.5rem; border-radius:4px; font-weight:700; font-size:0.75rem;">
                                ${r.weight} transfers
                            </span>
                        </div>
                    `).join('');
                }
            }
        } catch (err) {
            console.error("Tourist flow error:", err);
        }
    }

    // ----------------- View 5: Prediction & Forecasting -----------------
    async function populatePredictionAttractions() {
        try {
            const sel = document.getElementById("predict-attraction");
            if (!sel) return;

            const city = state.city !== "All" ? state.city : null;
            const attractions = await window.TourPulseAPI.getAttractions({ city: city });
            
            sel.innerHTML = attractions.map(a => `<option value="${a.id}">${a.name} (${a.city})</option>`).join('');
            
            // Default target date: tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 2);
            document.getElementById("predict-date").value = tomorrow.toISOString().split('T')[0];
        } catch (e) {
            console.error("Failed to populate prediction selector:", e);
        }
    }

    async function runPrediction() {
        const attrId = document.getElementById("predict-attraction").value;
        const targetDate = document.getElementById("predict-date").value;
        const targetTime = document.getElementById("predict-time").value;

        if (!attrId || !targetDate || !targetTime) {
            showToast("Missing Parameters", "Please select an attraction, date, and target hour.", "warning");
            return;
        }

        try {
            showToast("Calculating Model", "Querying forecasting engine...", "info");
            const res = await window.TourPulseAPI.getForecast(attrId, targetDate, targetTime);

            document.getElementById("prediction-outcome").style.display = "grid";
            document.getElementById("pred-comparison-card").style.display = "block";

            document.getElementById("pred-model-label").innerText = res.model_name;
            document.getElementById("pred-visitors").innerText = res.predicted_visitors.toLocaleString();
            
            let crowdBadge = `<span style="color:var(--crowd-low); font-weight:700;">🟢 Low Density</span>`;
            if (res.crowd_level === "High") crowdBadge = `<span style="color:var(--crowd-high); font-weight:700;">🔴 High Congestion Risk</span>`;
            else if (res.crowd_level === "Moderate") crowdBadge = `<span style="color:var(--crowd-moderate); font-weight:700;">🟡 Moderate Activity</span>`;
            document.getElementById("pred-crowd").innerHTML = crowdBadge;

            document.getElementById("pred-confidence").innerText = `${res.confidence_score}% (Horizon: ${res.prediction_horizon_days} days)`;
            document.getElementById("pred-rec-time").innerText = res.recommended_time_window;

            const altEl = document.getElementById("pred-alt-attraction");
            if (altEl) {
                altEl.innerText = res.recommended_alternative_attraction ? `Consider: ${res.recommended_alternative_attraction}` : "None needed";
            }

            // Render comparison chart
            window.TourPulseCharts.renderComparisonChart(
                "prediction-comparison-chart",
                res.historical_baseline_visitors,
                res.predicted_visitors
            );

            showToast("Forecast Ready", `Model generated demand prediction for ${res.attraction_name}.`, "success");
        } catch (err) {
            showToast("Prediction Failed", err.message, "error");
        }
    }

    // ----------------- View 6: Recommendations -----------------
    async function renderRecommendations() {
        const crowdPref = document.getElementById("rec-crowd-pref") ? document.getElementById("rec-crowd-pref").value : "low";
        const recCity = document.getElementById("rec-city-select") ? document.getElementById("rec-city-select").value : (state.city !== "All" ? state.city : "Chennai");
        const container = document.getElementById("recommendations-container");
        const titleEl = document.getElementById("rec-result-title");

        if (titleEl) {
            titleEl.innerText = `Active Diversions for ${recCity} (Preference: ${crowdPref.toUpperCase()})`;
        }

        if (!container) return;
        container.innerHTML = `<div style="color:var(--text-secondary); text-align:center; grid-column:span 3; padding:2rem;">Evaluating attraction capacity & crowd density in ${recCity}...</div>`;

        try {
            const recs = await window.TourPulseAPI.getRecommendations(recCity, crowdPref);

            if (!recs || recs.length === 0) {
                container.innerHTML = `
                    <div style="grid-column:span 3; background:var(--bg-main); border:1px solid var(--border-color); border-radius:var(--radius-md); padding:1.5rem; text-align:center;">
                        <div style="font-size:1.5rem; margin-bottom:0.5rem;">ℹ️</div>
                        <h4 style="font-size:0.95rem; margin-bottom:0.4rem;">No Active Congestion Bottlenecks</h4>
                        <p style="font-size:0.8rem; color:var(--text-secondary); max-width:600px; margin:0 auto;">
                            All monitored destinations in <strong>${recCity}</strong> are currently operating within safe capacity limits (&lt; 75% load). Diversion algorithms activate automatically when attendance surges exceed congestion thresholds.
                        </p>
                    </div>
                `;
                return;
            }

            container.innerHTML = recs.map(r => {
                let badgeClass = "badge-green";
                if (r.current_crowd === "High") badgeClass = "badge-red";
                else if (r.current_crowd === "Moderate") badgeClass = "badge-orange";

                const isDiversion = r.recommendation_type === "diversion";
                return `
                    <div class="rec-card" style="display:flex; flex-direction:column; justify-content:space-between; border-left: 3px solid ${isDiversion ? 'var(--accent)' : 'var(--crowd-low)'};">
                        <div>
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:0.4rem;">
                                <span class="rec-category">${r.category}</span>
                                <span class="badge ${badgeClass}">${r.current_crowd}</span>
                            </div>
                            <h4 class="rec-title">${r.name}</h4>
                            <span style="font-size:0.75rem; color:var(--text-secondary);">${r.city} • Capacity: ${r.capacity || 'N/A'}</span>
                        </div>

                        <div style="margin:0.75rem 0; font-size:0.8rem; background:var(--bg-main); padding:0.5rem 0.75rem; border-radius:4px; border:1px solid var(--border-color);">
                            <div style="display:flex; justify-content:space-between; margin-bottom:0.25rem;">
                                <span style="color:var(--text-secondary);">Optimal Time:</span>
                                <strong style="color:var(--accent);">${r.optimal_time_slot}</strong>
                            </div>
                            <div style="display:flex; justify-content:space-between;">
                                <span style="color:var(--text-secondary);">Capacity Load:</span>
                                <strong>${r.capacity_utilization_pct || 0}%</strong>
                            </div>
                        </div>

                        <p class="rec-reason" style="font-size:0.78rem; line-height:1.45; color:var(--text-primary); margin:0;">
                            💡 <strong>Reason:</strong> ${r.recommendation_reason}
                        </p>
                    </div>
                `;
            }).join('');
        } catch (err) {
            container.innerHTML = `
                <div style="grid-column:span 3; background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.3); border-radius:var(--radius-md); padding:1.25rem; text-align:center; color:#ef4444;">
                    <div style="font-weight:700; margin-bottom:0.25rem;">⚠️ Recommendation Engine Notice</div>
                    <div style="font-size:0.8rem;">${err.message}</div>
                </div>
            `;
        }
    }

    // ----------------- View 7: Data Upload (Select -> Preview -> Commit) -----------------
    async function handleValidateFileSelected(event) {
        const file = event.target.files[0];
        if (!file) return;

        showToast("Validating CSV", `Reading schema and validating records for ${file.name}...`, "info");
        const prevContainer = document.getElementById("ingest-preview-container");
        const commitSuccess = document.getElementById("ingest-commit-success");
        if (commitSuccess) commitSuccess.style.display = "none";

        try {
            const res = await window.TourPulseAPI.validateAndPreviewCSV(file);
            state.currentBatchId = res.batch_id;
            state.currentBatchStats = res;

            // Set file name & statistics
            const nameEl = document.getElementById("prev-file-name");
            if (nameEl) nameEl.innerText = res.file_name;

            document.getElementById("stat-prev-total").innerText = res.total_records.toLocaleString();
            document.getElementById("stat-prev-valid").innerText = res.valid_records.toLocaleString();
            document.getElementById("stat-prev-dup").innerText = res.duplicate_records.toLocaleString();
            document.getElementById("stat-prev-pot").innerText = res.potential_duplicate_records.toLocaleString();
            document.getElementById("stat-prev-invalid").innerText = res.invalid_records.toLocaleString();

            // Populate preview table
            const tbody = document.getElementById("ingest-preview-table-body");
            if (tbody) {
                if (!res.preview_rows || res.preview_rows.length === 0) {
                    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">No preview rows found.</td></tr>`;
                } else {
                    tbody.innerHTML = res.preview_rows.map(row => {
                        let badgeClass = "badge-valid";
                        if (row.status === "INVALID") badgeClass = "badge-invalid";
                        else if (row.status === "DUPLICATE") badgeClass = "badge-duplicate";
                        else if (row.status === "POTENTIAL DUPLICATE") badgeClass = "badge-potential";

                        const coordStr = (typeof row.latitude === 'number' && typeof row.longitude === 'number')
                            ? `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`
                            : `${row.latitude}, ${row.longitude}`;

                        return `
                            <tr>
                                <td>${row.row_number}</td>
                                <td style="font-family:monospace; font-size:0.8rem;">${row.tourist_code}</td>
                                <td style="font-weight:600; color:var(--accent);">${row.attraction_name}</td>
                                <td>${row.city}</td>
                                <td style="font-size:0.75rem; white-space:nowrap;">${row.timestamp}</td>
                                <td style="font-size:0.75rem; font-family:monospace;">${coordStr}</td>
                                <td><span class="badge ${badgeClass}">${row.status}</span></td>
                                <td style="font-size:0.75rem; color:${row.status === 'VALID' ? 'var(--text-secondary)' : 'var(--crowd-high)'};">${row.error_reason || '—'}</td>
                            </tr>
                        `;
                    }).join('');
                }
            }

            if (prevContainer) prevContainer.style.display = "block";
            showToast("Validation Complete", `Analyzed ${res.total_records} rows. ${res.valid_records} valid records ready for commit.`, "success");
        } catch (err) {
            showToast("Validation Failed", err.message, "error");
            if (prevContainer) prevContainer.style.display = "none";
        }
    }

    async function commitCurrentBatch() {
        if (!state.currentBatchId) {
            showToast("No Pending Batch", "Please browse and validate a CSV file first.", "warning");
            return;
        }

        const chkExcludeDups = document.getElementById("chk-exclude-dups");
        const chkExcludePot = document.getElementById("chk-exclude-potential");
        const excludeDups = chkExcludeDups ? chkExcludeDups.checked : true;
        const excludePot = chkExcludePot ? chkExcludePot.checked : false;

        const commitBtn = document.getElementById("btn-commit-batch");
        if (commitBtn) {
            commitBtn.disabled = true;
            commitBtn.innerText = "⏳ Committing to Oracle Database...";
        }

        try {
            showToast("Committing Ingestion", "Writing verified rows into Oracle Database tables...", "info");
            const res = await window.TourPulseAPI.commitBatch(state.currentBatchId, excludeDups, excludePot);

            // Display success confirmation panel
            const successPanel = document.getElementById("ingest-commit-success");
            const summaryEl = document.getElementById("ingest-commit-summary");
            if (successPanel && summaryEl) {
                summaryEl.innerHTML = `
                    <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.75rem; margin-bottom:0.5rem;">
                        <div><strong>File Name:</strong> ${res.file_name}</div>
                        <div><strong>Target Database:</strong> Oracle (TOURPULSE schema)</div>
                        <div><strong>Inserted Check-ins:</strong> <span style="color:var(--crowd-low); font-weight:700;">${res.inserted_records.toLocaleString()}</span></div>
                        <div><strong>Duplicates Skipped:</strong> ${res.duplicate_records.toLocaleString()}</div>
                    </div>
                    <div style="color:var(--text-secondary); font-size:0.78rem;">
                        ✓ Ingestion execution logged in Oracle <code>DATASET_UPLOADS</code> table with audit tracking.
                    </div>
                `;
                successPanel.style.display = "block";
            }

            // Hide preview container and reset batch
            const prevContainer = document.getElementById("ingest-preview-container");
            if (prevContainer) prevContainer.style.display = "none";
            const fileInput = document.getElementById("ingest-file-input");
            if (fileInput) fileInput.value = "";
            state.currentBatchId = null;

            // Refresh audit history, system info, and overview
            await loadIngestionHistory();
            await loadSystemInfo();
            if (state.currentView === "overview") {
                await renderOverview({
                    city: state.city,
                    date_preset: state.datePreset
                });
            }

            showToast("Commit Complete", res.message, "success");
        } catch (err) {
            showToast("Commit Failed", err.message, "error");
        } finally {
            if (commitBtn) {
                commitBtn.disabled = false;
                commitBtn.innerText = "✓ Commit Verified Rows to Oracle Database";
            }
        }
    }

    async function loadIngestionHistory() {
        const tbody = document.getElementById("ingest-history-table-body");
        if (!tbody) return;

        try {
            const history = await window.TourPulseAPI.getUploadHistory();
            if (!history || history.length === 0) {
                tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:var(--text-secondary);">No past ingestion runs recorded in Oracle DATASET_UPLOADS.</td></tr>`;
            } else {
                tbody.innerHTML = history.map(h => `
                    <tr>
                        <td style="font-weight:700; color:var(--accent);">#${h.upload_id}</td>
                        <td style="font-weight:600;">${h.file_name}</td>
                        <td style="font-size:0.75rem;">${h.upload_timestamp}</td>
                        <td>${h.total_records.toLocaleString()}</td>
                        <td style="color:var(--crowd-low); font-weight:600;">${h.valid_records.toLocaleString()}</td>
                        <td style="color:var(--crowd-high);">${h.invalid_records.toLocaleString()}</td>
                        <td style="color:var(--crowd-moderate);">${h.duplicate_records.toLocaleString()}</td>
                        <td style="color:var(--accent); font-weight:700;">${h.inserted_records.toLocaleString()}</td>
                        <td><span class="badge badge-green">${h.status}</span></td>
                    </tr>
                `).join('');
            }
        } catch (err) {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align:center; padding:1.5rem; color:#ef4444;">Could not load ingestion history: ${err.message}</td></tr>`;
        }
    }

    // ----------------- View 8: Reports -----------------
    async function renderReportsView() {
        try {
            const rep = await window.TourPulseAPI.getReportSummary(state.city, state.datePreset);
            document.getElementById("rep-total-visits").innerText = rep.total_visits.toLocaleString();
            document.getElementById("rep-active-sites").innerText = rep.active_locations;
            document.getElementById("rep-top-site").innerText = rep.most_popular_attraction;
            document.getElementById("rep-peak-slot").innerText = rep.peak_visiting_hour;

            const recsContainer = document.getElementById("rep-planning-recs");
            if (recsContainer) {
                recsContainer.innerHTML = rep.resource_planning_recommendations.map(r => `<li>${r}</li>`).join('');
            }
        } catch (e) {
            console.error("Reports render error:", e);
        }
    }

    function downloadPDF() {
        showToast("Generating PDF", "Streaming binary PDF from ReportLab engine...", "info");
        window.location.href = window.TourPulseAPI.exportPDFUrl(state.city, state.datePreset);
    }

    function downloadExcel() {
        showToast("Generating Excel", "Streaming multi-sheet workbook from openpyxl...", "info");
        window.location.href = window.TourPulseAPI.exportExcelUrl(state.city, state.datePreset);
    }

    function downloadCSV() {
        showToast("Exporting CSV", "Streaming filtered check-ins...", "info");
        window.location.href = window.TourPulseAPI.exportCSVUrl(state.city, state.datePreset);
    }

    // ----------------- View 10: Settings & Add Attraction -----------------
    async function renderSettingsView() {
        const user = window.TourPulseAPI.getCurrentUser();
        const infoEl = document.getElementById("settings-user-info");
        if (infoEl && user) {
            infoEl.innerHTML = `
                <div style="font-size:0.9rem;"><strong>Name:</strong> ${user.name}</div>
                <div style="font-size:0.9rem;"><strong>Email:</strong> ${user.email}</div>
                <div style="font-size:0.9rem;"><strong>Assigned Role:</strong> <span class="badge badge-green">${user.role.toUpperCase()}</span></div>
            `;
        }
    }

    async function handleAddAttractionSubmit(event) {
        event.preventDefault();
        const data = {
            name: document.getElementById("attr-modal-name").value,
            city: document.getElementById("attr-modal-city").value,
            category: document.getElementById("attr-modal-cat").value,
            latitude: parseFloat(document.getElementById("attr-modal-lat").value),
            longitude: parseFloat(document.getElementById("attr-modal-lng").value),
            capacity: parseInt(document.getElementById("attr-modal-cap").value) || 1000,
            base_popularity: parseInt(document.getElementById("attr-modal-pop") ? document.getElementById("attr-modal-pop").value : 75) || 75,
            peak_start: parseInt(document.getElementById("attr-modal-pstart") ? document.getElementById("attr-modal-pstart").value : 16) || 16,
            peak_end: parseInt(document.getElementById("attr-modal-pend") ? document.getElementById("attr-modal-pend").value : 19) || 19,
            description: document.getElementById("attr-modal-desc").value || ""
        };

        try {
            await window.TourPulseAPI.createAttraction(data);
            showToast("Attraction Created", `Successfully added ${data.name} to ${data.city} in Oracle.`, "success");
            closeModal("modal-add-attraction");
            renderAttractionsView();
            if (state.currentView === "live-map") window.TourPulseMap.update(state.city);
        } catch (err) {
            showToast("Failed to add", err.message, "error");
        }
    }

    async function openEditAttractionModal(attractionId) {
        try {
            const d = await window.TourPulseAPI.getAttractionDetail(attractionId);
            if (!d) return;

            document.getElementById("edit-attr-id").value = d.id;
            document.getElementById("edit-attr-name").value = d.name;
            document.getElementById("edit-attr-city").value = d.city;
            document.getElementById("edit-attr-cat").value = d.category;
            document.getElementById("edit-attr-cap").value = d.capacity;
            document.getElementById("edit-attr-lat").value = d.latitude;
            document.getElementById("edit-attr-lng").value = d.longitude;
            document.getElementById("edit-attr-desc").value = d.description || "";

            openModal("modal-edit-attraction");
        } catch (err) {
            showToast("Error", `Could not load attraction details: ${err.message}`, "error");
        }
    }

    async function handleEditAttractionSubmit(event) {
        event.preventDefault();
        const id = document.getElementById("edit-attr-id").value;
        const data = {
            name: document.getElementById("edit-attr-name").value,
            city: document.getElementById("edit-attr-city").value,
            category: document.getElementById("edit-attr-cat").value,
            latitude: parseFloat(document.getElementById("edit-attr-lat").value),
            longitude: parseFloat(document.getElementById("edit-attr-lng").value),
            capacity: parseInt(document.getElementById("edit-attr-cap").value) || 1000,
            description: document.getElementById("edit-attr-desc").value || ""
        };

        try {
            await window.TourPulseAPI.updateAttraction(id, data);
            showToast("Attraction Updated", `Successfully updated ${data.name} in Oracle.`, "success");
            closeModal("modal-edit-attraction");
            renderAttractionsView();
            selectAttractionRow(id);
            if (state.currentView === "live-map") window.TourPulseMap.update(state.city);
        } catch (err) {
            showToast("Failed to update", err.message, "error");
        }
    }

    async function handleDeleteAttraction(attractionId, attractionName) {
        if (!confirm(`Are you sure you want to permanently delete "${attractionName}" from Oracle Database?`)) {
            return;
        }

        try {
            await window.TourPulseAPI.deleteAttraction(attractionId);
            showToast("Attraction Deleted", `Successfully removed destination from Oracle.`, "success");
            renderAttractionsView();
            if (state.currentView === "live-map") window.TourPulseMap.update(state.city);
        } catch (err) {
            showToast("Failed to delete", err.message, "error");
        }
    }

    async function handleDeleteFromModal() {
        const id = document.getElementById("edit-attr-id").value;
        const name = document.getElementById("edit-attr-name").value;
        closeModal("modal-edit-attraction");
        await handleDeleteAttraction(id, name);
    }

    // ----------------- Theme & Toasts -----------------
    function applyTheme() {
        if (state.theme === "light") {
            document.body.classList.add("light-theme");
        } else {
            document.body.classList.remove("light-theme");
        }
    }

    function toggleTheme() {
        state.theme = state.theme === "midnight" ? "light" : "midnight";
        localStorage.setItem("tourpulse_theme", state.theme);
        applyTheme();
        refreshActiveView();
        showToast("Theme Toggled", `Switched to ${state.theme.toUpperCase()} interface.`, "info");
    }

    function showToast(title, msg, type = "success") {
        const mount = document.getElementById("toast-alerts-mount");
        if (!mount) return;

        const el = document.createElement("div");
        el.className = `toast-alert toast-${type}`;
        el.innerHTML = `
            <div style="font-size:1.2rem;">${type === "error" ? "⚠️" : (type === "info" ? "ℹ️" : "✓")}</div>
            <div class="toast-content">
                <span class="toast-title">${title}</span>
                <span class="toast-desc">${msg}</span>
            </div>
        `;
        mount.appendChild(el);

        setTimeout(() => {
            el.style.opacity = "0";
            setTimeout(() => el.remove(), 300);
        }, 3200);
    }

    // ----------------- Modals -----------------
    function openModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = "flex";
    }

    function closeModal(id) {
        const m = document.getElementById(id);
        if (m) m.style.display = "none";
    }

    // Quick Login Helpers
    function fillLogin(email, pwd) {
        document.getElementById("login-email").value = email;
        document.getElementById("login-password").value = pwd;
    }

    async function handleLoginSubmit(event) {
        event.preventDefault();
        const email = document.getElementById("login-email").value;
        const pwd = document.getElementById("login-password").value;

        try {
            const user = await window.TourPulseAPI.login(email, pwd);
            updateUserUI(user);
            closeModal("modal-auth");
            showToast("Authenticated", `Welcome back, ${user.name}!`, "success");
            enterDashboard("overview");
        } catch (err) {
            showToast("Login Failed", err.message, "error");
        }
    }

    function enterDashboard(viewId = "overview") {
        const landing = document.getElementById("landing-page");
        const app = document.getElementById("app-container");
        if (landing) landing.style.display = "none";
        if (app) app.style.display = "flex";
        navigateTo(viewId);
    }

    function setupEventListeners() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                closeModal("modal-auth");
                closeModal("modal-add-attraction");
                closeModal("modal-edit-attraction");
            }
        });
    }

    document.addEventListener("DOMContentLoaded", () => {
        init();
    });

    function toggleSidebar() {
        const sb = document.getElementById("sidebar-menu");
        if (sb) sb.classList.toggle("open");
    }

    return {
        enterDashboard: enterDashboard,
        navigateTo: navigateTo,
        toggleSidebar: toggleSidebar,
        handleFilterChange: handleFilterChange,
        selectAttractionRow: selectAttractionRow,
        renderAttractionsView: renderAttractionsView,
        openEditAttractionModal: openEditAttractionModal,
        handleEditAttractionSubmit: handleEditAttractionSubmit,
        handleDeleteAttraction: handleDeleteAttraction,
        handleDeleteFromModal: handleDeleteFromModal,
        runPrediction: runPrediction,
        renderRecommendations: renderRecommendations,
        handleValidateFileSelected: handleValidateFileSelected,
        commitCurrentBatch: commitCurrentBatch,
        loadIngestionHistory: loadIngestionHistory,
        downloadPDF: downloadPDF,
        downloadExcel: downloadExcel,
        downloadCSV: downloadCSV,
        loadDatabaseStatus: loadDatabaseStatus,
        toggleTheme: toggleTheme,
        openModal: openModal,
        closeModal: closeModal,
        fillLogin: fillLogin,
        handleLoginSubmit: handleLoginSubmit,
        handleAddAttractionSubmit: handleAddAttractionSubmit,
        logout: function() {
            window.TourPulseAPI.logout();
            updateUserUI(null);
            showToast("Logged Out", "Session terminated.", "info");
        }
    };
})();


