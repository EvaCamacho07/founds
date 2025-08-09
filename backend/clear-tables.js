const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const AWS = require('aws-sdk');

// Configurar AWS DynamoDB
AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const docClient = new AWS.DynamoDB.DocumentClient();

const tableNames = [
  `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-users`,
  `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-subscriptions`,
  `${process.env.DYNAMODB_TABLE_PREFIX || 'btg-pension'}-notifications`
];

async function clearTable(tableName) {
  try {
    console.log(`🧹 Limpiando tabla: ${tableName}`);
    
    // Obtener todos los elementos de la tabla
    const scanParams = {
      TableName: tableName
    };
    
    const result = await docClient.scan(scanParams).promise();
    
    if (result.Items && result.Items.length > 0) {
      console.log(`   📋 Encontrados ${result.Items.length} elementos para eliminar`);
      
      // Eliminar elementos en lotes
      for (const item of result.Items) {
        let deleteParams;
        
        // Diferentes claves primarias según la tabla
        if (tableName.includes('users')) {
          deleteParams = {
            TableName: tableName,
            Key: {
              userId: item.userId
            }
          };
        } else if (tableName.includes('subscriptions')) {
          deleteParams = {
            TableName: tableName,
            Key: {
              userId: item.userId,
              subscriptionId: item.subscriptionId
            }
          };
        } else if (tableName.includes('notifications')) {
          deleteParams = {
            TableName: tableName,
            Key: {
              userId: item.userId,
              notificationId: item.notificationId
            }
          };
        }
        
        if (deleteParams) {
          await docClient.delete(deleteParams).promise();
        }
      }
      
      console.log(`   ✅ Eliminados ${result.Items.length} elementos de ${tableName}`);
    } else {
      console.log(`   ℹ️  La tabla ${tableName} ya está vacía`);
    }
    
  } catch (error) {
    console.error(`   ❌ Error limpiando tabla ${tableName}:`, error.message);
  }
}

async function clearAllTables() {
  console.log('🚀 BTG Pactual - Iniciando limpieza de tablas DynamoDB\n');
  
  for (const tableName of tableNames) {
    await clearTable(tableName);
  }
  
  console.log('\n✨ Limpieza completada! Todas las tablas están vacías.');
  console.log('💡 El balance inicial de COP $500,000 se creará automáticamente cuando hagas la primera consulta.');
}

// Ejecutar limpieza
clearAllTables().catch(console.error);
