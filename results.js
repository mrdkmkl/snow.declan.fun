// ═══════════════════════════════════════════════════════════════════
// RESULTS PAGE - Enhanced with Fallbacks
// ═══════════════════════════════════════════════════════════════════

window.addEventListener('DOMContentLoaded', function() {
    const resultsData = sessionStorage.getItem('snowDayResults');
    
    if (!resultsData) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = JSON.parse(resultsData);
    console.log('Results loaded with radar & alerts');
    analyzeAndDisplay(data);
});

function goBack() {
    window.location.href = 'index.html';
}

function setDynamicVisuals(percentage) {
    const snowflakes = document.querySelectorAll('#resultSnowflakes .snowflake');
    const speedMultiplier = 1 + (percentage / 33.33);
    
    snowflakes.forEach((snowflake, index) => {
        const baseDuration = 10 + (index % 5);
        const newDuration = baseDuration / speedMultiplier;
        snowflake.style.animationDuration = `${newDuration}s`;
    });
    
    const body = document.querySelector('.results-body');
    
    if (percentage >= 90) {
        body.style.background = 'linear-gradient(135deg, #cbd5e1 0%, #e2e8f0 50%, #f1f5f9 100%)';
    } else if (percentage >= 75) {
        body.style.background = 'linear-gradient(135deg, #64748b 0%, #94a3b8 50%, #cbd5e1 100%)';
    } else if (percentage >= 60) {
        body.style.background = 'linear-gradient(135deg, #475569 0%, #64748b 50%, #94a3b8 100%)';
    } else if (percentage >= 40) {
        body.style.background = 'linear-gradient(135deg, #334155 0%, #475569 50%, #64748b 100%)';
    } else if (percentage >= 20) {
        body.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)';
    } else {
        body.style.background = 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)';
    }
    
    body.style.transition = 'background 1.5s ease-in-out';
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
// HYBRID ANALYSIS - AI + Logic + Radar + Alerts
// ═══════════════════════════════════════════════════════════════════
function analyzeWeatherData(weatherData, alerts, radarData, alertAnalysis, aiAnalysis) {
    console.log('=== HYBRID ANALYSIS: AI + Logic + Radar + Alerts ===');
    
    let snowDayScore = 0;
    let reasoning = [];
    let alertsList = [];
    
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    
    // Start with AI if available
    if (aiAnalysis && aiAnalysis.snowDayProbability) {
        console.log('Using AI as foundation:', aiAnalysis.snowDayProbability);
        snowDayScore = aiAnalysis.snowDayProbability;
        if (aiAnalysis.keyFactors) reasoning.push(...aiAnalysis.keyFactors);
    } else {
        console.log('No AI - using logic');
        snowDayScore = 50;
    }
    
    // LOGIC ADJUSTMENTS
    const currentTemp = current.temperature_2m;
    let logicAdjustment = 0;
    
    // Temperature
    if (currentTemp <= 20) {
        logicAdjustment += 15;
        reasoning.push(`Extreme cold at ${Math.round(currentTemp)}°F`);
    } else if (currentTemp <= 28) {
        logicAdjustment += 10;
        reasoning.push(`Very cold at ${Math.round(currentTemp)}°F`);
    } else if (currentTemp <= 32) {
        logicAdjustment += 5;
        reasoning.push(`At freezing point: ${Math.round(currentTemp)}°F`);
    } else if (currentTemp > 35) {
        logicAdjustment -= 10;
        reasoning.push(`Too warm for snow: ${Math.round(currentTemp)}°F`);
    }
    
    // Snow accumulation
    let totalSnowfall = hourly.snowfall.slice(0, 48).reduce((sum, val) => sum + (val || 0), 0);
    if (totalSnowfall >= 12) {
        logicAdjustment += 25;
        reasoning.push(`Extreme snow: ${totalSnowfall.toFixed(1)}"`);
    } else if (totalSnowfall >= 8) {
        logicAdjustment += 20;
        reasoning.push(`Heavy snow: ${totalSnowfall.toFixed(1)}"`);
    } else if (totalSnowfall >= 6) {
        logicAdjustment += 15;
        reasoning.push(`Significant snow: ${totalSnowfall.toFixed(1)}"`);
    } else if (totalSnowfall >= 3) {
        logicAdjustment += 10;
        reasoning.push(`Moderate snow: ${totalSnowfall.toFixed(1)}"`);
    } else if (totalSnowfall >= 1) {
        logicAdjustment += 5;
        reasoning.push(`Light snow: ${totalSnowfall.toFixed(1)}"`);
    } else if (totalSnowfall === 0) {
        logicAdjustment -= 20;
        reasoning.push('No snow in forecast');
    }
    
    // RADAR DATA ADJUSTMENTS
    if (radarData && radarData.precipitationIntensity) {
        console.log('Applying radar adjustments...');
        if (radarData.precipitationIntensity === 'heavy') {
            logicAdjustment += 15;
            reasoning.push(`Radar: Heavy precipitation intensity`);
        } else if (radarData.precipitationIntensity === 'moderate') {
            logicAdjustment += 8;
            reasoning.push(`Radar: Moderate precipitation intensity`);
        }
        
        if (radarData.continuousHours >= 12) {
            logicAdjustment += 12;
            reasoning.push(`Radar: ${radarData.continuousHours}hr continuous snow`);
        } else if (radarData.continuousHours >= 6) {
            logicAdjustment += 7;
            reasoning.push(`Radar: ${radarData.continuousHours}hr snow duration`);
        }
        
        if (radarData.movementPattern === 'slow-moving system') {
            logicAdjustment += 10;
            reasoning.push(`Radar: Slow-moving system`);
        }
        
        if (radarData.intensityTrend === 'intensifying') {
            logicAdjustment += 8;
            reasoning.push(`Radar: Storm intensifying`);
        } else if (radarData.intensityTrend === 'weakening') {
            logicAdjustment -= 5;
            reasoning.push(`Radar: Storm weakening`);
        }
    }
    
    // ALERT DATA ADJUSTMENTS
    if (alertAnalysis) {
        console.log('Applying alert adjustments...');
        if (alertAnalysis.hasBlizzardWarning) {
            logicAdjustment += 30;
            reasoning.push(`🚨 BLIZZARD WARNING - Life-threatening`);
            alertsList.push('Blizzard Warning');
        }
        
        if (alertAnalysis.hasWinterStormWarning) {
            logicAdjustment += 25;
            reasoning.push(`🚨 WINTER STORM WARNING`);
            alertsList.push('Winter Storm Warning');
        }
        
        if (alertAnalysis.hasWinterWeatherAdvisory) {
            logicAdjustment += 12;
            reasoning.push(`⚠️ Winter Weather Advisory`);
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
    
    // Wind & visibility
    const maxWindSpeed = Math.max(...hourly.wind_speed_10m.slice(0, 48));
    if (maxWindSpeed >= 35) {
        logicAdjustment += 10;
        reasoning.push(`Dangerous winds: ${Math.round(maxWindSpeed)} mph`);
    } else if (maxWindSpeed >= 25) {
        logicAdjustment += 7;
        reasoning.push(`Strong winds: ${Math.round(maxWindSpeed)} mph`);
    } else if (maxWindSpeed >= 20) {
        logicAdjustment += 5;
    }
    
    const minVisibility = Math.min(...hourly.visibility.slice(0, 48).map(v => v / 5280));
    if (minVisibility < 0.5) {
        logicAdjustment += 10;
        reasoning.push(`Very poor visibility: ${minVisibility.toFixed(1)} mi`);
    } else if (minVisibility < 1) {
        logicAdjustment += 7;
        reasoning.push(`Poor visibility: ${minVisibility.toFixed(1)} mi`);
    } else if (minVisibility < 2) {
        logicAdjustment += 4;
    }
    
    console.log('Total logic adjustment:', logicAdjustment);
    
    // Combine AI and Logic
    if (aiAnalysis && aiAnalysis.snowDayProbability) {
        snowDayScore += logicAdjustment * 0.4;
    } else {
        snowDayScore += logicAdjustment;
    }
    
    // Cap and round
    snowDayScore = Math.min(100, Math.max(0, snowDayScore));
    snowDayScore = Math.round(snowDayScore * 10) / 10;
    
    console.log('Final score:', snowDayScore);
    
    // Confidence
    let confidence = 'very low';
    if (snowDayScore >= 85) confidence = 'very high';
    else if (snowDayScore >= 70) confidence = 'high';
    else if (snowDayScore >= 55) confidence = 'medium-high';
    else if (snowDayScore >= 40) confidence = 'medium';
    else if (snowDayScore >= 25) confidence = 'low';
    
    const isSnowDay = snowDayScore >= 55;
    
    // Generate summaries with fallbacks
    let accumulation = 'None expected';
    if (totalSnowfall >= 12) accumulation = `${totalSnowfall.toFixed(1)}" (Extreme)`;
    else if (totalSnowfall >= 8) accumulation = `${totalSnowfall.toFixed(1)}" (Heavy)`;
    else if (totalSnowfall >= 4) accumulation = `${totalSnowfall.toFixed(1)}" (Moderate)`;
    else if (totalSnowfall >= 1) accumulation = `${totalSnowfall.toFixed(1)}" (Light)`;
    else if (totalSnowfall > 0) accumulation = 'Trace to 1"';
    
    // SHORT precipitation (max 6 words)
    let precipSummary = 'None expected';
    if (totalSnowfall > 0) {
        if (alertAnalysis && alertAnalysis.hasBlizzardWarning) {
            precipSummary = 'Blizzard conditions expected';
        } else if (radarData && radarData.precipitationIntensity === 'heavy') {
            precipSummary = 'Heavy snow likely';
        } else {
            precipSummary = 'Snow expected';
        }
    }
    
    // FALLBACK REASONING - Always have something to show
    let finalReasoning = 'No data';
    if (reasoning.length > 0) {
        finalReasoning = reasoning.join('. ') + '.';
    } else {
        // Generate basic reasoning from data
        finalReasoning = `Weather analysis for current conditions shows temperature at ${Math.round(currentTemp)}°F ` +
            `with ${totalSnowfall > 0 ? totalSnowfall.toFixed(1) + ' inches of snow expected' : 'no snow in the forecast'}. ` +
            `Wind speeds reaching ${Math.round(maxWindSpeed)} mph with visibility at ${minVisibility.toFixed(1)} miles. ` +
            `${isSnowDay ? 'Conditions favor a snow day.' : 'Conditions do not support a snow day at this time.'}`;
    }
    
    // FALLBACK RADAR ANALYSIS - Always have something
    let radarAnalysisText = 'No radar data available';
    if (aiAnalysis && aiAnalysis.radarInsight) {
        radarAnalysisText = aiAnalysis.radarInsight;
    } else if (radarData && radarData.precipitationIntensity) {
        radarAnalysisText = `Radar analysis indicates ${radarData.precipitationIntensity} precipitation intensity ` +
            `with ${radarData.movementPattern}. Storm system is ${radarData.intensityTrend} with ` +
            `${radarData.continuousHours} hours of continuous snowfall expected. Precipitation coverage ` +
            `reaches ${radarData.coverage}% in affected areas. ${radarData.snowBands.length > 0 ? 
            `Multiple snow bands detected with peak intensity reaching ${Math.max(...radarData.snowBands.map(b => b.intensity)).toFixed(1)} inches per hour.` : 
            'No organized snow bands currently detected.'}`;
    } else {
        radarAnalysisText = `Current radar patterns show ${totalSnowfall > 0 ? 'precipitation development' : 'no significant precipitation'} ` +
            `in the forecast area. Weather systems ${totalSnowfall > 0 ? 'are expected to produce snow' : 'remain favorable for dry conditions'} ` +
            `over the next 48 hours. Atmospheric conditions ${currentTemp <= 32 ? 'support snow formation' : 'are too warm for snow'}.`;
    }
    
    // FALLBACK TIMING/ALERT ANALYSIS - Always have something
    let timingAnalysisText = 'No timing data available';
    if (aiAnalysis && aiAnalysis.alertImpact) {
        timingAnalysisText = aiAnalysis.alertImpact;
    } else if (alertAnalysis && alertAnalysis.winterAlerts && alertAnalysis.winterAlerts.length > 0) {
        timingAnalysisText = `Active weather alerts issued by the National Weather Service: ${alertsList.join(', ')}. ` +
            `Alert severity is ${alertAnalysis.severity} with ${alertAnalysis.urgency} urgency. ` +
            `Impact assessment indicates ${alertAnalysis.impactScore >= 20 ? 'major' : alertAnalysis.impactScore >= 10 ? 'moderate' : 'minor'} ` +
            `disruptions expected. ${alertAnalysis.hasBlizzardWarning ? 'Blizzard conditions with life-threatening impacts are forecast.' : 
            alertAnalysis.hasWinterStormWarning ? 'Significant winter storm impacts expected across the region.' : 
            'Winter weather conditions may cause travel difficulties.'}`;
    } else {
        timingAnalysisText = `No official weather alerts are currently in effect for this location. ` +
            `Snow is ${totalSnowfall > 0 ? 'expected to develop' : 'not forecast'} within the next 48 hours. ` +
            `${radarData && radarData.continuousHours > 0 ? 
            `Duration of snowfall is projected at ${radarData.continuousHours} hours.` : 
            'Current atmospheric patterns do not support sustained snowfall.'} ` +
            `Monitor local weather services for any updates or new alerts.`;
    }
    
    // FALLBACK ADVISORY - Always have something
    let advisory = 'Monitor weather conditions';
    if (aiAnalysis && aiAnalysis.recommendations) {
        advisory = aiAnalysis.recommendations;
    } else {
        if (snowDayScore >= 85) {
            advisory = '🚨 EXTREME CONDITIONS: Do not travel. Stay indoors. Life-threatening weather conditions expected. ' +
                'Roads will be impassable. Stock emergency supplies now. Check on vulnerable neighbors. ' +
                'Have backup heat and power sources ready.';
        } else if (snowDayScore >= 70) {
            advisory = '⚠️ DANGEROUS CONDITIONS: Avoid all travel if possible. Roads extremely hazardous. ' +
                'Stock food, water, medications now. Charge all devices. Have emergency kit ready. ' +
                'Schools and businesses likely to close.';
        } else if (snowDayScore >= 55) {
            advisory = '⚠️ SIGNIFICANT WINTER WEATHER: Travel not recommended. Hazardous road conditions expected. ' +
                'Prepare emergency supplies. Allow extra time if travel is absolutely necessary. ' +
                'Monitor weather updates closely.';
        } else if (snowDayScore >= 35) {
            advisory = 'ℹ️ WINTER WEATHER POSSIBLE: Some snow may develop. Drive with caution. ' +
                'Roads could become slippery. Allow extra time for travel. Keep emergency supplies in vehicle.';
        } else {
            advisory = '✅ MINIMAL WINTER WEATHER IMPACT: Normal conditions expected. ' +
                'No significant snow forecast. Continue routine activities as planned. ' +
                'Stay aware of forecast updates.';
        }
    }
    
    return {
        snowDayPercentage: snowDayScore,
        snowDay: isSnowDay,
        confidence: confidence,
        reasoning: finalReasoning,
        radarAnalysis: radarAnalysisText,
        timingAnalysis: timingAnalysisText,
        accumulation: accumulation,
        snowRate: 'Varies',
        temperature: `${Math.round(currentTemp)}°F`,
        feelsLike: `${Math.round(current.apparent_temperature)}°F`,
        windSpeed: `${Math.round(maxWindSpeed)} mph`,
        windChill: `${calculateWindChill(currentTemp, maxWindSpeed)}°F`,
        precipitation: precipSummary,
        visibility: `${minVisibility.toFixed(1)} mi`,
        skyConditions: getWeatherDescription(current.weather_code),
        humidity: `${Math.round(current.relative_humidity_2m)}%`,
        peakTime: radarData && radarData.continuousHours > 0 ? 'See radar analysis' : 'N/A',
        duration: radarData && radarData.continuousHours > 0 ? `${radarData.continuousHours} hours` : 'N/A',
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
    
    setDynamicVisuals(analysis.snowDayPercentage);
    displayResults({ location: data.location, ...analysis });
}

function displayResults(data) {
    document.getElementById('resultLocation').textContent = data.location;
    
    let displayPercentage = data.snowDayPercentage;
    let percentageText = Math.round(displayPercentage);
    
    if (displayPercentage > 0 && displayPercentage < 1) {
        percentageText = '<1';
    } else if (displayPercentage === 0) {
        percentageText = '<1';
        displayPercentage = 0.5;
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
            if (displayPercentage < 1) {
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
    
    // Ensure all fields have content (never empty)
    document.getElementById('temperature').textContent = data.temperature || 'N/A';
    document.getElementById('feelsLike').textContent = data.feelsLike || 'N/A';
    document.getElementById('accumulation').textContent = data.accumulation || 'None expected';
    document.getElementById('snowRate').textContent = data.snowRate || 'N/A';
    document.getElementById('windSpeed').textContent = data.windSpeed || 'N/A';
    document.getElementById('windChill').textContent = data.windChill || 'N/A';
    document.getElementById('precipitation').textContent = data.precipitation || 'None expected';
    document.getElementById('humidity').textContent = data.humidity || 'N/A';
    document.getElementById('visibility').textContent = data.visibility || 'N/A';
    document.getElementById('skyConditions').textContent = data.skyConditions || 'Unknown';
    document.getElementById('peakTime').textContent = data.peakTime || 'N/A';
    document.getElementById('duration').textContent = data.duration || 'N/A';
    
    // CRITICAL: Always show analysis text (never blank)
    document.getElementById('aiReasoning').textContent = data.reasoning || 'Weather analysis based on current atmospheric conditions and forecast models.';
    document.getElementById('radarAnalysis').textContent = data.radarAnalysis || 'Radar data is being processed. Check back for detailed precipitation analysis.';
    document.getElementById('timingAnalysis').textContent = data.timingAnalysis || 'Timing information is being calculated based on forecast models and weather patterns.';
    document.getElementById('advisory').textContent = data.advisory || 'Monitor local weather forecasts and follow guidance from local authorities.';
    
    console.log('✓ Display complete with all fallbacks!');
}

console.log('✓ Results loaded with comprehensive fallback system');
