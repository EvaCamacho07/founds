const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

console.log('🔍 Verificando configuración AWS:');
console.log('   ➜ AWS_REGION:', process.env.AWS_REGION);
console.log('   ➜ AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? '✅ Configurado' : '❌ No configurado');
console.log('   ➜ AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? '✅ Configurado' : '❌ No configurado');

// Test básico de DynamoDB
const AWS = require('aws-sdk');

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();

console.log('\n🔗 Probando conexión con DynamoDB...');

dynamodb.listTables({}, (err, data) => {
  if (err) {
    console.error('❌ Error conectando con DynamoDB:', err.message);
    if (err.code === 'UnauthorizedOperation' || err.code === 'InvalidUserID.NotFound') {
      console.error('   ➜ Problema con las credenciales AWS');
    } else if (err.code === 'NetworkingError') {
      console.error('   ➜ Problema de red');
    }
  } else {
    console.log('✅ Conexión exitosa con DynamoDB');
    console.log('   ➜ Tablas encontradas:', data.TableNames.length);
    console.log('   ➜ Tablas:', data.TableNames);
  }
});
