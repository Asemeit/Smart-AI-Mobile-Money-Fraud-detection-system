import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import VerifyReceipt from './pages/VerifyReceipt';
import Advisor from './pages/Advisor';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="verify" element={<VerifyReceipt />} />
        <Route path="advisor" element={<Advisor />} />
      </Route>
    </Routes>
  );
}
