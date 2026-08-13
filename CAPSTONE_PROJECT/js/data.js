// TourPulse - Core Seeded Data & Analytics Engine
// SIMULATED DEMO DATA - Generated deterministically using a seeded randomizer.

window.TourPulseData = (function() {
    // City center coordinates and defaults
    const cities = {
        "Chennai": { lat: 13.0475, lng: 80.2824, zoom: 12 },
        "Bengaluru": { lat: 12.9716, lng: 77.5946, zoom: 12 },
        "Hyderabad": { lat: 17.3850, lng: 78.4867, zoom: 12 },
        "Mumbai": { lat: 18.9750, lng: 72.8258, zoom: 12 },
        "Delhi": { lat: 28.6139, lng: 77.2090, zoom: 12 },
        "Pune": { lat: 18.5204, lng: 73.8567, zoom: 12 }
    };

    // Attraction configurations
    const attractions = {
        "Chennai": [
            { id: "che_marina", name: "Marina Beach", lat: 13.0475, lng: 80.2824, category: "Nature/Beach", basePopularity: 96, peakStart: 17, peakEnd: 20 },
            { id: "che_kapaleeshwarar", name: "Kapaleeshwarar Temple", lat: 13.0333, lng: 80.2694, category: "Heritage/Culture", basePopularity: 89, peakStart: 16, peakEnd: 19 },
            { id: "che_fort", name: "Fort St. George", lat: 13.0792, lng: 80.2917, category: "Historical", basePopularity: 78, peakStart: 10, peakEnd: 13 },
            { id: "che_valluvar", name: "Valluvar Kottam", lat: 13.0528, lng: 80.2486, category: "Monument", basePopularity: 76, peakStart: 14, peakEnd: 17 },
            { id: "che_museum", name: "Government Museum", lat: 13.0606, lng: 80.2562, category: "Museum", basePopularity: 83, peakStart: 11, peakEnd: 15 },
            { id: "che_santhome", name: "San Thome Basilica", lat: 13.0339, lng: 80.2785, category: "Heritage/Culture", basePopularity: 81, peakStart: 9, peakEnd: 12 },
            { id: "che_guindy", name: "Guindy National Park", lat: 12.9982, lng: 80.2227, category: "Nature/Wildlife", basePopularity: 73, peakStart: 7, peakEnd: 10 }
        ],
        "Bengaluru": [
            { id: "blr_lalbagh", name: "Lalbagh Botanical Garden", lat: 12.9507, lng: 77.5844, category: "Nature/Garden", basePopularity: 91, peakStart: 7, peakEnd: 10 },
            { id: "blr_cubbon", name: "Cubbon Park", lat: 12.9739, lng: 77.5906, category: "Nature/Garden", basePopularity: 90, peakStart: 6, peakEnd: 9 },
            { id: "blr_palace", name: "Bangalore Palace", lat: 12.9988, lng: 77.5921, category: "Historical", basePopularity: 85, peakStart: 11, peakEnd: 14 },
            { id: "blr_bannerghatta", name: "Bannerghatta National Park", lat: 12.8013, lng: 77.5777, category: "Nature/Wildlife", basePopularity: 84, peakStart: 10, peakEnd: 15 },
            { id: "blr_visvesvaraya", name: "Visvesvaraya Museum", lat: 12.9754, lng: 77.5962, category: "Museum", basePopularity: 81, peakStart: 11, peakEnd: 16 }
        ],
        "Hyderabad": [
            { id: "hyd_charminar", name: "Charminar", lat: 17.3616, lng: 78.4747, category: "Monument", basePopularity: 97, peakStart: 16, peakEnd: 21 },
            { id: "hyd_golconda", name: "Golconda Fort", lat: 17.3833, lng: 78.4011, category: "Historical", basePopularity: 91, peakStart: 15, peakEnd: 18 },
            { id: "hyd_hussain", name: "Hussain Sagar Lake", lat: 17.4239, lng: 78.4738, category: "Nature/Waterfront", basePopularity: 88, peakStart: 17, peakEnd: 20 },
            { id: "hyd_birla", name: "Birla Mandir", lat: 17.4062, lng: 78.4690, category: "Heritage/Culture", basePopularity: 86, peakStart: 16, peakEnd: 19 },
            { id: "hyd_salar", name: "Salar Jung Museum", lat: 17.3713, lng: 78.4804, category: "Museum", basePopularity: 84, peakStart: 11, peakEnd: 15 }
        ],
        "Mumbai": [
            { id: "mum_gateway", name: "Gateway of India", lat: 18.9220, lng: 72.8347, category: "Historical", basePopularity: 98, peakStart: 16, peakEnd: 20 },
            { id: "mum_drive", name: "Marine Drive", lat: 18.9431, lng: 72.8230, category: "Nature/Waterfront", basePopularity: 97, peakStart: 17, peakEnd: 22 },
            { id: "mum_elephanta", name: "Elephanta Caves", lat: 18.9633, lng: 72.9315, category: "Heritage/Culture", basePopularity: 83, peakStart: 10, peakEnd: 14 },
            { id: "mum_cst", name: "Chhatrapati Shivaji Terminus", lat: 18.9400, lng: 72.8354, category: "Historical", basePopularity: 89, peakStart: 8, peakEnd: 11 },
            { id: "mum_siddhivinayak", name: "Siddhivinayak Temple", lat: 19.0169, lng: 72.8315, category: "Heritage/Culture", basePopularity: 92, peakStart: 6, peakEnd: 11 }
        ],
        "Delhi": [
            { id: "del_redfort", name: "Red Fort", lat: 28.6562, lng: 77.2410, category: "Historical", basePopularity: 95, peakStart: 10, peakEnd: 14 },
            { id: "del_qutub", name: "Qutub Minar", lat: 28.5244, lng: 77.1855, category: "Monument", basePopularity: 93, peakStart: 11, peakEnd: 15 },
            { id: "del_indiagate", name: "India Gate", lat: 28.6129, lng: 77.2295, category: "Monument", basePopularity: 96, peakStart: 17, peakEnd: 21 },
            { id: "del_lotus", name: "Lotus Temple", lat: 28.5535, lng: 77.2588, category: "Heritage/Culture", basePopularity: 92, peakStart: 10, peakEnd: 13 },
            { id: "del_humayun", name: "Humayun's Tomb", lat: 28.5933, lng: 77.2507, category: "Historical", basePopularity: 88, peakStart: 14, peakEnd: 17 }
        ],
        "Pune": [
            { id: "pun_shaniwar", name: "Shaniwar Wada", lat: 18.5194, lng: 73.8553, category: "Historical", basePopularity: 87, peakStart: 10, peakEnd: 13 },
            { id: "pun_aga", name: "Aga Khan Palace", lat: 18.5524, lng: 73.9015, category: "Historical", basePopularity: 84, peakStart: 11, peakEnd: 14 },
            { id: "pun_sinhagad", name: "Sinhagad Fort", lat: 18.3662, lng: 73.7558, category: "Historical", basePopularity: 89, peakStart: 6, peakEnd: 10 },
            { id: "pun_dagdusheth", name: "Dagusheth Halwai Temple", lat: 18.5165, lng: 73.8561, category: "Heritage/Culture", basePopularity: 91, peakStart: 8, peakEnd: 12 },
            { id: "pun_osho", name: "Osho Teerth Park", lat: 18.5369, lng: 73.8872, category: "Nature/Garden", basePopularity: 79, peakStart: 15, peakEnd: 18 }
        ]
    };

    // The primary global dataset of tourist check-ins
    let checkIns = [];
    
    // Seeded random number generator (Linear Congruential Generator - LCG)
    // Formula: X_{n+1} = (a * X_n + c) % m
    let m = 0x80000000; // 2**31
    let a = 1103515245;
    let c = 12345;
    let state = 101; // Initial Seed

    function lcgRandom() {
        state = (a * state + c) % m;
        return state / (m - 1);
    }

    function lcgRange(min, max) {
        return Math.floor(lcgRandom() * (max - min + 1)) + min;
    }

    // Anchor Date is August 12, 2026
    const ANCHOR_DATE = new Date("2026-08-12T12:00:00");

    // Generate simulated dataset deterministically on load
    function generateSimulatedDataset() {
        checkIns = [];
        state = 101; // Reset seed state for absolute determinism

        const sources = ["GPS", "Travel App", "Check-in"];
        const citiesList = Object.keys(cities);

        // Density weights
        const cityWeights = {
            "Chennai": 0.28,
            "Bengaluru": 0.22,
            "Hyderabad": 0.16,
            "Mumbai": 0.14,
            "Delhi": 0.12,
            "Pune": 0.08
        };

        // Date bounds: 40 days back from anchor
        const totalDays = 40;
        const totalRecords = 22000; // Large big data feel
        
        let idCounter = 1;

        for (let i = 0; i < totalRecords; i++) {
            // Determine City
            let city = "Chennai";
            const r = lcgRandom();
            let weightSum = 0;
            for (let c of citiesList) {
                weightSum += cityWeights[c];
                if (r <= weightSum) {
                    city = c;
                    break;
                }
            }

            const cityAttractions = attractions[city];
            if (!cityAttractions || cityAttractions.length === 0) continue;

            // Pick an attraction biased by popularity
            const attrIdx = Math.floor(Math.pow(lcgRandom(), 1.4) * cityAttractions.length);
            const attraction = cityAttractions[attrIdx] || cityAttractions[0];

            // Deterministic date offset
            // Modulo offsets spread dates across the 40 day span
            const dayOffset = lcgRange(0, totalDays);
            const timestamp = new Date(ANCHOR_DATE.getTime() - (dayOffset * 24 * 60 * 60 * 1000));
            
            // Peak hourly distributions
            let hour = lcgRange(0, 23);
            const peakStart = attraction.peakStart;
            const peakEnd = attraction.peakEnd;

            // 70% probability to cluster around peak hours
            if (lcgRandom() < 0.70) {
                hour = lcgRange(peakStart, peakEnd);
            }
            timestamp.setHours(hour);
            timestamp.setMinutes(lcgRange(0, 59));
            timestamp.setSeconds(lcgRange(0, 59));

            const visitDateStr = timestamp.toISOString().split('T')[0];
            const visitTimeStr = `${String(timestamp.getHours()).padStart(2, '0')}:${String(timestamp.getMinutes()).padStart(2, '0')}`;
            
            // Jitter coordinates around attraction center
            const lat = attraction.lat + (lcgRandom() - 0.5) * 0.004;
            const lng = attraction.lng + (lcgRandom() - 0.5) * 0.004;
            
            const source = sources[lcgRange(0, sources.length - 1)];
            const visitDuration = lcgRange(30, 240); // 30 mins to 4 hours

            // Determine crowd levels
            let crowd_level = "Low";
            const curHour = timestamp.getHours();
            const popularityFactor = attraction.basePopularity;
            
            // If weekend (Saturday/Sunday), increase crowd density
            const dayOfWeek = timestamp.getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            
            let loadValue = popularityFactor * (curHour >= peakStart && curHour <= peakEnd ? 1.0 : 0.4);
            if (isWeekend) loadValue *= 1.3;

            if (loadValue > 95) crowd_level = "High";
            else if (loadValue > 55) crowd_level = "Moderate";

            checkIns.push({
                tourist_id: `T-${String(idCounter++).padStart(6, '0')}`,
                city: city,
                attraction: attraction.name,
                attraction_id: attraction.id,
                timestamp: timestamp,
                visit_date: visitDateStr,
                visit_time: visitTimeStr,
                latitude: lat,
                longitude: lng,
                source: source,
                visit_duration: visitDuration,
                crowd_level: crowd_level,
                popularity_score: Math.round(loadValue > 100 ? 100 : loadValue)
            });
        }

        // Sort chronologically by timestamp
        checkIns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        console.log(`TourPulse: Deterministically generated ${checkIns.length} check-ins.`);
    }

    // Call dataset generator on load
    generateSimulatedDataset();

    // Query helper to filter data based on active states
    function getFilteredRecords(filters) {
        const { city, dateOption, customStart, customEnd, crowdFilter, sourceFilter, attractionId } = filters;
        
        let targetStart = null;
        let targetEnd = null;

        // Date logic
        if (dateOption === "today") {
            const todayStr = ANCHOR_DATE.toISOString().split('T')[0];
            targetStart = new Date(todayStr + "T00:00:00");
            targetEnd = new Date(todayStr + "T23:59:59");
        } else if (dateOption === "yesterday") {
            const yesterday = new Date(ANCHOR_DATE.getTime() - (24 * 60 * 60 * 1000));
            const yestStr = yesterday.toISOString().split('T')[0];
            targetStart = new Date(yestStr + "T00:00:00");
            targetEnd = new Date(yestStr + "T23:59:59");
        } else if (dateOption === "7days") {
            const startLimit = new Date(ANCHOR_DATE.getTime() - (7 * 24 * 60 * 60 * 1000));
            targetStart = new Date(startLimit.toISOString().split('T')[0] + "T00:00:00");
            targetEnd = new Date(ANCHOR_DATE.toISOString().split('T')[0] + "T23:59:59");
        } else if (dateOption === "30days") {
            const startLimit = new Date(ANCHOR_DATE.getTime() - (30 * 24 * 60 * 60 * 1000));
            targetStart = new Date(startLimit.toISOString().split('T')[0] + "T00:00:00");
            targetEnd = new Date(ANCHOR_DATE.toISOString().split('T')[0] + "T23:59:59");
        } else if (dateOption === "custom" && customStart && customEnd) {
            targetStart = new Date(customStart + "T00:00:00");
            targetEnd = new Date(customEnd + "T23:59:59");
        }

        return checkIns.filter(r => {
            // City check
            if (city && r.city.toLowerCase() !== city.toLowerCase()) return false;
            
            // Attraction check
            if (attractionId && r.attraction_id !== attractionId) return false;

            // Date Range check
            if (targetStart && targetEnd) {
                const time = r.timestamp.getTime();
                if (time < targetStart.getTime() || time > targetEnd.getTime()) return false;
            }

            // Crowd check
            if (crowdFilter && crowdFilter !== "all") {
                if (r.crowd_level.toLowerCase() !== crowdFilter.toLowerCase()) return false;
            }

            // Source check
            if (sourceFilter && sourceFilter !== "all") {
                let mappedSource = r.source.toLowerCase();
                if (mappedSource === "travel app") mappedSource = "app";
                
                if (mappedSource !== sourceFilter.toLowerCase()) return false;
            }

            return true;
        });
    }

    return {
        getCities: function() {
            return cities;
        },
        getAttractions: function(city) {
            return city ? (attractions[city] || []) : attractions;
        },
        getRawRecordsCount: function() {
            return checkIns.length;
        },
        getDatesRange: function() {
            // Return 7 unique dates back from anchor for dynamic selector
            const dates = [];
            for (let i = 0; i < 15; i++) {
                const d = new Date(ANCHOR_DATE.getTime() - (i * 24 * 60 * 60 * 1000));
                dates.push(d.toISOString().split('T')[0]);
            }
            return dates.sort();
        },
        getAnchorDateStr: function() {
            return ANCHOR_DATE.toISOString().split('T')[0];
        },
        
        // Overview KPIs - Driven by Central Filter Object
        getOverviewKPIs: function(filters) {
            const records = getFilteredRecords(filters);
            const totalVisits = records.length;
            
            const activeLocationsSet = new Set(records.map(r => r.attraction));
            const activeLocations = activeLocationsSet.size;

            // Aggregate popularity
            const counts = {};
            records.forEach(r => {
                counts[r.attraction] = (counts[r.attraction] || 0) + 1;
            });

            let topAttraction = "N/A";
            let maxCount = -1;
            for (let attr in counts) {
                if (counts[attr] > maxCount) {
                    maxCount = counts[attr];
                    topAttraction = attr;
                }
            }

            // Average crowd level percentage calculation
            let crowdSum = 0;
            records.forEach(r => {
                crowdSum += r.popularity_score;
            });
            const avgCrowd = totalVisits > 0 ? Math.round(crowdSum / totalVisits) : 0;

            // Peak Hour
            const hours = Array(24).fill(0);
            records.forEach(r => {
                const hr = r.timestamp.getHours();
                hours[hr]++;
            });
            let peakHour = 0;
            let peakHourCount = -1;
            hours.forEach((count, hr) => {
                if (count > peakHourCount) {
                    peakHourCount = count;
                    peakHour = hr;
                }
            });
            
            const pStart = peakHour;
            const pEnd = (peakHour + 2) % 24;
            const peakHourFormatted = `${pStart % 12 || 12} ${pStart >= 12 ? 'PM' : 'AM'} – ${pEnd % 12 || 12} ${pEnd >= 12 ? 'PM' : 'AM'}`;

            // Determinstic trend logic based on city and date to ensure consistency
            let visitsTrend = "+5.4%";
            let crowdTrend = "+2.1%";
            
            // Shift values deterministically based on character codes of filters
            const cityCode = filters.city ? filters.city.charCodeAt(0) : 67;
            const dayCode = filters.dateOption ? filters.dateOption.charCodeAt(0) : 84;
            const combination = (cityCode + dayCode) % 10;
            
            if (combination % 3 === 0) {
                visitsTrend = `+${4 + (combination % 5)}.${combination % 9}%`;
                crowdTrend = `+${1 + (combination % 3)}.${combination % 7}%`;
            } else {
                visitsTrend = `-${2 + (combination % 4)}.${combination % 8}%`;
                crowdTrend = `-${1 + (combination % 2)}.${combination % 6}%`;
            }

            const dailyAverage = totalVisits > 0 ? Math.round(totalVisits / 1.5) : 0;

            return {
                totalVisits: totalVisits.toLocaleString(),
                activeLocations: activeLocations,
                topAttraction: topAttraction,
                avgCrowd: `${avgCrowd}%`,
                peakHour: peakHourFormatted,
                trendVisits: visitsTrend,
                trendCrowd: crowdTrend,
                dailyAverage: dailyAverage.toLocaleString(),
                rawVisits: totalVisits
            };
        },

        // Popularity ranking of attractions for a given filter
        getAttractionPopularity: function(filters) {
            const records = getFilteredRecords(filters);
            const city = filters.city || "Chennai";
            const cityAttractions = attractions[city] || [];
            
            const counts = {};
            cityAttractions.forEach(a => {
                counts[a.name] = { id: a.id, name: a.name, visits: 0, category: a.category, basePopularity: a.basePopularity };
            });

            records.forEach(r => {
                if (counts[r.attraction]) {
                    counts[r.attraction].visits++;
                }
            });

            const result = Object.values(counts);
            if (result.length === 0) return [];
            
            const maxVisits = Math.max(...result.map(r => r.visits), 1);
            
            result.forEach(item => {
                const visitRatio = item.visits / maxVisits;
                item.popularity = Math.round((visitRatio * 40) + ((item.basePopularity / 100) * 60));
                
                if (item.popularity > 80) {
                    item.crowd = "High";
                    item.color = "red";
                } else if (item.popularity > 50) {
                    item.crowd = "Moderate";
                    item.color = "orange";
                } else {
                    item.crowd = "Low";
                    item.color = "green";
                }
                
                // Deterministic trend logic
                const codeSum = item.name.charCodeAt(0) + (filters.dateOption ? filters.dateOption.charCodeAt(0) : 0);
                item.trend = codeSum % 2 === 0 ? "increasing" : "stable";
            });

            return result.sort((a, b) => b.visits - a.visits);
        },

        // Detailed analytics for a single attraction
        getAttractionDetail: function(attractionId, filters) {
            let targetAttr = null;
            let targetCity = "";
            for (let c in attractions) {
                const found = attractions[c].find(a => a.id === attractionId);
                if (found) {
                    targetAttr = found;
                    targetCity = c;
                    break;
                }
            }

            if (!targetAttr) return null;

            // Merge attractionId into filter overrides
            const localFilters = Object.assign({}, filters, { attractionId: attractionId, city: targetCity });
            const records = getFilteredRecords(localFilters);
            const totalVisits = records.length;

            // Sources split
            const sources = { "GPS": 0, "Travel App": 0, "Check-in": 0 };
            records.forEach(r => {
                if (sources[r.source] !== undefined) sources[r.source]++;
            });
            const sumSources = Math.max(totalVisits, 1);
            const sourcePercentages = {
                gps: Math.round((sources["GPS"] / sumSources) * 100),
                app: Math.round((sources["Travel App"] / sumSources) * 100),
                checkin: Math.round((sources["Check-in"] / sumSources) * 100)
            };

            // Hourly distribution
            const hours = Array(24).fill(0);
            records.forEach(r => {
                hours[r.timestamp.getHours()]++;
            });

            // Weekly period heatmap grid
            const heatmapData = Array(4).fill(0).map(() => Array(7).fill(0));
            records.forEach(r => {
                const ts = r.timestamp;
                let day = ts.getDay() - 1;
                if (day < 0) day = 6; // Sunday index 6
                
                const hr = ts.getHours();
                let p = 3; // Night
                if (hr >= 6 && hr < 12) p = 0; // Morning
                else if (hr >= 12 && hr < 17) p = 1; // Afternoon
                else if (hr >= 17 && hr < 21) p = 2; // Evening

                heatmapData[p][day]++;
            });

            const maxCell = Math.max(...heatmapData.map(row => Math.max(...row)), 1);
            const normalizedHeatmap = heatmapData.map(row => 
                row.map(v => Math.round((v / maxCell) * 100))
            );

            // Deterministic predicted count (Anchor tomorrow)
            const seedVal = attractionId.charCodeAt(0) + totalVisits;
            const predictedCount = Math.round(totalVisits * (0.8 + ((seedVal % 5) / 10)));

            const siblingAttrs = attractions[targetCity].filter(a => a.id !== attractionId);
            const nearby = siblingAttrs.map(a => {
                const d = Math.sqrt(Math.pow(a.lat - targetAttr.lat, 2) + Math.pow(a.lng - targetAttr.lng, 2));
                return { name: a.name, id: a.id, dist: d };
            }).sort((a, b) => a.dist - b.dist).slice(0, 2);

            return {
                metadata: targetAttr,
                city: targetCity,
                totalVisits: totalVisits,
                sourcePercentages: sourcePercentages,
                hourlyDistribution: hours,
                heatmap: normalizedHeatmap,
                expectedTomorrow: predictedCount,
                nearby: nearby,
                visitsFormatted: totalVisits.toLocaleString(),
                dailyAverage: Math.round(totalVisits / 1.5).toLocaleString(),
                weeklyAverage: Math.round(totalVisits * 4.5).toLocaleString()
            };
        },

        // Tourist Flow Charts & Grids
        getTouristFlowData: function(filters) {
            const records = getFilteredRecords(filters);
            
            // Check if filtering across multiple days (7days, 30days, or custom range with delta > 1 day)
            let isMultiDay = false;
            let datePointsMap = {};

            if (filters.dateOption === "7days" || filters.dateOption === "30days") {
                isMultiDay = true;
            } else if (filters.dateOption === "custom" && filters.customStart && filters.customEnd) {
                const diffTime = Math.abs(new Date(filters.customEnd) - new Date(filters.customStart));
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays > 1) isMultiDay = true;
            }

            let chartLabels = [];
            let chartValues = [];

            if (isMultiDay) {
                // Aggregate counts by date
                records.forEach(r => {
                    datePointsMap[r.visit_date] = (datePointsMap[r.visit_date] || 0) + 1;
                });
                
                // Sort dates chronologically
                const sortedDates = Object.keys(datePointsMap).sort();
                sortedDates.forEach(d => {
                    const parts = d.split('-');
                    // Label formatted: e.g. "12 Aug"
                    chartLabels.push(`${parts[2]} Aug`);
                    chartValues.push(datePointsMap[d]);
                });

                // Fill values if empty
                if (chartLabels.length === 0) {
                    chartLabels = ["Aug 10", "Aug 11", "Aug 12"];
                    chartValues = [0, 0, 0];
                }
            } else {
                // Hourly aggregation for single days
                const hours = Array(24).fill(0);
                records.forEach(r => {
                    hours[r.timestamp.getHours()]++;
                });
                
                // Format hours labels (alternate hours to fit charts)
                for (let i = 0; i < 24; i++) {
                    if (i === 0) chartLabels.push("12 AM");
                    else if (i === 12) chartLabels.push("12 PM");
                    else if (i % 3 === 0) {
                        chartLabels.push(i < 12 ? `${i} AM` : `${i-12} PM`);
                    } else {
                        chartLabels.push("");
                    }
                    chartValues.push(hours[i]);
                }
            }

            // Custom Heatmap counts
            const heatmapGrid = Array(4).fill(0).map(() => Array(7).fill(0));
            records.forEach(r => {
                const ts = r.timestamp;
                let day = ts.getDay() - 1;
                if (day < 0) day = 6;

                const hr = ts.getHours();
                let p = 3; // Night
                if (hr >= 6 && hr < 12) p = 0;
                else if (hr >= 12 && hr < 17) p = 1;
                else if (hr >= 17 && hr < 21) p = 2;

                heatmapGrid[p][day]++;
            });

            const maxHeat = Math.max(...heatmapGrid.map(row => Math.max(...row)), 1);
            const heatmap = heatmapGrid.map(row =>
                row.map(val => ({
                    count: val,
                    percent: Math.round((val / maxHeat) * 100)
                }))
            );

            // Flow transfer paths paths
            const paths = {};
            const groupTourist = {};
            records.forEach(r => {
                if (!groupTourist[r.tourist_id]) groupTourist[r.tourist_id] = [];
                groupTourist[r.tourist_id].push({ name: r.attraction, time: r.timestamp.getTime() });
            });

            Object.values(groupTourist).forEach(list => {
                if (list.length < 2) return;
                list.sort((a, b) => a.time - b.time);
                for (let i = 0; i < list.length - 1; i++) {
                    const from = list[i].name;
                    const to = list[i + 1].name;
                    if (from === to) continue;
                    const key = `${from} ➔ ${to}`;
                    paths[key] = (paths[key] || 0) + 1;
                }
            });

            const movementFlows = Object.entries(paths)
                .map(([key, count]) => {
                    const parts = key.split(' ➔ ');
                    return { from: parts[0], to: parts[1], weight: count };
                })
                .sort((a, b) => b.weight - a.weight)
                .slice(0, 5);

            return {
                chartType: isMultiDay ? 'daily' : 'hourly',
                labels: chartLabels,
                values: chartValues,
                heatmap: heatmap,
                movementFlows: movementFlows,
                rawHourly: records.reduce((acc, r) => {
                    acc[r.timestamp.getHours()] = (acc[r.timestamp.getHours()] || 0) + 1;
                    return acc;
                }, Array(24).fill(0))
            };
        },

        // Deterministic AI Predictions
        getFlowPrediction: function(filters, attractionId, targetDate, targetTime) {
            let attr = null;
            for (let c in attractions) {
                const found = attractions[c].find(a => a.id === attractionId);
                if (found) {
                    attr = found;
                    break;
                }
            }

            if (!attr) return null;

            const dateObj = new Date(targetDate);
            const day = dateObj.getDay();
            const isWeekend = (day === 0 || day === 6);
            const hour = parseInt(targetTime.split(':')[0]);

            // Multipliers
            let hourMult = 0.25;
            if (hour >= attr.peakStart && hour <= attr.peakEnd) hourMult = 1.0;
            else if (hour >= attr.peakStart - 2 && hour <= attr.peakEnd + 2) hourMult = 0.65;

            const weekendMult = isWeekend ? 1.3 : 0.9;
            const visitorBase = filters.city === "Chennai" ? 950 : 550;
            
            // Deterministic visitors calculation
            const predictedCount = Math.round(visitorBase * (attr.basePopularity / 100) * hourMult * weekendMult);
            
            let predictedCrowd = "Low";
            if (predictedCount > visitorBase * 0.75) predictedCrowd = "High";
            else if (predictedCount > visitorBase * 0.4) predictedCrowd = "Moderate";

            // Historical average visitors for this target slot
            const historicalCount = Math.round(predictedCount * 0.95);

            // Confidence based on forecast date length (max 95%, decays by date distance)
            const daysOffset = Math.abs(dateObj.getTime() - ANCHOR_DATE.getTime()) / (1000 * 60 * 60 * 24);
            const score = Math.round(Math.max(95 - (daysOffset * 1.2), 70));

            let confidence = "High";
            if (score < 85) confidence = "Medium";
            if (score < 75) confidence = "Low";

            let recTime = "7:30 AM – 9:30 AM";
            if (attr.peakStart > 12) {
                recTime = "9:00 AM – 11:30 AM";
            } else {
                recTime = "4:30 PM – 7:00 PM";
            }

            return {
                attractionName: attr.name,
                predictedVisitors: predictedCount,
                historicalVisitors: historicalCount,
                predictedCrowd: predictedCrowd,
                confidence: confidence,
                confidenceScore: score,
                trend: hourMult > 0.6 ? "Increasing" : (hourMult < 0.3 ? "Decreasing" : "Stable"),
                recommendedTime: recTime
            };
        },

        // Smart recommendations based on current aggregates
        getSmartRecommendations: function(filters, crowdPreference) {
            const city = filters.city || "Chennai";
            const cityAttractions = attractions[city] || [];
            const results = [];

            cityAttractions.forEach(attr => {
                const isPeak = lcgRange(0, 100) > 40; // Simulated density calculation
                
                // Determine simulated crowd levels
                let crowd = "Low";
                if (attr.basePopularity > 85) {
                    crowd = "High";
                } else if (attr.basePopularity > 65) {
                    crowd = "Moderate";
                }

                // Filter matching
                if (crowdPreference !== "any" && crowd.toLowerCase() !== crowdPreference.toLowerCase()) {
                    return; // Mismatch
                }

                const expectedCount = lcgRange(100, 1500);

                let bestTime = "8:00 AM – 10:30 AM";
                let reason = `Optimal visit window offers low density (${crowd} crowd levels predicted).`;
                
                if (attr.peakStart > 12) {
                    bestTime = crowdPreference === "low" ? "8:30 AM – 10:30 AM" : "1:30 PM – 3:30 PM";
                } else {
                    bestTime = crowdPreference === "low" ? "4:00 PM – 6:00 PM" : "12:00 PM – 2:00 PM";
                }

                if (crowdPreference === "moderate") {
                    reason = `Balanced tourist capacity with a high popularity ranking of ${attr.basePopularity}%.`;
                } else if (crowdPreference === "high") {
                    reason = `Vibrant crowd atmosphere during active peak visiting slots.`;
                }

                results.push({
                    name: attr.name,
                    category: attr.category,
                    popularity: attr.basePopularity,
                    expectedVisitors: expectedCount,
                    predictedCrowd: crowd,
                    bestTime: bestTime,
                    reason: reason
                });
            });

            // Sort by popularity descending
            return results.sort((a, b) => b.popularity - a.popularity).slice(0, 3);
        },

        // Fetch detailed raw records list for downloadable reports
        getDownloadableRawRecords: function(filters) {
            const records = getFilteredRecords(filters);
            return records.map(r => ({
                tourist_id: r.tourist_id,
                city: r.city,
                attraction: r.attraction,
                date: r.visit_date,
                time: r.visit_time,
                timestamp: r.timestamp.toISOString(),
                latitude: r.latitude.toFixed(6),
                longitude: r.longitude.toFixed(6),
                source: r.source,
                visit_duration: r.visit_duration,
                crowd_level: r.crowd_level,
                popularity_score: r.popularity_score
            }));
        },

        // Data Upload CSV integration
        parseUploadedCSV: function(csvText) {
            const lines = csvText.split('\n');
            if (lines.length < 2) {
                throw new Error("Invalid CSV: Empty file or headers only.");
            }

            const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
            const requiredFields = ["tourist_id", "city", "attraction", "visit_date", "visit_time", "latitude", "longitude"];
            const missing = requiredFields.filter(f => !headers.includes(f));
            
            if (missing.length > 0) {
                throw new Error(`Invalid CSV: Missing fields: ${missing.join(', ')}`);
            }

            const touristIdIdx = headers.indexOf("tourist_id");
            const cityIdx = headers.indexOf("city");
            const attractionIdx = headers.indexOf("attraction");
            const dateIdx = headers.indexOf("visit_date");
            const timeIdx = headers.indexOf("visit_time");
            const latIdx = headers.indexOf("latitude");
            const lngIdx = headers.indexOf("longitude");
            const durationIdx = headers.indexOf("visit_duration");
            const sourceIdx = headers.indexOf("source");

            let validCount = 0;
            const newRecords = [];

            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;

                const cells = line.split(',').map(c => c.trim());
                if (cells.length < requiredFields.length) continue;

                const city = cells[cityIdx];
                const attraction = cells[attractionIdx];
                const visit_date = cells[dateIdx];
                const visit_time = cells[timeIdx];
                const latitude = parseFloat(cells[latIdx]);
                const longitude = parseFloat(cells[lngIdx]);
                
                if (!city || !attraction || !visit_date || !visit_time || isNaN(latitude) || isNaN(longitude)) {
                    continue; // Skip invalid rows
                }

                const tourist_id = cells[touristIdIdx] || `T-UP-${lcgRange(10000, 99999)}`;
                const duration = durationIdx !== -1 && cells[durationIdx] ? parseInt(cells[durationIdx]) : 120;
                const source = sourceIdx !== -1 && cells[sourceIdx] ? cells[sourceIdx] : "Check-in";
                
                const timestamp = new Date(`${visit_date}T${visit_time}:00`);

                newRecords.push({
                    tourist_id: tourist_id,
                    city: city,
                    attraction: attraction,
                    attraction_id: `up_${city.toLowerCase().substring(0,3)}_${attraction.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                    timestamp: timestamp,
                    visit_date: visit_date,
                    visit_time: visit_time,
                    latitude: latitude,
                    longitude: longitude,
                    source: source,
                    visit_duration: duration,
                    crowd_level: duration > 120 ? "High" : "Moderate",
                    popularity_score: duration > 120 ? 88 : 58
                });

                validCount++;
            }

            // Dynamically register any new cities or attractions
            const newCities = [...new Set(newRecords.map(r => r.city))];
            newCities.forEach(cityName => {
                if (!cities[cityName]) {
                    const cityRecords = newRecords.filter(r => r.city === cityName);
                    const avgLat = cityRecords.reduce((sum, r) => sum + r.latitude, 0) / cityRecords.length;
                    const avgLng = cityRecords.reduce((sum, r) => sum + r.longitude, 0) / cityRecords.length;
                    cities[cityName] = { lat: avgLat, lng: avgLng, zoom: 12 };
                }

                if (!attractions[cityName]) {
                    attractions[cityName] = [];
                }

                const cityAttrNames = [...new Set(newRecords.filter(r => r.city === cityName).map(r => r.attraction))];
                cityAttrNames.forEach(attrName => {
                    const exists = attractions[cityName].some(a => a.name === attrName);
                    if (!exists) {
                        const attrRecords = newRecords.filter(r => r.city === cityName && r.attraction === attrName);
                        const avgAttrLat = attrRecords.reduce((sum, r) => sum + r.latitude, 0) / attrRecords.length;
                        const avgAttrLng = attrRecords.reduce((sum, r) => sum + r.longitude, 0) / attrRecords.length;
                        
                        attractions[cityName].push({
                            id: `up_${cityName.toLowerCase().substring(0,3)}_${attrName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
                            name: attrName,
                            lat: avgAttrLat,
                            lng: avgAttrLng,
                            category: "Custom Category",
                            basePopularity: 75,
                            peakStart: 10,
                            peakEnd: 18
                        });
                    }
                });
            });

            // Append parsed data
            checkIns = checkIns.concat(newRecords);
            
            // Sort chronologically
            checkIns.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

            return {
                recordsCount: validCount,
                uniqueCities: [...new Set(newRecords.map(r => r.city))].length,
                dateRange: [...new Set(newRecords.map(r => r.visit_date))].sort(),
            };
        },
        getAllCitiesList: function() {
            const uniqueCheckinCities = [...new Set(checkIns.map(r => r.city))];
            const allCitiesSet = new Set([...Object.keys(cities), ...uniqueCheckinCities]);
            return [...allCitiesSet].sort();
        }
    };
})();
