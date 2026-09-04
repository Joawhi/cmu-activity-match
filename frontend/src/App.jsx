import { useState, useEffect } from 'react';
import './App.css';
import CreateActivityForm from './components/CreateActivityForm';
import BrowseActivities from './components/BrowseActivities';
import MyActivities from './components/MyActivities';
import Login from './components/Login';
import Modal from './components/Modal';
import Profile from './components/Profile';

const STORAGE_KEY = 'cmu_activity_match_user';

function App() {
  const [activeTab, setActiveTab] = useState('create');
  const [user, setUser] = useState(null);
  const [checkedStorage, setCheckedStorage] = useState(false);
  const [viewingProfileUserId, setViewingProfileUserId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      setUser(JSON.parse(stored));
    }
    setCheckedStorage(true);
  }, []);

  const handleLogin = (loggedInUser) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  if (!checkedStorage) {
    return null;
  }

  return (
    <div className="page">
      <div className="top-bar">
        <div>
          <h1>CMU Activity Match</h1>
          <p className="subtitle">Find people to do things with around campus.</p>
        </div>
        {user && (
          <div className="user-badge">
            <button type="button" className="link-btn" onClick={() => setViewingProfileUserId(user.id)}>
              {user.name}
            </button>
            <button type="button" className="ghost-btn" onClick={handleLogout}>Log out</button>
          </div>
        )}
      </div>

      {!user && <Login onLogin={handleLogin} />}

      {user && (
        <>
          <nav className="nav">
            <button type="button" className={activeTab === 'create' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('create')}>
              Create
            </button>
            <button type="button" className={activeTab === 'browse' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('browse')}>
              Browse
            </button>
            <button type="button" className={activeTab === 'mine' ? 'nav-tab active' : 'nav-tab'} onClick={() => setActiveTab('mine')}>
              Mine
            </button>
          </nav>

          {activeTab === 'create' && <CreateActivityForm user={user} />}
          {activeTab === 'browse' && (
            <BrowseActivities
              onCreateClick={() => setActiveTab('create')}
              currentUserId={user.id}
              onViewProfile={(id) => setViewingProfileUserId(id)}
            />
          )}
          {activeTab === 'mine' && <MyActivities user={user} />}
        </>
      )}

      {viewingProfileUserId && (
        <Modal onClose={() => setViewingProfileUserId(null)}>
          <Profile userId={viewingProfileUserId} currentUser={user} />
        </Modal>
      )}
    </div>
  );
}

export default App;