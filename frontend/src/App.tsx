import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { CreatePollForm } from './components/host/CreatePollForm';
import { HostDashboard } from './components/host/HostDashboard';
import { PollForm } from './components/participant/PollForm';
import { ThankYou } from './components/participant/ThankYou';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<CreatePollForm />} />
        <Route path="/host/:hostCode" element={<HostDashboard />} />
        <Route path="/poll/:participantCode" element={<PollForm />} />
        <Route path="/poll/:participantCode/thanks" element={<ThankYou />} />
      </Routes>
    </Router>
  );
}

export default App;
