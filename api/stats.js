const { connectToDatabase } = require('./db');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    const { db } = await connectToDatabase();
    const incidentsCount = await db.collection('incidents').countDocuments();
    const usersCount = await db.collection('users').countDocuments();

    return res.status(200).json({
      success: true,
      data: {
        activeRoads: 142,
        highCongestionSegments: 18,
        activeIncidents: incidentsCount || 4,
        emergencyUnits: 3,
        usersCount: usersCount || 4,
        database: 'MongoDB Atlas (Live Connected)'
      }
    });
  } catch (error) {
    console.error('Stats API Error:', error);
    res.status(200).json({
      success: false,
      error: error.message,
      data: {
        activeRoads: 142,
        highCongestionSegments: 18,
        activeIncidents: 4,
        emergencyUnits: 3,
        usersCount: 4,
        database: 'Offline Mock'
      }
    });
  }
};
