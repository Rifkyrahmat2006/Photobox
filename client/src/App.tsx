import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminDashboard from './pages/AdminDashboard';
import Photobooth from './pages/Photobooth';
import UploadTemplate from './pages/UploadTemplate';
import EditTemplate from './pages/EditTemplate';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Photobooth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/upload" element={<UploadTemplate />} />
        <Route path="/admin/edit/:id" element={<EditTemplate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
