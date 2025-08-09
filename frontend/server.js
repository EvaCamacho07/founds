const express = require('express');
const path = require('path');

const app = express();
const PORT = 3001; // Puerto diferente al backend

// Servir archivos estáticos
app.use(express.static(__dirname));

// Ruta principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        service: 'BTG Pactual Frontend',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('🎨 Frontend ejecutándose en:');
    console.log(`   ➜ Local: http://localhost:${PORT}`);
    console.log(`   ➜ Health: http://localhost:${PORT}/health`);
    console.log('');
    console.log('✅ BTG Pactual - Frontend iniciado correctamente');
});

module.exports = app;
