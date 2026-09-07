/**
 * TourPulse: Centralized API Client Service
 * Connects frontend views to FastAPI backend and Oracle Database.
 */

window.TourPulseAPI = (function() {
    const API_BASE = "";

    function getToken() {
        return localStorage.getItem("tourpulse_token");
    }

    function setToken(token) {
        if (token) localStorage.setItem("tourpulse_token", token);
        else localStorage.removeItem("tourpulse_token");
    }

    function getUser() {
        const u = localStorage.getItem("tourpulse_user");
        return u ? JSON.parse(u) : null;
    }

    function setUser(user) {
        if (user) localStorage.setItem("tourpulse_user", JSON.stringify(user));
        else localStorage.removeItem("tourpulse_user");
    }

    async function request(endpoint, options = {}) {
        const headers = options.headers || {};
        const token = getToken();
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }
        if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
            headers["Content-Type"] = "application/json";
        }

        const config = {
            ...options,
            headers: headers
        };

        const response = await fetch(`${API_BASE}${endpoint}`, config);
        
        if (!response.ok) {
            let errorMsg = `Server returned status ${response.status}`;
            try {
                const errData = await response.json();
                if (errData.detail) errorMsg = errData.detail;
            } catch (e) {
                errorMsg = response.statusText || errorMsg;
            }
            throw new Error(errorMsg);
        }

        return await response.json();
    }

    return {
        // System & Database Status
        getDatabaseStatus: async function() {
            return await request("/api/system/database-status");
        },

        getSystemInfo: async function() {
            return await request("/api/system/info");
        },

        getDatasetAudit: async function() {
            return await request("/api/system/dataset-audit");
        },

        // Authentication
        login: async function(email, password) {
            const data = await request("/api/auth/login", {
                method: "POST",
                body: JSON.stringify({ email, password })
            });
            setToken(data.access_token);
            setUser(data.user);
            return data.user;
        },

        logout: function() {
            setToken(null);
            setUser(null);
        },

        getCurrentUser: function() {
            return getUser();
        },

        getMe: async function() {
            if (!getToken()) return null;
            try {
                const user = await request("/api/auth/me");
                setUser(user);
                return user;
            } catch (e) {
                setToken(null);
                setUser(null);
                return null;
            }
        },

        // Analytics
        getKPIs: async function(params = {}) {
            const qs = new URLSearchParams(params).toString();
            return await request(`/api/analytics/kpis?${qs}`);
        },

        getTouristFlow: async function(params = {}) {
            const qs = new URLSearchParams(params).toString();
            return await request(`/api/analytics/tourist-flow?${qs}`);
        },

        getWeeklyHeatmap: async function(city = "All") {
            return await request(`/api/analytics/heatmap?city=${encodeURIComponent(city)}`);
        },

        getPopularity: async function(city = "All") {
            return await request(`/api/analytics/popularity?city=${encodeURIComponent(city)}`);
        },

        getRoutes: async function(city = "All") {
            return await request(`/api/analytics/routes?city=${encodeURIComponent(city)}`);
        },

        // Attractions
        getAttractions: async function(params = {}) {
            const qs = new URLSearchParams(params).toString();
            return await request(`/api/attractions/?${qs}`);
        },

        getCities: async function() {
            return await request("/api/attractions/cities/list");
        },

        getAttractionDetail: async function(id) {
            return await request(`/api/attractions/${id}`);
        },

        createAttraction: async function(data) {
            return await request("/api/attractions/", {
                method: "POST",
                body: JSON.stringify(data)
            });
        },

        updateAttraction: async function(id, data) {
            return await request(`/api/attractions/${id}`, {
                method: "PUT",
                body: JSON.stringify(data)
            });
        },

        deleteAttraction: async function(id) {
            return await request(`/api/attractions/${id}`, {
                method: "DELETE"
            });
        },

        // Prediction & Recommendations
        getForecast: async function(attractionId, targetDate, targetHour) {
            const qs = new URLSearchParams({
                attraction_id: attractionId,
                target_date: targetDate,
                target_hour: targetHour
            }).toString();
            return await request(`/api/prediction/forecast?${qs}`);
        },

        getRecommendations: async function(city = "Chennai", crowdPreference = "low") {
            const qs = new URLSearchParams({
                city: city,
                crowd_preference: crowdPreference
            }).toString();
            return await request(`/api/recommendations?${qs}`);
        },

        // Data Ingestion (Validate - Preview - Commit - History)
        validateAndPreviewCSV: async function(file) {
            const formData = new FormData();
            formData.append("file", file);
            return await request("/api/upload/validate-preview", {
                method: "POST",
                body: formData
            });
        },

        commitBatch: async function(batchId, excludeDups = true, excludePotential = false) {
            return await request("/api/upload/commit", {
                method: "POST",
                body: JSON.stringify({
                    batch_id: batchId,
                    exclude_duplicates: excludeDups,
                    exclude_potential_duplicates: excludePotential
                })
            });
        },

        getUploadHistory: async function() {
            return await request("/api/upload/history");
        },

        // Reports
        getReportSummary: async function(city = "All", datePreset = "30days") {
            const qs = new URLSearchParams({ city, date_preset: datePreset }).toString();
            return await request(`/api/reports/summary?${qs}`);
        },

        exportPDFUrl: function(city = "All", datePreset = "30days") {
            const qs = new URLSearchParams({ city, date_preset: datePreset }).toString();
            return `/api/reports/pdf?${qs}`;
        },

        exportExcelUrl: function(city = "All", datePreset = "30days") {
            const qs = new URLSearchParams({ city, date_preset: datePreset }).toString();
            return `/api/reports/excel?${qs}`;
        },

        exportCSVUrl: function(city = "All", datePreset = "30days") {
            const qs = new URLSearchParams({ city, date_preset: datePreset }).toString();
            return `/api/reports/csv?${qs}`;
        }
    };
})();
