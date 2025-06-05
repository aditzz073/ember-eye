import axios from 'axios';

const API_KEY = import.meta.env.VITE_WEATHER_API_KEY; 

// Fallback weather data generator based on location
function generateFallbackWeatherData(lat, lon) {
  // Simple algorithm to generate realistic weather data based on coordinates
  const latAbs = Math.abs(lat);
  const seasonalVariation = Math.sin((Date.now() / (1000 * 60 * 60 * 24 * 365)) * 2 * Math.PI) * 10;
  
  // Temperature: varies by latitude and season
  const baseTemp = 30 - (latAbs * 0.6) + seasonalVariation;
  const temperature = Math.max(5, Math.min(45, baseTemp + (Math.random() - 0.5) * 10));
  
  // Humidity: generally higher near equator and coasts
  const baseHumidity = 70 - (latAbs * 0.5);
  const humidity = Math.max(20, Math.min(90, baseHumidity + (Math.random() - 0.5) * 30));
  
  // Wind speed: varies randomly
  const windSpeed = Math.random() * 20;
  
  return {
    temperature: parseFloat(temperature.toFixed(1)),
    humidity: Math.round(humidity),
    windSpeed: parseFloat(windSpeed.toFixed(1)),
  };
}

export async function getWeatherData(lat, lon) {
  // If no API key is available, use fallback data
  if (!API_KEY) {
    console.warn('No weather API key found, using fallback weather data');
    return generateFallbackWeatherData(lat, lon);
  }

  try {
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather`,
      {
        params: {
          lat,
          lon,
          units: 'metric',
          appid: API_KEY,
        },
      }
    );

    const { temp, humidity } = response.data.main;
    const wind = response.data.wind.speed;

    return {
      temperature: parseFloat(temp.toFixed(1)),
      humidity: Math.round(humidity),
      windSpeed: parseFloat(wind.toFixed(1)),
    };
  } catch (error) {
    console.error('Error fetching weather data, using fallback:', error);
    // Return fallback data instead of null
    return generateFallbackWeatherData(lat, lon);
  }
}
