import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuth from './hooks/useAuth';
import { useTheme } from './contexts/ThemeContext';
import Sidebar from './components/common/Sidebar';
import MobileNav from './components/common/MobileNav';
import Header from './components/common/Header';
import PrivateRoute from './components/common/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import Leave from './pages/Leave';
import Payroll from './pages/Payroll';
import SalarySlip from './pages/SalarySlip';
import Employees from './pages/Employees';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated, loading } = useAuth();
  const { theme } = useTheme();

  useEffect(() => {
    console.log('App state:', { isAuthenticated, loading });
  }, [isAuthenticated, loading]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: theme === 'dark' ? '#1f2937' : '#fff',
              color: theme === 'dark' ? '#fff' : '#1f2937',
            },
          }}
        />
        
        {isAuthenticated ? (
          <div className="flex h-screen">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
              <Header />
              <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-20 lg:pb-6">
                <Routes>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                  <Route path="/attendance" element={<PrivateRoute><Attendance /></PrivateRoute>} />
                  <Route path="/leave" element={<PrivateRoute><Leave /></PrivateRoute>} />
                  <Route path="/payroll" element={<PrivateRoute><Payroll /></PrivateRoute>} />
                  <Route path="/salary-slips" element={<PrivateRoute><SalarySlip /></PrivateRoute>} />
                  <Route path="/employees" element={<PrivateRoute adminOnly><Employees /></PrivateRoute>} />
                  <Route path="/reports" element={<PrivateRoute adminOnly><Reports /></PrivateRoute>} />
                  <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
            <MobileNav />
          </div>
        ) : (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App;