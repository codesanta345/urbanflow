const { ObjectId } = require('mongodb');
const { connectToDatabase } = require('./db');

const SEED_USERS = [
  {
    displayName: 'Shruti',
    role: 'admin',
    roleTitle: 'System Administrator',
    accessLevel: 'Full Root Admin',
    permissions: 'Complete infrastructure access, user management, ML model retraining',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    displayName: 'Agrim Bhatt',
    role: 'traffic_manager',
    roleTitle: 'Traffic Authority Officer',
    accessLevel: 'Traffic Manager',
    permissions: 'Adaptive signal adjustments, manual overrides, incident verification',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    displayName: 'Patiala Central Control',
    role: 'traffic_manager',
    roleTitle: 'Dispatch Operator',
    accessLevel: 'Traffic Manager',
    permissions: 'Emergency corridor routing, live alert broadcasting',
    status: 'Active',
    createdAt: new Date().toISOString()
  },
  {
    displayName: 'Simranjeet Singh',
    role: 'user',
    roleTitle: 'Commuter / Citizen',
    accessLevel: 'Standard User',
    permissions: 'Route planning, traffic map viewing, incident reporting',
    status: 'Active',
    createdAt: new Date().toISOString()
  }
];

module.exports = async function handler(req, res) {
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
    const collection = db.collection('users');

    if (req.method === 'GET') {
      let users = await collection.find({}).toArray();
      if (users.length === 0) {
        await collection.insertMany(SEED_USERS);
        users = await collection.find({}).toArray();
      }
      return res.status(200).json({ success: true, data: users });
    }

    if (req.method === 'POST') {
      const { displayName, role, roleTitle, accessLevel, permissions } = req.body || {};
      if (!displayName || !role) {
        return res.status(400).json({ success: false, error: 'Name and role are required' });
      }
      const newUser = {
        displayName,
        role,
        roleTitle: roleTitle || (role === 'admin' ? 'Administrator' : role === 'traffic_manager' ? 'Traffic Authority' : 'Commuter'),
        accessLevel: accessLevel || (role === 'admin' ? 'Full Root Admin' : 'Standard User'),
        permissions: permissions || 'Standard permissions',
        status: 'Active',
        createdAt: new Date().toISOString()
      };
      const result = await collection.insertOne(newUser);
      return res.status(201).json({ success: true, insertedId: result.insertedId, user: newUser });
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, error: 'Missing user id' });
      let query = {};
      try { query = { _id: new ObjectId(id) }; } catch (e) { query = { _id: id }; }
      const result = await collection.deleteOne(query);
      return res.status(200).json({ success: true, deletedCount: result.deletedCount });
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('User API Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
