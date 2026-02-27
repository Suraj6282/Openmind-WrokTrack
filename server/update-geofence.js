// Update Company Settings Geo-fence
const mongoose = require('mongoose');
require('dotenv').config();

const CompanySettings = require('./src/models/CompanySettings');

const updateGeoFence = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/openmind-worktrack');
    console.log('Connected to MongoDB');

    // Update or create company settings
    const settings = await CompanySettings.findOneAndUpdate(
      {},
      {
        $set: {
          'geoFence.companyLocation.lat': 23.032546,
          'geoFence.companyLocation.lng': 72.5030202,
          'geoFence.radius': 100,
          'geoFence.enabled': true
        }
      },
      { upsert: true, new: true }
    );

    console.log('Geo-fence settings updated successfully!');
    console.log('Location:', settings.geoFence.companyLocation);
    console.log('Radius:', settings.geoFence.radius, 'meters');
    
    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Error updating settings:', error);
    process.exit(1);
  }
};

updateGeoFence();
