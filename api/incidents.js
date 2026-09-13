const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./db');

const SEED_INCIDENTS = [
  {
    title: '💥 Vehicle Collision / Accident',
    type: 'Accident',
    severity: 'Critical',
    road: 'Road C (Main Bypass Highway)',
    city: 'Patiala',
    reportedBy: 'Citizen Traffic Reporter',
    description: 'Two-vehicle collision & lane blocked on exit ramp.',
    delayImpact: '+15 min delay',
    status: 'Verified',
    createdAt: new Date().toISOString()
  },
  {
    title: '🚧 Roadwork / Construction',
    type: 'Roadwork',
    severity: 'Moderate',
    road: 'Road A (Phase 7 Chowk)',
    city: 'Patiala',
    reportedBy: 'Municipal Authority',
    description: 'Pipe laying underway & single lane open.',
    delayImpact: '+8 min delay',
    status: 'In Progress',
    createdAt: new Date().toISOString()
  },
  {
    title: '🚗 Stalled Vehicle / Breakdown',
    type: 'Breakdown',
    severity: 'Minor',
    road: 'Road D (Lower Mall Road)',
    city: 'Patiala',
    reportedBy: 'Traffic Patrol',
    description: 'Stalled car on shoulder lane, tow truck dispatched.',
    delayImpact: '+3 min delay',
    status: 'Reported',
    createdAt: new Date().toISOString()
  },
  {
    title: '🚦 Traffic Signal Malfunction',
    type: 'Signal Failure',
    severity: 'Moderate',
    road: 'Urban Estate Phase 2 Market',
    city: 'Patiala',
    reportedBy: 'Traffic Warden',
    description: 'Blinking amber on north-bound lane.',
    delayImpact: '+6 min delay',
    status: 'Reported',
    createdAt: new Date().toISOString()
  }
];

module.exports = async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
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
    const collection = db.collection('incidents');

    if (req.method === 'GET') {
      let incidents = await collection.find({}).sort({ createdAt: -1 }).toArray();
      if (incidents.length === 0) {
        await collection.insertMany(SEED_INCIDENTS);
        incidents = await collection.find({}).sort({ createdAt: -1 }).toArray();
      }
      return res.status(200).json({ success: true, data: incidents });
    }

    if (req.method === 'POST') {
      const data = req.body || {};
      const newIncident = {
        title: data.title || `${data.type || 'Incident'} at ${data.road || 'City Road'}`,
        type: data.type || 'Accident',
        severity: data.severity || 'Moderate',
        road: data.road || 'Unspecified Road',
        city: data.city || 'Patiala',
        reportedBy: data.reportedBy || 'Citizen',
        description: data.description || '',
        delayImpact: data.delayImpact || '+5 min delay',
        status: data.status || 'Reported',
        createdAt: new Date().toISOString()
      };

      const result = await collection.insertOne(newIncident);
      return res.status(201).json({ success: true, insertedId: result.insertedId, incident: newIncident });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ success: false, error: 'Missing incident id' });
      }
      let query = {};
      try {
        query = { _id: new ObjectId(id) };
      } catch (e) {
        query = { _id: id };
      }
      const result = await collection.deleteOne(query);
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    if (req.method === 'PATCH') {
      const { id, status } = req.body || {};
      if (!id || !status) {
        return res.status(400).json({ success: false, error: 'Missing id or status' });
      }
      let query = {};
      try {
        query = { _id: new ObjectId(id) };
      } catch (e) {
        query = { _id: id };
      }
      const result = await collection.updateOne(query, { $set: { status, updatedAt: new Date().toISOString() } });
      return res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
