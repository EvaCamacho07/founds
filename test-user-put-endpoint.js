// Script para agregar endpoint PUT de usuarios al backend actual
const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testBackendAndSuggestFix() {
  console.log('🔍 Probando endpoints del backend actual...');
  
  try {
    // Test GET users (sabemos que funciona)
    const getResponse = await fetch(`${API_BASE_URL}/users/user123`);
    console.log('✅ GET /users/user123:', getResponse.status);
    
    if (getResponse.status === 200) {
      const userData = await getResponse.json();
      console.log('📋 Estructura de usuario actual:', {
        success: userData.success,
        hasData: !!userData.data,
        userFields: userData.data ? Object.keys(userData.data) : 'N/A'
      });
    }
    
    // Test PUT users (esperamos que falle)
    try {
      const putResponse = await fetch(`${API_BASE_URL}/users/user123`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'user123',
          preferredMethod: 'email',
          email: 'test@btgpactual.com',
          phoneNumber: '+573001234567'
        })
      });
      
      console.log('📝 PUT /users/user123:', putResponse.status);
      
      if (putResponse.status !== 200) {
        const errorData = await putResponse.json();
        console.log('❌ PUT Error:', errorData);
        
        console.log('\n💡 SOLUCIÓN NECESARIA:');
        console.log('El backend necesita un endpoint PUT en /users/{userId} que permita actualizar:');
        console.log('- preferredMethod (email/sms)');
        console.log('- email');
        console.log('- phoneNumber');
      } else {
        console.log('✅ PUT ya funciona!');
      }
    } catch (putError) {
      console.log('❌ PUT Error:', putError.message);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error.message);
  }
}

testBackendAndSuggestFix();
