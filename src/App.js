import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import LoginPage from './LoginPage';
import NewReusedTab from './NewReusedTab';
import TakeOutStoreTab from './TakeOutStoreTab';
import AllTapesTab from './AllTapesTab';
import './App.css';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState('newReused');

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return (
    <div className="App">
      <h1>Tape Management System</h1>
      <div className="tabs">
        <button onClick={() => setActiveTab('newReused')}>New & Reused</button>
        <button onClick={() => setActiveTab('takeOutStore')}>Take Out / Store</button>
        <button onClick={() => setActiveTab('allTapes')}>All Tapes</button>
        <button
          style={{ marginLeft: 'auto', background: 'tomato', color: 'white' }}
          onClick={() => setLoggedIn(false)}
        >
          Logout
        </button>
      </div>
      {activeTab === 'newReused' && <NewReusedTab />}
      {activeTab === 'takeOutStore' && <TakeOutStoreTab />}
      {activeTab === 'allTapes' && <AllTapesTab />}
      
      {/* Toast container to display toast notifications */}
      <ToastContainer />
    </div>
  );
}
