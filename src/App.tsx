import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import AnalyticsPage from './components/AnalyticsPage';

function App() {
  const [page, setPage] = useState<'dashboard' | 'analytics'>('dashboard');
  return (
    <div className="App">
      <header className="App-header">
        <h1>Система керування заявками</h1>
        <nav style={{marginTop: 16}}>
          <button onClick={() => setPage('dashboard')} style={{marginRight: 8}}>Заявки</button>
          <button onClick={() => setPage('analytics')}>Аналітика</button>
        </nav>
      </header>
      <main>
        {page === 'dashboard' ? <Dashboard /> : <AnalyticsPage />}
      </main>
    </div>
  );
}

export default App;
