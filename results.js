/// ═══════════════════════════════════════════════════════════════════
/// SNOW DAY PREDICTOR - RESULTS PAGE
/// Dynamic Snowfall & Alert-Based Background Colors
/// ═══════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', function() {
    const resultsData = sessionStorage.getItem('snowDayResults');
    
    if (!resultsData) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = JSON.parse(resultsData);
    console.log('Results loaded with advanced visual effects');
    analyzeAndDisplay(data);
});

function goBack() {
    window.location.href = 'index.html';
}

// ═══════════════════════════════════════════════════════════════════
// DYNAMIC VISUAL EFFECTS - Snow & Background Based on Percentage & Alerts
// ═══════════════════════════════════════════════════════════════════
function setDynamicVisuals(percentage, alertCount) {
    console.log(`Setting dynamic visuals: ${percentage}%, ${alertCount} alerts`);
    
    const snowflakesContainer = document.querySelector('#resultSnowflakes');
    const snowflakes = document.querySelectorAll('#resultSnowflakes .snowflake');
    const body = document.querySelector('.results-body');
    
    // ═══════════════════════════════════════════════════════════════
    // SNOWFLAKE VISIBILITY & ANIMATION
    // ═══════════════════════════════════════════════════════════════
    
    // RULE 1: No snow at 0% or <1%
    if (percentage === 0 || percentage < 1) {
        console.log('0% or <1% - No snowflakes');
        snowflakesContainer.style.display = 'none';
    } else {
        snowflakesContainer.style.display = 'block';
        
        // RULE 2: Number of visible snowflakes based on percentage
        let visibleCount;
        if (percentage <= 20) {
            visibleCount = 5;
        } else if (percentage <= 40) {
            visibleCount = 10;
        } else if (percentage <= 60) {
            visibleCount = 15;
        } else if (percentage <= 80) {
            visibleCount = 20;
        } else {
            visibleCount = 30; // All snowflakes
        }
        
        console.log(`Showing ${visibleCount} snowflakes`);
        
        // Show/hide snowflakes
        snowflakes.forEach((snowflake, index) => {
            if (index < visibleCount) {
                snowflake.style.display = 'block';
                snowflake.style.opacity = '0.8';
            } else {
                snowflake.style.display = 'none';
            }
        });
        
        // RULE 3: Snow speed based on percentage (1x to 4x)
        const speedMultiplier = 1 + (percentage / 33.33);
        
        snowflakes.forEach((snowflake, index) => {
            if (index < visibleCount) {
                const baseDuration = 10 + (index % 5); // 10-14 seconds
                const newDuration = baseDuration / speedMultiplier;
                snowflake.style.animationDuration = `${newDuration}s`;
            }
        });
        
        console.log(`Snow speed: ${speedMultiplier.toFixed(2)}x`);
    }
    
    // ═══════════════════════════════════════════════════════════════
    // BACKGROUND COLOR - Based on Percentage & Alerts
    // ═══════════════════════════════════════════════════════════════
    
    // Calculate red intensity based on alerts (1 alert = 20% red)
    const redIntensity = Math.min(alertCount * 0.2, 1.0); // Cap at 100%
    
    let background;
    
    if (alertCount > 0) {
        // ALERT MODE - Red gradient based on alert count
        console.log(`Alert mode: ${alertCount} alerts = ${(redIntensity * 100).toFixed(0)}% red`);
        
        if (alertCount >= 5) {
            // Extreme alert (5+ alerts) - Very red
            background = 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 50%, #b91c1c 100%)';
        } else if (alertCount >= 4) {
            // 4 alerts - 80% red
            background = 'linear-gradient(135deg, #991b1b 0%, #b91c1c 50%, #dc2626 100%)';
        } else if (alertCount >= 3) {
            // 3 alerts - 60% red
            background = 'linear-gradient(135deg, #b91c1c 0%, #dc2626 50%, #ef4444 100%)';
        } else if (alertCount >= 2) {
            // 2 alerts - 40% red
            background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)';
        } else {
            // 1 alert - 20% red (light red)
            background = 'linear-gradient(135deg, #ef4444 0%, #f87171 50%, #fca5a5 100%)';
        }
    } else {
        // NO ALERTS MODE - Blue gradient based on percentage (lighter = higher %)
        console.log('No alerts - standard blue gradient');
        
        if (percentage >= 90) {
            // Extreme - Nearly white (whiteout)
            background = 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 50%, #f1f5f9 100%)';
        } else if (percentage >= 75) {
            // Very High - Light gray-blue
            background = 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)';
        } else if (percentage >= 60) {
            // High - Medium gray-blue
            background = 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)';
        } else if (percentage >= 40) {
            // Medium - Blue-gray
            background = 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)';
        } else if (percentage >= 20) {
            // Low - Dark blue
            background = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)';
        } else {
            // Very Low - Very dark blue
            background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
        }
    }
    
    body.style.background = background;
    body.style.transition = 'background 1.5s ease-in-out';
    
    console.log('Visual effects applied');
}

function getWeatherDescription(code) {
    const weatherCodes = {
        0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
        45: 'Foggy', 48: 'Depositing rime fog',
        51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
        61: 'Slight rain', 63: 'Moderate rain', 65: 'Heavy rain',
        71: 'Slight snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
        80: 'Slight rain showers', 81: 'Moderate rain showers', 82: 'Violent rain showers',
        85: 'Slight snow showers', 86: 'Heavy snow showers',
        95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
}

function calculateWindChill(tempF, windMph) {
    if (tempF > 50 || windMph < 3) return tempF;
    return Math.round(35.74 + (0.6215 * tempF) - (35.75 * Math.pow(windMph, 0.16)) + (0.4275 * tempF * Math.pow(windMph, 0.16)));
}

// ═══════════════════════════════════════════════════════════════════
// ADVANCED LOGIC SYSTEM - Precise Calculations
// ═══════════════════════════════════════════════════════════════════
function analyzeWeatherData(weatherData, alerts, radarData, alertAnalysis, aiAnalysis) {
    console.log('=== ADVANCED LOGIC ANALYSIS ===');
    
    let snowDayScore = 0;
    let reasoning = [];
    let alertsList = [];
    
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    
    // CRITICAL TEMPERATURE CHECK
    const currentTemp = current.temperature_2m;
    const avgTemp24Hr = hourly.temperature_2m.slice(0, 24).reduce((sum, val) => sum + val, 0) / 24;
    const highTemp = Math.max(...hourly.temperature_2m.slice(0, 24));
    
    console.log('Temperature:', { current: currentTemp, avg: avgTemp24Hr, high: highTemp });
    
    // RULE 1: Above 60°F = 0%
    if (currentTemp >= 60 || highTemp >= 60) {
        console.log('Temperature above 60°F - returning 0%');
        return {
            snowDayPercentage: 0,
            snowDay: false,
            confidence: 'very high',
            reasoning: `Temperature is ${Math.round(currentTemp)}°F, far too warm for any snow. No winter weather possible.`,
            radarAnalysis: 'No snow possible at current temperatures.',
            timingAnalysis: 'Temperatures remain well above freezing.',
            accumulation: 'None - too warm',
            snowRate: 'N/A',
            temperature: `${Math.round(currentTemp)}°F`,
            feelsLike: `${Math.round(current.apparent_temperature)}°F`,
            windSpeed: `${Math.round(current.wind_speed_10m)} mph`,
            windChill: 'N/A (too warm)',
            precipitation: 'None expected',
            visibility: '10+ miles',
            skyConditions: getWeatherDescription(current.weather_code),
            humidity: `${Math.round(current.relative_humidity_2m)}%`,
            peakTime: 'N/A',
            duration: 'N/A',
            alerts: [],
            advisory: '✅ Normal conditions. Far too warm for snow.',
            rawAlerts: alerts
        };
    }
    
    // RULE 2: 40°F+ = <1%
    if (currentTemp >= 40 && avgTemp24Hr >= 38) {
        console.log('Temperature 40°F+ - returning <1%');
        snowDayScore = 0.5;
        reasoning.push(`Temperature ${Math.round(currentTemp)}°F too warm for snow`);
    } else {
        snowDayScore = 10;
    }
    
    // SNOW ACCUMULATION
    let totalSnowfall = hourly.snowfall.slice(0, 48).reduce((sum, val) => sum + (val || 0), 0);
    let maxSnowRate = Math.max(...hourly.snowfall.slice(0, 48));
    let snowHours = hourly.snowfall.slice(0, 48).filter(s => s > 0).length;
    let heavySnowHours = hourly.snowfall.slice(0, 48).filter(s => s >= 0.5).length;
    
    console.log('Snow:', { total: totalSnowfall, maxRate: maxSnowRate, hours: snowHours });
    
    // Temperature scoring
    if (currentTemp <= 40) {
        if (currentTemp <= 15) {
            snowDayScore += 27;
            reasoning.push(`Extreme cold ${Math.round(currentTemp)}°F`);
        } else if (currentTemp <= 20) {
            snowDayScore += 21;
            reasoning.push(`Very cold ${Math.round(currentTemp)}°F`);
        } else if (currentTemp <= 25) {
            snowDayScore += 16;
            reasoning.push(`Cold ${Math.round(currentTemp)}°F`);
        } else if (currentTemp <= 30) {
            snowDayScore += 12;
            reasoning.push(`Below freezing ${Math.round(currentTemp)}°F`);
        } else if (currentTemp <= 32) {
            snowDayScore += 7;
            reasoning.push(`At freezing ${Math.round(currentTemp)}°F`);
        } else if (currentTemp <= 35) {
            snowDayScore += 2;
        }
    }
    
    // WIND CHILL ANALYSIS
    const maxWindSpeed = Math.max(...hourly.wind_speed_10m.slice(0, 48));
    const windChill = calculateWindChill(currentTemp, maxWindSpeed);
    
    if (windChill < 0) {
        const degreesBelow0 = Math.abs(windChill);
        if (windChill <= -8) {
            const degreesBelow8 = degreesBelow0 - 8;
            snowDayScore += degreesBelow8 * 5;
            snowDayScore += 8;
            reasoning.push(`Extreme wind chill ${windChill}°F (+${degreesBelow8 * 5 + 8}%)`);
        } else {
            snowDayScore += degreesBelow0 * 1;
            reasoning.push(`Severe wind chill ${windChill}°F (+${degreesBelow0}%)`);
        }
    }
    
    // Snow accumulation scoring
    if (totalSnowfall >= 18) {
        snowDayScore += 36;
        reasoning.push(`Extreme snow ${totalSnowfall.toFixed(1)}" (+35%)`);
    } else if (totalSnowfall >= 15) {
        snowDayScore += 32;
        reasoning.push(`Major snow ${totalSnowfall.toFixed(1)}" (+32%)`);
    } else if (totalSnowfall >= 12) {
        snowDayScore += 28;
        reasoning.push(`Very heavy snow ${totalSnowfall.toFixed(1)}" (+28%)`);
    } else if (totalSnowfall >= 10) {
        snowDayScore += 26;
        reasoning.push(`Heavy snow ${totalSnowfall.toFixed(1)}" (+25%)`);
    } else if (totalSnowfall >= 8) {
        snowDayScore += 22;
        reasoning.push(`Heavy snow ${totalSnowfall.toFixed(1)}" (+22%)`);
    } else if (totalSnowfall >= 6) {
        snowDayScore += 18;
        reasoning.push(`Significant snow ${totalSnowfall.toFixed(1)}" (+18%)`);
    } else if (totalSnowfall >= 4) {
        snowDayScore += 12;
        reasoning.push(`Moderate snow ${totalSnowfall.toFixed(1)}" (+12%)`);
    } else if (totalSnowfall >= 3) {
        snowDayScore += 9;
        reasoning.push(`Moderate snow ${totalSnowfall.toFixed(1)}" (+9%)`);
    } else if (totalSnowfall >= 2) {
        snowDayScore += 6;
        reasoning.push(`Light-moderate snow ${totalSnowfall.toFixed(1)}" (+6%)`);
    } else if (totalSnowfall >= 1) {
        snowDayScore += 3;
        reasoning.push(`Light snow ${totalSnowfall.toFixed(1)}" (+3%)`);
    } else if (totalSnowfall === 0) {
        snowDayScore -= 10;
        reasoning.push('No snow in forecast (-10%)');
    }
    
    // Snow rate/intensity
    if (maxSnowRate >= 2.0) {
        snowDayScore += 16;
        reasoning.push(`Extreme snow rate ${maxSnowRate.toFixed(1)}"/hr (+15%)`);
    } else if (maxSnowRate >= 1.5) {
        snowDayScore += 12;
        reasoning.push(`Very heavy rate ${maxSnowRate.toFixed(1)}"/hr (+12%)`);
    } else if (maxSnowRate >= 1.0) {
        snowDayScore += 9;
        reasoning.push(`Heavy rate ${maxSnowRate.toFixed(1)}"/hr (+10%)`);
    } else if (maxSnowRate >= 0.5) {
        snowDayScore += 6;
        reasoning.push(`Moderate rate ${maxSnowRate.toFixed(1)}"/hr (+6%)`);
    }
    
    // Duration
    if (heavySnowHours >= 8) {
        snowDayScore += 12;
        reasoning.push(`${heavySnowHours}hr heavy snow (+12%)`);
    } else if (heavySnowHours >= 4) {
        snowDayScore += 8;
        reasoning.push(`${heavySnowHours}hr heavy snow (+8%)`);
    } else if (snowHours >= 12) {
        snowDayScore += 9;
        reasoning.push(`${snowHours}hr snow duration (+10%)`);
    } else if (snowHours >= 6) {
        snowDayScore += 6;
        reasoning.push(`${snowHours}hr snow (+6%)`);
    }
    
    // RADAR DATA
    if (radarData && radarData.precipitationIntensity) {
        if (radarData.precipitationIntensity === 'heavy') {
            snowDayScore += 12;
            reasoning.push('Radar: Heavy intensity (+12%)');
        } else if (radarData.precipitationIntensity === 'moderate') {
            snowDayScore += 6;
            reasoning.push('Radar: Moderate intensity (+6%)');
        }
        
        if (radarData.movementPattern === 'slow-moving system') {
            snowDayScore += 8;
            reasoning.push('Radar: Slow-moving (+8%)');
        }
        
        if (radarData.intensityTrend === 'intensifying') {
            snowDayScore += 6;
            reasoning.push('Radar: Intensifying (+6%)');
        } else if (radarData.intensityTrend === 'weakening') {
            snowDayScore -= 4;
            reasoning.push('Radar: Weakening (-4%)');
        }
    }
    
    // WEATHER ALERTS
    if (alertAnalysis) {
        if (alertAnalysis.hasBlizzardWarning) {
            snowDayScore += 27;
            reasoning.push('🚨 BLIZZARD WARNING (+25%)');
            alertsList.push('Blizzard Warning');
        }
        
        if (alertAnalysis.hasWinterStormWarning) {
            snowDayScore += 22;
            reasoning.push('🚨 WINTER STORM WARNING (+20%)');
            alertsList.push('Winter Storm Warning');
        }
        
        if (alertAnalysis.hasWinterWeatherAdvisory) {
            snowDayScore += 12;
            reasoning.push('⚠️ Winter Weather Advisory (+10%)');
            alertsList.push('Winter Weather Advisory');
        }
        
        if (alertAnalysis.winterAlerts) {
            alertAnalysis.winterAlerts.forEach(alert => {
                if (!alertsList.includes(alert.type)) {
                    alertsList.push(alert.type);
                }
            });
        }
    }
    
    // Wind
    if (maxWindSpeed >= 40) {
        snowDayScore += 12;
        reasoning.push(`Extreme winds ${Math.round(maxWindSpeed)}mph (+12%)`);
    } else if (maxWindSpeed >= 35) {
        snowDayScore += 9;
        reasoning.push(`Dangerous winds ${Math.round(maxWindSpeed)}mph (+10%)`);
    } else if (maxWindSpeed >= 30) {
        snowDayScore += 8;
        reasoning.push(`High winds ${Math.round(maxWindSpeed)}mph (+8%)`);
    } else if (maxWindSpeed >= 25) {
        snowDayScore += 6;
        reasoning.push(`Strong winds ${Math.round(maxWindSpeed)}mph (+6%)`);
    }
    
    // Visibility
    const minVisibility = Math.min(...hourly.visibility.slice(0, 48).map(v => v / 5280));
    if (minVisibility < 0.25) {
        snowDayScore += 16;
        reasoning.push(`Near-zero visibility ${minVisibility.toFixed(2)}mi (+15%)`);
    } else if (minVisibility < 0.5) {
        snowDayScore += 12;
        reasoning.push(`Very poor visibility ${minVisibility.toFixed(1)}mi (+12%)`);
    } else if (minVisibility < 1) {
        snowDayScore += 8;
        reasoning.push(`Poor visibility ${minVisibility.toFixed(1)}mi (+8%)`);
    } else if (minVisibility < 2) {
        snowDayScore += 4;
        reasoning.push(`Reduced visibility ${minVisibility.toFixed(1)}mi (+4%)`);
    }
    
    // Temperature persistence
    const belowFreezingHours = hourly.temperature_2m.slice(0, 48).filter(t => t <= 32).length;
    if (belowFreezingHours >= 40) {
        snowDayScore += 11;
        reasoning.push(`${belowFreezingHours}hr below freezing (+10%)`);
    } else if (belowFreezingHours >= 30) {
        snowDayScore += 7;
        reasoning.push(`${belowFreezingHours}hr below freezing (+7%)`);
    } else if (belowFreezingHours >= 24) {
        snowDayScore += 4;
        reasoning.push(`${belowFreezingHours}hr below freezing (+5%)`);
    }
    
    // AI adjustment (70% logic, 30% AI)
    if (aiAnalysis && aiAnalysis.snowDayProbability) {
        console.log('AI suggests:', aiAnalysis.snowDayProbability);
        const blended = (snowDayScore * 0.7) + (aiAnalysis.snowDayProbability * 0.3);
        console.log('Blending:', snowDayScore, 'with AI', aiAnalysis.snowDayProbability, '=', blended);
        snowDayScore = blended;
        
        if (aiAnalysis.keyFactors) {
            reasoning.push(...aiAnalysis.keyFactors.slice(0, 2));
        }
    }
    
    // Cap and round
    snowDayScore = Math.min(100, Math.max(0, snowDayScore));
    snowDayScore = Math.round(snowDayScore * 10) / 10;
    
    if (snowDayScore > 0 && snowDayScore < 1 && (totalSnowfall > 0 || currentTemp >= 38)) {
        snowDayScore = 0.5;
    }
    
    console.log('FINAL SCORE:', snowDayScore);
    
    // Confidence
    let confidence = 'very low';
    if (snowDayScore >= 85) confidence = 'very high';
    else if (snowDayScore >= 70) confidence = 'high';
    else if (snowDayScore >= 55) confidence = 'medium-high';
    else if (snowDayScore >= 40) confidence = 'medium';
    else if (snowDayScore >= 25) confidence = 'low';
    
    const isSnowDay = snowDayScore >= 55;
    
    // Summaries
    let accumulation = 'None expected';
    if (totalSnowfall >= 12) accumulation = `${totalSnowfall.toFixed(1)}" (Extreme)`;
    else if (totalSnowfall >= 8) accumulation = `${totalSnowfall.toFixed(1)}" (Heavy)`;
    else if (totalSnowfall >= 4) accumulation = `${totalSnowfall.toFixed(1)}" (Moderate)`;
    else if (totalSnowfall >= 1) accumulation = `${totalSnowfall.toFixed(1)}" (Light)`;
    else if (totalSnowfall > 0) accumulation = 'Trace to 1"';
    
    let precipSummary = 'None expected';
    if (totalSnowfall > 0) {
        if (alertAnalysis && alertAnalysis.hasBlizzardWarning) {
            precipSummary = 'Blizzard conditions';
        } else if (maxSnowRate >= 1.0) {
            precipSummary = 'Heavy snow likely';
        } else {
            precipSummary = 'Snow expected';
        }
    }
    
    let finalReasoning = reasoning.length > 0 ? reasoning.join('. ') + '.' : 
        `Conditions: ${Math.round(currentTemp)}°F, ${totalSnowfall.toFixed(1)}" snow, ${Math.round(maxWindSpeed)}mph winds.`;
    
    let radarAnalysisText = radarData && radarData.precipitationIntensity ? 
        `Radar: ${radarData.precipitationIntensity} precipitation, ${radarData.movementPattern}, ${radarData.intensityTrend}.` :
        `Radar shows ${totalSnowfall > 0 ? 'snow development' : 'no precipitation'}.`;
    
    let timingAnalysisText = alertsList.length > 0 ? 
        `Active alerts: ${alertsList.join(', ')}. NWS warnings indicate significant impacts.` :
        `No alerts. Snow ${totalSnowfall > 0 ? 'expected' : 'not forecast'}.`;
    
    let advisory = 'Monitor conditions';
    if (snowDayScore >= 85) {
        advisory = '🚨 EXTREME: Do not travel. Life-threatening.';
    } else if (snowDayScore >= 70) {
        advisory = '⚠️ DANGEROUS: Avoid travel. Roads impassable.';
    } else if (snowDayScore >= 55) {
        advisory = '⚠️ SIGNIFICANT: Travel not recommended.';
    } else if (snowDayScore >= 35) {
        advisory = 'ℹ️ MINOR: Drive carefully.';
    } else {
        advisory = '✅ MINIMAL: Normal conditions.';
    }
    
    return {
        snowDayPercentage: snowDayScore,
        snowDay: isSnowDay,
        confidence: confidence,
        reasoning: finalReasoning,
        radarAnalysis: radarAnalysisText,
        timingAnalysis: timingAnalysisText,
        accumulation: accumulation,
        snowRate: maxSnowRate > 0 ? `${maxSnowRate.toFixed(1)}"/hr` : 'N/A',
        temperature: `${Math.round(currentTemp)}°F`,
        feelsLike: `${Math.round(current.apparent_temperature)}°F`,
        windSpeed: `${Math.round(maxWindSpeed)} mph`,
        windChill: `${windChill}°F`,
        precipitation: precipSummary,
        visibility: `${minVisibility.toFixed(1)} mi`,
        skyConditions: getWeatherDescription(current.weather_code),
        humidity: `${Math.round(current.relative_humidity_2m)}%`,
        peakTime: snowHours > 0 ? 'See analysis' : 'N/A',
        duration: `${snowHours} hours`,
        alerts: alertsList,
        advisory: advisory,
        rawAlerts: alerts
    };
}

function analyzeAndDisplay(data) {
    const analysis = analyzeWeatherData(
        data.weatherData, 
        data.alerts, 
        data.radarData, 
        data.alertAnalysis, 
        data.aiAnalysis
    );
    
    // Count alerts for background color
    const alertCount = analysis.alerts ? analysis.alerts.length : 0;
    
    // Set dynamic visuals with percentage AND alert count
    setDynamicVisuals(analysis.snowDayPercentage, alertCount);
    
    displayResults({ location: data.location, ...analysis });
}

function displayResults(data) {
    console.log('Displaying results:', data);
    
    document.getElementById('resultLocation').textContent = data.location;
    
    let displayPercentage = data.snowDayPercentage;
    let percentageText = Math.round(displayPercentage);
    
    if (displayPercentage === 0) {
        percentageText = '0';
    } else if (displayPercentage > 0 && displayPercentage < 1) {
        percentageText = '<1';
    }
    
    const circle = document.getElementById('progressCircle');
    const percentageNumber = document.getElementById('percentageNumber');
    
    const circumference = 2 * Math.PI * 100;
    const offset = circumference - (displayPercentage / 100) * circumference;
    
    let currentPercentage = 0;
    const increment = displayPercentage / 50;
    const timer = setInterval(() => {
        currentPercentage += increment;
        if (currentPercentage >= displayPercentage) {
            currentPercentage = displayPercentage;
            clearInterval(timer);
            percentageNumber.textContent = percentageText;
        } else {
            if (displayPercentage === 0) {
                percentageNumber.textContent = '0';
            } else if (displayPercentage < 1) {
                percentageNumber.textContent = '<1';
            } else {
                percentageNumber.textContent = Math.round(currentPercentage);
            }
        }
    }, 20);
    
    const gradient = document.querySelector('#progressGradient');
    if (displayPercentage >= 70) {
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        `;
    } else if (displayPercentage >= 40) {
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#eab308;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#ca8a04;stop-opacity:1" />
        `;
    } else {
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#9ca3af;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#6b7280;stop-opacity:1" />
        `;
    }
    
    circle.style.strokeDashoffset = offset;
    
    const verdict = document.getElementById('verdict');
    if (data.snowDay) {
        verdict.textContent = '❄️ SNOW DAY LIKELY!';
        verdict.className = 'snow-day-verdict yes';
    } else {
        verdict.textContent = '☀️ No Snow Day Expected';
        verdict.className = 'snow-day-verdict no';
    }
    
    const confidenceBadge = document.getElementById('confidenceBadge');
    confidenceBadge.textContent = `${data.confidence} confidence`;
    confidenceBadge.className = `confidence-badge ${data.confidence.replace(' ', '-')}`;
    
    document.getElementById('quickTemp').textContent = data.temperature;
    document.getElementById('quickSnow').textContent = data.accumulation.split('(')[0].trim();
    document.getElementById('quickWind').textContent = data.windSpeed.split(',')[0];
    document.getElementById('quickVis').textContent = data.visibility;
    
    const alertsSection = document.getElementById('alertsSection');
    if (data.alerts && data.alerts.length > 0) {
        alertsSection.innerHTML = `
            <div class="alert-title">🚨 Active Weather Alerts</div>
            ${data.alerts.map(alert => `
                <div class="alert-item">
                    <div class="alert-type">${alert}</div>
                </div>
            `).join('')}
        `;
        alertsSection.classList.add('show');
    } else if (data.rawAlerts && data.rawAlerts.length > 0) {
        alertsSection.innerHTML = `
            <div class="alert-title">🚨 Active Weather Alerts</div>
            ${data.rawAlerts.map(alert => `
                <div class="alert-item">
                    <div class="alert-type">${alert.properties.event}</div>
                    <div class="alert-description">${alert.properties.headline || ''}</div>
                </div>
            `).join('')}
        `;
        alertsSection.classList.add('show');
    } else {
        alertsSection.classList.remove('show');
    }
    
    document.getElementById('temperature').textContent = data.temperature || 'N/A';
    document.getElementById('feelsLike').textContent = data.feelsLike || 'N/A';
    document.getElementById('accumulation').textContent = data.accumulation || 'None';
    document.getElementById('snowRate').textContent = data.snowRate || 'N/A';
    document.getElementById('windSpeed').textContent = data.windSpeed || 'N/A';
    document.getElementById('windChill').textContent = data.windChill || 'N/A';
    document.getElementById('precipitation').textContent = data.precipitation || 'None';
    document.getElementById('humidity').textContent = data.humidity || 'N/A';
    document.getElementById('visibility').textContent = data.visibility || 'N/A';
    document.getElementById('skyConditions').textContent = data.skyConditions || 'Unknown';
    document.getElementById('peakTime').textContent = data.peakTime || 'N/A';
    document.getElementById('duration').textContent = data.duration || 'N/A';
    
    document.getElementById('aiReasoning').textContent = data.reasoning;
    document.getElementById('radarAnalysis').textContent = data.radarAnalysis;
    document.getElementById('timingAnalysis').textContent = data.timingAnalysis;
    document.getElementById('advisory').textContent = data.advisory;
    
    console.log('✓ Display complete - Score:', displayPercentage);
}

console.log('✓ Advanced results script loaded with dynamic visuals');
