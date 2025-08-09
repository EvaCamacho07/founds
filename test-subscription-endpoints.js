// Test de endpoints de suscripción y cancelación
const baseURL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testSubscriptionEndpoints() {
    console.log('🔍 Probando endpoints de suscripción y cancelación...\n');
    
    try {
        // 1. Test POST /api/funds/subscribe
        console.log('1️⃣ Testing subscription...');
        const subscribeResponse = await fetch(`${baseURL}/funds/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fundId: 3, // DEUDAPRIVADA (50,000 COP)
                fundName: "DEUDAPRIVADA",
                amount: 50000
            })
        });
        
        console.log(`📝 Subscribe endpoint status: ${subscribeResponse.status}`);
        const subscribeData = await subscribeResponse.text();
        console.log(`📋 Subscribe response: ${subscribeData}\n`);
        
        // 2. Test POST /api/funds/unsubscribe
        console.log('2️⃣ Testing unsubscription...');
        const unsubscribeResponse = await fetch(`${baseURL}/funds/unsubscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                fundId: 3
            })
        });
        
        console.log(`📝 Unsubscribe endpoint status: ${unsubscribeResponse.status}`);
        const unsubscribeData = await unsubscribeResponse.text();
        console.log(`📋 Unsubscribe response: ${unsubscribeData}\n`);
        
        // 3. Test GET /api/user/state vs /api/user/user123
        console.log('3️⃣ Testing user state endpoints...');
        
        // Test /api/user/state
        try {
            const userStateResponse = await fetch(`${baseURL}/user/state`);
            console.log(`📝 User state endpoint status: ${userStateResponse.status}`);
            if (userStateResponse.status === 200) {
                const userStateData = await userStateResponse.json();
                console.log(`📋 User state data:`, JSON.stringify(userStateData, null, 2));
            } else {
                const errorText = await userStateResponse.text();
                console.log(`❌ User state error: ${errorText}`);
            }
        } catch (error) {
            console.log(`❌ User state error: ${error.message}`);
        }
        
        // Test /api/user/user123 (que sabemos que funciona)
        const userResponse = await fetch(`${baseURL}/user/user123`);
        console.log(`📝 User user123 endpoint status: ${userResponse.status}`);
        if (userResponse.status === 200) {
            const userData = await userResponse.json();
            console.log(`📋 User user123 data:`, JSON.stringify(userData, null, 2));
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
    
    console.log('\n✅ Pruebas de suscripción completadas');
}

testSubscriptionEndpoints();
