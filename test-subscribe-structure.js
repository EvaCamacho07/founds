// Test detallado del endpoint de suscripción
const baseURL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testSubscribeResponse() {
    console.log('🔍 Probando estructura de respuesta de suscripción...\n');
    
    try {
        // 1. Crear usuario
        const userPayload = {
            name: 'Usuario Test Estructura',
            email: 'estructura-test@btg.com',
            phone: '+573001133445'
        };
        
        const createUserResponse = await fetch(`${baseURL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        
        const userData = await createUserResponse.json();
        const userId = userData.data.userId;
        console.log(`✅ Usuario creado: ${userId}`);
        
        // 2. Suscribir y ver estructura completa
        console.log('🔍 Suscribiendo y analizando respuesta...');
        const subscribeResponse = await fetch(`${baseURL}/transactions/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId,
                fundId: 1,
                amount: 75000  // Monto mínimo requerido
            })
        });
        
        const subscriptionData = await subscribeResponse.json();
        console.log('📋 Respuesta completa de suscripción:');
        console.log(JSON.stringify(subscriptionData, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSubscribeResponse();
