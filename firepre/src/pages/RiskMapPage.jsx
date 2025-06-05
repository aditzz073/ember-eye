import React, { useState, useEffect } from 'react';
import MapView from '../components/MapView';
import PredictionPanel from '../components/PredictionPanel';
import RiskLevelCard from '../components/RiskLevelCard';
import WeatherInfo from '../components/WeatherInfo';
import ApiStatus from '../components/ApiStatus';
import { getWeatherData } from '../utils/GetWeatherdata';
import { predictRisk } from '../utils/Predictor';
import { getLocationName } from '../utils/GeocodingService';
import '../styles/locations.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('RiskMapPage Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '2rem',
          textAlign: 'center',
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          borderRadius: '8px',
          margin: '2rem'
        }}>
          <h2>❌ AI Risk Map Error</h2>
          <p>Something went wrong loading the risk map.</p>
          <details style={{ marginTop: '1rem', textAlign: 'left' }}>
            <summary>Error Details</summary>
            <pre style={{ 
              backgroundColor: '#f9fafb', 
              padding: '1rem', 
              borderRadius: '4px',
              overflow: 'auto',
              fontSize: '0.8rem'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#dc2626',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function RiskMapPage() {
  const [weather, setWeather] = useState(null);
  const [riskResult, setRiskResult] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [apiStatus, setApiStatus] = useState({ status: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLocationChange = async ({ lat, lng }) => {
    try {
      setIsLoading(true);
      setError(null);
      setSelectedLocation({ lat, lng });
      
      const data = await getWeatherData(lat, lng);
      setWeather(data);
      
      // Get location name based on coordinates
      try {
        const name = await getLocationName(lat, lng);
        setLocationName(name);
      } catch (error) {
        console.error("Error getting location name:", error);
        setLocationName('Unknown location');
      }
    } catch (error) {
      console.error("Error in handleLocationChange:", error);
      setError('Failed to get location data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrediction = async (inputs) => {
    if (selectedLocation) {
      // Include latitude and longitude in prediction inputs
      const predictionData = {
        ...inputs,
        latitude: selectedLocation.lat,
        longitude: selectedLocation.lng,
        // Add a default precipitation value if not provided
        precipitation: 0
      };
      
      try {
        // Show loading status
        setApiStatus({
          status: 'loading',
          message: 'Contacting backend API for prediction...'
        });
        
        const result = await predictRisk(predictionData);
        setRiskResult(result);
        
        // Show success status
        setApiStatus({
          status: 'success',
          message: `Successfully received prediction: ${result.level} risk (${result.percentage}%)`
        });
      } catch (error) {
        console.error("Error getting prediction:", error);
        // Show error status
        setApiStatus({
          status: 'error',
          message: `Error: ${error.message || 'Failed to get prediction from API'}`
        });
      }
    } else {
      // If no location is selected, we can't make an API call
      // We'll use the client-side prediction as a fallback
      const result = predictRisk(inputs);
      setRiskResult(result);
      
      setApiStatus({
        status: 'loading',
        message: 'No location selected. Using client-side prediction...'
      });
    }
  };

  return (
    <ErrorBoundary>
      <div className="risk-map-page">
        <ApiStatus status={apiStatus.status} message={apiStatus.message} />
        {error && (
          <div className="error-banner" style={{
            background: '#fee2e2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '1rem',
            margin: '1rem',
            borderRadius: '0.5rem',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {/* Add loading state */}
        {isLoading && (
          <div style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0,0,0,0.8)',
            color: 'white',
            padding: '1rem 2rem',
            borderRadius: '8px',
            zIndex: 9999
          }}>
            Loading...
          </div>
        )}

        <div className="container">
          <div className="page-header">
            <h1 className="page-title">AI Risk Map</h1>
            <p className="page-description">
              Explore our interactive map to visualize and predict wildfire risks in your area.
              Click anywhere on the map to get location-specific weather data and risk assessment.
            </p>
          </div>

          <div className="risk-map-content-vertical">
            <div className="map-container">
              <MapView onLocationChange={handleLocationChange} />
              <div className="map-overlay">
                <div className="map-legend">
                  <h3 className="legend-title">Risk Levels</h3>
                  <div className="legend-item">
                    <div className="color-box low"></div>
                    <span>Low Risk (0-40%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box medium"></div>
                    <span>Medium Risk (41-70%)</span>
                  </div>
                  <div className="legend-item">
                    <div className="color-box high"></div>
                    <span>High Risk (71-100%)</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="assessment-container">
              {selectedLocation && (
                <div className="location-info">
                  <h3 className="location-title">Selected Location</h3>
                  <span className="location-name">{locationName}</span>
                  <p className="location-coordinates">
                    Lat: {selectedLocation.lat.toFixed(6)}, Lng: {selectedLocation.lng.toFixed(6)}
                  </p>
                </div>
              )}

              <div className="assessment-flow">
                {weather && <WeatherInfo weatherData={weather} />}
                
                <div className="prediction-section">
                  <PredictionPanel weatherData={weather} onPredict={handlePrediction} />
                  {riskResult && <RiskLevelCard riskResult={riskResult} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
