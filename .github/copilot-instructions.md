# Copilot Instructions

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Context
This is a fullstack pension and investment funds management system with the following structure:

- **Backend**: Node.js with Express and TypeScript, DynamoDB integration
- **Frontend**: React with Material-UI and TypeScript
- **Infrastructure**: AWS CloudFormation for deployment
- **Database**: DynamoDB (NoSQL)

## Business Rules
- Initial balance: COP $500,000
- Each transaction must have a unique identifier
- Validate minimum subscription amounts
- When canceling, return the subscription value to available balance
- Send notifications via email or SMS based on user preference

## Code Guidelines
- Use TypeScript for type safety
- Follow clean code principles with English comments
- Implement proper error handling and validations
- Use object-oriented programming patterns
- Include unit tests for backend functionality
- Use Material-UI components for consistent UI design

## Available Funds
1. FPV_EL CLIENTE_RECAUDADORA - 75,000 COP (FPV)
2. FPV_EL CLIENTE_ECOPETROL - 125,000 COP (FPV)
3. DEUDAPRIVADA - 50,000 COP (FIC)
4. FDO-ACCIONES - 250,000 COP (FIC)
5. FPV_EL CLIENTE_DINAMICA - 100,000 COP (FPV)
