import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import KioskHome from './pages/KioskHome';
import Scanner from './pages/Scanner';
import AdminLayout from './pages/Admin/AdminLayout';
import UserList from './pages/Admin/UserList';
import UserForm from './pages/Admin/UserForm';
import StudentList from './pages/Admin/StudentList';
import StudentForm from './pages/Admin/StudentForm';
import Reports from './pages/Admin/Reports';
import QRCodePage from './pages/Admin/QRCodePage';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <ToastContainer position="top-right" autoClose={3000} />
        <Routes>
          {/* Kiosk Routes */}
          <Route path="/" element={<KioskHome />} />
          <Route path="/scan/:type" element={<Scanner />} />

          {/* Public Admin Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<UserList />} />
              <Route path="users/add" element={<UserForm />} />
              <Route path="students" element={<StudentList />} />
              <Route path="students/add" element={<StudentForm />} />
              <Route path="students/edit/:id" element={<StudentForm />} />
              <Route path="reports" element={<Reports />} />
            </Route>
            {/* Print QR Route */}
            <Route path="/admin/qr/:id" element={<QRCodePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
