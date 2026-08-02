import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import EstimateBuilder from './pages/EstimateBuilder';
import Settlement from './pages/Settlement';
import SettlementHistory from './pages/SettlementHistory';
import MasterData from './pages/MasterData';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProtectedRoute from './components/layout/ProtectedRoute';
import './index.css';

import Analytics from './pages/Analytics';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><ProjectList /></ProtectedRoute>} />
        <Route path="/estimate" element={<ProtectedRoute><EstimateBuilder /></ProtectedRoute>} />
        <Route path="/settlements" element={<ProtectedRoute><Settlement /></ProtectedRoute>} />
        <Route path="/settlement-history" element={<ProtectedRoute><SettlementHistory /></ProtectedRoute>} />
        <Route path="/master" element={<ProtectedRoute><MasterData /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}


export default App;
