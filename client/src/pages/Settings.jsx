import React from 'react';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';
import ThemeToggle from '../components/settings/ThemeToggle';
import CompanySettings from '../components/settings/CompanySettings';
import ProfileSettings from '../components/settings/ProfileSettings';
import NotificationSettings from '../components/settings/NotificationSettings';
import SecuritySettings from '../components/settings/SecuritySettings';
import Tabs from '../components/common/Tabs';

const Settings = () => {
  const { isAdmin } = useAuth();
  const [activeTab, setActiveTab] = React.useState(0);

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'theme', label: 'Theme' },
    ...(isAdmin ? [{ id: 'company', label: 'Company' }] : [])
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 pb-20 lg:pb-0"
    >
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="card">
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab}>
          {activeTab === 0 && <ProfileSettings />}
          {activeTab === 1 && <NotificationSettings />}
          {activeTab === 2 && <SecuritySettings />}
          {activeTab === 3 && <ThemeToggle />}
          {activeTab === 4 && isAdmin && <CompanySettings />}
        </Tabs>
      </div>
    </motion.div>
  );
};

export default Settings;