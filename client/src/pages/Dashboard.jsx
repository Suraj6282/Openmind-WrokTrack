import React from 'react';
import useAuth from '../hooks/useAuth';
import AdminDashboard from '../components/dashboard/AdminDashboard';
import EmployeeDashboard from '../components/dashboard/EmployeeDashboard';

const Dashboard = () => {
  const { isAdmin } = useAuth();

  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};

export default Dashboard;