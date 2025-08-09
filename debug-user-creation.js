// Test rápido de creación de usuario para debug
const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testUserCreation() {
    try {
        console.log('🧪 Testing user creation...');
        
        const userPayload = {
            name: 'Test User',
            email: 'test@btgpactual.com',
            phone: '+573001234567'
        };
        
        const response = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userPayload)
        });
        
        const result = await response.json();
        console.log('📝 Response status:', response.status);
        console.log('📋 Full response:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

testUserCreation();
