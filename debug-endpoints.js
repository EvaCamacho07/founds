// Test específico para endpoints problemáticos
const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testProblematicEndpoints() {
    try {
        console.log('🧪 Testing problematic endpoints...');
        
        // First create a user and subscription
        const userPayload = {
            name: 'Test User Debug',
            email: 'testdebug@btgpactual.com',
            phone: '+573001234567'
        };
        
        const userResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userPayload)
        });
        
        const userData = await userResponse.json();
        console.log('✅ Usuario creado:', userData.data.userId);
        
        // Subscribe to fund
        const subscriptionPayload = {
            userId: userData.data.userId,
            fundId: 1,
            amount: 100000
        };
        
        const subscribeResponse = await fetch(`${API_BASE_URL}/transactions/subscribe`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(subscriptionPayload)
        });
        
        const subscriptionData = await subscribeResponse.json();
        console.log('✅ Suscripción creada');
        
        // Now test the problematic endpoints
        console.log('\n🔍 Testing problematic endpoints:');
        
        // 1. Test transactions endpoint
        console.log('\n1️⃣ Testing transactions endpoint...');
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions/${userData.data.userId}`);
        const transactionsResult = await transactionsResponse.json();
        console.log('📝 Transactions status:', transactionsResponse.status);
        console.log('📋 Transactions response:', JSON.stringify(transactionsResult, null, 2));
        
        // 2. Test subscriptions endpoint
        console.log('\n2️⃣ Testing subscriptions endpoint...');
        const subscriptionsResponse = await fetch(`${API_BASE_URL}/subscriptions/${userData.data.userId}`);
        const subscriptionsResult = await subscriptionsResponse.json();
        console.log('📝 Subscriptions status:', subscriptionsResponse.status);
        console.log('📋 Subscriptions response:', JSON.stringify(subscriptionsResult, null, 2));
        
        // 3. Test notifications endpoint
        console.log('\n3️⃣ Testing notifications endpoint...');
        const notificationsResponse = await fetch(`${API_BASE_URL}/notifications/${userData.data.userId}`);
        const notificationsResult = await notificationsResponse.json();
        console.log('📝 Notifications status:', notificationsResponse.status);
        console.log('📋 Notifications response:', JSON.stringify(notificationsResult, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testProblematicEndpoints();
