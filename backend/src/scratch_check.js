import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';
import { WhatsAppCampaign } from './models/WhatsAppCampaign.js';
import { getTenantDbConnection } from './utils/connectionManager.js';
import { Tenant } from './models/master/Tenant.js';

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Master DB connected');
  
  const masterCampaigns = await WhatsAppCampaign.find({});
  console.log('Master campaigns count:', masterCampaigns.length);
  for (const c of masterCampaigns) {
    console.log(JSON.stringify({ id: c._id, name: c.name, total: c.totalContacts, sent: c.sentCount, failed: c.failedCount, status: c.status }));
    if (c.name.toLowerCase().includes('lithium') || c.totalContacts === 857) {
      console.log('MATCHED IN MASTER DB:');
      console.log('Campaign:', {
        id: c._id,
        name: c.name,
        total: c.totalContacts,
        sent: c.sentCount,
        failed: c.failedCount,
        status: c.status,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      });
      console.log('Contacts failed samples:', JSON.stringify(c.contacts.filter(x => x.status === 'failed').slice(0, 10), null, 2));
      console.log('Contacts pending samples:', JSON.stringify(c.contacts.filter(x => x.status === 'pending').slice(0, 5), null, 2));
    }
  }

  const tenants = await Tenant.find({});
  console.log('Tenants count:', tenants.length);
  for (const t of tenants) {
    console.log('Checking tenant:', t.name, t.dbName);
    const conn = getTenantDbConnection(t.dbName);
    const schema = mongoose.model('WhatsAppCampaign').schema;
    const TenantModel = conn.models['WhatsAppCampaign'] || conn.model('WhatsAppCampaign', schema);
    const campaigns = await TenantModel.find({});
    console.log('Found campaigns in tenant:', campaigns.length);
    for (const c of campaigns) {
      console.log(JSON.stringify({ id: c._id, name: c.name, total: c.totalContacts, sent: c.sentCount, failed: c.failedCount, status: c.status }));
      if (c.name.toLowerCase().includes('lithium') || c.totalContacts === 857) {
        console.log('MATCHED IN TENANT DB:', t.dbName);
        console.log('Campaign:', {
          id: c._id,
          name: c.name,
          total: c.totalContacts,
          sent: c.sentCount,
          failed: c.failedCount,
          status: c.status,
          createdAt: c.createdAt,
          updatedAt: c.updatedAt
        });
        const failedContacts = c.contacts.filter(x => x.status === 'failed');
        console.log('Total failed contacts:', failedContacts.length);
        console.log('Contacts failed samples:', JSON.stringify(failedContacts.slice(0, 15), null, 2));
        const pendingContacts = c.contacts.filter(x => x.status === 'pending');
        console.log('Total pending contacts:', pendingContacts.length);
        console.log('Contacts pending samples:', JSON.stringify(pendingContacts.slice(0, 5), null, 2));
      }
    }
  }

  process.exit(0);
}
check().catch(err => { console.error(err); process.exit(1); });
