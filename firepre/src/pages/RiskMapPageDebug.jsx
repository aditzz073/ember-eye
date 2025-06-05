import { useState, useEffect } from 'react';
import RiskMapDiagnostic from '../components/RiskMapDiagnostic';

// Import components dynamically to catch errors
const loadComponent = async (componentPath) => {
  try {
    const module = await import(componentPath);
    return module.default;
  } catch (error) {
    console.error(`Failed to load ${componentPath}:`, error);
    return null;
  }
};

export default function RiskMapPage() {
  const [components, setComponents] = useState({
    MapView: null,
    PredictionPanel: null,
    RiskLevelCard: null,
    WeatherInfo: null,
    ApiStatus: null
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadAllComponents = async () => {
      try {
        console.log('Loading RiskMapPage components...');
        
        const [MapView, PredictionPanel, RiskLevelCard, WeatherInfo, ApiStatus] = await Promise.all([
          loadComponent('../components/MapView'),
          loadComponent('../components/PredictionPanel'),
          loadComponent('../components/RiskLevelCard'),
          loadComponent('../components/WeatherInfo'),
          loadComponent('../components/ApiStatus')
        ]);

        console.log('Components loaded:', { MapView, PredictionPanel, RiskLevelCard, WeatherInfo, ApiStatus });

        setComponents({
          MapView,
          PredictionPanel,
          RiskLevelCard,
          WeatherInfo,
          ApiStatus
        });

        if (!MapView) {
          throw new Error('MapView component failed to load');
        }

      } catch (err) {
        console.error('Failed to load RiskMapPage components:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadAllComponents();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '50vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🔄</div>
        <p>Loading AI Risk Map...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>AI Risk Map - Debug Mode</h1>
        <div style={{
          backgroundColor: '#fee2e2',
          border: '1px solid #fecaca',
          color: '#dc2626',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <h3>Component Load Error:</h3>
          <p>{error}</p>
        </div>
        <RiskMapDiagnostic />
      </div>
    );
  }

  const { MapView, PredictionPanel, RiskLevelCard, WeatherInfo, ApiStatus } = components;

  if (!MapView) {
    return (
      <div style={{ padding: '2rem' }}>
        <h1>AI Risk Map - Diagnostic</h1>
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #fde68a',
          color: '#92400e',
          padding: '1rem',
          borderRadius: '0.5rem',
          marginBottom: '2rem'
        }}>
          <p>MapView component is not available. Running diagnostics...</p>
        </div>
        <RiskMapDiagnostic />
      </div>
    );
  }

  // If we get here, try to render the normal page
  return (
    <div className="risk-map-page">
      <div className="container">
        <div className="page-header">
          <h1 className="page-title">AI Risk Map</h1>
          <p className="page-description">
            Explore our interactive map to visualize and predict wildfire risks in your area.
            Click anywhere on the map to get location-specific weather data and risk assessment.
          </p>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <RiskMapDiagnostic />
        </div>

        <div className="risk-map-content-vertical">
          <div className="map-container">
            <MapView onLocationChange={(coords) => console.log('Location changed:', coords)} />
          </div>

          <div className="assessment-container">
            <p style={{ 
              background: '#e0f2fe', 
              padding: '1rem', 
              borderRadius: '8px',
              marginTop: '1rem'
            }}>
              ✅ MapView component loaded successfully! The map should be visible above.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
