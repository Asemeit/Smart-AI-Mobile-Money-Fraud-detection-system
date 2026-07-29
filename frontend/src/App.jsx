import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute, { GuestRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import VerifyReceipt from './pages/VerifyReceipt';
import Advisor from './pages/Advisor';
import Login from './pages/Login';
import Register from './pages/Register';
import Welcome from './pages/Welcome';
import History from './pages/History';
import Database from './pages/Database';

export default function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/welcome" element={<Welcome />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="verify" element={<VerifyReceipt />} />
          <Route path="advisor" element={<Advisor />} />
          <Route path="history" element={<History />} />
          <Route path="database" element={<Database />} />
        </Route>
      </Route>
    </Routes>
  );
}
