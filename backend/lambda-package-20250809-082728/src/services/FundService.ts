import { Fund, AVAILABLE_FUNDS } from '../models/Fund';
import { NotFoundError } from '../utils/errors';

/**
 * Service class for fund operations
 */
export class FundService {
  /**
   * Gets all available funds
   */
  async getAllFunds(): Promise<Fund[]> {
    // In a real implementation, this could fetch from a database
    return AVAILABLE_FUNDS;
  }

  /**
   * Gets a fund by ID
   */
  async getFundById(fundId: number): Promise<Fund> {
    const fund = AVAILABLE_FUNDS.find(f => f.id === fundId);
    
    if (!fund) {
      throw new NotFoundError(`Fund with ID ${fundId} not found`);
    }

    return fund;
  }

  /**
   * Gets funds by category
   */
  async getFundsByCategory(category: 'FPV' | 'FIC'): Promise<Fund[]> {
    return AVAILABLE_FUNDS.filter(fund => fund.category === category);
  }

  /**
   * Validates if the amount meets the minimum requirement for a fund
   */
  async validateMinimumAmount(fundId: number, amount: number): Promise<boolean> {
    const fund = await this.getFundById(fundId);
    return amount >= fund.minimumAmount;
  }

  /**
   * Gets minimum amount required for a fund
   */
  async getMinimumAmount(fundId: number): Promise<number> {
    const fund = await this.getFundById(fundId);
    return fund.minimumAmount;
  }
}
