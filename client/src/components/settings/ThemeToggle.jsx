import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme, setSystemTheme } = useTheme();

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Theme Settings</h3>
      
      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => setSystemTheme()}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'system' 
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
          }`}
        >
          <Monitor className={`w-6 h-6 mx-auto mb-2 ${
            theme === 'system' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`text-sm ${
            theme === 'system' ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-400'
          }`}>
            System
          </span>
        </button>

        <button
          onClick={() => theme !== 'light' && toggleTheme()}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'light' 
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
          }`}
        >
          <Sun className={`w-6 h-6 mx-auto mb-2 ${
            theme === 'light' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`text-sm ${
            theme === 'light' ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-400'
          }`}>
            Light
          </span>
        </button>

        <button
          onClick={() => theme !== 'dark' && toggleTheme()}
          className={`p-4 rounded-lg border-2 transition-all ${
            theme === 'dark' 
              ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
          }`}
        >
          <Moon className={`w-6 h-6 mx-auto mb-2 ${
            theme === 'dark' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-400'
          }`} />
          <span className={`text-sm ${
            theme === 'dark' ? 'text-primary-600 font-medium' : 'text-gray-600 dark:text-gray-400'
          }`}>
            Dark
          </span>
        </button>
      </div>
    </div>
  );
};

export default ThemeToggle;