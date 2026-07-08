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
          <Route path="/search" element={<SearchPage />} />
          <Route path="/notifications" element={<NotificationCenter />} />

          {/* Student Routes */}
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/profile" element={<StudentProfile />} />
          <Route path="/student/applications" element={<StudentApplications />} />
          <Route path="/student/ai-assistant" element={<AIAssistant />} />
          <Route path="/student/bookmarks" element={<BookmarkedOpportunities />} />

          {/* Organization Routes */}
          <Route path="/org/dashboard" element={<OrganizationDashboard />} />
          <Route path="/org/profile" element={<OrganizationProfile />} />
          <Route path="/org/post-opportunity" element={<PostOpportunity />} />
          <Route path="/org/applicants/:opportunityId" element={<OrganizationApplicants />} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminDashboard />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
