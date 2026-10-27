import React, { useLayoutEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { Header } from './components/common/Header';
import { Footer } from './components/common/Footer';

// Helper to scroll window to top on route change
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

// Pages
import { HomePage } from './pages/HomePage';
import { ExplorePage } from './pages/ExplorePage';
import { StoryDetailPage } from './pages/StoryDetailPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { WriteStoryPage } from './pages/WriteStoryPage';
import { MyStoriesPage } from './pages/MyStoriesPage';
import { MembersPage } from './pages/MembersPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminStoriesPage } from './pages/admin/AdminStoriesPage';
import { AdminPendingPage } from './pages/admin/AdminPendingPage';
import { AdminCreateStoryPage } from './pages/admin/AdminCreateStoryPage';
import { AdminEditStoryPage } from './pages/admin/AdminEditStoryPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminCategoriesPage } from './pages/admin/AdminCategoriesPage';
import { AdminAnalyticsPage } from './pages/admin/AdminAnalyticsPage';
import { AdminMembersPage } from './pages/admin/AdminMembersPage';


// Protected Route Component for Logged-In Users
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Authenticating...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Strict Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-slate-500">
        Verifying administrator authorization...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col justify-between selection:bg-primary-light selection:text-primary bg-[#F8FAFC] text-[#0F172A]">
            <div>
              <Header />
              <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <Routes>
                  {/* Public & User Routes */}
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<HomePage />} />
                  <Route path="/explore" element={<ExplorePage />} />
                  <Route path="/members" element={<MembersPage />} />
                  <Route path="/members/:id" element={<MembersPage />} />
                  <Route path="/stories/:id" element={<StoryDetailPage />} />
                  <Route path="/story/:id" element={<StoryDetailPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />

                  
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/write-story"
                    element={
                      <ProtectedRoute>
                        <WriteStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stories/write"
                    element={
                      <ProtectedRoute>
                        <WriteStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/write"
                    element={
                      <ProtectedRoute>
                        <WriteStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/stories/:id/edit"
                    element={
                      <ProtectedRoute>
                        <WriteStoryPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-stories"
                    element={
                      <ProtectedRoute>
                        <MyStoriesPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* PROTECTED ADMIN ROUTES */}
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboardPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stories"
                    element={
                      <AdminRoute>
                        <AdminStoriesPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/pending"
                    element={
                      <AdminRoute>
                        <AdminPendingPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stories/pending"
                    element={
                      <AdminRoute>
                        <AdminPendingPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/review"
                    element={
                      <AdminRoute>
                        <AdminPendingPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stories/create"
                    element={
                      <AdminRoute>
                        <AdminCreateStoryPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stories/:id/edit"
                    element={
                      <AdminRoute>
                        <AdminEditStoryPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/stories/edit/:id"
                    element={
                      <AdminRoute>
                        <AdminEditStoryPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <AdminRoute>
                        <AdminUsersPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <AdminRoute>
                        <AdminCategoriesPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/analytics"
                    element={
                      <AdminRoute>
                        <AdminAnalyticsPage />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/members"
                    element={
                      <AdminRoute>
                        <AdminMembersPage />
                      </AdminRoute>
                    }
                  />

                  {/* Fallback Route */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </main>
            </div>
            <Footer />
          </div>
        </BrowserRouter>
      </RealtimeProvider>
    </AuthProvider>
  );
}

export default App;
