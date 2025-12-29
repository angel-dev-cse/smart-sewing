const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUnits() {
  try {
    console.log('Testing database connection...');

    // Check if Unit table exists
    const units = await prisma.unit.findMany({ take: 1 });
    console.log('✅ Unit table exists, found', units.length, 'units');

    // Check if Product has the new fields
    const products = await prisma.product.findMany({
      where: { isAssetTracked: true },
      take: 1
    });
    console.log('✅ Product table has isAssetTracked field, found', products.length, 'asset-tracked products');

    // Check if locations exist
    const locations = await prisma.location.findMany({ take: 5 });
    console.log('✅ Found', locations.length, 'locations:', locations.map(l => l.code));

    // Check if parties exist
    const parties = await prisma.party.findMany({ take: 1 });
    console.log('✅ Found parties in database');

  } catch (error) {
    console.error('❌ Database test failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testUnits();
