// Script específico para verificar las URLs que están fallando
const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testSpecificEndpoints() {
    console.log('🔍 Probando endpoints específicos que están fallando...');
    
    try {
        // 1. Test user balance (equivalente a localhost:3000/api/user/user123/balance)
        console.log('\n1️⃣ Testing user balance...');
        const userResponse = await fetch(`${API_BASE_URL}/users/user123`);
        console.log('📝 User endpoint status:', userResponse.status);
        const userData = await userResponse.json();
        console.log('📋 User data:', JSON.stringify(userData, null, 2));
        
        // 2. Test funds (equivalente a localhost:3000/api/funds)
        console.log('\n2️⃣ Testing funds...');
        const fundsResponse = await fetch(`${API_BASE_URL}/funds`);
        console.log('📝 Funds endpoint status:', fundsResponse.status);
        const fundsData = await fundsResponse.json();
        console.log('📋 Funds data:', JSON.stringify(fundsData, null, 2));
        
        // 3. Test subscriptions
        console.log('\n3️⃣ Testing subscriptions...');
        const subscriptionsResponse = await fetch(`${API_BASE_URL}/subscriptions/user123`);
        console.log('📝 Subscriptions endpoint status:', subscriptionsResponse.status);
        const subscriptionsData = await subscriptionsResponse.json();
        console.log('📋 Subscriptions data:', JSON.stringify(subscriptionsData, null, 2));
        
        // 4. Test transactions
        console.log('\n4️⃣ Testing transactions...');
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions/user123`);
        console.log('📝 Transactions endpoint status:', transactionsResponse.status);
        const transactionsData = await transactionsResponse.json();
        console.log('📋 Transactions data:', JSON.stringify(transactionsData, null, 2));
        
        // 5. Test notifications
        console.log('\n5️⃣ Testing notifications...');
        const notificationsResponse = await fetch(`${API_BASE_URL}/notifications/user123`);
        console.log('📝 Notifications endpoint status:', notificationsResponse.status);
        const notificationsData = await notificationsResponse.json();
        console.log('📋 Notifications data:', JSON.stringify(notificationsData, null, 2));
        
        console.log('\n✅ Todas las pruebas completadas');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testSpecificEndpoints();
