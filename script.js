// ═══════════════════════════════════════════════════════════════════
// SNOW DAY PREDICTOR - INPUT PAGE SCRIPT
// Free weather analysis using Open-Meteo API (no API keys required)
// ═══════════════════════════════════════════════════════════════════

// Event listener for Enter key
document.getElementById('location').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        analyzeSnowDay();
    }
});

// ═══════════════════════════════════════════════════════════════════
// GEOCODING - Convert location name to coordinates
// ═══════════════════════════════════════════════════════════════════
async function getCoordinates(location) {
    console.log(`Geocoding location: ${location}`);
    
    const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(location)}&count=1&language=en&format=json`
    );
    
    if (!response.ok) {
        throw new Error('Geocoding service unavailable');
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
        throw new Error('Location not found. Try: "City, State" or "City, Country"');
    }
    
    const result = {
        lat: data.results[0].latitude,
        lon: data.results[0].longitude,
        name: data.results[0].name,
        country: data.results[0].country,
        state: data.results[0].admin1 || ''
    };
    
    console.log('Geocoding successful:', result);
    return result;
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER DATA - Fetch comprehensive forecast data
// ═══════════════════════════════════════════════════════════════════
async function getWeatherData(lat, lon) {
    console.log(`Fetching weather data for coordinates: ${lat}, ${lon}`);
    
    // Request ALL available parameters from Open-Meteo API
    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        // Current conditions
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
        // Hourly forecast (72 hours)
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
        // Daily forecast
        daily: [
            'weather_code',
            'temperature_2m_max',
            'temperature_2m_min',
            'precipitation_sum',
            'snowfall_sum'
        ].join(','),
        // Units
        temperature_unit: 'fahrenheit',
        wind_speed_unit: 'mph',
        precipitation_unit: 'inch',
        // Timezone
        timezone: 'auto',
        // Forecast days
        forecast_days: 3
    });
    
    const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?${params.toString()}`
    );
    
    if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('Weather data received successfully');
    console.log('Current conditions:', data.current);
    console.log('Hourly forecast hours:', data.hourly.time.length);
    
    return data;
}

// ═══════════════════════════════════════════════════════════════════
// WEATHER ALERTS - Fetch active alerts (US only - weather.gov)
// ═══════════════════════════════════════════════════════════════════
async function getWeatherAlerts(lat, lon) {
    console.log('Checking for weather alerts...');
    
    try {
        // Weather.gov API only works for US locations
        const response = await fetch(
            `https://api.weather.gov/alerts/active?point=${lat},${lon}`,
            {
                headers: {
                    'User-Agent': 'SnowDayPredictor/1.0'
                }
            }
        );
        
        if (!response.ok) {
            console.log('No alerts available (likely outside US coverage area)');
            return [];
        }
        
        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            console.log(`Found ${data.features.length} active alerts`);
            data.features.forEach(alert => {
                console.log(`- ${alert.properties.event}`);
            });
            return data.features;
        } else {
            console.log('No active alerts for this location');
            return [];
        }
    } catch (error) {
        console.log('Alert service unavailable or location outside US:', error.message);
        return [];
    }
}

// ═══════════════════════════════════════════════════════════════════
// ERROR DISPLAY
// ═══════════════════════════════════════════════════════════════════
function showError(message) {
    const errorMsg = document.getElementById('errorMsg');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorMsg.classList.add('show');
    console.error('Error:', message);
}

function hideError() {
    const errorMsg = document.getElementById('errorMsg');
    errorMsg.classList.remove('show');
}

// ═══════════════════════════════════════════════════════════════════
// MAIN ANALYSIS FUNCTION
// ═══════════════════════════════════════════════════════════════════
async function analyzeSnowDay() {
    const location = document.getElementById('location').value.trim();
    const analyzeBtn = document.getElementById('analyzeBtn');
    
    // Validate input
    if (!location) {
        showError('Please enter a location');
        return;
    }
    
    // Show loading state
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner"></span><span>Analyzing...</span>';
    hideError();
    
    console.log('=== STARTING WEATHER ANALYSIS ===');
    console.log('Location input:', location);
    
    try {
        // STEP 1: Geocode location
        console.log('Step 1: Geocoding location...');
        const locationData = await getCoordinates(location);
        console.log('✓ Geocoding complete');
        
        // STEP 2: Fetch weather data
        console.log('Step 2: Fetching weather forecast...');
        const weatherData = await getWeatherData(locationData.lat, locationData.lon);
        console.log('✓ Weather data retrieved');
        
        // STEP 3: Fetch weather alerts (optional, US only)
        console.log('Step 3: Checking for weather alerts...');
        const alerts = await getWeatherAlerts(locationData.lat, locationData.lon);
        console.log('✓ Alert check complete');
        
        // STEP 4: Package data for results page
        const resultData = {
            location: `${locationData.name}${locationData.state ? ', ' + locationData.state : ''}, ${locationData.country}`,
            weatherData: weatherData,
            alerts: alerts,
            timestamp: new Date().toISOString()
        };
        
        console.log('=== DATA COLLECTION COMPLETE ===');
        console.log('Location:', resultData.location);
        console.log('Current temp:', weatherData.current.temperature_2m + '°F');
        console.log('Forecast hours:', weatherData.hourly.time.length);
        console.log('Active alerts:', alerts.length);
        
        // STEP 5: Store data in sessionStorage
        sessionStorage.setItem('snowDayResults', JSON.stringify(resultData));
        console.log('✓ Data stored in session');
        
        // STEP 6: Navigate to results page
        console.log('Navigating to results page...');
        window.location.href = 'results.html';
        
    } catch (error) {
        console.error('=== ANALYSIS FAILED ===');
        console.error('Error type:', error.name);
        console.error('Error message:', error.message);
        console.error('Stack trace:', error.stack);
        
        // User-friendly error messages
        let errorMessage = 'Failed to analyze weather. ';
        
        if (error.message.includes('Location not found')) {
            errorMessage = 'Location not found. Try entering: "City, State" or "City, Country"';
        } else if (error.message.includes('Geocoding')) {
            errorMessage = 'Unable to find location. Please check spelling and try again.';
        } else if (error.message.includes('Weather API')) {
            errorMessage = 'Weather service temporarily unavailable. Please try again in a moment.';
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
            errorMessage = 'Network error. Please check your internet connection.';
        } else {
            errorMessage += error.message;
        }
        
        showError(errorMessage);
        
        // Reset button
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyze Weather</span><span class="btn-icon">🔍</span>';
    }
}

// ═══════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════
console.log('Snow Day Predictor initialized');
console.log('Free weather data provided by Open-Meteo.com');
console.log('Weather alerts provided by Weather.gov (US only)');

// Auto-focus on input field when page loads
window.addEventListener('DOMContentLoaded', function() {
    document.getElementById('location').focus();
    console.log('Page loaded and ready for input');
});

// Clear error when user starts typing
document.getElementById('location').addEventListener('input', function() {
    if (this.value.length > 0) {
        hideError();
    }
});

// ═══════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════

// Detect if browser supports sessionStorage
function checkStorageSupport() {
    try {
        const test = '__storage_test__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
    } catch(e) {
        console.error('SessionStorage not available:', e);
        return false;
    }
}

// Check storage support on load
if (!checkStorageSupport()) {
    console.warn('Browser storage not available - results page may not work');
}

// Handle back button - clear old data
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        // Page was loaded from back/forward cache
        console.log('Page restored from cache');
        hideError();
        const analyzeBtn = document.getElementById('analyzeBtn');
        analyzeBtn.disabled = false;
        analyzeBtn.innerHTML = '<span class="btn-text">Analyze Weather</span><span class="btn-icon">🔍</span>';
    }
});

// ═══════════════════════════════════════════════════════════════════
// DEBUG MODE (Enable by adding ?debug=1 to URL)
// ═══════════════════════════════════════════════════════════════════
const urlParams = new URLSearchParams(window.location.search);
const debugMode = urlParams.get('debug') === '1';

if (debugMode) {
    console.log('🐛 DEBUG MODE ENABLED');
    
    // Add test button
    const testBtn = document.createElement('button');
    testBtn.textContent = 'Test with Boston';
    testBtn.style.marginTop = '1rem';
    testBtn.onclick = function() {
        document.getElementById('location').value = 'Boston, MA';
        analyzeSnowDay();
    };
    document.querySelector('.card').appendChild(testBtn);
    
    // Log all fetch requests
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
        console.log('🌐 Fetch request:', args[0]);
        const response = await originalFetch.apply(this, args);
        console.log('✓ Fetch response:', response.status, response.statusText);
        return response;
    };
}

// ═══════════════════════════════════════════════════════════════════
// EXAMPLE LOCATIONS (for testing)
// ═══════════════════════════════════════════════════════════════════
const exampleLocations = [
    'Boston, MA',
    'Denver, CO',
    'Chicago, IL',
    'Buffalo, NY',
    'Minneapolis, MN',
    'Portland, ME',
    'Salt Lake City, UT',
    'Burlington, VT'
];

// Log example locations in debug mode
if (debugMode) {
    console.log('Example locations for testing:');
    exampleLocations.forEach(loc => console.log(`  - ${loc}`));
}

// ═══════════════════════════════════════════════════════════════════
// PERFORMANCE MONITORING
// ═══════════════════════════════════════════════════════════════════
let performanceData = {
    startTime: null,
    geocodeTime: null,
    weatherTime: null,
    alertTime: null,
    totalTime: null
};

// Add timing to async functions for performance monitoring
const originalAnalyzeSnowDay = analyzeSnowDay;
analyzeSnowDay = async function() {
    performanceData.startTime = performance.now();
    await originalAnalyzeSnowDay();
};

// Log performance data in console
if (debugMode) {
    window.addEventListener('beforeunload', function() {
        if (performanceData.startTime) {
            performanceData.totalTime = performance.now() - performanceData.startTime;
            console.log('⏱️ Performance Data:');
            console.log(`Total time: ${performanceData.totalTime.toFixed(0)}ms`);
        }
    });
}

// ═══════════════════════════════════════════════════════════════════
// ERROR RECOVERY
// ═══════════════════════════════════════════════════════════════════

// Global error handler
window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
    if (event.error && event.error.message) {
        showError('An unexpected error occurred. Please refresh and try again.');
    }
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showError('Connection error. Please check your internet and try again.');
});

// ═══════════════════════════════════════════════════════════════════
// ANALYTICS & LOGGING (Optional - can be removed)
// ═══════════════════════════════════════════════════════════════════

function logSearch(location, success) {
    // This is where you could add analytics tracking
    // For now, just console logging
    console.log('Search logged:', {
        location: location,
        success: success,
        timestamp: new Date().toISOString()
    });
}

// ═══════════════════════════════════════════════════════════════════
// KEYBOARD SHORTCUTS
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('keydown', function(event) {
    // Ctrl/Cmd + K to focus search
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        document.getElementById('location').focus();
        document.getElementById('location').select();
    }
    
    // Escape to clear input
    if (event.key === 'Escape') {
        document.getElementById('location').value = '';
        hideError();
    }
});

// ═══════════════════════════════════════════════════════════════════
// ACCESSIBILITY ENHANCEMENTS
// ═══════════════════════════════════════════════════════════════════

// Announce to screen readers when analysis starts
function announceToScreenReader(message) {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', 'polite');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// Add screen reader only class to CSS if not present
if (!document.querySelector('.sr-only')) {
    const style = document.createElement('style');
    style.textContent = `
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
    `;
    document.head.appendChild(style);
}

// ═══════════════════════════════════════════════════════════════════
// FORM VALIDATION
// ═══════════════════════════════════════════════════════════════════

function validateLocation(location) {
    // Remove extra whitespace
    location = location.trim();
    
    // Check minimum length
    if (location.length < 2) {
        return { valid: false, message: 'Location name too short' };
    }
    
    // Check maximum length
    if (location.length > 100) {
        return { valid: false, message: 'Location name too long' };
    }
    
    // Check for valid characters (letters, numbers, spaces, commas, hyphens)
    const validPattern = /^[a-zA-Z0-9\s,.\-]+$/;
    if (!validPattern.test(location)) {
        return { valid: false, message: 'Location contains invalid characters' };
    }
    
    return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════
// BROWSER COMPATIBILITY CHECKS
// ═══════════════════════════════════════════════════════════════════

function checkBrowserCompatibility() {
    const issues = [];
    
    // Check fetch API
    if (!window.fetch) {
        issues.push('Fetch API not supported');
    }
    
    // Check Promise support
    if (!window.Promise) {
        issues.push('Promises not supported');
    }
    
    // Check sessionStorage
    if (!window.sessionStorage) {
        issues.push('Session storage not supported');
    }
    
    // Check URLSearchParams
    if (!window.URLSearchParams) {
        issues.push('URLSearchParams not supported');
    }
    
    if (issues.length > 0) {
        console.warn('Browser compatibility issues:', issues);
        showError('Your browser may not be fully supported. Please use a modern browser.');
        return false;
    }
    
    return true;
}

// Run compatibility check on load
checkBrowserCompatibility();

// ═══════════════════════════════════════════════════════════════════
// RATE LIMITING (Prevent spam)
// ═══════════════════════════════════════════════════════════════════

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 seconds between requests

function checkRateLimit() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        const waitTime = Math.ceil((MIN_REQUEST_INTERVAL - (now - lastRequestTime)) / 1000);
        showError(`Please wait ${waitTime} second(s) before searching again.`);
        return false;
    }
    lastRequestTime = now;
    return true;
}

// Wrap analyzeSnowDay with rate limiting
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

console.log('✓ Script fully loaded and initialized');
console.log('Ready to analyze weather!');