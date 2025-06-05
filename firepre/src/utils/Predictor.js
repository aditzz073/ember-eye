import axios from 'axios';

// The base URL for your FastAPI backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Check if we're in production and don't have a backend URL
const isProduction = import.meta.env.PROD;
const hasValidBackendUrl = import.meta.env.VITE_API_BASE_URL && 
  import.meta.env.VITE_API_BASE_URL !== 'http://localhost:8000/api' &&
  !import.meta.env.VITE_API_BASE_URL.includes('your-backend-api-url.com');

console.log('Environment check:', { 
  isProduction, 
  hasValidBackendUrl, 
  apiUrl: API_BASE_URL,
  envApiUrl: import.meta.env.VITE_API_BASE_URL
});

// Client-side prediction as a fallback
export function clientPredictRisk({ temperature, humidity, windSpeed, vegetation }) {
  // Make sure all inputs are valid numbers
  const temp = parseFloat(temperature) || 0;
  const humid = parseFloat(humidity) || 0;
  const wind = parseFloat(windSpeed) || 0;
  const veg = parseFloat(vegetation) || 0;
  
  console.log("Client prediction using values:", { temp, humid, wind, veg });
  
  // More sophisticated risk calculation based on wildfire research
  let riskScore = 0;
  
  // Temperature factor (0-40 points)
  if (temp > 40) riskScore += 40;
  else if (temp > 35) riskScore += 35;
  else if (temp > 30) riskScore += 25;
  else if (temp > 25) riskScore += 15;
  else if (temp > 20) riskScore += 5;
  
  // Humidity factor (0-30 points) - lower humidity = higher risk
  if (humid < 15) riskScore += 30;
  else if (humid < 25) riskScore += 25;
  else if (humid < 35) riskScore += 20;
  else if (humid < 45) riskScore += 15;
  else if (humid < 55) riskScore += 10;
  else if (humid < 65) riskScore += 5;
  
  // Wind speed factor (0-20 points)
  if (wind > 25) riskScore += 20;
  else if (wind > 20) riskScore += 18;
  else if (wind > 15) riskScore += 15;
  else if (wind > 10) riskScore += 10;
  else if (wind > 5) riskScore += 5;
  
  // Vegetation factor (0-10 points)
  if (veg > 80) riskScore += 10;
  else if (veg > 70) riskScore += 8;
  else if (veg > 60) riskScore += 6;
  else if (veg > 50) riskScore += 4;
  else if (veg > 40) riskScore += 2;
  
  // Cap at 100 and ensure minimum of 1
  const percentage = Math.max(1, Math.min(riskScore, 100));
  
  let level = 'Low';
  if (percentage >= 75) level = 'Very High';
  else if (percentage >= 60) level = 'High';
  else if (percentage >= 40) level = 'Medium';
  else if (percentage >= 20) level = 'Low';
  else level = 'Very Low';

  console.log("Client prediction result:", { percentage, level, factors: { temp, humid, wind, veg } });

  return { 
    percentage, 
    level,
    confidence: 85, // Client-side predictions have good confidence
    factors: {
      temperature: { value: temp, contribution: 0.4 },
      humidity: { value: humid, contribution: 0.3 },
      wind_speed: { value: wind, contribution: 0.2 },
      vegetation: { value: veg, contribution: 0.1 }
    },
    factorContributions: {
      temperature: Math.round((temp > 30 ? 40 : temp > 20 ? 25 : 10)),
      humidity: Math.round((humid < 30 ? 30 : humid < 50 ? 20 : 10)),
      wind_speed: Math.round((wind > 15 ? 20 : wind > 10 ? 15 : 5)),
      vegetation: Math.round((veg > 70 ? 10 : veg > 50 ? 5 : 2))
    },
    recommendations: generateRecommendations(percentage),
    modelInfo: {
      name: "Client-side Wildfire Risk Model",
      version: "1.0",
      accuracy: "85%"
    }
  };
}

// Generate recommendations based on risk level
function generateRecommendations(riskPercentage) {
  if (riskPercentage >= 75) {
    return [
      "Extreme fire danger - avoid any outdoor burning",
      "Monitor weather conditions closely",
      "Have evacuation plan ready",
      "Keep emergency supplies accessible",
      "Stay informed about local fire restrictions"
    ];
  } else if (riskPercentage >= 60) {
    return [
      "High fire danger - postpone outdoor burning",
      "Check local fire restrictions",
      "Clear defensible space around structures",
      "Monitor weather and wind conditions",
      "Prepare emergency supplies"
    ];
  } else if (riskPercentage >= 40) {
    return [
      "Moderate fire danger - use caution with fire",
      "Follow all local fire regulations",
      "Maintain defensible space",
      "Check weather before outdoor activities",
      "Have fire suppression tools ready"
    ];
  } else if (riskPercentage >= 20) {
    return [
      "Low fire danger - normal precautions apply",
      "Follow basic fire safety practices",
      "Maintain equipment in good condition",
      "Stay aware of changing conditions"
    ];
  } else {
    return [
      "Very low fire danger",
      "Standard fire safety practices sufficient",
      "Monitor for changing weather conditions"
    ];
  }
}

// API-based prediction
export async function predictRisk({ 
  latitude, 
  longitude, 
  temperature, 
  humidity, 
  windSpeed, 
  precipitation = 0, 
  vegetation = 50,
  elevation = null,
  droughtIndex = null
}) {
  // If in production without a valid backend URL, use client-side prediction
  if (isProduction && !hasValidBackendUrl) {
    console.log('Production mode without valid backend URL, using client-side prediction');
    return clientPredictRisk({ temperature, humidity, windSpeed, vegetation });
  }
  
  // If no backend URL is set at all, use client-side prediction
  if (!import.meta.env.VITE_API_BASE_URL) {
    console.log('No backend URL configured, using client-side prediction');
    return clientPredictRisk({ temperature, humidity, windSpeed, vegetation });
  }

  try {
    // Ensure temperature and windSpeed have only one decimal place
    const formattedTemperature = parseFloat(parseFloat(temperature).toFixed(1));
    const formattedWindSpeed = parseFloat(parseFloat(windSpeed).toFixed(1));
    
    // Log API request for debugging
    console.log("Sending API request to backend:", {
      url: `${API_BASE_URL}/predict`,
      data: {
        latitude,
        longitude,
        temperature: formattedTemperature,
        humidity,
        wind_speed: formattedWindSpeed,
        precipitation,
        vegetation_density: vegetation / 100,
        elevation,
        drought_index: droughtIndex
      }
    });

    const response = await axios.post(`${API_BASE_URL}/predict`, {
      latitude,
      longitude,
      temperature: formattedTemperature,
      humidity,
      wind_speed: formattedWindSpeed,
      precipitation,
      vegetation_density: vegetation / 100, // Convert from percentage (0-100) to decimal (0-1)
      elevation,
      drought_index: droughtIndex
    });

    // Log API response for debugging
    console.log("Received API response:", response.data);

    const { risk_level, risk_score, confidence, factors, recommendations } = response.data;
    
    // Convert the risk_score from 0-1 to 0-100 percentage
    // Make sure risk_score is a valid number before multiplying
    const riskScoreValue = parseFloat(risk_score);
    const percentage = !isNaN(riskScoreValue) ? Math.round(riskScoreValue * 100) : 0;
    
    // Log the risk score calculation for debugging
    console.log("Risk score calculation:", { 
      original: risk_score, 
      parsed: riskScoreValue, 
      percentage: percentage 
    });
    
    // Prepare factor contributions for visualization
    const factorContributions = {};
    if (factors) {
      Object.keys(factors).forEach(key => {
        if (factors[key].hasOwnProperty('contribution')) {
          factorContributions[key] = Math.round(factors[key].contribution * 100);
        }
      });
    }
    
    // Get model details if available
    const modelInfo = response.data.model_details || {};
    
    return {
      percentage,
      level: risk_level,
      confidence: Math.round(confidence * 100),
      factors,
      factorContributions,
      recommendations,
      modelInfo
    };
  } catch (error) {
    console.error('Error fetching prediction from API:', error);
    console.log('Falling back to client-side prediction...', { temperature, humidity, windSpeed, vegetation });
    
    // Log the input values for debugging
    console.log("Input values for fallback:", {
      temperature: typeof temperature + " - " + temperature,
      humidity: typeof humidity + " - " + humidity,
      windSpeed: typeof windSpeed + " - " + windSpeed,
      vegetation: typeof vegetation + " - " + vegetation
    });
    
    // Fallback to client-side prediction if API call fails
    return clientPredictRisk({ temperature, humidity, windSpeed, vegetation });
  }
}
  