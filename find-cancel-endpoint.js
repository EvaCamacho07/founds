// Test para encontrar el endpoint correcto de cancelación
const baseURL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function findCancelEndpoint() {
    console.log('🔍 Buscando endpoint de cancelación...\n');
    
    try {
        // Usar los datos del test anterior
        const userId = 'user_1754754752008';
        const subscriptionId = 'sub_1754754752334';
        
        console.log(`Probando cancelación para suscripción: ${subscriptionId}`);
        
        // Posibles endpoints a probar
        const endpoints = [
            { method: 'POST', path: '/transactions/cancel', body: { subscriptionId } },
            { method: 'DELETE', path: '/transactions/cancel', body: { subscriptionId } },
            { method: 'POST', path: '/transactions/unsubscribe', body: { subscriptionId } },
            { method: 'PUT', path: '/transactions/cancel', body: { subscriptionId } },
            { method: 'POST', path: '/subscriptions/cancel', body: { subscriptionId } },
            { method: 'DELETE', path: `/subscriptions/${subscriptionId}`, body: null },
            { method: 'POST', path: '/transactions/cancel', body: { userId, subscriptionId } },
            { method: 'POST', path: '/users/unsubscribe', body: { userId, subscriptionId } },
        ];
        
        for (const endpoint of endpoints) {
            console.log(`\n   Probando ${endpoint.method} ${endpoint.path}...`);
            try {
                const options = {
                    method: endpoint.method,
                    headers: { 'Content-Type': 'application/json' }
                };
                
                if (endpoint.body) {
                    options.body = JSON.stringify(endpoint.body);
                }
                
                const response = await fetch(`${baseURL}${endpoint.path}`, options);
                console.log(`     Status: ${response.status}`);
                
                if (response.status !== 404) {
                    const result = await response.text();
                    console.log(`     ✅ RESPUESTA ENCONTRADA: ${result}`);
                    
                    if (response.status === 200) {
                        console.log(`     🎉 ENDPOINT CORRECTO ENCONTRADO: ${endpoint.method} ${endpoint.path}`);
                        return;
                    }
                }
            } catch (e) {
                console.log(`     Error: ${e.message}`);
            }
        }
        
        console.log('\n❌ No se encontró ningún endpoint de cancelación funcionando');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

findCancelEndpoint();
