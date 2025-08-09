import { FundService } from '../services/FundService';
import { AVAILABLE_FUNDS } from '../models/Fund';
import { NotFoundError } from '../utils/errors';

describe('FundService', () => {
  let fundService: FundService;

  beforeEach(() => {
    fundService = new FundService();
  });

  describe('getAllFunds', () => {
    it('should return all available funds', async () => {
      const funds = await fundService.getAllFunds();
      
      expect(funds).toEqual(AVAILABLE_FUNDS);
      expect(funds).toHaveLength(5);
    });

    it('should return funds with correct structure', async () => {
      const funds = await fundService.getAllFunds();
      
      funds.forEach(fund => {
        expect(fund).toHaveProperty('id');
        expect(fund).toHaveProperty('name');
        expect(fund).toHaveProperty('minimumAmount');
        expect(fund).toHaveProperty('category');
        expect(['FPV', 'FIC']).toContain(fund.category);
      });
    });
  });

  describe('getFundById', () => {
    it('should return fund when valid ID is provided', async () => {
      const fund = await fundService.getFundById(1);
      
      expect(fund.id).toBe(1);
      expect(fund.name).toBe('FPV_EL CLIENTE_RECAUDADORA');
      expect(fund.minimumAmount).toBe(75000);
      expect(fund.category).toBe('FPV');
    });

    it('should throw NotFoundError when invalid ID is provided', async () => {
      await expect(fundService.getFundById(999)).rejects.toThrow(NotFoundError);
      await expect(fundService.getFundById(999)).rejects.toThrow('Fund with ID 999 not found');
    });

    it('should return correct fund for each available fund', async () => {
      for (const expectedFund of AVAILABLE_FUNDS) {
        const fund = await fundService.getFundById(expectedFund.id);
        expect(fund).toEqual(expectedFund);
      }
    });
  });

  describe('getFundsByCategory', () => {
    it('should return only FPV funds when category is FPV', async () => {
      const fpvFunds = await fundService.getFundsByCategory('FPV');
      
      expect(fpvFunds).toHaveLength(3);
      fpvFunds.forEach(fund => {
        expect(fund.category).toBe('FPV');
      });
    });

    it('should return only FIC funds when category is FIC', async () => {
      const ficFunds = await fundService.getFundsByCategory('FIC');
      
      expect(ficFunds).toHaveLength(2);
      ficFunds.forEach(fund => {
        expect(fund.category).toBe('FIC');
      });
    });
  });

  describe('validateMinimumAmount', () => {
    it('should return true when amount meets minimum requirement', async () => {
      const isValid = await fundService.validateMinimumAmount(1, 75000);
      expect(isValid).toBe(true);
    });

    it('should return true when amount exceeds minimum requirement', async () => {
      const isValid = await fundService.validateMinimumAmount(1, 100000);
      expect(isValid).toBe(true);
    });

    it('should return false when amount is below minimum requirement', async () => {
      const isValid = await fundService.validateMinimumAmount(1, 50000);
      expect(isValid).toBe(false);
    });

    it('should throw error when fund does not exist', async () => {
      await expect(fundService.validateMinimumAmount(999, 100000)).rejects.toThrow(NotFoundError);
    });
  });

  describe('getMinimumAmount', () => {
    it('should return correct minimum amount for fund', async () => {
      const minimumAmount = await fundService.getMinimumAmount(4);
      expect(minimumAmount).toBe(250000);
    });

    it('should throw error when fund does not exist', async () => {
      await expect(fundService.getMinimumAmount(999)).rejects.toThrow(NotFoundError);
    });
  });
});
