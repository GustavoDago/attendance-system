import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import KioskHome from './pages/KioskHome';
import Scanner from './pages/Scanner';
import AdminLayout from './pages/Admin/AdminLayout';
import UserList from './pages/Admin/UserList';
import UserForm from './pages/Admin/UserForm';
import Reports from './pages/Admin/Reports';
import QRCodePage from './pages/Admin/QRCodePage';
import Login from './pages/Admin/Login';
import Dashboard from './pages/Admin/Dashboard';
import StudentList from './pages/Admin/StudentList';
import ManualAttendancePage from './pages/Admin/ManualAttendancePage';
import SubjectReportPage from './pages/Admin/SubjectReportPage';
import ScheduleConfigPage from './pages/Admin/ScheduleConfigPage';
import HolidayConfigPage from './pages/Admin/HolidayConfigPage';
import MonthlyReportPage from './pages/Admin/MonthlyReportPage';
import StudentForm from './pages/Admin/StudentForm';
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
          {/* Redirect root to login (or admin if authenticated) */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Kiosk Routes */}
          <Route path="/kiosk" element={<KioskHome />} />
          <Route path="/scan/:type" element={<Scanner />} />

          {/* Public Admin Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Admin Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="attendance/manual" element={<ManualAttendancePage />} />
              <Route path="schedules" element={<ScheduleConfigPage />} />
              <Route path="holidays" element={<HolidayConfigPage />} />
              <Route path="students" element={<StudentList />} />
              <Route path="students/new" element={<StudentForm />} />
              <Route path="students/edit/:id" element={<StudentForm />} />
              <Route path="users" element={<UserList />} />
              <Route path="users/add" element={<UserForm />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/monthly" element={<MonthlyReportPage />} />
              <Route path="reports/subjects" element={<SubjectReportPage />} />
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
