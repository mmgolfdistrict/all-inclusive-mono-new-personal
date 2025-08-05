import { describe, it, expect } from 'vitest';
import { calculateCheckoutTotals } from '../../utils/checkout-helpers'; // Adjust the import path as needed

// The user has provided the following types. This comment block is for context.
/*
export type CartProduct = {
  name: string;
  id: string;
  price: number; //int
  image: string;
  currency: string; //USD
  display_price: string;
  product_data: {
    metadata: // Union of all product types
  };
};
*/

/**
 * Helper function to create mock CartProduct objects for tests,
 * reflecting the detailed type structure.
 * @param {number} price - The price of the product in cents.
 * @param {object} metadata - The full metadata object, including its 'type'.
 * @returns {CartProduct} A mock cart product.
 */
const createProduct = (price, metadata) => ({
    name: `test-${metadata.type}`,
    id: `test-id-${Math.random()}`,
    price,
    image: '',
    currency: 'USD',
    display_price: `$${(price / 100).toFixed(2)}`,
    product_data: {
        metadata,
    },
});


describe('calculateCheckoutTotals', () => {
    // Define a base input object to be reused and overridden in tests.
    const baseInput = {
        cartData: [],
        amountOfPlayers: 1,
        validatedPlayersCount: 0,
        roundUpCharityId: undefined,
        donateValue: 0,
        supportsSellingMerchandise: false,
    };

    it('should calculate the total for a single first_hand item correctly', () => {
        const input = {
            ...baseInput,
            cartData: [createProduct(5000, { type: 'first_hand' })], // $50.00
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(50.00);
        expect(result.TaxCharge).toBe(0);
        expect(result.totalGreenFeesPerPlayer).toBe(50.00);
        expect(result.TotalAmt).toBe('50.00');
    });

    it('should sum multiple items of the same type', () => {
        const input = {
            ...baseInput,
            cartData: [
                createProduct(2500, { type: 'first_hand' }), // $25.00
                createProduct(2500, { type: 'first_hand' }), // $25.00
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(50.00);
        expect(result.totalGreenFeesPerPlayer).toBe(50.00);
        expect(result.primaryGreenFeeCharge).toBe(50.00);
        // expect(result.Total).toBe(50.00);
        expect(result.TotalAmt).toBe('50.00');
    });

    it('should handle second_hand items if no first_hand items exist', () => {
        const input = {
            ...baseInput,
            cartData: [createProduct(3000, { type: 'second_hand' })], // $30.00
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(30.00);
        expect(result.primaryGreenFeeCharge).toBe(30.00);
        // expect(result.Total).toBe(30.00);
        expect(result.TotalAmt).toBe('30.00');
    });

    it('should prioritize first_hand_group over other green fees', () => {
        const input = {
            ...baseInput,
            cartData: [
                createProduct(5000, { type: 'first_hand' }),
                createProduct(12000, { type: 'first_hand_group' }), // $120.00
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(120.00);
        expect(result.primaryGreenFeeCharge).toBe(120.00);
        // expect(result.Total).toBe(120.00);
        expect(result.TotalAmt).toBe('120.00');
    });

    it('should correctly handle calculations prone to floating point inaccuracies (e.g., 0.1 + 0.2)', () => {
        const input = {
            ...baseInput,
            cartData: [
                createProduct(10, { type: 'first_hand' }),      // $0.10
                createProduct(20, { type: 'convenience_fee' }), // $0.20
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(0.1);
        expect(result.TaxCharge).toBe(0.2);
        // expect(result.Total).toBe(0.30);
        expect(result.TotalAmt).toBe('0.30');
    });

    it('should correctly calculate and round up taxes', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 1,
            cartData: [
                createProduct(10000, { type: 'first_hand' }),
                createProduct(887, { type: 'greenFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(8.87);
        expect(result.TaxCharge).toBe(8.87);
        expect((result.greenFeeTaxAmount + result.markupFeesTaxAmount) / 100).toBe(8.87);
        // expect(result.Total).toBe(108.87);
        expect(result.TotalAmt).toBe('108.87');
    });

    it('should handle a complex scenario with multiple fees, players, and taxes', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 2,
            validatedPlayersCount: 0,
            supportsSellingMerchandise: true,
            cartData: [
                createProduct(10000, { type: 'first_hand' }),
                createProduct(250, { type: 'convenience_fee' }),
                createProduct(100, { type: 'cart_fee' }),
                createProduct(300, { type: 'sensible' }),
                createProduct(2000, { type: 'merchandise' }),
                createProduct(500, { type: 'greenFeeTaxPercent' }),
                createProduct(1000, { type: 'cartFeeTaxPercent' }),
                createProduct(800, { type: 'merchandiseTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBe(120.00);
        expect(result.totalCartFeePerPlayer).toBe(2);
        expect(result.taxCharge).toBe(6.7);
        expect(result.TaxCharge).toBe(12.2);
        expect((result.greenFeeTaxAmount + result.markupFeesTaxAmount) / 100).toBe(4.9);
        expect(result.cartFeeTaxAmount / 100).toBe(0.2);
        expect(result.merchandiseTaxAmount / 100).toBe(1.6);
        // expect(result.Total).toBe(132.2);
        expect(result.TotalAmt).toBe('132.20');
    });

    it('should correctly calculate totals with merchandise tax override', () => {
        const input = {
            ...baseInput,
            supportsSellingMerchandise: true,
            cartData: [
                createProduct(10825, {
                    type: 'merchandiseWithTaxOverride',
                    priceWithoutTax: 10000,
                    taxAmount: 825,
                }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.merchandiseTotalCharge).toBe(100.00);
        expect(result.taxCharge).toBe(8.25);
        expect(result.merchandiseTaxAmount / 100).toBe(8.25);
        // expect(result.Total).toBe(108.25);
        expect(result.TotalAmt).toBe('108.25');
    });

    it('should apply round-up charity donation correctly', () => {
        const input = {
            ...baseInput,
            cartData: [createProduct(9910, { type: 'first_hand' })],
            roundUpCharityId: 'some-charity-id',
            donateValue: 0.90,
        };
        const result = calculateCheckoutTotals(input);
        // expect(result.Total).toBe(100.00);
        expect(result.TotalAmt).toBe('100.00');
    });

    it('should NOT add charity value if roundUpCharityId is not present', () => {
        const input = {
            ...baseInput,
            cartData: [
                createProduct(9910, { type: 'first_hand' }),
                createProduct(500, { type: 'charity' }),
            ],
            roundUpCharityId: undefined,
            donateValue: 0.90,
        };
        const result = calculateCheckoutTotals(input);
        // expect(result.Total).toBe(104.10);
        expect(result.TotalAmt).toBe('104.10');
    });

    it('should ignore product types that are not handled by the calculation logic', () => {
        const input = {
            ...baseInput,
            cartData: [
                createProduct(5000, { type: 'first_hand' }),
                createProduct(20000, { type: 'auction', auction_id: 'auc-1' }),
                createProduct(15000, { type: 'offer', booking_ids: ['b-1'] }),
                createProduct(500, { type: 'advanced_booking_fees_per_player' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.primaryGreenFeeCharge).toBe(50.00);
        // expect(result.Total).toBe(50.00);
        expect(result.TotalAmt).toBe('50.00');
    });

    it('should return zero for all values when cart is empty', () => {
        const result = calculateCheckoutTotals(baseInput);
        // expect(result.Total).toBe(0);
        expect(result.subTotal).toBe(0);
        expect(result.taxCharge).toBe(0);
        expect(result.TotalAmt).toBe('0.00');
    });

    it('FLOATING POINT: torture test with multiple awkward fees, taxes, and players', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 2,
            supportsSellingMerchandise: true,
            cartData: [
                createProduct(9999, { type: 'first_hand' }),
                createProduct(149, { type: 'convenience_fee' }),
                createProduct(99, { type: 'cart_fee' }),
                createProduct(299, { type: 'sensible' }),
                createProduct(1999, { type: 'merchandise' }),
                createProduct(825, { type: 'greenFeeTaxPercent' }),
                createProduct(825, { type: 'cartFeeTaxPercent' }),
                createProduct(825, { type: 'merchandiseTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.subTotal).toBeCloseTo(119.98);
        expect(result.totalCartFeePerPlayer).toBe(1.98);
        expect(result.taxCharge).toBe(9.9);
        expect(result.TaxCharge).toBe(14.38);
        expect((result.greenFeeTaxAmount + result.markupFeesTaxAmount) / 100).toBeCloseTo(8.085825);
        expect(result.cartFeeTaxAmount / 100).toBeCloseTo(0.16335);
        expect(result.merchandiseTaxAmount / 100).toBeCloseTo(1.649175);
        expect(result.TotalAmt).toBe('134.36');
    });
});

describe('Maximum Difficulty Floating-Point and Logic Stress Tests', () => {
    const baseInput = {
        cartData: [],
        amountOfPlayers: 1,
        validatedPlayersCount: 0,
        roundUpCharityId: undefined,
        donateValue: 0,
        supportsSellingMerchandise: true,
    };

    it('DIFFICULTY: handles some zero-value fees gracefully without producing NaN', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 2,
            cartData: [
                createProduct(10000, { type: 'first_hand' }),
                createProduct(0, { type: 'cart_fee' }),
                createProduct(500, { type: 'greenFeeTaxPercent' }),
                createProduct(0, { type: 'cartFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(5);
        // expect(result.Total).toBe(105);
        expect(result.TotalAmt).toBe('105.00');
    });

    it('DIFFICULTY: correctly calculates per-player fees with validated players', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 4,
            validatedPlayersCount: 1,
            cartData: [
                createProduct(12000, { type: 'first_hand' }),
                createProduct(150, { type: 'cart_fee' }),
                createProduct(1000, { type: 'greenFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.playersInNumber).toBe(3);
        expect(result.subTotal).toBe(120);
        // Corrected based on function logic: ( (120/3 - 1.5) + 0) * 3 = 115.5
        expect(result.totalGreenFeesPerPlayer).toBe(115.5);
        expect(result.totalCartFeePerPlayer).toBe(4.5);
        expect(result.taxCharge).toBe(11.55);
        expect(result.TaxCharge).toBe(11.55);
        expect((result.greenFeeTaxAmount + result.markupFeesTaxAmount) / 100).toBe(11.55);
        // expect(result.Total).toBeCloseTo(131.55);
        expect(result.TotalAmt).toBe('131.55');
    });

    it('DIFFICULTY: "Rounding Hell" - accumulation of multiple small ceil() operations', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 1,
            cartData: [
                createProduct(1000, { type: 'first_hand' }),
                createProduct(100, { type: 'cart_fee' }),
                createProduct(100, { type: 'sensible' }),
                createProduct(11, { type: 'greenFeeTaxPercent' }),
                createProduct(11, { type: 'cartFeeTaxPercent' }),
                createProduct(11, { type: 'weatherGuaranteeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(0.02);
        expect(result.weatherGuaranteeTaxAmount / 100).toBeCloseTo(0.0011);
        // expect(result.Total).toBe(11.02);
        expect(result.TotalAmt).toBe('11.02');
    });

    it('DIFFICULTY: calculation with a prime number of players to maximize division chaos', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 7,
            cartData: [
                createProduct(10000, { type: 'first_hand' }),
                createProduct(123, { type: 'cart_fee' }),
                createProduct(876, { type: 'greenFeeTaxPercent' }),
                createProduct(543, { type: 'cartFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(8.48);
        // expect(result.Total).toBe(108.48);
        expect(result.TotalAmt).toBe('108.48');
    });

    it('DIFFICULTY: The Ultimate Kitchen Sink Torture Test', () => {
        const input = {
            amountOfPlayers: 3,
            validatedPlayersCount: 1,
            roundUpCharityId: 'charity-123',
            donateValue: 0.73,
            supportsSellingMerchandise: true,
            cartData: [
                createProduct(12345, { type: 'first_hand' }),
                createProduct(101, { type: 'convenience_fee' }),
                createProduct(202, { type: 'cart_fee' }),
                createProduct(303, { type: 'sensible' }),
                createProduct(404, { type: 'markup' }),
                createProduct(505, { type: 'charity' }),
                createProduct(606, { type: 'merchandise' }),
                createProduct(10825, {
                    type: 'merchandiseWithTaxOverride',
                    priceWithoutTax: 10000,
                    taxAmount: 825,
                }),
                createProduct(111, { type: 'greenFeeTaxPercent' }),
                createProduct(222, { type: 'cartFeeTaxPercent' }),
                createProduct(333, { type: 'weatherGuaranteeTaxPercent' }),
                createProduct(444, { type: 'markupTaxPercent' }),
                createProduct(555, { type: 'merchandiseTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(10.38);
        // expect(result.Total).toBe(244.66);
        expect(result.TotalAmt).toBe('244.66');
    });
});

describe('Hell Level: Extreme Edge Cases and Precision Torture', () => {
    const baseInput = {
        cartData: [],
        amountOfPlayers: 1,
        validatedPlayersCount: 0,
        roundUpCharityId: undefined,
        donateValue: 0,
        supportsSellingMerchandise: true,
    };

    it('HELL: "Penny Shaving" - Accumulating tiny fractions across many players', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 100,
            cartData: [
                createProduct(10001, { type: 'first_hand' }),
                createProduct(1, { type: 'cart_fee' }),
                createProduct(1, { type: 'greenFeeTaxPercent' }),
                createProduct(1, { type: 'cartFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(0.02);
        // expect(result.Total).toBe(100.03);
        expect(result.TotalAmt).toBe('100.03');
    });

    it('HELL: Maximum Value Torture Test', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 1000,
            cartData: [
                createProduct(99999999, { type: 'first_hand' }),
                createProduct(10000, { type: 'cart_fee' }),
                createProduct(5000, { type: 'greenFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(450000);
        // expect(result.Total).toBe(1449999.99);
        expect(result.TotalAmt).toBe('1,449,999.99');
    });

    it('HELL: Rounding Conflict - Tax rounds down, but total rounds up', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 1,
            cartData: [
                createProduct(9999, { type: 'first_hand' }),
                createProduct(0, { type: 'taxes' }),
                createProduct(4, { type: 'greenFeeTaxPercent' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        expect(result.taxCharge).toBe(0.04);
        // expect(result.Total).toBe(100.03);
        expect(result.TotalAmt).toBe('100.03');
    });

    it('HELL: All Zero Inputs', () => {
        const input = {
            ...baseInput,
            amountOfPlayers: 0,
            donateValue: 0,
            cartData: [
                createProduct(0, { type: 'first_hand' }),
                createProduct(0, { type: 'convenience_fee' }),
                createProduct(0, { type: 'taxes' }),
            ],
        };
        const result = calculateCheckoutTotals(input);
        // expect(result.Total).toBe(0);
        expect(result.subTotal).toBe(0);
        expect(result.taxCharge).toBe(0);
        expect(result.TotalAmt).toBe('0.00');
    });
});
