import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Pie, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Charts = ({ type, data, options = {} }) => {
  const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: document.documentElement.classList.contains('dark') ? '#fff' : '#374151'
        }
      }
    }
  };

  const chartData = {
    labels: data?.labels || [],
    datasets: data?.datasets || []
  };

  const renderChart = () => {
    switch (type) {
      case 'line':
        return <Line data={chartData} options={{ ...defaultOptions, ...options }} />;
      case 'bar':
        return <Bar data={chartData} options={{ ...defaultOptions, ...options }} />;
      case 'pie':
        return <Pie data={chartData} options={{ ...defaultOptions, ...options }} />;
      case 'doughnut':
        return <Doughnut data={chartData} options={{ ...defaultOptions, ...options }} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full h-64 md:h-80">
      {renderChart()}
    </div>
  );
};

export default Charts;