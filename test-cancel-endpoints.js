// Test para encontrar el endpoint de cancelación de suscripción
const baseURL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testCancelEndpoints() {
    console.log('🔍 Probando endpoints de cancelación...\n');
    
    try {
        // 1. Crear usuario
        console.log('1️⃣ Creando usuario...');
        const userPayload = {
            name: 'Usuario Cancelación Test',
            email: 'cancel-test@btg.com',
            phone: '+573001122334'
        };
        
        const createUserResponse = await fetch(`${baseURL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        
        const userData = await createUserResponse.json();
        const userId = userData.data.userId;
        console.log(`✅ Usuario creado: ${userId}`);
        
        // 2. Suscribir a un fondo
        console.log('2️⃣ Suscribiendo a fondo...');
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
        console.log(`✅ Suscripción creada: ${subscriptionData.subscription.subscriptionId}`);
        
        // 3. Probar diferentes endpoints de cancelación
        const subscriptionId = subscriptionData.subscription.subscriptionId;
        console.log('3️⃣ Probando endpoints de cancelación...');
        
        // Opción 1: DELETE /transactions/unsubscribe
        console.log('   Probando DELETE /transactions/unsubscribe...');
        try {
            const unsubResponse1 = await fetch(`${baseURL}/transactions/unsubscribe`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: subscriptionId })
            });
            console.log(`     Status: ${unsubResponse1.status}`);
            if (unsubResponse1.status !== 404) {
                const result = await unsubResponse1.text();
                console.log(`     Response: ${result}`);
            }
        } catch (e) {
            console.log(`     Error: ${e.message}`);
        }
        
        // Opción 2: POST /transactions/unsubscribe
        console.log('   Probando POST /transactions/unsubscribe...');
        try {
            const unsubResponse2 = await fetch(`${baseURL}/transactions/unsubscribe`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ subscriptionId: subscriptionId })
            });
            console.log(`     Status: ${unsubResponse2.status}`);
            if (unsubResponse2.status !== 404) {
                const result = await unsubResponse2.text();
                console.log(`     Response: ${result}`);
            }
        } catch (e) {
            console.log(`     Error: ${e.message}`);
        }
        
        // Opción 3: DELETE /subscriptions/{id}
        console.log('   Probando DELETE /subscriptions/{id}...');
        try {
            const unsubResponse3 = await fetch(`${baseURL}/subscriptions/${subscriptionId}`, {
                method: 'DELETE'
            });
            console.log(`     Status: ${unsubResponse3.status}`);
            if (unsubResponse3.status !== 404) {
                const result = await unsubResponse3.text();
                console.log(`     Response: ${result}`);
            }
        } catch (e) {
            console.log(`     Error: ${e.message}`);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Pruebas de cancelación completadas');
}

testCancelEndpoints();
