// TourPulse - Charts & Heatmaps Rendering Controller
// Connects Chart.js instances to dynamic datasets and handles theme coloring.

window.TourPulseCharts = (function() {
    let overviewChart = null;
    let flowChart = null;
    let detailChart = null;
    let comparisonChart = null;

    // Helper to read active theme colors from document variables
    function getChartColors() {
        const isLight = document.body.classList.contains('light-theme');
        return {
            primary: isLight ? '#3b82f6' : '#06b6d4', // Cyan accent in dark mode, blue in light
            primaryLight: isLight ? 'rgba(59, 130, 246, 0.08)' : 'rgba(6, 182, 212, 0.1)',
            gridColor: isLight ? '#e2e8f0' : '#1e293b',
            textColor: isLight ? '#475569' : '#94a3b8',
            accent: '#4f46e5', // Indigo/violet
            accentLight: 'rgba(79, 70, 229, 0.1)'
        };
    }

    return {
        // Overview View: Check-ins line chart (Hourly or Daily depending on range)
        renderOverviewChart: function(canvasId, flowData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (overviewChart) {
                overviewChart.destroy();
            }

            const colors = getChartColors();
            const labelText = flowData.chartType === 'daily' ? 'Daily Total Check-ins' : 'Hourly Check-ins';

            overviewChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: flowData.labels,
                    datasets: [{
                        label: labelText,
                        data: flowData.values,
                        borderColor: colors.primary,
                        backgroundColor: colors.primaryLight,
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: colors.primary,
                        pointHoverRadius: 6,
                        pointRadius: flowData.chartType === 'daily' ? 4 : 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.parsed.y.toLocaleString()} check-ins`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: colors.textColor, font: { family: 'inherit', size: 10 } }
                        },
                        y: {
                            grid: { color: colors.gridColor },
                            ticks: { color: colors.textColor, font: { family: 'inherit', size: 10 } },
                            beginAtZero: true
                        }
                    }
                }
            });
        },

        // Tourist Flow View: Intensity trend line
        renderFlowChart: function(canvasId, flowData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (flowChart) {
                flowChart.destroy();
            }

            const colors = getChartColors();
            const labelText = flowData.chartType === 'daily' ? 'Daily Movement total' : 'Hourly Flow Count';

            flowChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: flowData.labels,
                    datasets: [{
                        label: labelText,
                        data: flowData.values,
                        borderColor: colors.accent,
                        backgroundColor: colors.accentLight,
                        borderWidth: 2.5,
                        tension: 0.35,
                        fill: true,
                        pointBackgroundColor: colors.accent,
                        pointRadius: flowData.chartType === 'daily' ? 4 : 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
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

        // Attraction detail pane: Hourly traffic bar graph
        renderAttractionDetailChart: function(canvasId, hourlyData) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (detailChart) {
                detailChart.destroy();
            }

            const isLight = document.body.classList.contains('light-theme');
            const color = isLight ? 'rgba(59, 130, 246, 0.75)' : 'rgba(6, 182, 212, 0.75)';

            // Select alternate hours
            const labels = [];
            const data = [];
            for (let i = 0; i < 24; i += 2) {
                labels.push(i === 0 ? "12 AM" : (i === 12 ? "12 PM" : (i < 12 ? `${i} AM` : `${i-12} PM`)));
                data.push(hourlyData[i]);
            }

            detailChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Visits count',
                        data: data,
                        backgroundColor: color,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { font: { size: 8 } } },
                        y: { beginAtZero: true, grid: { color: isLight ? '#e2e8f0' : '#1e293b' }, ticks: { font: { size: 8 } } }
                    }
                }
            });
        },

        // AI Insights Page: Historical average vs forecasted count bar chart
        renderComparisonChart: function(canvasId, historicalVal, predictedVal) {
            const ctx = document.getElementById(canvasId);
            if (!ctx) return;

            if (comparisonChart) {
                comparisonChart.destroy();
            }

            const colors = getChartColors();
            comparisonChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: ['Historical average (same slot)', 'Simulated Forecast Target'],
                    datasets: [{
                        data: [historicalVal, predictedVal],
                        backgroundColor: ['rgba(79, 70, 229, 0.75)', 'rgba(6, 182, 212, 0.75)'],
                        borderColor: ['#4f46e5', '#06b6d4'],
                        borderWidth: 1.5,
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: { grid: { display: false }, ticks: { color: colors.textColor, font: { size: 10 } } },
                        y: { beginAtZero: true, grid: { color: colors.gridColor }, ticks: { color: colors.textColor, font: { size: 10 } } }
                    }
                }
            });
        },

        // Custom HTML/CSS heatmap matrix drawer
        renderCustomHeatmap: function(containerId, heatmapData) {
            const container = document.getElementById(containerId);
            if (!container) return;

            const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            const dayPeriods = [
                { name: "Morning", hours: "6AM - 12PM" },
                { name: "Afternoon", hours: "12PM - 5PM" },
                { name: "Evening", hours: "5PM - 9PM" },
                { name: "Night", hours: "9PM - 6AM" }
            ];

            let html = `<div class="heatmap-grid">
                <div></div> <!-- Spacer -->
                ${weekdays.map(day => `<div class="heatmap-header-cell">${day}</div>`).join('')}
            </div>`;

            for (let p = 0; p < 4; p++) {
                const period = dayPeriods[p];
                html += `<div class="heatmap-grid" style="margin-top: 4px;">
                    <div class="heatmap-label">
                        <div style="display: flex; flex-direction: column; text-align: left;">
                            <strong>${period.name}</strong>
                            <span style="font-size: 0.6rem; color: var(--text-secondary);">${period.hours}</span>
                        </div>
                    </div>`;

                for (let d = 0; d < 7; d++) {
                    const cell = heatmapData[p][d];
                    const count = cell.count;
                    const pct = cell.percent;

                    const heatLevel = Math.round(pct / 10);

                    html += `
                        <div class="heatmap-cell heat-level-${heatLevel}">
                            ${count}
                            <div class="tooltip">
                                <strong>${weekdays[d]} - ${period.name}</strong><br/>
                                Simulated count: ${count.toLocaleString()}
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
