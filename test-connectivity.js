// Prueba de conectividad frontend-backend
// Este script verifica que el frontend pueda conectarse al backend

const API_BASE_URL = 'https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api';

async function testBackendConnectivity() {
    console.log('🧪 Iniciando pruebas de conectividad Frontend → Backend');
    console.log('📡 API Base URL:', API_BASE_URL);
    
    try {
        // Test 1: Health Check
        console.log('\n1️⃣ Probando Health Check...');
        const healthResponse = await fetch(`${API_BASE_URL}/health`);
        const healthData = await healthResponse.json();
        console.log('✅ Health Check:', healthData);
        
        // Test 2: Get Funds
        console.log('\n2️⃣ Probando obtención de fondos...');
        const fundsResponse = await fetch(`${API_BASE_URL}/funds`);
        const fundsData = await fundsResponse.json();
        console.log('✅ Fondos disponibles:', fundsData.data.length, 'fondos');
        console.log('📊 Fondos:', fundsData.data.map(f => f.name));
        
        // Test 3: Create User
        console.log('\n3️⃣ Probando creación de usuario...');
        const userPayload = {
            name: 'Usuario de Prueba Frontend',
            email: 'test-frontend@btg.com',
            phone: '+573001111111'
        };
        
        const createUserResponse = await fetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userPayload)
        });
        
        const userData = await createUserResponse.json();
        console.log('✅ Usuario creado:', userData.data.userId);
        console.log('💰 Balance inicial:', userData.data.availableBalance, 'COP');
        
        // Test 4: Subscribe to Fund
        console.log('\n4️⃣ Probando suscripción a fondo...');
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
        console.log('✅ Suscripción exitosa:', subscriptionData.subscription.subscriptionId);
        console.log('💰 Nuevo balance:', subscriptionData.newBalance.availableBalance, 'COP');
        
        // Test 5: Get Transactions
        console.log('\n5️⃣ Probando historial de transacciones...');
        const transactionsResponse = await fetch(`${API_BASE_URL}/transactions/${userData.data.userId}`);
        const transactionsData = await transactionsResponse.json();
        console.log('✅ Transacciones encontradas:', transactionsData.data.length);
        
        console.log('\n🎉 TODAS LAS PRUEBAS EXITOSAS - Frontend conectado correctamente con Backend!');
        console.log('🌐 Frontend URL: https://d2v0pdx5y6xxrr.cloudfront.net');
        console.log('🚀 Backend API: https://2707pya55l.execute-api.us-east-1.amazonaws.com/dev/api');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error en las pruebas:', error);
        return false;
    }
}

// Ejecutar pruebas
testBackendConnectivity();
