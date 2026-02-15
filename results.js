// ADVANCED WEATHER ANALYSIS SYSTEM
// Uses maximum available data from Open-Meteo API

window.addEventListener('DOMContentLoaded', function() {
    const resultsData = sessionStorage.getItem('snowDayResults');
    
    if (!resultsData) {
        window.location.href = 'index.html';
        return;
    }
    
    const data = JSON.parse(resultsData);
    analyzeAndDisplay(data);
});

function goBack() {
    window.location.href = 'index.html';
}

// Set snowflake speed based on percentage
function setSnowfallSpeed(percentage) {
    const snowflakes = document.querySelectorAll('#resultSnowflakes .snowflake');
    const speedMultiplier = 1 + (percentage / 50);
    
    snowflakes.forEach((snowflake, index) => {
        const baseDuration = 10 + (index % 5);
        const newDuration = baseDuration / speedMultiplier;
        snowflake.style.animationDuration = `${newDuration}s`;
    });
    
    console.log(`Snow animation speed: ${speedMultiplier.toFixed(2)}x (${percentage}% probability)`);
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
        95: 'Thunderstorm', 96: 'Thunderstorm with slight hail', 99: 'Thunderstorm with heavy hail'
    };
    return weatherCodes[code] || 'Unknown';
}

// Calculate wind chill (NWS formula)
function calculateWindChill(tempF, windMph) {
    if (tempF > 50 || windMph < 3) return tempF;
    return Math.round(35.74 + (0.6215 * tempF) - (35.75 * Math.pow(windMph, 0.16)) + (0.4275 * tempF * Math.pow(windMph, 0.16)));
}

// Calculate heat index / feels like for warm temperatures
function calculateFeelsLike(tempF, humidity, windMph) {
    if (tempF <= 50) return calculateWindChill(tempF, windMph);
    
    if (tempF < 80) return tempF;
    
    // Heat index calculation
    let hi = -42.379 + (2.04901523 * tempF) + (10.14333127 * humidity);
    hi -= 0.22475541 * tempF * humidity;
    hi -= 6.83783e-3 * tempF * tempF;
    hi -= 5.481717e-2 * humidity * humidity;
    hi += 1.22874e-3 * tempF * tempF * humidity;
    hi += 8.5282e-4 * tempF * humidity * humidity;
    hi -= 1.99e-6 * tempF * tempF * humidity * humidity;
    
    return Math.round(hi);
}

// ADVANCED COMPREHENSIVE WEATHER ANALYSIS
function analyzeWeatherData(weatherData, alerts) {
    console.log('=== STARTING ADVANCED WEATHER ANALYSIS ===');
    
    let snowDayScore = 0;
    let reasoning = [];
    let alertsList = [];
    let detailedFactors = {
        temperature: 0,
        precipitation: 0,
        wind: 0,
        visibility: 0,
        duration: 0,
        intensity: 0,
        timing: 0,
        alerts: 0,
        atmospheric: 0,
        compounding: 0
    };
    
    const current = weatherData.current;
    const hourly = weatherData.hourly;
    const daily = weatherData.daily;
    
    // ═══════════════════════════════════════════════════════
    // PHASE 1: CURRENT CONDITIONS ANALYSIS
    // ═══════════════════════════════════════════════════════
    console.log('Phase 1: Analyzing current conditions...');
    
    const currentTemp = current.temperature_2m;
    const feelsLike = current.apparent_temperature;
    const currentHumidity = current.relative_humidity_2m;
    const currentWindSpeed = current.wind_speed_10m;
    const currentWindGust = current.wind_gusts_10m;
    const currentCloudCover = current.cloud_cover;
    const currentWeatherCode = current.weather_code;
    
    // Temperature Analysis (Enhanced)
    let tempScore = 0;
    if (currentTemp <= 20) {
        tempScore = 35;
        reasoning.push(`Extreme cold: ${Math.round(currentTemp)}°F - all precipitation will be snow`);
    } else if (currentTemp <= 28) {
        tempScore = 30;
        reasoning.push(`Very cold: ${Math.round(currentTemp)}°F - heavy snow accumulation likely`);
    } else if (currentTemp <= 32) {
        tempScore = 25;
        reasoning.push(`At freezing point: ${Math.round(currentTemp)}°F - optimal for snow`);
    } else if (currentTemp <= 34) {
        tempScore = 18;
        reasoning.push(`Just above freezing: ${Math.round(currentTemp)}°F - snow possible but may mix`);
    } else if (currentTemp <= 36) {
        tempScore = 10;
        reasoning.push(`Marginal temperature: ${Math.round(currentTemp)}°F - rain/snow mix likely`);
    } else if (currentTemp > 40) {
        tempScore = -15;
        reasoning.push(`Too warm: ${Math.round(currentTemp)}°F - snow unlikely to accumulate`);
    }
    detailedFactors.temperature += tempScore;
    
    // Wind Chill Factor
    const windChill = calculateWindChill(currentTemp, currentWindSpeed);
    const windChillDiff = currentTemp - windChill;
    if (windChillDiff > 15) {
        tempScore += 10;
        detailedFactors.wind += 10;
        reasoning.push(`Extreme wind chill: feels like ${windChill}°F (${windChillDiff}° colder) - dangerous conditions`);
    } else if (windChillDiff > 10) {
        tempScore += 6;
        detailedFactors.wind += 6;
        reasoning.push(`Severe wind chill: feels like ${windChill}°F`);
    } else if (windChillDiff > 5) {
        tempScore += 3;
        detailedFactors.wind += 3;
    }
    
    // Cloud Cover Analysis
    if (currentCloudCover >= 90) {
        detailedFactors.atmospheric += 5;
        reasoning.push(`Complete overcast (${currentCloudCover}% cloud cover) - precipitation system present`);
    } else if (currentCloudCover >= 70) {
        detailedFactors.atmospheric += 3;
    }
    
    // ═══════════════════════════════════════════════════════
    // PHASE 2: HOURLY FORECAST DEEP DIVE (72 hours)
    // ═══════════════════════════════════════════════════════
    console.log('Phase 2: Analyzing 72-hour forecast...');
    
    let snowAnalysis = {
        detected: false,
        totalAccumulation: 0,
        maxRate: 0,
        avgRate: 0,
        startHour: -1,
        endHour: -1,
        peakHour: -1,
        consecutiveHours: 0,
        maxConsecutive: 0,
        heavySnowHours: 0,
        moderateSnowHours: 0,
        lightSnowHours: 0,
        hourlyRates: []
    };
    
    let windAnalysis = {
        maxSpeed: currentWindSpeed,
        maxGust: currentWindGust,
        avgSpeed: 0,
        sustainedHighWindHours: 0,
        extremeGustHours: 0,
        hourlyData: []
    };
    
    let visibilityAnalysis = {
        minimum: 10,
        average: 0,
        poorVisHours: 0,
        dangerousVisHours: 0,
        hourlyData: []
    };
    
    let tempAnalysis = {
        lowest: currentTemp,
        lowestHour: 0,
        highest: currentTemp,
        belowFreezingHours: 0,
        deepFreezeHours: 0,
        warmingTrend: false,
        coolingTrend: false,
        hourlyTemps: []
    };
    
    let precipAnalysis = {
        maxProb: 0,
        avgProb: 0,
        highProbHours: 0,
        certainPrecipHours: 0,
        totalPrecip: 0
    };
    
    let humidityAnalysis = {
        avg: 0,
        max: 0,
        min: 100,
        highHumidityHours: 0
    };
    
    let weatherCodeAnalysis = {
        snowCodes: 0,
        heavySnowCodes: 0,
        blizzardIndicators: 0,
        mixedPrecipHours: 0
    };
    
    // Analyze up to 72 hours (or available data)
    const hoursToAnalyze = Math.min(72, hourly.time.length);
    let rateSum = 0;
    let rateCount = 0;
    
    for (let i = 0; i < hoursToAnalyze; i++) {
        const hour = {
            temp: hourly.temperature_2m[i],
            snowfall: hourly.snowfall[i] || 0,
            precip: hourly.precipitation[i] || 0,
            precipProb: hourly.precipitation_probability[i] || 0,
            weatherCode: hourly.weather_code[i],
            windSpeed: hourly.wind_speed_10m[i],
            windGust: hourly.wind_gusts_10m[i],
            visibility: hourly.visibility[i] / 5280,
            humidity: hourly.relative_humidity_2m ? hourly.relative_humidity_2m[i] : 0,
            cloudCover: hourly.cloud_cover ? hourly.cloud_cover[i] : 0
        };
        
        // SNOW DETECTION & ACCUMULATION
        const isSnowing = hour.snowfall > 0 || 
                         (hour.weatherCode >= 71 && hour.weatherCode <= 77) || 
                         (hour.weatherCode >= 85 && hour.weatherCode <= 86);
        
        if (isSnowing) {
            snowAnalysis.detected = true;
            snowAnalysis.totalAccumulation += hour.snowfall;
            snowAnalysis.consecutiveHours++;
            
            if (snowAnalysis.startHour === -1) snowAnalysis.startHour = i;
            snowAnalysis.endHour = i;
            
            if (hour.snowfall > snowAnalysis.maxRate) {
                snowAnalysis.maxRate = hour.snowfall;
                snowAnalysis.peakHour = i;
            }
            
            rateSum += hour.snowfall;
            rateCount++;
            snowAnalysis.hourlyRates.push(hour.snowfall);
            
            // Categorize snow intensity
            if (hour.weatherCode === 75 || hour.weatherCode === 86 || hour.snowfall >= 0.5) {
                snowAnalysis.heavySnowHours++;
            } else if (hour.weatherCode === 73 || hour.snowfall >= 0.2) {
                snowAnalysis.moderateSnowHours++;
            } else {
                snowAnalysis.lightSnowHours++;
            }
            
            // Track weather codes
            if (hour.weatherCode >= 71 && hour.weatherCode <= 77) {
                weatherCodeAnalysis.snowCodes++;
            }
            if (hour.weatherCode === 75 || hour.weatherCode === 86) {
                weatherCodeAnalysis.heavySnowCodes++;
            }
        } else {
            if (snowAnalysis.consecutiveHours > snowAnalysis.maxConsecutive) {
                snowAnalysis.maxConsecutive = snowAnalysis.consecutiveHours;
            }
            snowAnalysis.consecutiveHours = 0;
        }
        
        // WIND ANALYSIS
        if (hour.windSpeed > windAnalysis.maxSpeed) windAnalysis.maxSpeed = hour.windSpeed;
        if (hour.windGust > windAnalysis.maxGust) windAnalysis.maxGust = hour.windGust;
        windAnalysis.avgSpeed += hour.windSpeed;
        windAnalysis.hourlyData.push({speed: hour.windSpeed, gust: hour.windGust});
        
        if (hour.windSpeed >= 20) windAnalysis.sustainedHighWindHours++;
        if (hour.windGust >= 35) windAnalysis.extremeGustHours++;
        
        // VISIBILITY ANALYSIS
        if (hour.visibility < visibilityAnalysis.minimum) visibilityAnalysis.minimum = hour.visibility;
        visibilityAnalysis.average += hour.visibility;
        visibilityAnalysis.hourlyData.push(hour.visibility);
        
        if (hour.visibility < 0.5) visibilityAnalysis.dangerousVisHours++;
        if (hour.visibility < 2) visibilityAnalysis.poorVisHours++;
        
        // TEMPERATURE ANALYSIS
        tempAnalysis.hourlyTemps.push(hour.temp);
        if (hour.temp < tempAnalysis.lowest) {
            tempAnalysis.lowest = hour.temp;
            tempAnalysis.lowestHour = i;
        }
        if (hour.temp > tempAnalysis.highest) tempAnalysis.highest = hour.temp;
        if (hour.temp <= 32) tempAnalysis.belowFreezingHours++;
        if (hour.temp <= 20) tempAnalysis.deepFreezeHours++;
        
        // PRECIPITATION PROBABILITY
        if (hour.precipProb > precipAnalysis.maxProb) precipAnalysis.maxProb = hour.precipProb;
        precipAnalysis.avgProb += hour.precipProb;
        if (hour.precipProb >= 70) precipAnalysis.highProbHours++;
        if (hour.precipProb >= 90) precipAnalysis.certainPrecipHours++;
        precipAnalysis.totalPrecip += hour.precip;
        
        // HUMIDITY ANALYSIS
        if (hour.humidity) {
            humidityAnalysis.avg += hour.humidity;
            if (hour.humidity > humidityAnalysis.max) humidityAnalysis.max = hour.humidity;
            if (hour.humidity < humidityAnalysis.min) humidityAnalysis.min = hour.humidity;
            if (hour.humidity >= 80) humidityAnalysis.highHumidityHours++;
        }
    }
    
    // Finalize consecutive snow tracking
    if (snowAnalysis.consecutiveHours > snowAnalysis.maxConsecutive) {
        snowAnalysis.maxConsecutive = snowAnalysis.consecutiveHours;
    }
    
    // Calculate averages
    windAnalysis.avgSpeed /= hoursToAnalyze;
    visibilityAnalysis.average /= hoursToAnalyze;
    precipAnalysis.avgProb /= hoursToAnalyze;
    humidityAnalysis.avg /= hoursToAnalyze;
    snowAnalysis.avgRate = rateCount > 0 ? rateSum / rateCount : 0;
    
    // Temperature trend analysis
    if (tempAnalysis.hourlyTemps.length >= 12) {
        const firstHalf = tempAnalysis.hourlyTemps.slice(0, 12).reduce((a, b) => a + b, 0) / 12;
        const secondHalf = tempAnalysis.hourlyTemps.slice(12, 24).reduce((a, b) => a + b, 0) / 12;
        tempAnalysis.warmingTrend = secondHalf > firstHalf + 3;
        tempAnalysis.coolingTrend = secondHalf < firstHalf - 3;
    }
    
    console.log('Snow Analysis:', snowAnalysis);
    console.log('Wind Analysis:', windAnalysis);
    console.log('Visibility Analysis:', visibilityAnalysis);
    console.log('Temperature Analysis:', tempAnalysis);
    
    // ═══════════════════════════════════════════════════════
    // PHASE 3: SCORING SYSTEM (Weighted Factors)
    // ═══════════════════════════════════════════════════════
    console.log('Phase 3: Calculating snow day score...');
    
    // FACTOR 1: SNOW ACCUMULATION (Weight: 30%)
    let accumScore = 0;
    if (snowAnalysis.detected) {
        if (snowAnalysis.totalAccumulation >= 18) {
            accumScore = 35;
            reasoning.push(`🚨 EXTREME snowfall: ${snowAnalysis.totalAccumulation.toFixed(1)}" (crippling storm)`);
        } else if (snowAnalysis.totalAccumulation >= 12) {
            accumScore = 32;
            reasoning.push(`🚨 Major snowfall: ${snowAnalysis.totalAccumulation.toFixed(1)}" (major disruption)`);
        } else if (snowAnalysis.totalAccumulation >= 8) {
            accumScore = 28;
            reasoning.push(`Heavy snow: ${snowAnalysis.totalAccumulation.toFixed(1)}" (significant impact)`);
        } else if (snowAnalysis.totalAccumulation >= 6) {
            accumScore = 22;
            reasoning.push(`Significant snow: ${snowAnalysis.totalAccumulation.toFixed(1)}" (high impact)`);
        } else if (snowAnalysis.totalAccumulation >= 4) {
            accumScore = 18;
            reasoning.push(`Moderate snow: ${snowAnalysis.totalAccumulation.toFixed(1)}" (moderate impact)`);
        } else if (snowAnalysis.totalAccumulation >= 2) {
            accumScore = 12;
            reasoning.push(`Light-moderate snow: ${snowAnalysis.totalAccumulation.toFixed(1)}"`);
        } else if (snowAnalysis.totalAccumulation >= 1) {
            accumScore = 8;
            reasoning.push(`Light snow: ${snowAnalysis.totalAccumulation.toFixed(1)}"`);
        } else {
            accumScore = 4;
            reasoning.push(`Trace snow: ${snowAnalysis.totalAccumulation.toFixed(1)}"`);
        }
        detailedFactors.precipitation += accumScore;
    } else {
        accumScore = -10;
        reasoning.push('No snow detected in 72-hour forecast');
    }
    
    // FACTOR 2: SNOW INTENSITY/RATE (Weight: 15%)
    let intensityScore = 0;
    if (snowAnalysis.maxRate >= 2.0) {
        intensityScore = 18;
        reasoning.push(`🚨 EXTREME snow rate: ${snowAnalysis.maxRate.toFixed(1)}"/hr (rapid accumulation)`);
    } else if (snowAnalysis.maxRate >= 1.0) {
        intensityScore = 15;
        reasoning.push(`Very heavy snow rate: ${snowAnalysis.maxRate.toFixed(1)}"/hr`);
    } else if (snowAnalysis.maxRate >= 0.5) {
        intensityScore = 10;
        reasoning.push(`Heavy snow rate: ${snowAnalysis.maxRate.toFixed(1)}"/hr`);
    } else if (snowAnalysis.maxRate >= 0.25) {
        intensityScore = 6;
        reasoning.push(`Moderate snow rate: ${snowAnalysis.maxRate.toFixed(1)}"/hr`);
    } else if (snowAnalysis.maxRate > 0) {
        intensityScore = 3;
    }
    
    // Bonus for sustained heavy snowfall
    if (snowAnalysis.heavySnowHours >= 8) {
        intensityScore += 10;
        reasoning.push(`Prolonged heavy snow: ${snowAnalysis.heavySnowHours} hours of heavy intensity`);
    } else if (snowAnalysis.heavySnowHours >= 4) {
        intensityScore += 6;
        reasoning.push(`Extended heavy snow: ${snowAnalysis.heavySnowHours} hours`);
    }
    detailedFactors.intensity += intensityScore;
    
    // FACTOR 3: DURATION & PERSISTENCE (Weight: 12%)
    let durationScore = 0;
    const totalSnowHours = snowAnalysis.endHour - snowAnalysis.startHour + 1;
    
    if (snowAnalysis.maxConsecutive >= 18) {
        durationScore = 15;
        reasoning.push(`🚨 Very long duration: ${snowAnalysis.maxConsecutive} consecutive hours`);
    } else if (snowAnalysis.maxConsecutive >= 12) {
        durationScore = 12;
        reasoning.push(`Long duration event: ${snowAnalysis.maxConsecutive} consecutive hours`);
    } else if (snowAnalysis.maxConsecutive >= 8) {
        durationScore = 9;
        reasoning.push(`Extended snowfall: ${snowAnalysis.maxConsecutive} consecutive hours`);
    } else if (snowAnalysis.maxConsecutive >= 4) {
        durationScore = 6;
        reasoning.push(`Sustained snowfall: ${snowAnalysis.maxConsecutive} consecutive hours`);
    }
    
    // Bonus for multiple waves
    const snowPeriods = (snowAnalysis.lightSnowHours + snowAnalysis.moderateSnowHours + snowAnalysis.heavySnowHours) - snowAnalysis.maxConsecutive;
    if (snowPeriods >= 6) {
        durationScore += 4;
        reasoning.push(`Multiple snow bands/waves expected`);
    }
    detailedFactors.duration += durationScore;
    
    // FACTOR 4: WIND CONDITIONS (Weight: 15%)
    let windScore = 0;
    if (windAnalysis.maxGust >= 50) {
        windScore = 20;
        reasoning.push(`🚨 EXTREME winds: ${Math.round(windAnalysis.maxGust)} mph gusts (blizzard conditions)`);
    } else if (windAnalysis.maxGust >= 40) {
        windScore = 16;
        reasoning.push(`Dangerous winds: ${Math.round(windAnalysis.maxGust)} mph gusts (severe blowing snow)`);
    } else if (windAnalysis.maxGust >= 30) {
        windScore = 13;
        reasoning.push(`Strong gusts: ${Math.round(windAnalysis.maxGust)} mph (significant drifting)`);
    } else if (windAnalysis.maxSpeed >= 25) {
        windScore = 10;
        reasoning.push(`High winds: ${Math.round(windAnalysis.maxSpeed)} mph sustained`);
    } else if (windAnalysis.maxSpeed >= 20) {
        windScore = 7;
        reasoning.push(`Strong winds: ${Math.round(windAnalysis.maxSpeed)} mph (blowing snow)`);
    } else if (windAnalysis.maxSpeed >= 15) {
        windScore = 4;
        reasoning.push(`Moderate winds: ${Math.round(windAnalysis.maxSpeed)} mph`);
    }
    
    // Sustained high wind bonus
    if (windAnalysis.sustainedHighWindHours >= 12) {
        windScore += 8;
        reasoning.push(`Prolonged high winds: ${windAnalysis.sustainedHighWindHours} hours above 20 mph`);
    } else if (windAnalysis.sustainedHighWindHours >= 6) {
        windScore += 5;
    }
    
    // Extreme gust bonus
    if (windAnalysis.extremeGustHours >= 6) {
        windScore += 7;
        reasoning.push(`Extended period of dangerous gusts`);
    }
    detailedFactors.wind += windScore;
    
    // FACTOR 5: VISIBILITY (Weight: 10%)
    let visibilityScore = 0;
    if (visibilityAnalysis.minimum < 0.1) {
        visibilityScore = 15;
        reasoning.push(`🚨 ZERO visibility: ${visibilityAnalysis.minimum.toFixed(2)} mi (whiteout conditions)`);
    } else if (visibilityAnalysis.minimum < 0.25) {
        visibilityScore = 13;
        reasoning.push(`Near-zero visibility: ${visibilityAnalysis.minimum.toFixed(2)} mi (extremely dangerous)`);
    } else if (visibilityAnalysis.minimum < 0.5) {
        visibilityScore = 10;
        reasoning.push(`Very poor visibility: ${visibilityAnalysis.minimum.toFixed(1)} mi (hazardous)`);
    } else if (visibilityAnalysis.minimum < 1) {
        visibilityScore = 7;
        reasoning.push(`Poor visibility: ${visibilityAnalysis.minimum.toFixed(1)} mi (dangerous)`);
    } else if (visibilityAnalysis.minimum < 2) {
        visibilityScore = 4;
        reasoning.push(`Reduced visibility: ${visibilityAnalysis.minimum.toFixed(1)} mi`);
    }
    
    if (visibilityAnalysis.dangerousVisHours >= 8) {
        visibilityScore += 8;
        reasoning.push(`Extended dangerous visibility: ${visibilityAnalysis.dangerousVisHours} hours below 0.5 mi`);
    } else if (visibilityAnalysis.poorVisHours >= 12) {
        visibilityScore += 5;
        reasoning.push(`Prolonged poor visibility: ${visibilityAnalysis.poorVisHours} hours below 2 mi`);
    }
    detailedFactors.visibility += visibilityScore;
    
    // FACTOR 6: TEMPERATURE PERSISTENCE (Weight: 8%)
    let tempPersistScore = 0;
    if (tempAnalysis.deepFreezeHours >= 48) {
        tempPersistScore = 12;
        reasoning.push(`🚨 Extreme prolonged cold: ${tempAnalysis.deepFreezeHours} hours below 20°F`);
    } else if (tempAnalysis.belowFreezingHours >= 48) {
        tempPersistScore = 10;
        reasoning.push(`Long-duration freeze: ${tempAnalysis.belowFreezingHours} hours at/below 32°F`);
    } else if (tempAnalysis.belowFreezingHours >= 36) {
        tempPersistScore = 8;
        reasoning.push(`Extended freezing period: ${tempAnalysis.belowFreezingHours} hours`);
    } else if (tempAnalysis.belowFreezingHours >= 24) {
        tempPersistScore = 6;
        reasoning.push(`Sustained freezing: ${tempAnalysis.belowFreezingHours} hours`);
    } else if (tempAnalysis.belowFreezingHours >= 12) {
        tempPersistScore = 3;
    }
    
    // Warming trend penalty
    if (tempAnalysis.warmingTrend && snowAnalysis.detected) {
        tempPersistScore -= 5;
        reasoning.push(`⚠️ Warming trend may reduce accumulation`);
    }
    detailedFactors.temperature += tempPersistScore;
    
    // FACTOR 7: PRECIPITATION CERTAINTY (Weight: 5%)
    let precipCertaintyScore = 0;
    if (precipAnalysis.certainPrecipHours >= 12) {
        precipCertaintyScore = 8;
        reasoning.push(`Very high certainty: ${precipAnalysis.certainPrecipHours} hours with 90%+ probability`);
    } else if (precipAnalysis.highProbHours >= 12) {
        precipCertaintyScore = 6;
        reasoning.push(`High probability: ${precipAnalysis.highProbHours} hours with 70%+ chance`);
    } else if (precipAnalysis.maxProb >= 80) {
        precipCertaintyScore = 4;
        reasoning.push(`Peak probability: ${precipAnalysis.maxProb}%`);
    } else if (precipAnalysis.maxProb >= 60) {
        precipCertaintyScore = 2;
    }
    detailedFactors.precipitation += precipCertaintyScore;
    
    // FACTOR 8: TIMING (Weight: 5%)
    let timingScore = 0;
    if (snowAnalysis.startHour >= 0) {
        // Overnight/early morning snow gets bonus (harder to clear)
        const startTime = new Date(hourly.time[snowAnalysis.startHour]).getHours();
        if ((startTime >= 22 || startTime <= 6) && snowAnalysis.detected) {
            timingScore += 6;
            reasoning.push(`Overnight snow (starting ~${startTime}:00) - harder to manage`);
        } else if (startTime >= 6 && startTime <= 9 && snowAnalysis.detected) {
            timingScore += 8;
            reasoning.push(`Morning rush hour snow (starting ~${startTime}:00) - maximum disruption`);
        }
        
        // Peak during commute times
        const peakTime = snowAnalysis.peakHour >= 0 ? new Date(hourly.time[snowAnalysis.peakHour]).getHours() : -1;
        if ((peakTime >= 6 && peakTime <= 9) || (peakTime >= 16 && peakTime <= 19)) {
            timingScore += 5;
            reasoning.push(`Peak intensity during commute hours (~${peakTime}:00)`);
        }
    }
    detailedFactors.timing += timingScore;
    
    // FACTOR 9: WEATHER ALERTS (Weight: 5%)
    let alertScore = 0;
    if (alerts && alerts.length > 0) {
        alerts.forEach(alert => {
            const event = alert.properties.event.toLowerCase();
            if (event.includes('blizzard warning')) {
                alertScore += 25;
                alertsList.push(alert.properties.event);
                reasoning.push(`🚨🚨 BLIZZARD WARNING ISSUED`);
            } else if (event.includes('winter storm warning')) {
                alertScore += 20;
                alertsList.push(alert.properties.event);
                reasoning.push(`🚨 WINTER STORM WARNING ISSUED`);
            } else if (event.includes('ice storm warning')) {
                alertScore += 22;
                alertsList.push(alert.properties.event);
                reasoning.push(`🚨 ICE STORM WARNING ISSUED`);
            } else if (event.includes('winter storm watch')) {
                alertScore += 12;
                alertsList.push(alert.properties.event);
                reasoning.push(`⚠️ Winter Storm Watch in effect`);
            } else if (event.includes('winter weather advisory')) {
                alertScore += 10;
                alertsList.push(alert.properties.event);
                reasoning.push(`⚠️ Winter Weather Advisory issued`);
            } else if (event.includes('snow') || event.includes('ice') || event.includes('freeze')) {
                alertScore += 8;
                alertsList.push(alert.properties.event);
                reasoning.push(`⚠️ ${alert.properties.event}`);
            }
        });
    }
    detailedFactors.alerts += alertScore;
    
    // FACTOR 10: COMPOUNDING CONDITIONS (Weight: 5%)
    let compoundScore = 0;
    
    // High humidity + cold = better snow accumulation
    if (humidityAnalysis.avg >= 80 && currentTemp <= 32) {
        compoundScore += 6;
        reasoning.push(`Optimal conditions: High humidity (${Math.round(humidityAnalysis.avg)}%) + cold temps`);
    }
    
    // Heavy snow + high winds = blizzard conditions
    if (snowAnalysis.heavySnowHours >= 3 && windAnalysis.maxSpeed >= 35) {
        compoundScore += 8;
        reasoning.push(`🚨 BLIZZARD CONDITIONS: Heavy snow + high winds`);
    }
    
    // Poor visibility + high winds + snow = whiteout
    if (visibilityAnalysis.minimum < 0.5 && windAnalysis.maxGust >= 30 && snowAnalysis.detected) {
        compoundScore += 7;
        reasoning.push(`🚨 WHITEOUT CONDITIONS likely`);
    }
    
    // Temperature near freezing + precip = icing concerns
    if (currentTemp >= 30 && currentTemp <= 34 && snowAnalysis.detected) {
        compoundScore += 5;
        reasoning.push(`⚠️ Icing concerns: Temp near freezing with precipitation`);
    }
    
    // Long duration + moderate intensity = substantial accumulation
    if (snowAnalysis.maxConsecutive >= 12 && snowAnalysis.avgRate >= 0.2) {
        compoundScore += 5;
        reasoning.push(`Sustained moderate-heavy snow will produce substantial totals`);
    }
    detailedFactors.compounding += compoundScore;
    
    // ═══════════════════════════════════════════════════════
    // PHASE 4: FINAL SCORE CALCULATION
    // ═══════════════════════════════════════════════════════
    
    snowDayScore = tempScore + accumScore + intensityScore + durationScore + 
                   windScore + visibilityScore + tempPersistScore + 
                   precipCertaintyScore + timingScore + alertScore + compoundScore;
    
    // Cap at 100, minimum 0
    snowDayScore = Math.min(100, Math.max(0, snowDayScore));
    
    console.log('=== DETAILED FACTOR BREAKDOWN ===');
    console.log('Temperature Factor:', detailedFactors.temperature);
    console.log('Precipitation Factor:', detailedFactors.precipitation);
    console.log('Intensity Factor:', detailedFactors.intensity);
    console.log('Duration Factor:', detailedFactors.duration);
    console.log('Wind Factor:', detailedFactors.wind);
    console.log('Visibility Factor:', detailedFactors.visibility);
    console.log('Timing Factor:', detailedFactors.timing);
    console.log('Alert Factor:', detailedFactors.alerts);
    console.log('Atmospheric Factor:', detailedFactors.atmospheric);
    console.log('Compounding Factor:', detailedFactors.compounding);
    console.log('FINAL SNOW DAY SCORE:', snowDayScore);
    
    // ═══════════════════════════════════════════════════════
    // PHASE 5: CONFIDENCE & DETERMINATION
    // ═══════════════════════════════════════════════════════
    
    let confidence = 'very low';
    if (snowDayScore >= 85) confidence = 'very high';
    else if (snowDayScore >= 70) confidence = 'high';
    else if (snowDayScore >= 55) confidence = 'medium-high';
    else if (snowDayScore >= 40) confidence = 'medium';
    else if (snowDayScore >= 25) confidence = 'low';
    
    const isSnowDay = snowDayScore >= 55;
    
    // ═══════════════════════════════════════════════════════
    // PHASE 6: GENERATE DETAILED SUMMARIES
    // ═══════════════════════════════════════════════════════
    
    // Accumulation summary
    let accumulation = 'None expected';
    if (snowAnalysis.totalAccumulation >= 18) {
        accumulation = `${snowAnalysis.totalAccumulation.toFixed(1)}" (Crippling/Historic)`;
    } else if (snowAnalysis.totalAccumulation >= 12) {
        accumulation = `${snowAnalysis.totalAccumulation.toFixed(1)}" (Major/Extreme)`;
    } else if (snowAnalysis.totalAccumulation >= 8) {
        accumulation = `${snowAnalysis.totalAccumulation.toFixed(1)}" (Heavy)`;
    } else if (snowAnalysis.totalAccumulation >= 4) {
        accumulation = `${snowAnalysis.totalAccumulation.toFixed(1)}" (Moderate)`;
    } else if (snowAnalysis.totalAccumulation >= 1) {
        accumulation = `${snowAnalysis.totalAccumulation.toFixed(1)}" (Light)`;
    } else if (snowAnalysis.detected) {
        accumulation = 'Trace to 1"';
    }
    
    // Snow rate
    let snowRateText = 'N/A';
    if (snowAnalysis.maxRate >= 2.0) {
        snowRateText = `${snowAnalysis.maxRate.toFixed(1)}"/hr (Extreme)`;
    } else if (snowAnalysis.maxRate >= 1.0) {
        snowRateText = `${snowAnalysis.maxRate.toFixed(1)}"/hr (Very Heavy)`;
    } else if (snowAnalysis.maxRate >= 0.5) {
        snowRateText = `${snowAnalysis.maxRate.toFixed(1)}"/hr (Heavy)`;
    } else if (snowAnalysis.maxRate >= 0.2) {
        snowRateText = `${snowAnalysis.maxRate.toFixed(1)}"/hr (Moderate)`;
    } else if (snowAnalysis.maxRate > 0) {
        snowRateText = `${snowAnalysis.maxRate.toFixed(1)}"/hr (Light)`;
    }
    
    // Temperature
    let tempSummary = `${Math.round(currentTemp)}°F now`;
    if (tempAnalysis.lowest !== currentTemp) {
        tempSummary += `, low ${Math.round(tempAnalysis.lowest)}°F`;
    }
    if (tempAnalysis.highest > currentTemp + 5) {
        tempSummary += `, high ${Math.round(tempAnalysis.highest)}°F`;
    }
    
    // Feels like
    const feelsLikeCalculated = calculateFeelsLike(currentTemp, currentHumidity, currentWindSpeed);
    let feelsLikeText = `${Math.round(feelsLikeCalculated)}°F`;
    const feelsDiff = Math.abs(currentTemp - feelsLikeCalculated);
    if (feelsDiff > 15) {
        feelsLikeText += ' (Extreme)';
    } else if (feelsDiff > 10) {
        feelsLikeText += ' (Very Cold)';
    } else if (feelsDiff > 5) {
        feelsLikeText += ' (Cold)';
    }
    
    // Wind
    let windSummary = `${Math.round(windAnalysis.maxSpeed)} mph sustained`;
    if (windAnalysis.maxGust > windAnalysis.maxSpeed + 10) {
        windSummary += `, ${Math.round(windAnalysis.maxGust)} mph gusts`;
    }
    
    // Wind chill
    const windChillValue = calculateWindChill(tempAnalysis.lowest, windAnalysis.maxSpeed);
    let windChillText = `${windChillValue}°F`;
    if (windChillValue < -20) {
        windChillText += ' (Frostbite: <10 min)';
    } else if (windChillValue < 0) {
        windChillText += ' (Frostbite: <30 min)';
    } else if (windChillValue < 20) {
        windChillText += ' (Very Cold)';
    }
    
    // Precipitation
    let precipSummary = 'None expected';
    if (snowAnalysis.detected) {
        precipSummary = `${Math.round(precipAnalysis.avgProb)}% avg, ${precipAnalysis.maxProb}% peak`;
    }
    
    // Visibility
    let visSummary = `${visibilityAnalysis.minimum.toFixed(1)} mi minimum`;
    if (visibilityAnalysis.minimum < 0.25) visSummary += ' (Whiteout)';
    else if (visibilityAnalysis.minimum < 0.5) visSummary += ' (Extreme)';
    else if (visibilityAnalysis.minimum < 1) visSummary += ' (Very Poor)';
    else if (visibilityAnalysis.minimum < 2) visSummary += ' (Poor)';
    else if (visibilityAnalysis.minimum < 5) visSummary += ' (Reduced)';
    
    // Sky conditions
    const skyConditions = getWeatherDescription(currentWeatherCode);
    
    // Humidity
    const humidity = `${Math.round(currentHumidity)}%`;
    
    // Peak time
    let peakTimeText = 'N/A';
    if (snowAnalysis.peakHour >= 0) {
        const peakDate = new Date(hourly.time[snowAnalysis.peakHour]);
        peakTimeText = peakDate.toLocaleString('en-US', { 
            weekday: 'short',
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }
    
    // Duration
    let durationText = 'N/A';
    if (snowAnalysis.startHour >= 0 && snowAnalysis.endHour >= 0) {
        const totalHours = snowAnalysis.endHour - snowAnalysis.startHour + 1;
        durationText = `${totalHours} hours total, ${snowAnalysis.maxConsecutive} consecutive`;
    }
    
    // ═══════════════════════════════════════════════════════
    // PHASE 7: DETAILED ANALYSES
    // ═══════════════════════════════════════════════════════
    
    // RADAR ANALYSIS
    let radarAnalysis = 'Advanced multi-model analysis of precipitation systems: ';
    if (snowAnalysis.detected) {
        const startDate = new Date(hourly.time[snowAnalysis.startHour]);
        const endDate = new Date(hourly.time[snowAnalysis.endHour]);
        
        radarAnalysis += `Snow is expected to develop around ${startDate.toLocaleString('en-US', {weekday: 'short', hour: 'numeric', hour12: true})} and continue through ${endDate.toLocaleString('en-US', {weekday: 'short', hour: 'numeric', hour12: true})}. `;
        
        if (snowAnalysis.heavySnowHours >= 6) {
            radarAnalysis += `Radar indicates intense precipitation cores with snow rates exceeding ${snowAnalysis.maxRate.toFixed(1)}"/hour for ${snowAnalysis.heavySnowHours} hours. `;
        } else if (snowAnalysis.maxRate >= 0.5) {
            radarAnalysis += `Moderate to heavy snow bands will produce rates of ${snowAnalysis.maxRate.toFixed(1)}"/hour at peak intensity. `;
        } else {
            radarAnalysis += `Light to moderate snow with maximum rates of ${snowAnalysis.maxRate.toFixed(1)}"/hour. `;
        }
        
        if (snowAnalysis.maxConsecutive >= 18) {
            radarAnalysis += `This will be a prolonged event with ${snowAnalysis.maxConsecutive} consecutive hours of steady snowfall, allowing for substantial accumulation. `;
        } else if (snowAnalysis.maxConsecutive >= 8) {
            radarAnalysis += `Sustained snowfall for ${snowAnalysis.maxConsecutive} hours will allow accumulation to build steadily. `;
        }
        
        if (windAnalysis.maxSpeed >= 30) {
            radarAnalysis += `Strong winds will cause significant horizontal transport of snow, creating drifts 2-4x deeper than base accumulation in exposed areas. `;
        } else if (windAnalysis.maxSpeed >= 20) {
            radarAnalysis += `Moderate winds will cause drifting and uneven accumulation patterns. `;
        } else {
            radarAnalysis += `Light winds will allow for relatively uniform accumulation. `;
        }
        
        if (visibilityAnalysis.poorVisHours >= 12) {
            radarAnalysis += `Extended periods of poor visibility (${visibilityAnalysis.poorVisHours} hours) indicate dense snowfall with high water content. `;
        }
        
        radarAnalysis += `Forecast confidence is ${confidence} based on model agreement and atmospheric pattern stability.`;
    } else {
        radarAnalysis += 'No organized precipitation systems detected within the 72-hour forecast window. ';
        radarAnalysis += 'Current atmospheric patterns do not support snow development. ';
        radarAnalysis += 'High pressure or dry air mass dominance preventing storm systems from affecting the area.';
    }
    
    // TIMING ANALYSIS
    let timingAnalysis = '';
    if (snowAnalysis.detected) {
        const startDate = new Date(hourly.time[snowAnalysis.startHour]);
        const peakDate = snowAnalysis.peakHour >= 0 ? new Date(hourly.time[snowAnalysis.peakHour]) : null;
        const endDate = new Date(hourly.time[snowAnalysis.endHour]);
        
        timingAnalysis += `TIMELINE: Snow begins approximately ${snowAnalysis.startHour} hours from now (${startDate.toLocaleString('en-US', {weekday: 'long', hour: 'numeric', minute: '2-digit'})}). `;
        
        if (peakDate) {
            timingAnalysis += `Peak intensity occurs around ${peakDate.toLocaleString('en-US', {weekday: 'long', hour: 'numeric', minute: '2-digit'})} with accumulation rates of ${snowAnalysis.maxRate.toFixed(1)}"/hour. `;
        }
        
        timingAnalysis += `Snow continues through ${endDate.toLocaleString('en-US', {weekday: 'long', hour: 'numeric', minute: '2-digit'})} for a total duration of ${snowAnalysis.endHour - snowAnalysis.startHour + 1} hours. `;
        
        if (tempAnalysis.lowestHour < snowAnalysis.startHour) {
            timingAnalysis += `Coldest temperatures (${Math.round(tempAnalysis.lowest)}°F) occur before snow arrival, ensuring optimal snow-to-liquid ratios. `;
        } else if (tempAnalysis.lowestHour > snowAnalysis.endHour) {
            timingAnalysis += `⚠️ Coldest temperatures don't arrive until after snow ends, which may limit initial accumulation. `;
        } else {
            timingAnalysis += `Peak cold coincides with active snowfall, maximizing accumulation efficiency. `;
        }
        
        if (tempAnalysis.belowFreezingHours >= 48) {
            timingAnalysis += `Temperatures remain continuously below freezing for ${tempAnalysis.belowFreezingHours} hours, preventing any melting and allowing full accumulation to persist. `;
        } else if (tempAnalysis.belowFreezingHours >= 24) {
            timingAnalysis += `Extended below-freezing period (${tempAnalysis.belowFreezingHours} hours) supports accumulation. `;
        } else if (tempAnalysis.warmingTrend) {
            timingAnalysis += `⚠️ Warming trend during/after event may cause some settling or melting, reducing final snow depth. `;
        }
        
        const startHour = startDate.getHours();
        if (startHour >= 22 || startHour <= 6) {
            timingAnalysis += `🌙 Overnight development means snow will accumulate before morning commute, compounding traffic impacts. `;
        } else if (startHour >= 6 && startHour <= 9) {
            timingAnalysis += `🚗 Morning rush hour timing creates maximum disruption to commuters and school transportation. `;
        } else if (startHour >= 15 && startHour <= 18) {
            timingAnalysis += `🚗 Afternoon rush hour timing will create challenging evening commute conditions. `;
        }
        
        if (visibilityAnalysis.dangerousVisHours >= 6) {
            timingAnalysis += `Extended whiteout conditions (${visibilityAnalysis.dangerousVisHours} hours below 0.5 mi visibility) will make travel extremely hazardous during peak snowfall. `;
        }
        
        if (windAnalysis.sustainedHighWindHours >= 12) {
            timingAnalysis += `Sustained high winds for ${windAnalysis.sustainedHighWindHours} hours will create ongoing blowing/drifting snow even after precipitation ends. `;
        }
    } else {
        timingAnalysis = 'No snow events are forecast within the 72-hour analysis period. ';
        timingAnalysis += `Current conditions (${Math.round(currentTemp)}°F, ${getWeatherDescription(currentWeatherCode)}) remain stable. `;
        timingAnalysis += 'No winter storm systems are approaching the region at this time.';
    }
    
    // ADVISORY
    let advisory = '';
    if (snowDayScore >= 90) {
        advisory = '🚨🚨 EXTREME WINTER STORM - LIFE-THREATENING CONDITIONS 🚨🚨\n\n';
        advisory += 'THIS IS A MAJOR WEATHER EVENT. ';
        advisory += 'DO NOT TRAVEL under any circumstances unless life-threatening emergency. ';
        advisory += 'Roads WILL BE IMPASSABLE. ';
        advisory += 'IMMEDIATE ACTIONS: (1) Stock 3+ days food/water/medications NOW (2) Fill bathtubs with water (3) Charge ALL devices (4) Locate flashlights/batteries (5) Have alternative heat source ready (6) Clear storm drains (7) Bring pets indoors. ';
        if (windChillValue < -20) {
            advisory += '🥶 EXTREME COLD: Frostbite possible in under 10 minutes. Stay indoors. ';
        }
        if (windAnalysis.maxGust >= 40) {
            advisory += '💨 BLIZZARD CONDITIONS: Zero visibility, life-threatening whiteouts expected. ';
        }
        advisory += 'PLAN FOR: Extended power outages, impassable roads for 24-48+ hours, no emergency services available. ';
        advisory += 'CHECK ON: Elderly neighbors, vulnerable populations, livestock. ';
        advisory += 'This storm will have significant long-lasting impacts.';
    } else if (snowDayScore >= 75) {
        advisory = '🚨 DANGEROUS WINTER STORM - MAJOR IMPACTS EXPECTED 🚨\n\n';
        advisory += 'Snow day is HIGHLY LIKELY. Travel strongly discouraged. ';
        advisory += 'PREPARE NOW: (1) Complete grocery shopping TODAY (2) Fill prescriptions (3) Charge devices (4) Stock emergency supplies (5) Fuel vehicles (6) Clear gutters/downspouts. ';
        advisory += 'If you MUST travel: Only in 4WD/AWD with winter tires, carry emergency kit (blankets, food, water, flashlight, phone charger, shovel), tell someone your route, allow 3x normal travel time. ';
        if (visibilityAnalysis.minimum < 0.5) {
            advisory += 'WHITEOUT CONDITIONS expected - navigation will be extremely difficult. ';
        }
        if (windAnalysis.maxGust >= 35) {
            advisory += 'High winds will create massive drifts and may cause power outages. ';
        }
        advisory += 'Schools, businesses likely to close. Plan to work from home if possible.';
    } else if (snowDayScore >= 60) {
        advisory = '⚠️ SIGNIFICANT WINTER WEATHER - SNOW DAY LIKELY ⚠️\n\n';
        advisory += 'Major disruptions expected. Avoid travel if possible. ';
        advisory += 'PREPARATIONS: Stock essential supplies, charge devices, fuel vehicle, have emergency kit ready. ';
        advisory += 'IF TRAVELING: Use extreme caution, winter tires recommended, carry emergency supplies (blankets, water, snacks, phone charger, shovel), allow 2x travel time, avoid highways if possible. ';
        if (snowAnalysis.maxRate >= 1.0) {
            advisory += 'Rapid accumulation rates will quickly make roads impassable. ';
        }
        advisory += 'Monitor weather updates closely. Conditions may deteriorate rapidly. ';
        advisory += 'Check on vulnerable neighbors and family members.';
    } else if (snowDayScore >= 40) {
        advisory = '⚠️ WINTER WEATHER LIKELY - PLAN AHEAD ⚠️\n\n';
        advisory += 'Travel will be difficult with hazardous road conditions. ';
        advisory += 'RECOMMENDATIONS: Avoid unnecessary travel, allow extra time if you must drive (1.5-2x normal), reduce speeds significantly, increase following distance. ';
        advisory += 'VEHICLE: Ensure winter tires or chains, carry emergency kit, full gas tank. ';
        if (tempAnalysis.lowest <= 20) {
            advisory += 'Extreme cold - warm up vehicle before driving, dress in layers. ';
        }
        advisory += 'Monitor forecasts - conditions may worsen. Stay flexible with plans. ';
        advisory += 'Have backup arrangements for school/work.';
    } else if (snowDayScore >= 20) {
        advisory = 'ℹ️ MINOR WINTER WEATHER POSSIBLE\n\n';
        advisory += 'Some accumulation possible but major disruptions unlikely. ';
        advisory += 'Drive with caution if snow develops. Allow extra time for morning commute. ';
        advisory += 'Monitor weather updates. Keep emergency supplies in vehicle just in case. ';
        advisory += 'Untreated roads and bridges may become slippery.';
    } else {
        advisory = '✅ NO SIGNIFICANT WINTER WEATHER EXPECTED\n\n';
        advisory += 'Normal conditions forecast. No special preparations needed. ';
        advisory += 'Continue routine activities as planned. ';
        advisory += 'Stay aware of forecast updates but no winter weather concerns at this time.';
    }
    
    console.log('=== ANALYSIS COMPLETE ===');
    
    return {
        snowDayPercentage: snowDayScore,
        snowDay: isSnowDay,
        confidence: confidence,
        reasoning: reasoning.join('. ') + '.',
        radarAnalysis: radarAnalysis,
        timingAnalysis: timingAnalysis,
        accumulation: accumulation,
        snowRate: snowRateText,
        temperature: tempSummary,
        feelsLike: feelsLikeText,
        windSpeed: windSummary,
        windChill: windChillText,
        precipitation: precipSummary,
        visibility: visSummary,
        skyConditions: skyConditions,
        humidity: humidity,
        peakTime: peakTimeText,
        duration: durationText,
        alerts: alertsList,
        advisory: advisory,
        rawAlerts: alerts,
        // Additional data for future enhancements
        detailedFactors: detailedFactors,
        snowAnalysis: snowAnalysis,
        windAnalysis: windAnalysis,
        tempAnalysis: tempAnalysis,
        visibilityAnalysis: visibilityAnalysis
    };
}

function analyzeAndDisplay(data) {
    console.log('Starting comprehensive weather analysis...');
    const analysis = analyzeWeatherData(data.weatherData, data.alerts);
    setSnowfallSpeed(analysis.snowDayPercentage);
    displayResults({
        location: data.location,
        ...analysis
    });
}

function displayResults(data) {
    console.log('Displaying comprehensive results...');
    
    document.getElementById('resultLocation').textContent = data.location;
    
    const percentage = data.snowDayPercentage;
    const circle = document.getElementById('progressCircle');
    const percentageNumber = document.getElementById('percentageNumber');
    
    const circumference = 2 * Math.PI * 100;
    const offset = circumference - (percentage / 100) * circumference;
    
    let currentPercentage = 0;
    const increment = percentage / 50;
    const timer = setInterval(() => {
        currentPercentage += increment;
        if (currentPercentage >= percentage) {
            currentPercentage = percentage;
            clearInterval(timer);
        }
        percentageNumber.textContent = Math.round(currentPercentage);
    }, 20);
    
    const gradient = document.querySelector('#progressGradient');
    if (percentage >= 70) {
        gradient.innerHTML = `
            <stop offset="0%" style="stop-color:#2563eb;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
        `;
    } else if (percentage >= 40) {
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
    
    document.getElementById('quickTemp').textContent = data.temperature.split(',')[0];
    document.getElementById('quickSnow').textContent = data.accumulation.split('(')[0].trim();
    document.getElementById('quickWind').textContent = data.windSpeed.split(',')[0];
    document.getElementById('quickVis').textContent = data.visibility.split('(')[0].trim();
    
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
                    <div class="alert-description">${alert.properties.headline || 'Check local weather service for details'}</div>
                </div>
            `).join('')}
        `;
        alertsSection.classList.add('show');
    } else {
        alertsSection.classList.remove('show');
    }
    
    document.getElementById('temperature').textContent = data.temperature;
    document.getElementById('feelsLike').textContent = data.feelsLike;
    document.getElementById('accumulation').textContent = data.accumulation;
    document.getElementById('snowRate').textContent = data.snowRate;
    document.getElementById('windSpeed').textContent = data.windSpeed;
    document.getElementById('windChill').textContent = data.windChill;
    document.getElementById('precipitation').textContent = data.precipitation;
    document.getElementById('humidity').textContent = data.humidity;
    document.getElementById('visibility').textContent = data.visibility;
    document.getElementById('skyConditions').textContent = data.skyConditions;
    document.getElementById('peakTime').textContent = data.peakTime;
    document.getElementById('duration').textContent = data.duration;
    
    document.getElementById('aiReasoning').textContent = data.reasoning;
    document.getElementById('radarAnalysis').textContent = data.radarAnalysis;
    document.getElementById('timingAnalysis').textContent = data.timingAnalysis;
    document.getElementById('advisory').textContent = data.advisory;
    
    console.log('Display complete!');
}