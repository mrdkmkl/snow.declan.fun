// ═══════════════════════════════════════════════════════════════════
// GROQ AI CONFIGURATION - Multi-Model Fallback System
// ═══════════════════════════════════════════════════════════════════

const GROQ_API_KEY = 'APIKEYGROQ';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant'
];

let currentModelIndex = 0;

document.getElementById('location').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        analyzeSnowDay();
    }
});

// ═══════════════════════════════════════════════════════════════════
// RADAR DATA ANALYSIS - Precipitation Patterns
// ═══════════════════════════════════════════════════════════════════
function analyzeRadarData(hourly) {
    console.log('Analyzing radar/precipitation patterns...');
    
    const radarData = {
        precipitationIntensity: 'none',
        movementPattern: 'static',
        coverage: 0,
        persistentAreas: [],
        intensityTrend: 'stable',
        snowBands: [],
        precipitationRate: 0,
        continuousHours: 0
    };
    
    // Analyze precipitation intensity over time
    let precipHours = 0;
    let totalPrecip = 0;
    let snowHours = 0;
    let consecutiveSnow = 0;
    let maxConsecutive = 0;
    
    for (let i = 0; i < Math.min(48, hourly.time.length); i++) {
        const precip = hourly.precipitation[i] || 0;
        const snow = hourly.snowfall[i] || 0;
        const precipProb = hourly.precipitation_probability[i] || 0;
        
        if (precip > 0 || precipProb > 50) {
            precipHours++;
            totalPrecip += precip;
            radarData.coverage = Math.max(radarData.coverage, precipProb);
        }
        
        if (snow > 0) {
            snowHours++;
            consecutiveSnow++;
            radarData.snowBands.push({
                hour: i,
                intensity: snow,
                probability: precipProb
            });
        } else {
            if (consecutiveSnow > maxConsecutive) {
                maxConsecutive = consecutiveSnow;
            }
            consecutiveSnow = 0;
        }
    }
    
    radarData.continuousHours = maxConsecutive;
    radarData.precipitationRate = precipHours > 0 ? totalPrecip / precipHours : 0;
    
    // Determine intensity
    if (radarData.precipitationRate >= 0.5) {
        radarData.precipitationIntensity = 'heavy';
    } else if (radarData.precipitationRate >= 0.2) {
        radarData.precipitationIntensity = 'moderate';
    } else if (radarData.precipitationRate > 0) {
        radarData.precipitationIntensity = 'light';
    }
    
    // Analyze movement pattern
    if (snowHours >= 12) {
        radarData.movementPattern = 'slow-moving system';
    } else if (snowHours >= 6) {
        radarData.movementPattern = 'steady progression';
    } else if (snowHours > 0) {
        radarData.movementPattern = 'fast-moving';
    }
    
    // Intensity trend
    const firstHalfSnow = hourly.snowfall.slice(0, 12).reduce((sum, val) => sum + (val || 0), 0);
    const secondHalfSnow = hourly.snowfall.slice(12, 24).reduce((sum, val) => sum + (val || 0), 0);
    
    if (secondHalfSnow > firstHalfSnow * 1.5) {
        radarData.intensityTrend = 'intensifying';
    } else if (secondHalfSnow < firstHalfSnow * 0.5) {
        radarData.intensityTrend = 'weakening';
    }
    
    console.log('Radar analysis:', radarData);
    return radarData;
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER ALERTS ANALYSIS - NWS Alerts Parsing
// ═══════════════════════════════════════════════════════════════════
function analyzeWeatherAlerts(alerts) {
    console.log('Analyzing weather alerts...');
    
    const alertAnalysis = {
        severity: 'none',
        types: [],
        impactScore: 0,
        winterAlerts: [],
        urgency: 'none',
        hasBlizzardWarning: false,
        hasWinterStormWarning: false,
        hasWinterWeatherAdvisory: false,
        totalAlerts: alerts.length
    };
    
    if (!alerts || alerts.length === 0) {
        return alertAnalysis;
    }
    
    alerts.forEach(alert => {
        const props = alert.properties;
        const event = props.event.toLowerCase();
        const severity = props.severity || 'Minor';
        const urgency = props.urgency || 'Unknown';
        
        alertAnalysis.types.push(props.event);
        
        // Categorize winter-related alerts
        if (event.includes('blizzard warning')) {
            alertAnalysis.hasBlizzardWarning = true;
            alertAnalysis.impactScore += 30;
            alertAnalysis.winterAlerts.push({
                type: 'Blizzard Warning',
                severity: 'Extreme',
                description: props.headline || props.description
            });
        } else if (event.includes('winter storm warning')) {
            alertAnalysis.hasWinterStormWarning = true;
            alertAnalysis.impactScore += 25;
            alertAnalysis.winterAlerts.push({
                type: 'Winter Storm Warning',
                severity: 'Severe',
                description: props.headline || props.description
            });
        } else if (event.includes('ice storm warning')) {
            alertAnalysis.impactScore += 25;
            alertAnalysis.winterAlerts.push({
                type: 'Ice Storm Warning',
                severity: 'Severe',
                description: props.headline || props.description
            });
        } else if (event.includes('winter storm watch')) {
            alertAnalysis.impactScore += 15;
            alertAnalysis.winterAlerts.push({
                type: 'Winter Storm Watch',
                severity: 'Moderate',
                description: props.headline || props.description
            });
        } else if (event.includes('winter weather advisory')) {
            alertAnalysis.hasWinterWeatherAdvisory = true;
            alertAnalysis.impactScore += 12;
            alertAnalysis.winterAlerts.push({
                type: 'Winter Weather Advisory',
                severity: 'Moderate',
                description: props.headline || props.description
            });
        } else if (event.includes('snow') || event.includes('ice') || event.includes('freeze')) {
            alertAnalysis.impactScore += 8;
            alertAnalysis.winterAlerts.push({
                type: props.event,
                severity: 'Minor',
                description: props.headline || props.description
            });
        }
        
        // Set overall severity
        if (severity === 'Extreme') {
            alertAnalysis.severity = 'extreme';
            alertAnalysis.urgency = 'immediate';
        } else if (severity === 'Severe' && alertAnalysis.severity !== 'extreme') {
            alertAnalysis.severity = 'severe';
            alertAnalysis.urgency = urgency.toLowerCase();
        } else if (severity === 'Moderate' && !['extreme', 'severe'].includes(alertAnalysis.severity)) {
            alertAnalysis.severity = 'moderate';
        }
    });
    
    console.log('Alert analysis:', alertAnalysis);
    return alertAnalysis;
}

// ═══════════════════════════════════════════════════════════════════
// AI ANALYSIS - Enhanced with Radar & Alerts
// ═══════════════════════════════════════════════════════════════════
async function getAIWeatherAnalysis(weatherData, locationName, alerts, radarData, alertAnalysis) {
    console.log('Getting AI analysis with radar & alert data...');
    
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    
    // Comprehensive data summary
    const snowData = hourly.snowfall.slice(0, 24).reduce((sum, val) => sum + (val || 0), 0);
    const avgTemp = hourly.temperature_2m.slice(0, 24).reduce((sum, val) => sum + val, 0) / 24;
    const maxWind = Math.max(...hourly.wind_speed_10m.slice(0, 24));
    const minVis = Math.min(...hourly.visibility.slice(0, 24).map(v => v / 5280));
    
    // Build alert summary
    let alertSummary = 'None';
    if (alertAnalysis.winterAlerts.length > 0) {
        alertSummary = alertAnalysis.winterAlerts.map(a => a.type).join(', ');
    }
    
    // Concise but comprehensive prompt
    const prompt = `Weather analysis for ${locationName}:

CURRENT: ${current.temperature_2m}°F, ${current.wind_speed_10m}mph wind, ${current.cloud_cover}% clouds
24HR FORECAST: Avg ${Math.round(avgTemp)}°F, ${snowData.toFixed(1)}" snow, ${Math.round(maxWind)}mph wind, ${minVis.toFixed(1)}mi visibility

RADAR ANALYSIS:
- Intensity: ${radarData.precipitationIntensity}
- Pattern: ${radarData.movementPattern}
- Duration: ${radarData.continuousHours} hours continuous
- Trend: ${radarData.intensityTrend}
- Coverage: ${radarData.coverage}%

ACTIVE ALERTS: ${alertSummary}
Alert Impact Score: ${alertAnalysis.impactScore}/30

Analyze and respond with ONLY valid JSON:
{
  "snowDayProbability": 75,
  "confidence": "high",
  "isSnowDay": true,
  "keyFactors": ["Blizzard Warning issued", "Heavy snow 8+ inches", "25mph winds"],
  "totalAccumulation": "8-10 inches",
  "radarInsight": "Slow-moving storm producing sustained heavy snow",
  "alertImpact": "Blizzard Warning indicates life-threatening conditions",
  "recommendations": "Do not travel. Roads impassable."
}`;

    // Try each model
    for (let i = currentModelIndex; i < GROQ_MODELS.length; i++) {
        try {
            const model = GROQ_MODELS[i];
            console.log(`Trying model: ${model}`);
            
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        {
                            role: 'system',
                            content: 'Expert meteorologist. Factor in radar patterns and NWS alerts heavily. Respond only with valid JSON.'
                        },
                        {
                            role: 'user',
                            content: prompt
                        }
                    ],
                    temperature: 0.3,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                const error = await response.json();
                console.log(`Model ${model} failed:`, error);
                
                if (error.error && (error.error.message.includes('rate') || error.error.message.includes('tokens'))) {
                    console.log('Trying next model...');
                    currentModelIndex = i + 1;
                    continue;
                }
                throw new Error(`API error: ${response.status}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;
            
            const cleanResponse = aiResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const analysis = JSON.parse(cleanResponse);
            
            console.log(`✓ AI analysis successful with ${model}`);
            currentModelIndex = i;
            return analysis;
            
        } catch (error) {
            console.error(`Model ${GROQ_MODELS[i]} failed:`, error);
            if (i === GROQ_MODELS.length - 1) {
                console.log('All models failed, using logic-only');
                return null;
            }
        }
    }
    
    return null;
}

// ═══════════════════════════════════════════════════════════════════
// GEOCODING & WEATHER DATA
// ═══════════════════════════════════════════════════════════════════
async function getCoordinates(location) {
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) throw new Error('Geocoding service unavailable');
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('Location not found. Try: "City, State" or "City, Country"');
    }
    
    return {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country,
        state: data.results[0].admin1 || ''
    };
}

async function getWeatherData(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: [
            'temperature_2m',
            'relative_humidity_2m',
            'apparent_temperature',
            'precipitation',
            'weather_code',
            'cloud_cover',
            'wind_speed_10m',
            'wind_gusts_10m'
        ].join(','),
        hourly: [
            'temperature_2m',
            'relative_humidity_2m',
            'precipitation_probability',
            'precipitation',
            'weather_code',
            'visibility',
            'wind_speed_10m',
            'wind_gusts_10m',
            'snowfall',
            'cloud_cover'
        ].join(','),
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'snowfall_sum'
        ].join(','),
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'auto',
        forecast_days: 3
    });
    
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    );
    
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    return await response.json();
}

async function getWeatherAlerts(lat, lon) {
    try {
        const response = await fetch(
            `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
            { headers: { 'User-Agent': 'SnowDayPredictor/1.0' } }
        );
        
        if (!response.ok) return [];
        const data = await response.json();
        return data.features || [];
    } catch (error) {
        console.log('Alerts unavailable:', error.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMsg.classList.add('show');
}

function hideError() {
    document.getElementById('errorMsg').classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION - Enhanced with Radar & Alerts
// ═══════════════════════════════════════════════════════════════════
async function analyzeSnowDay() {
    const location = document.getElementById('location').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!location) {
        showError('Please enter a location');
        return;
    }
    
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner"></span><span>Finding location...</span>';
    hideError();
    
    console.log('=== STARTING COMPREHENSIVE ANALYSIS ===');
    
    try {
        // Step 1: Geocode
        const locationData = await getCoordinates(location);
        console.log('✓ Location found');
        
        // Step 2: Weather Data
        analyzeBtn.innerHTML = '<span class="spinner"></span><span>Fetching weather data...</span>';
        const weatherData = await getWeatherData(locationData.lat, locationData.lon);
        console.log('✓ Weather data retrieved');
        
        // Step 3: Alerts
        analyzeBtn.innerHTML = '<span class="spinner"></span><span>Checking NWS alerts...</span>';
        const alerts = await getWeatherAlerts(locationData.lat, locationData.lon);
        console.log(`✓ Found ${alerts.length} alerts`);
        
        // Step 4: Analyze Radar Patterns
        analyzeBtn.innerHTML = '<span class="spinner"></span><span>Analyzing radar patterns...</span>';
        const radarData = analyzeRadarData(weatherData.hourly);
        console.log('✓ Radar analysis complete');
        
        // Step 5: Analyze Alerts
        analyzeBtn.innerHTML = '<span class="spinner"></span><span>Processing alerts...</span>';
        const alertAnalysis = analyzeWeatherAlerts(alerts);
        console.log('✓ Alert analysis complete');
        
        // Step 6: AI Analysis with Radar & Alerts
        analyzeBtn.innerHTML = '<span class="spinner"></span><span>AI analyzing with radar & alerts...</span>';
        const locationName = `${locationData.name}${locationData.state ? ', ' + locationData.state : ''}, ${locationData.country}`;
        const aiAnalysis = await getAIWeatherAnalysis(weatherData, locationName, alerts, radarData, alertAnalysis);
        console.log('✓ AI analysis complete');
        
        // Package all data
        const resultData = {
            location: locationName,
            weatherData: weatherData,
            alerts: alerts,
            radarData: radarData,
            alertAnalysis: alertAnalysis,
            aiAnalysis: aiAnalysis,
            timestamp: new Date().toISOString()
        };
        
        console.log('=== ANALYSIS COMPLETE ===');
        console.log('Radar intensity:', radarData.precipitationIntensity);
        console.log('Alert impact:', alertAnalysis.impactScore);
        console.log('AI probability:', aiAnalysis?.snowDayProbability);
        
        sessionStorage.setItem('snowDayResults', JSON.stringify(resultData));
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to analyze weather');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyze Weather</span><span class="btn-icon">🔍</span>';
    }
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('location').focus();
    console.log('✓ Enhanced script loaded with radar & alerts integration');
});

document.getElementById('location').addEventListener('input', function() {
    if (this.value.length > 0) hideError();
});

// Rate limiting
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;

function checkRateLimit() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        showError('Please wait before searching again.');
        return false;
    }
    lastRequestTime = now;
    return true;
}

const originalAnalyze = analyzeSnowDay;
analyzeSnowDay = async function() {
    if (!checkRateLimit()) {
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyze Weather</span><span class="btn-icon">🔍</span>';
        return;
    }
    await originalAnalyze();
};
