console.log('Testing all route imports...\n');

const routes = [
  './src/routes/authRoutes',
  './src/routes/userRoutes',
  './src/routes/attendanceRoutes',
  './src/routes/leaveRoutes',
  './src/routes/payrollRoutes',
  './src/routes/signatureRoutes',
  './src/routes/reportRoutes',
  './src/routes/settingsRoutes',
  './src/routes/analyticsRoutes'
];

routes.forEach(route => {
  try {
    require(route);
    console.log(`✓ ${route}`);
  } catch (e) {
    console.error(`× ${route}: ${e.message}`);
  }
});

console.log('\nTesting middleware imports...\n');

const middleware = [
  './src/middleware/errorHandler',
  './src/middleware/rateLimiter'
];

middleware.forEach(mid => {
  try {
    require(mid);
    console.log(`✓ ${mid}`);
  } catch (e) {
    console.error(`× ${mid}: ${e.message}`);
  }
});

console.log('\nAll tests complete!');
