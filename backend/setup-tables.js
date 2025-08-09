const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🚀 BTG Pactual - Configuración de Tablas DynamoDB');
console.log('================================================');

const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const tablePrefix = process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension';

const tables = [
  {
    name: `${tablePrefix}-users`,
    schema: {
      TableName: `${tablePrefix}-users`,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  },
  {
    name: `${tablePrefix}-subscriptions`,
    schema: {
      TableName: `${tablePrefix}-subscriptions`,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'subscriptionId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'subscriptionId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  },
  {
    name: `${tablePrefix}-notifications`,
    schema: {
      TableName: `${tablePrefix}-notifications`,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' },
        { AttributeName: 'notificationId', KeyType: 'RANGE' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'S' },
        { AttributeName: 'notificationId', AttributeType: 'S' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    }
  }
];

async function createTables() {
  console.log('\n📋 Creando tablas...');
  
  for (const table of tables) {
    try {
      console.log(`\n   ➜ Creando tabla: ${table.name}`);
      await dynamodb.createTable(table.schema).promise();
      console.log(`   ✅ Tabla creada exitosamente: ${table.name}`);
    } catch (error) {
      if (error.code === 'ResourceInUseException') {
        console.log(`   ⚠️  Tabla ya existe: ${table.name}`);
      } else {
        console.error(`   ❌ Error creando tabla ${table.name}:`, error.message);
      }
    }
  }
  
  console.log('\n🔍 Verificando tablas creadas...');
  try {
    const data = await dynamodb.listTables().promise();
    console.log(`   ➜ Total de tablas: ${data.TableNames.length}`);
    console.log(`   ➜ Tablas: ${data.TableNames.join(', ')}`);
    
    const btgTables = data.TableNames.filter(name => name.startsWith(tablePrefix));
    console.log(`   ➜ Tablas BTG: ${btgTables.join(', ')}`);
    
  } catch (error) {
    console.error('   ❌ Error listando tablas:', error.message);
  }
  
  console.log('\n✅ Configuración completada');
}

createTables().catch(console.error);
