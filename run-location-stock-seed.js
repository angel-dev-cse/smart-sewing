const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

const prisma = new PrismaClient();

async function runLocationStockSeed() {
  try {
    console.log('Running location stock seeding...');

    // Read the SQL file
    const sqlContent = fs.readFileSync('prisma/seed_location_stock_from_product.sql', 'utf8');

    // Split into individual statements (basic approach)
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        console.log('Executing:', statement.substring(0, 50) + '...');
        await prisma.$executeRawUnsafe(statement);
      }
    }

    console.log('✅ Location stock seeding completed!');

    // Verify the results
    const locationStocks = await prisma.locationStock.findMany({
      include: {
        product: { select: { title: true } },
        location: { select: { code: true } }
      }
    });

    console.log('\n📊 LocationStock records created:');
    for (const ls of locationStocks) {
      console.log(`  ${ls.product.title}: ${ls.quantity} units at ${ls.location.code}`);
    }

  } catch (error) {
    console.error('❌ Error running location stock seed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

runLocationStockSeed();
