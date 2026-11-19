import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

async function clean() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  // Purge dummy mock consultations
  const dummyConsultIds = ['CONS-AMAN-8', 'CONS-RADHA-29', 'CONS-RAMESH-62', 'CONS-BABY-1'];
  const r1 = await mongoose.connection.db.collection('consultations').deleteMany({
    id: { $in: dummyConsultIds }
  });
  console.log('Deleted dummy consultations:', r1.deletedCount);

  // Purge dummy mock prescriptions
  const dummyRxIds = ['RC-2026-98124', 'RC-2026-98125'];
  const r2 = await mongoose.connection.db.collection('prescriptions').deleteMany({
    id: { $in: dummyRxIds }
  });
  console.log('Deleted dummy prescriptions:', r2.deletedCount);

  await mongoose.disconnect();
  console.log('Done!');
  process.exit(0);
}

clean().catch(err => {
  console.error(err);
  process.exit(1);
});
