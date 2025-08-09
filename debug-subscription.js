// Test de suscripción específico para debug
const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testSubscription() {
    try {
        console.log('🧪 Testing subscription...');
        
        // First create a user
        const userPayload = {
            name: 'Test User',
            email: 'test@btgpactual.com',
            phone: '+573001234567'
        };
        
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userPayload)
        });
        
        const userData = await userResponse.json();
        console.log('✅ Usuario creado:', userData.data.userId);
        
        // Now subscribe to fund
        const subscriptionPayload = {
            userId: userData.data.userId,
            fundId: 1,
            amount: 100000
        };
        
        const subscribeResponse = await fetch(`${API_BASE_URL}/transactions/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(subscriptionPayload)
        });
        
        const subscriptionData = await subscribeResponse.json();
        console.log('📝 Subscription status:', subscribeResponse.status);
        console.log('📋 Full subscription response:', JSON.stringify(subscriptionData, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSubscription();
