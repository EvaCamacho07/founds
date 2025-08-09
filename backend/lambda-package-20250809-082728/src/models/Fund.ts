/**
 * Represents different types of funds available in the system
 */
export interface Fund {
  id: number;
  name: string;
  minimumAmount: number;
  category: 'FPV' | 'FIC';
  description?: string;
}

/**
 * Available funds in the system
 */
export const AVAILABLE_FUNDS: Fund[] = [
  {
    id: 1,
    name: 'FPV_EL CLIENTE_RECAUDADORA',
    minimumAmount: 75000,
    category: 'FPV',
    description: ''
  },
  {
    id: 2,
    name: 'FPV_EL CLIENTE_ECOPETROL',
    minimumAmount: 125000,
    category: 'FPV',
    description: ''
  },
  {
    id: 3,
    name: 'DEUDAPRIVADA',
    minimumAmount: 50000,
    category: 'FIC',
    description: ''
  },
  {
    id: 4,
    name: 'FDO-ACCIONES',
    minimumAmount: 250000,
    category: 'FIC',
    description: ''
  },
  {
    id: 5,
    name: 'FPV_EL CLIENTE_DINAMICA',
    minimumAmount: 100000,
    category: 'FPV',
    description: ''
  }
];
