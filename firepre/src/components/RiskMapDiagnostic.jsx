import { useState, useEffect } from 'react';

function RiskMapDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({
    reactLoaded: false,
    leafletLoaded: false,
    componentsLoaded: false,
    error: null
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        // Check React
        setDiagnostics(prev => ({ ...prev, reactLoaded: true }));

        // Check Leaflet
        const leaflet = await import('leaflet');
        setDiagnostics(prev => ({ ...prev, leafletLoaded: !!leaflet }));

        // Check components
        const mapView = await import('./MapView');
        const predictionPanel = await import('./PredictionPanel');
        const riskLevelCard = await import('./RiskLevelCard');
        const weatherInfo = await import('./WeatherInfo');
        const apiStatus = await import('./ApiStatus');
        
        setDiagnostics(prev => ({ 
          ...prev, 
          componentsLoaded: !!(mapView && predictionPanel && riskLevelCard && weatherInfo && apiStatus)
        }));

      } catch (error) {
        console.error('Diagnostic error:', error);
        setDiagnostics(prev => ({ ...prev, error: error.message }));
      }
    };

    runDiagnostics();
  }, []);

  return (
    <div style={{
      padding: '2rem',
      backgroundColor: '#f8f9fa',
      border: '1px solid #dee2e6',
      borderRadius: '8px',
      margin: '1rem',
      fontFamily: 'monospace'
    }}>
      <h2>Risk Map Diagnostics</h2>
      <div>
        <p>React Loaded: {diagnostics.reactLoaded ? '✅' : '❌'}</p>
        <p>Leaflet Loaded: {diagnostics.leafletLoaded ? '✅' : '❌'}</p>
        <p>Components Loaded: {diagnostics.componentsLoaded ? '✅' : '❌'}</p>
        {diagnostics.error && (
          <p style={{ color: 'red' }}>Error: {diagnostics.error}</p>
        )}
      </div>
      
      <div style={{ marginTop: '1rem' }}>
        <h3>Environment Info:</h3>
        <p>Node ENV: {import.meta.env.MODE}</p>
        <p>Base URL: {import.meta.env.BASE_URL}</p>
        <p>Prod: {import.meta.env.PROD ? 'true' : 'false'}</p>
      </div>
    </div>
  );
}

export default RiskMapDiagnostic;
