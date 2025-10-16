import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TokenizeService } from '../tokenize.service'; // Adjust the import path
// Import the actual schema objects for accurate assertions
import { bookings } from '@golf-district/database/schema/bookings';
import { groupBookings } from '@golf-district/database/schema/groupBooking';
import { bookingMerchandise } from '@golf-district/database/schema/bookingMerchandise';
import { courseMerchandise } from '@golf-district/database/schema/courseMerchandise';


// Mock external dependencies
const mockDatabase = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    leftJoin: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    execute: vi.fn(),
    transaction: vi.fn(async (callback) => {
        const tx = {
            insert: vi.fn().mockReturnThis(),
            values: vi.fn().mockReturnThis(),
            execute: vi.fn().mockResolvedValue(true),
            update: vi.fn().mockReturnThis(),
            set: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            rollback: vi.fn(),
        };
        // Store the mock transaction object so the test can access it.
        (mockDatabase.transaction as any).tx = tx;
        await callback(tx);
    }),
    catch: vi.fn(),
};

const mockNotificationService = {
    createNotification: vi.fn(),
    sendEmail: vi.fn(),
};

const mockSensibleService = {
    acceptQuote: vi.fn(),
};

const mockProvider = {
    getSlotIdsForBooking: vi.fn(),
    requireToCreatePlayerSlots: vi.fn().mockReturnValue(false),
    updateTeeTime: vi.fn(),
};

// Mock the logger service (correct relative path) to prevent it from making real network calls
vi.mock('../../webhooks/logging.service', () => ({
    loggerService: {
        errorLog: vi.fn(),
        auditLog: vi.fn(),
    }
}));


describe('TokenizeService', () => {
    let tokenizeService: TokenizeService;

    // FIX: Move mock data to the parent scope to be accessible by all describe blocks
    const baseTokenizeInput = {
        redirectHref: 'https://golfdistrict.com',
        userId: 'user-xyz',
        purchasePrice: 10000,
        players: 2,
        providerBookingId: 'provider-booking-1',
        providerTeeTimeId: 'tee-time-123',
        paymentId: 'payment-def',
        provider: mockProvider as any,
        cartFeeCharge: 100,
        additionalTaxes: {
            greenFeeTaxTotal: 5,
            markupTaxTotal: 0.5,
            weatherGuaranteeTaxTotal: 0,
            cartFeeTaxPercentTotal: 1,
            additionalTaxes: 6.5,
            merchandiseTaxTotal: 0,
        },
        source: 'web',
        needRentals: false,
        normalizedCartData: {
            cartId: 'cart-123',
            total: 10000,
            taxCharge: 6.5,
            charityCharge: 0,
            sensibleCharge: 0,
            markupCharge: 1,
            advancedBookingAmount: 0,
            taxes: 6.5,
            merchandiseCharge: 0,
            cart: {
                email: 'john.doe@example.com',
                name: 'John Doe',
                cart: [{
                    product_data: { metadata: { type: 'first_hand' } }
                }]
            }
        },
    };

    const mockExistingTeeTime = {
        id: 'tee-time-123',
        date: '2025-07-24T10:00:00.000Z',
        courseId: 'course-abc',
        numberOfHoles: 18,
        availableFirstHandSpots: 4,
        availableSecondHandSpots: 0,
        greenFee: 5000,
        courseName: 'Whispering Pines',
        customerName: 'John Doe',
        email: 'john.doe@example.com',
        entityName: 'Golf Management Inc.',
        providerDate: '2025-07-24T10:00:00.000Z',
        address: '123 Golf Rd, Golfville',
        name: 'Whispering Pines',
        websiteURL: 'https://whisperingpines.com',
        cdnKey: 'logo-key',
        extension: 'png',
        timezoneCorrection: 0,
    };

    beforeEach(() => {
        vi.stubGlobal('process', {
            ...process,
            env: {
                ...process.env,
                NEXT_PUBLIC_AWS_CLOUDFRONT_URL: 'd123.cloudfront.net',
                SENDGRID_TEE_TIMES_PURCHASED_TEMPLATE_ID: 'template-1',
                SENDGRID_TEE_TIMES_GROUP_PURCHASED_TEMPLATE_ID: 'template-2',
                ADMIN_EMAIL_LIST: 'admin@golfdistrict.com',
            },
        });

        tokenizeService = new TokenizeService(
            mockDatabase as any,
            mockNotificationService as any,
            mockSensibleService as any
        );
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.clearAllMocks();
        // Clear the stored transaction mock
        if ((mockDatabase.transaction as any).tx) {
            delete (mockDatabase.transaction as any).tx;
        }
    });

    describe('tokenizeBooking', () => {
        it('should tokenize a standard first-hand booking and create correct DB and Email records', async () => {
            // Arrange
            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime]);
            mockProvider.getSlotIdsForBooking.mockResolvedValue([]);

            // Act
            await tokenizeService.tokenizeBooking(baseTokenizeInput);

            // Assert: Database Records
            const mockTx = (mockDatabase.transaction as any).tx;
            expect(mockTx.insert).toHaveBeenCalledWith(bookings);
            const createdBooking = mockTx.values.mock.calls[0][0][0];
            expect(createdBooking.totalAmount).toBe(10650);

            // Assert: Email Template Values
            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
            const emailTemplate = mockNotificationService.createNotification.mock.calls[0][5];
            expect(emailTemplate.TotalAmount).toBe('$106.50');
            expect(emailTemplate.GreenFeesPerPlayer).toBe('$52.00');
            expect(emailTemplate.GreenFees).toBe('$104.00');
            expect(emailTemplate.TaxesAndOtherFees).toBe('$13.00');
            expect(emailTemplate.SensibleWeatherIncluded).toBe('No');
        });

        it('should correctly handle a booking with a Sensible Weather Guarantee', async () => {
            // Arrange
            const sensibleQuoteId = 'sensible-quote-456';
            const sensiblePrice = 1000;
            const mockAcceptedQuote = { id: 'sensible-accepted-1', price_charged: 10 };

            const inputWithSensible = {
                ...baseTokenizeInput,
                normalizedCartData: {
                    ...baseTokenizeInput.normalizedCartData,
                    total: 11000,
                    sensibleCharge: 10,
                    weatherQuoteId: sensibleQuoteId,
                    cart: {
                        email: 'john.doe@example.com',
                        name: 'John Doe',
                        cart: [
                            { product_data: { metadata: { type: 'first_hand' } } },
                            { price: sensiblePrice, product_data: { metadata: { type: 'sensible', sensible_quote_id: sensibleQuoteId } } }
                        ]
                    }
                },
            };

            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime]);
            mockSensibleService.acceptQuote.mockResolvedValue(mockAcceptedQuote);

            // Act
            await tokenizeService.tokenizeBooking(inputWithSensible);

            // Assert: Database Records
            const mockTx = (mockDatabase.transaction as any).tx;
            const createdBooking = mockTx.values.mock.calls[0][0][0];
            expect(createdBooking.weatherGuaranteeId).toBe(mockAcceptedQuote.id);
            expect(createdBooking.weatherGuaranteeAmount).toBe(sensiblePrice);
            expect(createdBooking.totalAmount).toBe(11650);

            // Assert: Email Template Values
            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
            const emailTemplate = mockNotificationService.createNotification.mock.calls[0][5];
            expect(emailTemplate.TotalAmount).toBe('$116.50');
            expect(emailTemplate.SensibleWeatherIncluded).toBe('Yes');
        });

        it('should correctly handle a booking with merchandise', async () => {
            // Arrange
            const merchandisePrice = 2500;
            const inputWithMerchandise = {
                ...baseTokenizeInput,
                purchasedMerchandise: [
                    { id: 'merch-item-1', qoh: 10, caption: 'Golf Balls' },
                    { id: 'merch-item-2', qoh: 5, caption: 'Golf Glove' },
                ],
                normalizedCartData: {
                    ...baseTokenizeInput.normalizedCartData,
                    total: 12500,
                    merchandiseCharge: 25,
                    cart: {
                        ...baseTokenizeInput.normalizedCartData.cart,
                        cart: [
                            { product_data: { metadata: { type: 'first_hand' } } },
                            {
                                price: merchandisePrice,
                                product_data: {
                                    metadata: {
                                        type: 'merchandise',
                                        merchandiseItems: [
                                            { id: 'merch-item-1', qty: 2, pricePerItem: 1000, taxAmountPerItem: 50 },
                                            { id: 'merch-item-2', qty: 1, pricePerItem: 500, taxAmountPerItem: 25 },
                                        ],
                                    },
                                },
                            },
                        ],
                    },
                },
            };

            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime]);

            // Act
            await tokenizeService.tokenizeBooking(inputWithMerchandise);

            // Assert: Database Records
            const mockTx = (mockDatabase.transaction as any).tx;
            expect(mockTx.insert).toHaveBeenCalledWith(bookingMerchandise);
            expect(mockTx.update).toHaveBeenCalledWith(courseMerchandise);

            const setCallsArgs = mockTx.set.mock.calls.map(call => call[0]);
            const merchUpdate1 = setCallsArgs.find(arg => arg.id === 'merch-item-1');
            const merchUpdate2 = setCallsArgs.find(arg => arg.id === 'merch-item-2');

            expect(merchUpdate1).toBeDefined();
            expect(merchUpdate1.qoh).toBe(8);
            expect(merchUpdate2).toBeDefined();
            expect(merchUpdate2.qoh).toBe(4);

            // Assert: Email Template Values
            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
            const emailTemplate = mockNotificationService.createNotification.mock.calls[0][5];
            expect(emailTemplate.TotalAmount).toBe('$131.50');
            expect(emailTemplate.PurchasedMerchandise).toBe(true);
            expect(emailTemplate.MerchandiseDetails).toEqual([
                { caption: 'Golf Balls', qty: 2 },
                { caption: 'Golf Glove', qty: 1 },
            ]);
        });

        it('should correctly tokenize a first-hand group booking', async () => {
            // Arrange
            const groupBookingInput = {
                ...baseTokenizeInput,
                isFirstHandGroupBooking: true,
                players: 4,
                providerBookings: [
                    { providerBookingId: 'group-booking-1', teeTimeId: 'tee-time-123', playerCount: 2 },
                    { providerBookingId: 'group-booking-2', teeTimeId: 'tee-time-456', playerCount: 2 },
                ],
            };
            const mockSecondTeeTime = { ...mockExistingTeeTime, id: 'tee-time-456' };

            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime, mockSecondTeeTime]);
            mockProvider.getSlotIdsForBooking.mockResolvedValue([]);

            // Act
            await tokenizeService.tokenizeBooking(groupBookingInput);

            // Assert: Database Records
            const mockTx = (mockDatabase.transaction as any).tx;
            expect(mockTx.insert).toHaveBeenCalledWith(groupBookings);
            const bookingsToCreate = mockTx.values.mock.calls[1][0];
            expect(bookingsToCreate).toHaveLength(2);

            const totalAmountPerPlayer = ((10000 + 650) / 4);
            const totalAmountForBooking = Math.round(totalAmountPerPlayer * 2);

            expect(bookingsToCreate[0].totalAmount).toBe(totalAmountForBooking);
            expect(bookingsToCreate[1].totalAmount).toBe(totalAmountForBooking);

            // Assert: Email Template Values
            expect(mockNotificationService.createNotification).toHaveBeenCalledTimes(1);
            const emailTemplate = mockNotificationService.createNotification.mock.calls[0][5];
            expect(emailTemplate.TotalAmount).toBe('$106.50');
            expect(emailTemplate.PlayerCount).toBe(4);
            expect(emailTemplate.GroupReservationID).toBeDefined();
        });
    });

    describe('Hell Level: Extreme Edge Cases and Precision Torture', () => {

        it('HELL: Group booking with uneven player distribution and remainder', async () => {
            // Arrange
            const groupBookingInput = {
                redirectHref: 'https://golfdistrict.com',
                userId: 'user-xyz',
                purchasePrice: 10000,
                players: 3, // Prime number to force rounding issues
                providerBookingId: 'group-booking-1',
                providerTeeTimeId: 'tee-time-123',
                paymentId: 'payment-def',
                provider: mockProvider as any,
                cartFeeCharge: 0,
                additionalTaxes: { additionalTaxes: 10.01 }, // $10.01
                source: 'web',
                needRentals: false,
                isFirstHandGroupBooking: true,
                providerBookings: [
                    { providerBookingId: 'group-booking-1', teeTimeId: 'tee-time-123', playerCount: 2 },
                    { providerBookingId: 'group-booking-2', teeTimeId: 'tee-time-456', playerCount: 1 }, // Uneven split
                ],
                normalizedCartData: {
                    cartId: 'cart-123',
                    total: 10000, // $100.00
                    taxes: 10.01,
                    cart: { cart: [{ product_data: { metadata: { type: 'first_hand' } } }] }
                },
            };
            const mockSecondTeeTime = { ...mockExistingTeeTime, id: 'tee-time-456' };

            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime, mockSecondTeeTime]);
            mockProvider.getSlotIdsForBooking.mockResolvedValue([]);

            // Act
            await tokenizeService.tokenizeBooking(groupBookingInput);

            // Assert
            const mockTx = (mockDatabase.transaction as any).tx;
            const bookingsToCreate = mockTx.values.mock.calls[1][0];
            expect(bookingsToCreate).toHaveLength(2);

            // Total amount in cents = 10000 + (10.01 * 100) = 11001
            // Amount per player = 11001 / 3 = 3667
            // Booking 1 (2 players) = 3667 * 2 = 7334
            // Remaining amount = 11001 - 7334 = 3667
            // Booking 2 (1 player) should get the remainder
            expect(bookingsToCreate[0].totalAmount).toBe(7334);
            expect(bookingsToCreate[1].totalAmount).toBe(3667);
            expect(bookingsToCreate[0].totalAmount + bookingsToCreate[1].totalAmount).toBe(11001);
        });

        it('HELL: All Zero Inputs should not produce NaN', async () => {
            // Arrange
            const zeroInput = {
                redirectHref: 'https://golfdistrict.com',
                userId: 'user-xyz',
                purchasePrice: 0,
                players: 0,
                providerBookingId: 'provider-booking-1',
                providerTeeTimeId: 'tee-time-123',
                paymentId: 'payment-def',
                provider: mockProvider as any,
                cartFeeCharge: 0,
                additionalTaxes: { additionalTaxes: 0 },
                source: 'web',
                needRentals: false,
                normalizedCartData: {
                    cartId: 'cart-123',
                    total: 0,
                    taxes: 0,
                    sensibleCharge: 0,
                    markupCharge: 0,
                    advancedBookingAmount: 0,
                    cart: { cart: [{ product_data: { metadata: { type: 'first_hand' } } }] }
                },
            };
            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime]);
            mockProvider.getSlotIdsForBooking.mockResolvedValue([]);

            // Act
            await tokenizeService.tokenizeBooking(zeroInput);

            // Assert
            const mockTx = (mockDatabase.transaction as any).tx;
            const createdBooking = mockTx.values.mock.calls[0][0][0];
            expect(createdBooking.totalAmount).toBe(0);

            const emailTemplate = mockNotificationService.createNotification.mock.calls[0][5];
            expect(emailTemplate.TotalAmount).toBe('$0.00');
            expect(emailTemplate.GreenFeesPerPlayer).not.toBe('$NaN');
            expect(emailTemplate.GreenFees).not.toBe('$NaN');
            expect(emailTemplate.TaxesAndOtherFees).not.toBe('$NaN');
        });
    });

    describe('Chaos Level: Combined Feature Torture Tests', () => {
        it('CHAOS: Group booking with uneven players, merchandise, and sensible weather', async () => {
            // Arrange
            const mockExistingTeeTime = { id: 'tee-time-123', availableFirstHandSpots: 10, greenFee: 5000, courseName: 'Chaos Course', providerDate: '2025-07-24T10:00:00.000Z' };
            const mockSecondTeeTime = { ...mockExistingTeeTime, id: 'tee-time-456' };
            const sensibleQuoteId = 'sensible-chaos-quote';
            const sensiblePrice = 1500; // $15.00
            const mockAcceptedQuote = { id: 'sensible-chaos-accepted', price_charged: 15 };

            const chaosInput = {
                redirectHref: 'https://golfdistrict.com',
                userId: 'user-chaos',
                players: 3,
                isFirstHandGroupBooking: true,
                providerBookings: [
                    { providerBookingId: 'chaos-1', teeTimeId: 'tee-time-123', playerCount: 2 },
                    { providerBookingId: 'chaos-2', teeTimeId: 'tee-time-456', playerCount: 1 },
                ],
                paymentId: 'payment-chaos',
                provider: mockProvider as any,
                cartFeeCharge: 50, // $0.50
                additionalTaxes: { additionalTaxes: 12.34 }, // $12.34
                purchasedMerchandise: [{ id: 'merch-chaos', qoh: 2, caption: 'Chaos Cap' }],
                normalizedCartData: {
                    cartId: 'cart-chaos',
                    total: 13500, // 10000 (green fee) + 1500 (sensible) + 2000 (merch)
                    taxes: 12.34,
                    sensibleCharge: 15,
                    merchandiseCharge: 20,
                    weatherQuoteId: sensibleQuoteId,
                    cart: {
                        email: 'chaos@example.com', name: 'Chaos Agent',
                        cart: [
                            { product_data: { metadata: { type: 'first_hand' } } },
                            { price: sensiblePrice, product_data: { metadata: { type: 'sensible', sensible_quote_id: sensibleQuoteId } } },
                            { price: 2000, product_data: { metadata: { type: 'merchandise', merchandiseItems: [{ id: 'merch-chaos', qty: 1, pricePerItem: 2000, taxAmountPerItem: 100 }] } } }
                        ]
                    }
                },
            };

            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime, mockSecondTeeTime]);
            mockSensibleService.acceptQuote.mockResolvedValue(mockAcceptedQuote);
            mockProvider.getSlotIdsForBooking.mockResolvedValue([]);

            // Act
            await tokenizeService.tokenizeBooking(chaosInput);

            // Assert
            const mockTx = (mockDatabase.transaction as any).tx;
            const bookingsToCreate = mockTx.values.mock.calls[1][0];

            // Total amount = 13500 + (12.34 * 100) = 14734
            const amountFor2Players = Math.round(14734 / 3 * 2); // 9823
            const amountFor1Player = 14734 - amountFor2Players; // 4911

            expect(bookingsToCreate[0].totalAmount).toBe(amountFor2Players);
            expect(bookingsToCreate[1].totalAmount).toBe(amountFor1Player);
            expect(bookingsToCreate[0].weatherGuaranteeId).toBe(mockAcceptedQuote.id);

            const merchEntries = mockTx.values.mock.calls[4][0];
            expect(merchEntries[0].courseMerchandiseId).toBe('merch-chaos');
        });
    });

    describe('Error Handling & Resilience Level', () => {
        it('ERROR: should throw an error if the initial tee time cannot be found', async () => {
            // Arrange
            mockDatabase.execute.mockResolvedValue([]); // Simulate no tee time found
            const input = { ...baseTokenizeInput };

            // Act & Assert
            await expect(tokenizeService.tokenizeBooking(input))
                .rejects.toThrow(`TeeTime with ID: ${input.providerTeeTimeId} does not exist.`);
        });

        it('ERROR: should continue booking if Sensible service fails, and send admin email', async () => {
            // Arrange
            const sensibleQuoteId = 'sensible-quote-fail';
            const sensiblePrice = 1000;
            const inputWithSensible = {
                ...baseTokenizeInput,
                normalizedCartData: {
                    ...baseTokenizeInput.normalizedCartData,
                    cart: {
                        email: 'fail@example.com', name: 'Fail User',
                        cart: [
                            { product_data: { metadata: { type: 'first_hand' } } },
                            { price: sensiblePrice, product_data: { metadata: { type: 'sensible', sensible_quote_id: sensibleQuoteId } } }
                        ]
                    }
                },
            };

            // FIX: Resolve with the correct mock tee time object
            mockDatabase.execute.mockResolvedValue([mockExistingTeeTime]);
            mockSensibleService.acceptQuote.mockRejectedValue(new Error('Sensible API is down'));

            // Act
            await tokenizeService.tokenizeBooking(inputWithSensible);

            // Assert
            // 1. Admin email was sent
            expect(mockNotificationService.sendEmail).toHaveBeenCalledWith(
                'admin@golfdistrict.com',
                'sensible Failed',
                expect.stringContaining('error while accepting quote in sensible: Sensible API is down')
            );

            // 2. Booking was still created, but without the weather guarantee ID
            const mockTx = (mockDatabase.transaction as any).tx;
            const createdBooking = mockTx.values.mock.calls[0][0][0];
            expect(createdBooking.id).toBeDefined();
            expect(createdBooking.weatherGuaranteeId).toBeNull();
            expect(createdBooking.weatherGuaranteeAmount).toBe(0);
        });
    });
});
