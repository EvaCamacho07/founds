# BTG Pactual - Sistema de Gestión de Fondos de Pensión

Este es el frontend de la aplicación para gestión de fondos de pensión desarrollado con React, TypeScript y Material-UI.

## Características

- **Interfaz Moderna**: Desarrollada con Material-UI para una experiencia de usuario amigable
- **Gestión de Fondos**: Visualización y suscripción a fondos disponibles
- **Historial de Transacciones**: Seguimiento completo de suscripciones y cancelaciones
- **Centro de Notificaciones**: Sistema de notificaciones por email y SMS
- **Formato Colombiano**: Formateo de moneda en pesos colombianos (COP)
- **Responsive**: Adaptable a diferentes tamaños de pantalla

## Tecnologías Utilizadas

- **React 19**: Framework principal
- **TypeScript**: Para tipado estático
- **Material-UI (MUI)**: Componentes de interfaz de usuario
- **Axios**: Cliente HTTP para comunicación con el backend
- **Emotion**: Sistema de estilos CSS-in-JS

## Instalación y Ejecución

1. **Instalar dependencias**:
   ```bash
   npm install
   ```

2. **Configurar variables de entorno**:
   Crear un archivo `.env` en la raíz del proyecto:
   ```
   REACT_APP_API_URL=http://localhost:3000/api
   ```

3. **Ejecutar en modo desarrollo**:
   ```bash
   npm start
   ```
   La aplicación estará disponible en `http://localhost:3000`

4. **Compilar para producción**:
   ```bash
   npm run build
   ```

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
