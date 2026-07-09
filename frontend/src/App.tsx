import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import OrganizationDashboard from './pages/OrganizationDashboard';
import PostOpportunity from './pages/PostOpportunity';
import OrganizationApplicants from './pages/OrganizationApplicants';
import StudentDashboard from './pages/StudentDashboard';
import StudentApplications from './pages/StudentApplications';
import AIAssistant from './pages/AIAssistant';
import AdminDashboard from './pages/AdminDashboard';
import StudentProfile from './pages/StudentProfile';
import BookmarkedOpportunities from './pages/BookmarkedOpportunities';
import OrganizationProfile from './pages/OrganizationProfile';
import SearchPage from './pages/SearchPage';
import NotificationCenter from './pages/NotificationCenter';
import ProtectedRoute from './components/ProtectedRoute';
import Tickets from './pages/Tickets';
import TicketDetails from './pages/TicketDetails';

function App() {
  return (
    <BrowserRouter>
      <div className="app-container">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Shared Authenticated Routes */}
          <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationCenter /></ProtectedRoute>} />
          <Route path="/tickets" element={<ProtectedRoute><Tickets /></ProtectedRoute>} />
          <Route path="/tickets/:id" element={<ProtectedRoute><TicketDetails /></ProtectedRoute>} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentDashboard /></ProtectedRoute>} />
          <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentProfile /></ProtectedRoute>} />
          <Route path="/student/applications" element={<ProtectedRoute allowedRoles={['STUDENT']}><StudentApplications /></ProtectedRoute>} />
          <Route path="/student/ai-assistant" element={<ProtectedRoute allowedRoles={['STUDENT']}><AIAssistant /></ProtectedRoute>} />
          <Route path="/student/bookmarks" element={<ProtectedRoute allowedRoles={['STUDENT']}><BookmarkedOpportunities /></ProtectedRoute>} />

          {/* Organization Routes */}
          <Route path="/org/dashboard" element={<ProtectedRoute allowedRoles={['ORGANIZATION']}><OrganizationDashboard /></ProtectedRoute>} />
          <Route path="/org/profile" element={<ProtectedRoute allowedRoles={['ORGANIZATION']}><OrganizationProfile /></ProtectedRoute>} />
          <Route path="/org/post-opportunity" element={<ProtectedRoute allowedRoles={['ORGANIZATION']}><PostOpportunity /></ProtectedRoute>} />
          <Route path="/org/applicants/:opportunityId" element={<ProtectedRoute allowedRoles={['ORGANIZATION']}><OrganizationApplicants /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
