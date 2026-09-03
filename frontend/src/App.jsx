import { useState } from 'react';
import './App.css';
import CreateActivityForm from './components/CreateActivityForm';
import BrowseActivities from './components/BrowseActivities';

function App() {
  const [activeTab, setActiveTab] = useState('create');

  return (
    <div className="page">
      <h1>CMU Activity Match</h1>
      <p className="subtitle">Find people to do things with around campus.</p>

      <nav className="nav">
        <button
          type="button"
          className={activeTab === 'create' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('create')}
        >
          Create
        </button>
        <button
          type="button"
          className={activeTab === 'browse' ? 'nav-tab active' : 'nav-tab'}
          onClick={() => setActiveTab('browse')}
        >
          Browse
        </button>
      </nav>

      {activeTab === 'create' && <CreateActivityForm />}
      {activeTab === 'browse' && <BrowseActivities onCreateClick={() => setActiveTab('create')} />}
    </div>
  );
}

export default App;