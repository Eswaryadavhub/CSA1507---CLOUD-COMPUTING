/**
 * TourPulse - Chart.js & Heatmap Visualizations Controller
 * Dynamically plots real analytical curves, histograms, comparison bars, and heatmaps.
 */

window.TourPulseCharts = (function() {
    let overviewChart = null;
    let flowChart = null;
    let detailChart = null;
    let comparisonChart = null;

    function getThemePalette() {
        const isLight = document.body.classList.contains("light-theme");
        return {
            primary: isLight ? "#2563eb" : "#06b6d4",
            primaryBg: isLight ? "rgba(37, 99, 235, 0.08)" : "rgba(6, 182, 212, 0.12)",
            accent: isLight ? "#4f46e5" : "#0ea5e9",
            accentBg: isLight ? "rgba(79, 70, 229, 0.08)" : "rgba(14, 165, 233, 0.12)",
            gridColor: isLight ? "#e2e8f0" : "#1e293b",
            textColor: isLight ? "#475569" : "#94a3b8"
        };
    }

    return {
        // Overview Check-ins trend line
        renderOverviewChart: function(canvasId, flowData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (overviewChart) overviewChart.destroy();
            const colors = getThemePalette();

            const labelText = flowData.chart_type === "daily" ? "Daily Total Check-ins" : "Hourly Check-in Count";

            overviewChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: flowData.labels,
                    datasets: [{
                        label: labelText,
                        data: flowData.values,
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryBg,
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: colors.primary,
                        pointRadius: flowData.chart_type === "daily" ? 3 : 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: (c) => ` ${c.parsed.y.toLocaleString()} verified visits`
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: colors.textColor, font: { family: "Inter", size: 10 } }
                        },
                        y: {
                            grid: { color: colors.gridColor },
                            ticks: { color: colors.textColor, font: { family: "Inter", size: 10 } },
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        // Tourist Flow Intensity curve
        renderFlowChart: function(canvasId, flowData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (flowChart) flowChart.destroy();
            const colors = getThemePalette();

            flowChart = new Chart(ctx, {
                type: "line",
                data: {
                    labels: flowData.labels,
                    datasets: [{
                        label: "Tourist Movement Volume",
                        data: flowData.values,
                        borderColor: colors.accent,
                        backgroundColor: colors.accentBg,
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: colors.accent,
                        pointRadius: 3
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: colors.textColor, font: { size: 10 } }
                        },
                        y: {
                            grid: { color: colors.gridColor },
                            ticks: { color: colors.textColor, font: { size: 10 } },
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        // Attraction Detail Peak Hourly Distribution
        renderAttractionDetailChart: function(canvasId, hourlyArray) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (detailChart) detailChart.destroy();
            const colors = getThemePalette();

            const labels = [];
            const data = [];
            for (let i = 0; i < 24; i += 2) {
                labels.push(i === 0 ? "12 AM" : (i === 12 ? "12 PM" : (i < 12 ? `${i} AM` : `${i - 12} PM`)));
                data.push(hourlyArray[i] || 0);
            }

            detailChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: labels,
                    datasets: [{
                        data: data,
                        backgroundColor: colors.primary,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 9 } } },
                        y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { color: colors.textColor, font: { size: 9 } } }
                    }
                }
            });
        },

        // Historical Baseline vs ML Forecast comparison
        renderComparisonChart: function(canvasId, historicalVal, predictedVal) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (comparisonChart) comparisonChart.destroy();
            const colors = getThemePalette();

            comparisonChart = new Chart(ctx, {
                type: "bar",
                data: {
                    labels: ["Historical Baseline (Same Slot)", "Model Predicted Demand Target"],
                    datasets: [{
                        data: [historicalVal, predictedVal],
                        backgroundColor: ["rgba(79, 70, 229, 0.75)", "rgba(6, 182, 212, 0.85)"],
                        borderColor: ["#4f46e5", "#06b6d4"],
                        borderWidth: 1.5,
                        borderRadius: 5
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 10 } } },
                        y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { color: colors.textColor, font: { size: 10 } } }
                    }
                }
            });
        },

        // Weekly Density Heatmap Matrix (7 days x 4 periods)
        renderCustomHeatmap: function(containerId, cells) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dayPeriods = [
                { name: "Morning", hours: "06:00 – 12:00" },
                { name: "Afternoon", hours: "12:00 – 17:00" },
                { name: "Evening", hours: "17:00 – 21:00" },
                { name: "Night", hours: "21:00 – 06:00" }
            ];

            let html = `
                <div class="heatmap-grid">
                    <div></div>
                    ${weekdays.map(d => `<div class="heatmap-header-cell">${d}</div>`).join('')}
                </div>
            `;

            for (let p of dayPeriods) {
                html += `
                    <div class="heatmap-grid" style="margin-top: 5px;">
                        <div class="heatmap-label">
                            <strong style="font-size:0.75rem;">${p.name}</strong>
                            <span style="font-size:0.6rem; color:var(--text-secondary);">${p.hours}</span>
                        </div>
                `;

                for (let d = 0; d < 7; d++) {
                    const match = cells.find(c => c.period === p.name && c.day_idx === d) || { count: 0, percent: 0 };
                    const heatLevel = Math.min(10, Math.round(match.percent / 10));

                    html += `
                        <div class="heatmap-cell heat-level-${heatLevel}">
                            ${match.count}
                            <div class="tooltip">
                                <strong>${weekdays[d]} - ${p.name}</strong><br/>
                                Verified visits: ${match.count.toLocaleString()}
                            </div>
                        </div>
                    `;
                }

                html += `</div>`;
            }

            container.innerHTML = html;
        }
    };
})();
