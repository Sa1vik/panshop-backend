const mongoose = require('mongoose');
const dns = require('dns');
const dnsPromises = dns.promises;

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('MONGO URI (masked):', uri ? uri.replace(/:[^@]+@/, ':*****@') : 'undefined');

    // Optional DNS fallback for environments with restricted DNS
    if (process.env.USE_DNS_FALLBACK === 'true' && uri && uri.startsWith('mongodb+srv://')) {
      const host = uri.split('@')[1].split('/')[0];
      try {
        await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
      } catch (firstErr) {
        console.warn('SRV lookup failed with system DNS, switching to 8.8.8.8 for SRV resolution');
        try {
          dns.setServers(['8.8.8.8']);
          await dnsPromises.resolveSrv(`_mongodb._tcp.${host}`);
        } catch (secondErr) {
          console.warn('SRV lookup via 8.8.8.8 also failed:', secondErr && secondErr.message ? secondErr.message : secondErr);
        }
      }
    }

    const conn = await mongoose.connect(uri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
