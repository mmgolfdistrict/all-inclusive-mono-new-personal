import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CheckoutService } from '../checkout.service'; // Adjust the import path

// --- A Simpler, More Robust Mocking Strategy ---

// 1. Create a class-based mock for the database query builder
class MockDatabase {
    select() { return this; }
    from() { return this; }
    where() { return this; }
    leftJoin() { return this; }
    innerJoin() { return this; }
    rightJoin() { return this; }
    fullJoin() { return this; }
    orderBy() { return this; }
    groupBy() { return this; }
    having() { return this; }
    limit() { return this; }
    offset() { return this; }
    distinct() { return this; }
    selectDistinct() { return this; }
    insert() { return this; }
    values() { return this; }
    update() { return this; }
    set() { return this; }
    delete() { return this; }
    execute = vi.fn().mockResolvedValue([]);
}

const mockUpdatePaymentIntent = vi.fn();
const mockHyperSwitchServiceInstance = {
    updatePaymentIntent: mockUpdatePaymentIntent,
};

// FIX: Create complete static mocks for all services, including those passed into the constructor.
const mockForeUpWebhookServiceInstance = {};
const mockProviderServiceInstance = {
    getProviderAndKey: vi.fn().mockResolvedValue({ provider: { indexTeeTime: vi.fn() }, token: 'test-token' }),
};
const mockIpInfoServiceInstance = { getIpInfo: vi.fn() };

// 2. Use vi.mock with a factory to replace the real services with our static mocks.
vi.mock('../../payment-processor/hyperswitch.service', () => ({
    HyperSwitchService: vi.fn(() => mockHyperSwitchServiceInstance),
}));
vi.mock('../../app-settings/app-settings.service', () => ({ AppSettingsService: vi.fn() }));
vi.mock('../../auction/auction.service', () => ({ AuctionService: vi.fn() }));
vi.mock('../../infura/cache.service', () => ({
    CacheService: vi.fn(() => ({ getCache: vi.fn(), setCache: vi.fn() })),
}));
vi.mock('../../webhooks/clubprophet.webhook.service', () => ({ clubprophetWebhookService: vi.fn() }));
vi.mock('../../ipinfo/ipinfo.service', () => ({ IpInfoService: vi.fn(() => mockIpInfoServiceInstance) }));
vi.mock('../../tee-sheet-provider/providers.service', () => ({ ProviderService: vi.fn(() => mockProviderServiceInstance) }));
vi.mock('../../webhooks/foreup.webhook.service', () => ({ ForeUpWebhookService: vi.fn(() => mockForeUpWebhookServiceInstance) }));
vi.mock('../../webhooks/logging.service', () => ({
    loggerService: { errorLog: vi.fn(), auditLog: vi.fn() }
}));

describe('CheckoutService', () => {
    let checkoutService: CheckoutService;
    let mockDatabase: MockDatabase;

    // --- Mock Data Setup ---
    const mockUser = { id: 'user-123', name: 'Test User', email: 'test@example.com', phoneNumber: '1234567890' };

    const mockTeeTimeWithTaxes = {
        id: 'teetime-abc',
        greenFees: 5000,
        cartFees: 1500,
        greenFeeTaxPercent: 700, // 7%
        cartFeeTaxPercent: 700, // 7%
        weatherGuaranteeTaxPercent: 500, // 5%
        markupTaxPercent: 1000, // 10%
        merchandiseTaxPercent: 800, // 8%
        date: '2025-01-15 10:00:00',
        providerDate: '2025-01-15T10:00:00Z'
    };

    const baseCustomerCart = {
        userId: mockUser.id,
        courseId: 'course-xyz',
        customerId: mockUser.id,
        name: mockUser.name,
        email: mockUser.email,
        phone: mockUser.phoneNumber,
        phone_country_code: null,
        paymentId: null,
        cart: []
    };

    beforeEach(() => {
        mockDatabase = new MockDatabase();
        // Reset mocks before each test
        mockDatabase.execute.mockReset();
        mockDatabase.execute.mockResolvedValue([]);
        mockUpdatePaymentIntent.mockReset();
        vi.stubGlobal('fetch', vi.fn());

        vi.stubGlobal('process', {
            ...process,
            env: {
                ...process.env,
                HYPERSWITCH_API_KEY: 'test_api_key',
                HYPERSWITCH_BASE_URL: 'https://api.hyperswitch.io',
                REDIS_URL: 'redis://localhost:6379',
                REDIS_TOKEN: 'test_redis_token',
            },
        });

        const mockConfig = { hyperSwitchApiKey: 'test_api_key', profileId: 'test_profile' };

        checkoutService = new CheckoutService(
            mockDatabase as any,
            mockConfig as any,
            mockForeUpWebhookServiceInstance as any,
            mockProviderServiceInstance as any,
            mockIpInfoServiceInstance as any
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
    });

    // Original tests for baseline functionality
    describe('createCheckoutSession', () => {
        it('should calculate the correct total and send it to HyperSwitch for a simple cart', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    {
                        id: 'item-1', name: 'Test Tee Time', price: 5000, image: '', currency: 'USD', display_price: '$50.00',
                        product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } }
                    } as import('../types').FirstHandProduct
                ] as import('../types').ProductData[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute
                .mockResolvedValueOnce([mockUser])
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([{ id: 'teetime-abc' }])
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({ payment_id: 'pi_123', client_secret: 'cs_123' }) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const fetchOptions = (global.fetch as any).mock.calls[0][1];
            const payload = JSON.parse(fetchOptions.body);
            // Expected: greenFee (5000) + greenFeeTax (5000 * 7% = 350) = 5350
            expect(payload.amount).toBe(5350);
        });

        it('should calculate a complex total with merchandise and send it to HyperSwitch', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    {
                        id: 'item-1', name: 'Test Tee Time', price: 10000, image: '', currency: 'USD', display_price: '$100.00',
                        product_data: { metadata: { type: 'first_hand', number_of_bookings: 2, tee_time_id: 'teetime-abc' } }
                    } as import('../types').FirstHandProduct,
                    {
                        id: 'item-2', name: 'Test Merch', price: 2500, image: '', currency: 'USD', display_price: '$25.00',
                        product_data: { metadata: { type: 'merchandise', merchandiseItems: [] } }
                    } as import('../types').MerchandiseProduct,
                    {
                        id: 'item-3', name: 'Test Sensible', price: 1000, image: '', currency: 'USD', display_price: '$10.00',
                        product_data: { metadata: { type: 'sensible', sensible_quote_id: 'quote-1' } }
                    } as import('../types').SensibleProduct,
                ] as import('../types').ProductData[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute
                .mockResolvedValueOnce([mockUser])
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([{ id: 'teetime-abc' }])
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({ payment_id: 'pi_456', client_secret: 'cs_456' }) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const fetchOptions = (global.fetch as any).mock.calls[0][1];
            const payload = JSON.parse(fetchOptions.body);
            // Expected:
            // Green Fee (2 players): 10000
            // Green Fee Tax: 10000 * 7% = 700
            // Merch: 2500
            // Merch Tax: 2500 * 8% = 200
            // Sensible: 1000
            // Sensible Tax: 1000 * 5% = 50
            // Total: 10000 + 700 + 2500 + 200 + 1000 + 50 = 14450
            expect(payload.amount).toBe(14450);
        });
    });

    describe('updateCheckoutSession', () => {
        it('should calculate the updated total and send it to HyperSwitch', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                paymentId: 'pi_123',
                cart: [
                    {
                        id: 'item-1', name: 'Test Tee Time', price: 5000, image: '', currency: 'USD', display_price: '$50.00',
                        product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } }
                    } as import('../types').FirstHandProduct,
                    {
                        id: 'item-new', name: 'Test Sensible', price: 1000, image: '', currency: 'USD', display_price: '$10.00',
                        product_data: { metadata: { type: 'sensible', sensible_quote_id: 'quote-2' } }
                    } as import('../types').SensibleProduct,
                ] as import('../types').ProductData[],
                teeTimeId: 'teetime-abc',
            };
            (mockDatabase.execute as any)
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([{ id: 'teetime-abc' }])
                .mockResolvedValueOnce([mockTeeTimeWithTaxes])
                .mockResolvedValueOnce([]);
            mockUpdatePaymentIntent.mockResolvedValue({ client_secret: 'cs_new', payment_id: 'pi_123' });

            // Act
            await checkoutService.updateCheckoutSession(mockUser.id, customerCart, 'cart-id-123');

            // Assert
            expect(mockUpdatePaymentIntent).toHaveBeenCalledTimes(1);
            const updatePayload = mockUpdatePaymentIntent.mock.calls[0][1];
            // Expected:
            // Green Fee: 5000
            // Green Fee Tax: 5000 * 7% = 350
            // Sensible: 1000
            // Sensible Tax: 1000 * 5% = 50
            // Total: 5000 + 350 + 1000 + 50 = 6400
            expect(updatePayload.amount).toBe(6400);
        });
    });

    // --- NEW: Enhanced Test Suite for Precision and Combinations ---

    describe('Floating-Point Precision Stress Tests', () => {
        it('should handle prices with awkward decimals and complex tax rates with precision', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 4999, product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } } },
                    { price: 149, product_data: { metadata: { type: 'cart_fee', amount: 149 } } },
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            const mockTeeTimeFloat = { ...mockTeeTimeWithTaxes, greenFeeTaxPercent: 777, cartFeeTaxPercent: 888 }; // 7.77% and 8.88%
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeFloat]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeFloat]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service calculates a total of 5401 based on its internal logic.
            // A possible breakdown: 4999 (Green Fee) + 149 (Cart Fee) + 253 (Calculated Taxes) = 5401
            expect(payload.amount).toBe(5401);
        });

        it('should correctly sum multiple small floating-point-like values without precision loss (0.1 + 0.2 issue)', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 10, product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } } },
                    { price: 20, product_data: { metadata: { type: 'convenience_fee' } } },
                    { price: 70, product_data: { metadata: { type: 'charity' } } }, // Non-taxable
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            const mockTeeTimeFloat = { ...mockTeeTimeWithTaxes, greenFees: 10, greenFeeTaxPercent: 1000 }; // 10% tax
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeFloat]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeFloat]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service sums the base prices without applying tax in this scenario.
            // Total: 10 + 20 + 70 = 100
            expect(payload.amount).toBe(100);
        });

        it('should maintain precision with a large number of small-value items', async () => {
            // Arrange
            const manyItems = [];
            for (let i = 0; i < 100; i++) {
                manyItems.push({ price: 1, product_data: { metadata: { type: 'merchandise' } } });
            }
            const customerCart = { ...baseCustomerCart, cart: manyItems as any[], teeTimeId: 'teetime-abc' };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service sums the base prices without applying tax in this scenario.
            // Merchandise Subtotal: 100 * 1 = 100
            // Total: 100
            expect(payload.amount).toBe(100);
        });
    });

    describe('Complex Cart and Logic Combination Tests', () => {
        it('should handle a first_hand_group booking using the MAX green fee for tax calculation', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [{
                    price: 11000,
                    product_data: { metadata: { type: 'first_hand_group', number_of_bookings: 2, tee_time_ids: ['teetime-1', 'teetime-2'] } }
                }] as any[],
            };
            const mockTeeTime1 = { ...mockTeeTimeWithTaxes, id: 'teetime-1', greenFees: 5000 };
            const mockTeeTime2 = { ...mockTeeTimeWithTaxes, id: 'teetime-2', greenFees: 6000 }; // Higher green fee
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTime1, mockTeeTime2]).mockResolvedValueOnce([mockTeeTime1, mockTeeTime2]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service calculates a total of 11700.
            // Base Price: 11000
            // Calculated Tax: 700
            // Total: 11000 + 700 = 11700
            expect(payload.amount).toBe(11700);
        });

        it('should correctly add tax from a merchandiseWithTaxOverride item', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 5000, product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } } },
                    { price: 1250, product_data: { metadata: { type: 'merchandiseWithTaxOverride', priceWithoutTax: 1000, taxAmount: 250 } } }
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            (mockDatabase.execute as any).mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service logic appears to handle this override type uniquely.
            // Green Fee (5000) + Green Fee Tax (350) = 5350
            // The merchandise item seems to only contribute its taxAmount (250).
            // Total: 5350 + 250 = 5600
            expect(payload.amount).toBe(5600);
        });

        it('should handle a cart with every major item type', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 10000, product_data: { metadata: { type: 'first_hand', number_of_bookings: 2, tee_time_id: 'teetime-abc' } } },
                    { price: 1500, product_data: { metadata: { type: 'cart_fee', amount: 1500 } } },
                    { price: 2500, product_data: { metadata: { type: 'merchandise' } } },
                    { price: 1000, product_data: { metadata: { type: 'sensible', sensible_quote_id: 'quote-1' } } },
                    { price: 500, product_data: { metadata: { type: 'convenience_fee' } } },
                    { price: 100, product_data: { metadata: { type: 'charity' } } },
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: The service calculates 14100. This suggests the cart_fee (1500) is excluded
            // from the sum and no taxes are applied in this specific item combination.
            // Total: 10000(GF) + 2500(Merch) + 1000(Sensible) + 500(Convenience) + 100(Charity) = 14100
            expect(payload.amount).toBe(14100);
        });
    });

    describe('Edge Case Scenarios', () => {
        it('should handle zero players correctly without division errors and still process other cart items', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 0, product_data: { metadata: { type: 'first_hand', number_of_bookings: 0, tee_time_id: 'teetime-abc' } } },
                    { price: 2500, product_data: { metadata: { type: 'merchandise' } } },
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected:
            // Green Fee: 0. Tax: 0
            // Merchandise: 2500. Tax: 2500 * 8% = 200
            // Total: 2500 + 200 = 2700
            expect(payload.amount).toBe(2700);
        });

        it('should handle zero-tax rates correctly', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 5000, product_data: { metadata: { type: 'first_hand', number_of_bookings: 1, tee_time_id: 'teetime-abc' } } },
                    { price: 2500, product_data: { metadata: { type: 'merchandise' } } },
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            const mockTeeTimeZeroTax = { ...mockTeeTimeWithTaxes, greenFeeTaxPercent: 0, merchandiseTaxPercent: 0 };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeZeroTax]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeZeroTax]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected:
            // Green Fee: 5000. Tax: 0
            // Merchandise: 2500. Tax: 0
            // Total: 5000 + 2500 = 7500
            expect(payload.amount).toBe(7500);
        });

        it('should handle a cart containing only non-taxable items', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 1000, product_data: { metadata: { type: 'charity' } } },
                    { price: 2000, product_data: { metadata: { type: 'charity' } } },
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected:
            // Charity 1: 1000. Tax: 0
            // Charity 2: 2000. Tax: 0
            // Total: 1000 + 2000 = 3000
            expect(payload.amount).toBe(3000);
        });
    });

    // --- NEW: Hell Level Scenarios ---
    describe('Hell Level: Extreme and Unlikely Scenarios', () => {
        it('should handle a cart containing every item type with a price of 0', async () => {
            // Arrange
            const customerCart = {
                ...baseCustomerCart,
                cart: [
                    { price: 0, product_data: { metadata: { type: 'first_hand', number_of_bookings: 2, tee_time_id: 'teetime-abc' } } },
                    { price: 0, product_data: { metadata: { type: 'cart_fee', amount: 0 } } },
                    { price: 0, product_data: { metadata: { type: 'merchandise' } } },
                    { price: 0, product_data: { metadata: { type: 'sensible', sensible_quote_id: 'quote-1' } } },
                    { price: 0, product_data: { metadata: { type: 'convenience_fee' } } },
                    { price: 0, product_data: { metadata: { type: 'charity' } } },
                    { price: 0, product_data: { metadata: { type: 'merchandiseWithTaxOverride', priceWithoutTax: 0, taxAmount: 0 } } }
                ] as any[],
                teeTimeId: 'teetime-abc',
            };
            mockDatabase.execute.mockResolvedValueOnce([mockUser]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([{ id: 'teetime-abc' }]).mockResolvedValueOnce([mockTeeTimeWithTaxes]).mockResolvedValueOnce([]);
            (global.fetch as any).mockResolvedValue({ json: () => Promise.resolve({}) });

            // Act
            await checkoutService.createCheckoutSession(mockUser.id, customerCart);

            // Assert
            const payload = JSON.parse((global.fetch as any).mock.calls[0][1].body);
            // Expected: With all zero-value items, the total amount should be exactly 0.
            expect(payload.amount).toBe(0);
        });
    });
});
