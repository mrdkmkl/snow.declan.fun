// ═══════════════════════════════════════════════════════════════════
// SNOW DAY PREDICTOR - COMPLETE SCRIPT
// AI-Enhanced Weather Analysis with Smart Geocoding
// ═══════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════
const GROQ_API_KEY = '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';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODELS = [
    'llama-3.3-70b-versatile',
    'llama-3.1-70b-versatile',
    'mixtral-8x7b-32768',
    'llama-3.1-8b-instant'
];

// ═══════════════════════════════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════════════════════════════
let currentModelIndex = 0;
let currentRegion = 'us'; // 'us' or 'global'
let autocompleteCache = {};
let autocompleteTimeout = null;
let selectedSuggestionIndex = -1;
let currentSuggestions = [];
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000;

// ═══════════════════════════════════════════════════════════════════
// US STATE CODES MAPPING
// ═══════════════════════════════════════════════════════════════════
const STATE_CODES = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
};

const STATE_CODE_TO_NAME = Object.fromEntries(
    Object.entries(STATE_CODES).map(([name, code]) => [code, name])
);

function getStateCode(stateName) {
    return STATE_CODES[stateName] || '';
}

function getStateName(stateCode) {
    return STATE_CODE_TO_NAME[stateCode.toUpperCase()] || '';
}

// ═══════════════════════════════════════════════════════════════════
// REGION TOGGLE - Simple & Integrated
// ═══════════════════════════════════════════════════════════════════
function toggleRegion() {
    currentRegion = currentRegion === 'us' ? 'global' : 'us';
    
    const toggleBtn = document.getElementById('regionToggle');
    const toggleUS = document.getElementById('toggleUS');
    const toggleGlobal = document.getElementById('toggleGlobal');
    const hintText = document.getElementById('hintText');
    
    if (currentRegion === 'global') {
        toggleBtn.classList.add('global');
        toggleUS.classList.remove('active');
        toggleGlobal.classList.add('active');
        hintText.textContent = 'Try: "London, UK" or "Tokyo, Japan"';
    } else {
        toggleBtn.classList.remove('global');
        toggleUS.classList.add('active');
        toggleGlobal.classList.remove('active');
        hintText.textContent = 'Try: "Boston, MA" or "Chicago"';
    }
    
    document.getElementById('location').value = '';
    document.getElementById('autocompleteSuggestion').textContent = '';
    document.getElementById('autocompleteDropdown').classList.remove('show');
    
    console.log('Region:', currentRegion);
}

// ═══════════════════════════════════════════════════════════════════
// SMART GEOCODING - Handles "Austin Nevada" Correctly
// ═══════════════════════════════════════════════════════════════════
async function getCoordinates(location) {
    console.log(`Smart geocoding: "${location}" (${currentRegion})`);
    
    // Parse input
    const parts = location.split(',').map(p => p.trim());
    const cityName = parts[0];
    const stateOrCountry = parts[1] || '';
    
    try {
        // Fetch results
        let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=30&language=en&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results || data.results.length === 0) {
            throw new Error(`Location "${location}" not found`);
        }
        
        console.log(`Found ${data.results.length} results, filtering...`);
        
        // SMART MATCHING ALGORITHM
        let matches = [];
        
        for (const result of data.results) {
            let score = 0;
            
            // STEP 1: Region filter
            const isUS = result.country_code === 'US';
            if (currentRegion === 'us' && !isUS) continue;
            if (currentRegion === 'global' && isUS) continue;
            
            // STEP 2: City name exact match
            const cityExactMatch = result.name.toLowerCase() === cityName.toLowerCase();
            if (!cityExactMatch) {
                // Allow partial match but lower score
                if (result.name.toLowerCase().includes(cityName.toLowerCase())) {
                    score += 30;
                } else {
                    continue; // Skip if no match
                }
            } else {
                score += 100;
            }
            
            // STEP 3: State/Country matching (if provided)
            if (stateOrCountry) {
                const targetLower = stateOrCountry.toLowerCase();
                const admin1 = result.admin1 || '';
                const country = result.country || '';
                
                // Check state code (e.g., "NV" for Nevada)
                if (isUS) {
                    const stateCode = getStateCode(admin1);
                    if (stateCode === stateOrCountry.toUpperCase()) {
                        score += 100; // Perfect match
                    }
                    
                    // Expand state code to full name (e.g., "Nevada" from "NV")
                    const expandedState = getStateName(stateOrCountry);
                    if (expandedState && admin1.toLowerCase() === expandedState.toLowerCase()) {
                        score += 100;
                    }
                }
                
                // Exact admin1/country match
                if (admin1.toLowerCase() === targetLower || country.toLowerCase() === targetLower) {
                    score += 100;
                } else if (admin1.toLowerCase().includes(targetLower) || country.toLowerCase().includes(targetLower)) {
                    score += 50;
                }
            }
            
            // STEP 4: Population bonus (prefer major cities)
            if (result.population) {
                score += Math.min(result.population / 50000, 30);
            }
            
            matches.push({ result, score });
        }
        
        if (matches.length === 0) {
            const regionMsg = currentRegion === 'us' ? 'United States' : 'outside United States';
            throw new Error(`No matches for "${location}" in ${regionMsg}`);
        }
        
        // Sort by score
        matches.sort((a, b) => b.score - a.score);
        
        const bestMatch = matches[0].result;
        console.log(`✓ Best: ${bestMatch.name}, ${bestMatch.admin1}, ${bestMatch.country} (score: ${matches[0].score})`);
        
        return {
            lat: bestMatch.latitude,
            lon: bestMatch.longitude,
            name: bestMatch.name,
            country: bestMatch.country,
            state: bestMatch.admin1 || ''
        };
        
    } catch (error) {
        if (error.message.includes('not found') || error.message.includes('No matches')) {
            throw error;
        }
        throw new Error(`Unable to find location: ${error.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════
// SMART AUTOCOMPLETE - Better Filtering
// ═══════════════════════════════════════════════════════════════════
async function fetchLocationSuggestions(query) {
    if (query.length < 2) return [];
    
    const cacheKey = `${currentRegion}-${query.toLowerCase()}`;
    if (autocompleteCache[cacheKey]) {
        return autocompleteCache[cacheKey];
    }
    
    try {
        const parts = query.split(',').map(p => p.trim());
        const cityQuery = parts[0];
        const stateQuery = parts[1] || '';
        
        let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityQuery)}&count=30&language=en&format=json`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (!data.results) return [];
        
        // Score and filter results
        let scored = data.results.map(result => {
            let score = 0;
            
            // Region filter
            const isUS = result.country_code === 'US';
            if (currentRegion === 'us' && !isUS) return null;
            if (currentRegion === 'global' && isUS) return null;
            
            // City matching
            const cityLower = result.name.toLowerCase();
            const queryLower = cityQuery.toLowerCase();
            
            if (cityLower === queryLower) {
                score += 100;
            } else if (cityLower.startsWith(queryLower)) {
                score += 80;
            } else if (cityLower.includes(queryLower)) {
                score += 40;
            } else {
                return null;
            }
            
            // State matching
            if (stateQuery) {
                const admin1 = (result.admin1 || '').toLowerCase();
                const stateLower = stateQuery.toLowerCase();
                
                if (isUS) {
                    const stateCode = getStateCode(result.admin1);
                    if (stateCode === stateQuery.toUpperCase()) {
                        score += 80;
                    }
                }
                
                if (admin1.includes(stateLower)) {
                    score += 60;
                }
            }
            
            // Population bonus
            if (result.population) {
                score += Math.min(result.population / 100000, 20);
            }
            
            return { result, score };
        }).filter(item => item !== null);
        
        scored.sort((a, b) => b.score - a.score);
        
        const suggestions = scored.slice(0, 10).map(item => ({
            name: item.result.name,
            admin1: item.result.admin1 || '',
            country: item.result.country,
            countryCode: item.result.country_code,
            lat: item.result.latitude,
            lon: item.result.longitude,
            displayName: `${item.result.name}${item.result.admin1 ? ', ' + item.result.admin1 : ''}, ${item.result.country}`
        }));
        
        autocompleteCache[cacheKey] = suggestions;
        return suggestions;
    } catch (error) {
        console.error('Autocomplete error:', error);
        return [];
    }
}

function updateAutocompleteSuggestion(userInput, suggestions) {
    const suggestionEl = document.getElementById('autocompleteSuggestion');
    
    if (suggestions.length === 0 || !userInput) {
        suggestionEl.textContent = '';
        return;
    }
    
    const firstSuggestion = suggestions[0].displayName;
    if (firstSuggestion.toLowerCase().startsWith(userInput.toLowerCase())) {
        const remainingText = firstSuggestion.substring(userInput.length);
        suggestionEl.textContent = userInput + remainingText;
    } else {
        suggestionEl.textContent = '';
    }
}

function showAutocompleteDropdown(suggestions) {
    const dropdown = document.getElementById('autocompleteDropdown');
    
    if (suggestions.length === 0) {
        dropdown.classList.remove('show');
        return;
    }
    
    currentSuggestions = suggestions;
    selectedSuggestionIndex = -1;
    
    dropdown.innerHTML = suggestions.map((suggestion, index) => `
        <div class="autocomplete-item" data-index="${index}" onclick="selectSuggestion(${index})">
            <div class="autocomplete-item-name">${suggestion.name}</div>
            <div class="autocomplete-item-details">${suggestion.admin1 ? suggestion.admin1 + ', ' : ''}${suggestion.country}</div>
        </div>
    `).join('');
    
    dropdown.classList.add('show');
}

function selectSuggestion(index) {
    if (index < 0 || index >= currentSuggestions.length) return;
    
    const suggestion = currentSuggestions[index];
    document.getElementById('location').value = suggestion.displayName;
    document.getElementById('autocompleteSuggestion').textContent = '';
    document.getElementById('autocompleteDropdown').classList.remove('show');
    
    analyzeSnowDay();
}

function highlightSuggestion(index) {
    const items = document.querySelectorAll('.autocomplete-item');
    items.forEach((item, i) => {
        item.classList.toggle('selected', i === index);
    });
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER DATA
// ═══════════════════════════════════════════════════════════════════
async function getWeatherData(lat, lon) {
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,cloud_cover,wind_speed_10m,wind_gusts_10m',
        hourly: 'temperature_2m,relative_humidity_2m,precipitation_probability,precipitation,weather_code,visibility,wind_speed_10m,wind_gusts_10m,snowfall,cloud_cover',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,snowfall_sum',
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        timezone: 'auto',
        forecast_days: 3
    });
    
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);
    if (!response.ok) throw new Error('Weather API error');
    return await response.json();
}

async function getWeatherAlerts(lat, lon) {
    if (currentRegion === 'global') {
        console.log('Global mode - skipping alerts');
        return [];
    }
    
    try {
        const response = await fetch(
            `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
            { headers: { 'User-Agent': 'SnowDayPredictor/1.0' } }
        );
        if (!response.ok) return [];
        const data = await response.json();
        return data.features || [];
    } catch (error) {
        return [];
    }
}

function analyzeRadarData(hourly) {
    const radarData = {
        precipitationIntensity: 'none',
        movementPattern: 'static',
        coverage: 0,
        intensityTrend: 'stable',
        snowBands: [],
        precipitationRate: 0,
        continuousHours: 0
    };
    
    let precipHours = 0, totalPrecip = 0, consecutiveSnow = 0, maxConsecutive = 0;
    
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
            consecutiveSnow++;
            radarData.snowBands.push({ hour: i, intensity: snow, probability: precipProb });
        } else {
            if (consecutiveSnow > maxConsecutive) maxConsecutive = consecutiveSnow;
            consecutiveSnow = 0;
        }
    }
    
    radarData.continuousHours = maxConsecutive;
    radarData.precipitationRate = precipHours > 0 ? totalPrecip / precipHours : 0;
    
    if (radarData.precipitationRate >= 0.5) radarData.precipitationIntensity = 'heavy';
    else if (radarData.precipitationRate >= 0.2) radarData.precipitationIntensity = 'moderate';
    else if (radarData.precipitationRate > 0) radarData.precipitationIntensity = 'light';
    
    if (maxConsecutive >= 12) radarData.movementPattern = 'slow-moving system';
    else if (maxConsecutive >= 6) radarData.movementPattern = 'steady progression';
    else if (maxConsecutive > 0) radarData.movementPattern = 'fast-moving';
    
    const firstHalf = hourly.snowfall.slice(0, 12).reduce((sum, val) => sum + (val || 0), 0);
    const secondHalf = hourly.snowfall.slice(12, 24).reduce((sum, val) => sum + (val || 0), 0);
    
    if (secondHalf > firstHalf * 1.5) radarData.intensityTrend = 'intensifying';
    else if (secondHalf < firstHalf * 0.5) radarData.intensityTrend = 'weakening';
    
    return radarData;
}

function analyzeWeatherAlerts(alerts) {
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
    
    if (!alerts || alerts.length === 0) return alertAnalysis;
    
    alerts.forEach(alert => {
        const event = alert.properties.event.toLowerCase();
        alertAnalysis.types.push(alert.properties.event);
        
        if (event.includes('blizzard warning')) {
            alertAnalysis.hasBlizzardWarning = true;
            alertAnalysis.impactScore += 42;
            alertAnalysis.winterAlerts.push({ type: 'Blizzard Warning', severity: 'Extreme' });
        } else if (event.includes('winter storm warning')) {
            alertAnalysis.hasWinterStormWarning = true;
            alertAnalysis.impactScore += 34;
            alertAnalysis.winterAlerts.push({ type: 'Winter Storm Warning', severity: 'Severe' });
        } else if (event.includes('winter weather advisory')) {
            alertAnalysis.hasWinterWeatherAdvisory = true;
            alertAnalysis.impactScore += 17;
            alertAnalysis.winterAlerts.push({ type: 'Winter Weather Advisory', severity: 'Moderate' });
        }
    });
    
    return alertAnalysis;
}

async function getAIWeatherAnalysis(weatherData, locationName, alerts, radarData, alertAnalysis) {
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    
    const snowData = hourly.snowfall.slice(0, 24).reduce((sum, val) => sum + (val || 0), 0);
    const avgTemp = hourly.temperature_2m.slice(0, 24).reduce((sum, val) => sum + val, 0) / 24;
    const maxWind = Math.max(...hourly.wind_speed_10m.slice(0, 24));
    
    const alertSummary = alertAnalysis.winterAlerts.length > 0 ? 
        alertAnalysis.winterAlerts.map(a => a.type).join(', ') : 'None';
    
    const prompt = `Weather for ${locationName}:
Temp: ${current.temperature_2m}°F, Avg ${Math.round(avgTemp)}°F
Snow: ${snowData.toFixed(1)}", Wind: ${Math.round(maxWind)}mph
Radar: ${radarData.precipitationIntensity}
Alerts: ${alertSummary}

JSON only:
{
  "snowDayProbability": 75,
  "confidence": "high",
  "keyFactors": ["Heavy snow", "Strong winds"],
  "recommendations": "Avoid travel"
}`;

    for (let i = currentModelIndex; i < GROQ_MODELS.length; i++) {
        try {
            const response = await fetch(GROQ_API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: GROQ_MODELS[i],
                    messages: [
                        { role: 'system', content: 'Meteorologist. JSON only.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.3,
                    max_tokens: 400
                })
            });

            if (!response.ok) {
                currentModelIndex = i + 1;
                continue;
            }

            const data = await response.json();
            const cleanResponse = data.choices[0].message.content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleanResponse);
        } catch (error) {
            if (i === GROQ_MODELS.length - 1) return null;
        }
    }
    return null;
}

// ═══════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════════
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    if (errorText) errorText.textContent = message;
    if (errorMsg) errorMsg.classList.add('show');
}

function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    if (errorMsg) errorMsg.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════════
async function analyzeSnowDay() {
    const location = document.getElementById('location').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    if (!location) {
        showError('Please enter a location');
        return;
    }
    
    // Rate limiting
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        showError('Please wait before searching again');
        return;
    }
    lastRequestTime = now;
    
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner"></span><span>Analyzing...</span>';
    hideError();
    
    try {
        const locationData = await getCoordinates(location);
        const weatherData = await getWeatherData(locationData.lat, locationData.lon);
        const alerts = await getWeatherAlerts(locationData.lat, locationData.lon);
        const radarData = analyzeRadarData(weatherData.hourly);
        const alertAnalysis = analyzeWeatherAlerts(alerts);
        const aiAnalysis = await getAIWeatherAnalysis(weatherData, location, alerts, radarData, alertAnalysis);
        
        const resultData = {
            location: `${locationData.name}${locationData.state ? ', ' + locationData.state : ''}, ${locationData.country}`,
            weatherData: weatherData,
            alerts: alerts,
            radarData: radarData,
            alertAnalysis: alertAnalysis,
            aiAnalysis: aiAnalysis,
            timestamp: new Date().toISOString()
        };
        
        sessionStorage.setItem('snowDayResults', JSON.stringify(resultData));
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('Error:', error);
        showError(error.message || 'Failed to analyze weather');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyze</span><span class="btn-icon">→</span>';
    }
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', function() {
    const locationInput = document.getElementById('location');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const toggleBtn = document.getElementById('regionToggle');
    const toggleUS = document.getElementById('toggleUS');
    
    // Set initial state
    if (toggleUS) toggleUS.classList.add('active');
    
    // Attach listeners
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeSnowDay);
    if (toggleBtn) toggleBtn.addEventListener('click', toggleRegion);
    
    if (locationInput) {
        locationInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            if (autocompleteTimeout) clearTimeout(autocompleteTimeout);
            
            if (!query) {
                document.getElementById('autocompleteSuggestion').textContent = '';
                document.getElementById('autocompleteDropdown').classList.remove('show');
                return;
            }
            
            autocompleteTimeout = setTimeout(async () => {
                const suggestions = await fetchLocationSuggestions(query);
                updateAutocompleteSuggestion(query, suggestions);
                showAutocompleteDropdown(suggestions);
            }, 300);
        });
        
        locationInput.addEventListener('keydown', function(e) {
            const dropdown = document.getElementById('autocompleteDropdown');
            const isDropdownVisible = dropdown.classList.contains('show');
            
            if (e.key === 'Enter') {
                e.preventDefault();
                if (isDropdownVisible && selectedSuggestionIndex >= 0) {
                    selectSuggestion(selectedSuggestionIndex);
                } else if (isDropdownVisible && currentSuggestions.length > 0) {
                    selectSuggestion(0);
                } else {
                    analyzeSnowDay();
                }
            } else if (e.key === 'Tab') {
                const suggestionText = document.getElementById('autocompleteSuggestion').textContent;
                if (suggestionText && isDropdownVisible) {
                    e.preventDefault();
                    locationInput.value = suggestionText;
                    document.getElementById('autocompleteSuggestion').textContent = '';
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (isDropdownVisible && currentSuggestions.length > 0) {
                    selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, currentSuggestions.length - 1);
                    highlightSuggestion(selectedSuggestionIndex);
                    if (selectedSuggestionIndex >= 0) {
                        locationInput.value = currentSuggestions[selectedSuggestionIndex].displayName;
                    }
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (isDropdownVisible && selectedSuggestionIndex > 0) {
                    selectedSuggestionIndex--;
                    highlightSuggestion(selectedSuggestionIndex);
                    locationInput.value = currentSuggestions[selectedSuggestionIndex].displayName;
                }
            } else if (e.key === 'Escape') {
                dropdown.classList.remove('show');
                document.getElementById('autocompleteSuggestion').textContent = '';
            }
        });
        
        locationInput.focus();
    }
    
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.autocomplete-wrapper')) {
            const dropdown = document.getElementById('autocompleteDropdown');
            if (dropdown) dropdown.classList.remove('show');
        }
    });
});

console.log('✓ Script loaded - Smart geocoding enabled');
