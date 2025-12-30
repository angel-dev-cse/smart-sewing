// test-phase8d21.js - Unit Identity Rules Tests
// Test the unit identity rules from Phase 8D.2.1

const { computeUniqueSerialKey, generateTagCode, validateUnitData } = require('./src/lib/unit-utils.ts');

// Mock database for tag generation tests
const mockDb = {
  shopTagCounter: {
    upsert: async ({ where, update, create, select }) => {
      // Mock implementation - in real test, this would use actual DB
      if (where.prefix === 'SS-M') {
        return { nextValue: 42 }; // Mock next value
      }
      return { nextValue: 2 };
    }
  }
};

async function testComputeUniqueSerialKey() {
  console.log('Testing computeUniqueSerialKey...');

  // Test basic functionality
  const key1 = computeUniqueSerialKey('JUKI', 'JK-809D', 'ABC123');
  console.log('Key1:', key1);
  assert(key1 === 'JUKI-JK-809D-ABC123', 'Basic serial key computation failed');

  // Test normalization
  const key2 = computeUniqueSerialKey('Juki ', ' JK-809D ', ' abc-123 ');
  console.log('Key2:', key2);
  assert(key2 === 'JUKI-JK-809D-ABC-123', 'Normalization failed');

  // Test special characters
  const key3 = computeUniqueSerialKey('Brother', 'Model X', 'SN#456/789');
  console.log('Key3:', key3);
  assert(key3 === 'BROTHER-MODEL-X-SN-456-789', 'Special character handling failed');

  console.log('✅ computeUniqueSerialKey tests passed');
}

async function testGenerateTagCode() {
  console.log('Testing generateTagCode...');

  // Test machine tag generation
  const tag1 = await generateTagCode(mockDb, 'M');
  console.log('Machine tag:', tag1);
  assert(tag1 === 'SS-M-00041', 'Machine tag generation failed'); // 42-1 = 41, padded to 00041

  // Test parts tag generation
  const tag2 = await generateTagCode(mockDb, 'P');
  console.log('Parts tag:', tag2);
  assert(tag2 === 'SS-P-00001', 'Parts tag generation failed');

  console.log('✅ generateTagCode tests passed');
}

async function testValidateUnitData() {
  console.log('Testing validateUnitData...');

  // Test OWNED unit with required fields
  const result1 = validateUnitData({
    ownershipType: 'OWNED',
    productId: 'prod-123',
    brand: 'JUKI',
    model: 'JK-809D',
    manufacturerSerial: 'ABC123',
    productSerialRequired: true
  });
  console.log('OWNED unit validation:', result1);
  assert(result1.isValid === true, 'OWNED unit validation failed');
  assert(result1.uniqueSerialKey === 'JUKI-JK-809D-ABC123', 'Serial key not computed correctly');

  // Test CUSTOMER_OWNED unit
  const result2 = validateUnitData({
    ownershipType: 'CUSTOMER_OWNED',
    brand: 'Brother',
    model: 'Model X',
    manufacturerSerial: 'SN456',
    ownerPartyId: 'party-123'
  });
  console.log('CUSTOMER_OWNED unit validation:', result2);
  assert(result2.isValid === true, 'CUSTOMER_OWNED unit validation failed');

  // Test missing brand/model
  const result3 = validateUnitData({
    ownershipType: 'OWNED',
    productId: 'prod-123',
    brand: '',
    model: 'JK-809D',
    manufacturerSerial: 'ABC123'
  });
  console.log('Missing brand validation:', result3);
  assert(result3.isValid === false, 'Should fail when brand is missing');
  assert(result3.error.includes('Brand and model are required'), 'Wrong error message');

  // Test serial required but missing
  const result4 = validateUnitData({
    ownershipType: 'OWNED',
    productId: 'prod-123',
    brand: 'JUKI',
    model: 'JK-809D',
    manufacturerSerial: null,
    productSerialRequired: true
  });
  console.log('Serial required validation:', result4);
  assert(result4.isValid === false, 'Should fail when serial is required but missing');

  console.log('✅ validateUnitData tests passed');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTests() {
  try {
    console.log('🧪 Running Phase 8D.2.1 Unit Identity Rules Tests...\n');

    await testComputeUniqueSerialKey();
    await testGenerateTagCode();
    await testValidateUnitData();

    console.log('\n✅ All Phase 8D.2.1 tests passed!');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();

