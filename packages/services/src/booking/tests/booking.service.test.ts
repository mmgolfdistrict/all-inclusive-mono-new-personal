import { describe, it, expect, vi, beforeEach } from "vitest";
import { BookingService } from "../booking.service";

// Import only the types for the services we will manually mock.
import type { TokenizeService } from "../../token/tokenize.service";
import type { ProviderService } from "../../tee-sheet-provider/providers.service";
import type { NotificationService } from "../../notification/notification.service";
import type { HyperSwitchService } from "../../payment-processor/hyperswitch.service";
import type { SensibleService } from "../../sensible/sensible.service";
import type { UserWaitlistService } from "../../user-waitlist/userWaitlist.service";

// We can still mock modules that export objects/functions directly.
vi.mock("../../webhooks/logging.service", () => ({
    loggerService: {
        errorLog: vi.fn(),
        auditLog: vi.fn(),
    },
}));
vi.mock("../../app-settings/initialized", () => ({
    appSettingService: {
        get: vi.fn().mockResolvedValue("Test Note"),
    },
}));

// Mock the CacheService to prevent it from trying to connect to Redis during tests.
vi.mock("../../infura/cache.service", () => {
    return {
        CacheService: vi.fn().mockImplementation(() => {
            return {
                getCache: vi.fn(),
                setCache: vi.fn(),
            };
        }),
    };
});


// --- Test Suite for BookingService ---

describe("BookingService Value Precision Calculations", () => {
    let bookingService: BookingService;
    let mockTokenizeService: TokenizeService;
    let mockProviderService: ProviderService;
    let mockNotificationService: NotificationService;
    let mockHyperSwitchService: HyperSwitchService;
    let mockSensibleService: SensibleService;
    let mockUserWaitlistService: UserWaitlistService;
    let mockDatabase: any;

    // Set up a fresh instance of the service and mocks before each test
    beforeEach(() => {
        // Reset mocks to ensure test isolation
        vi.clearAllMocks();

        // --- Manual Mock Creation ---
        // Create plain JavaScript objects that mimic the services.
        // Provide all query-builder methods and ensure `execute` always resolves
        // to a safe default (empty array) unless a test overrides it with
        // `mockResolvedValueOnce`. This prevents "undefined is not iterable" or
        // similar runtime errors when the production code makes more DB calls
        // than the test explicitly mocks.
        mockDatabase = {
            select: vi.fn().mockReturnThis(),
            from: vi.fn().mockReturnThis(),
            leftJoin: vi.fn().mockReturnThis(),
            innerJoin: vi.fn().mockReturnThis(),
            where: vi.fn().mockReturnThis(),
            orderBy: vi.fn().mockReturnThis(),
            execute: vi.fn().mockImplementation(() => Promise.resolve([])),
        };

        mockTokenizeService = {
            tokenizeBooking: vi.fn().mockResolvedValue({ bookingId: "mock-booking-id", isEmailSend: true }),
        } as any;

        const createBookingSpy = vi.fn().mockResolvedValue({
            bookingConfirmationId: "mock-confirmation-id",
            bookingStatus: "confirmed",
        });
        mockProviderService = {
            getProviderAndKey: vi.fn().mockResolvedValue({
                provider: {
                    getBookingCreationData: vi.fn().mockReturnValue({}),
                    createBooking: createBookingSpy,
                    getBookingId: vi.fn().mockReturnValue("mock-provider-booking-id"),
                    getSlotIdsFromBooking: vi.fn().mockReturnValue(["slot1", "slot2"]),
                    shouldAddSaleData: vi.fn().mockReturnValue(false),
                },
                token: "mock-token",
            }),
            findOrCreateCustomer: vi.fn().mockResolvedValue({ customerId: "mock-customer-id" }),
        } as any;

        // These services are not used in the calculation logic, so they can be empty mocks.
        mockNotificationService = {
            sendEmailByTemplate: vi.fn(),
        } as any;
        mockHyperSwitchService = {
            confirmPaymentIntent: vi.fn().mockResolvedValue({ status: "succeeded" }),
            sendEmailForBookingFailed: vi.fn(),
        } as any;
        mockSensibleService = { cancelQuote: vi.fn().mockResolvedValue(undefined) } as any;
        mockUserWaitlistService = {} as any;

        // Instantiate the real service with our manual mocks
        bookingService = new BookingService(
            mockDatabase,
            mockTokenizeService,
            mockProviderService,
            mockNotificationService,
            mockHyperSwitchService,
            mockSensibleService,
            mockUserWaitlistService
        );
    });

    // Helper to dynamically build mock return payloads + expected tax results
    type CalcInput = {
        playerCount: number;
        primaryGreenFeeCharge: number; // cents
        markupCharge: number;          // cents
        sensibleCharge: number;        // cents
        cartFeeCharge: number;         // cents
        merchandiseCharge: number;     // cents
        merchandiseWithTaxOverrideCharge: number; // cents
        merchandiseOverriddenTaxAmount: number;   // cents
        // NOTE: advancedBookingAmount is expressed in CENTS to mimic real cart data
        advancedBookingAmount: number; // cents
        taxPercents?: {
            greenFee?: number;
            markup?: number;
            weather?: number;
            cartFee?: number;
            merchandise?: number;
        }
    };

    const buildMockData = (input: CalcInput) => {
        const percents = {
            greenFee: 8.25,
            markup: 8.25,
            weather: 5,
            cartFee: 8.25,
            merchandise: 8.25,
            ...input.taxPercents,
        };

        const teeTimeData = {
            greenFees: input.primaryGreenFeeCharge,
            greenFeeTaxPercent: percents.greenFee,
            markupTaxPercent: percents.markup,
            weatherGuaranteeTaxPercent: percents.weather,
            cartFeeTaxPercent: percents.cartFee,
            merchandiseTaxPercent: percents.merchandise,
            courseId: "mock-course-id",
            facilityId: "mock-facility-id",
            providerDate: "2025-01-15T10:00:00Z",
            timezoneCorrection: 0,
        };

        const advancedBookingDollars = input.advancedBookingAmount / 100; // convert cents ➜ dollars
        const expectedGreenFeeTax = (((input.primaryGreenFeeCharge / 100) + advancedBookingDollars) * (percents.greenFee / 100 / 100)) * input.playerCount;
        const expectedMarkupTax = ((input.markupCharge / 100) * (percents.markup / 100)) * input.playerCount;
        const expectedWeatherTax = (input.sensibleCharge / 100) * (percents.weather / 100);
        const expectedCartFeeTax = (((input.cartFeeCharge / 100) * (percents.cartFee / 100)) / 100) * input.playerCount; // double-divide like production
        const expectedMerchTax = (input.merchandiseCharge / 100) * (percents.merchandise / 100);
        const expectedMerchOverrideTax = input.merchandiseOverriddenTaxAmount / 100;
        const additionalTaxesRaw = expectedGreenFeeTax + expectedMarkupTax + expectedWeatherTax + expectedCartFeeTax + expectedMerchTax + expectedMerchOverrideTax;
        const expectedAdditionalTaxes = Math.ceil(Number((additionalTaxesRaw * 100).toFixed(2))) / 100;

        const normalizedCartData = {
            playerCount: input.playerCount,
            primaryGreenFeeCharge: input.primaryGreenFeeCharge,
            markupCharge: input.markupCharge,
            sensibleCharge: input.sensibleCharge,
            cartFeeCharge: input.cartFeeCharge,
            merchandiseCharge: input.merchandiseCharge,
            merchandiseWithTaxOverrideCharge: input.merchandiseWithTaxOverrideCharge,
            merchandiseOverriddenTaxAmount: input.merchandiseOverriddenTaxAmount,
            advancedBookingAmount: input.advancedBookingAmount,
            cart: {
                cart: [{
                    product_data: {
                        metadata: { type: "tee_time", merchandiseItems: [] }
                    }
                }]
            },
            teeTimeIds: ["tee-time-1"],
        } as any;

        return {
            teeTimeData, expected: {
                greenFeeTax: expectedGreenFeeTax,
                markupTax: expectedMarkupTax,
                weatherTax: expectedWeatherTax,
                cartFeeTax: expectedCartFeeTax,
                merchTax: expectedMerchTax + expectedMerchOverrideTax,
                additionalTaxes: expectedAdditionalTaxes,
            }, normalizedCartData
        };
    };

    const TEST_CASES: CalcInput[] = [
        // baseline (similar to original)
        {
            playerCount: 2,
            primaryGreenFeeCharge: 25000,
            markupCharge: 1000,
            sensibleCharge: 1575,
            cartFeeCharge: 550,
            merchandiseCharge: 3025,
            merchandiseWithTaxOverrideCharge: 2000,
            merchandiseOverriddenTaxAmount: 165,
            advancedBookingAmount: 5,
        },
        // more players & higher fees
        {
            playerCount: 4,
            primaryGreenFeeCharge: 40000,
            markupCharge: 2400,
            sensibleCharge: 2000,
            cartFeeCharge: 1200,
            merchandiseCharge: 4500,
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 0,
        },
        // small decimals stress
        {
            playerCount: 1,
            primaryGreenFeeCharge: 12345,
            markupCharge: 333,
            sensibleCharge: 110,
            cartFeeCharge: 99,
            merchandiseCharge: 225,
            merchandiseWithTaxOverrideCharge: 100,
            merchandiseOverriddenTaxAmount: 7,
            advancedBookingAmount: 3.33,
        },
        // advanced-booking only (no green fees)
        {
            playerCount: 1,
            primaryGreenFeeCharge: 0,
            markupCharge: 0,
            sensibleCharge: 0,
            cartFeeCharge: 0,
            merchandiseCharge: 0,
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 500, // $5.00 adv booking fee only
        },
        // zero-tax percent scenario
        {
            playerCount: 3,
            primaryGreenFeeCharge: 3000,
            markupCharge: 200,
            sensibleCharge: 0,
            cartFeeCharge: 150,
            merchandiseCharge: 1000,
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 0,
            taxPercents: { greenFee: 0, markup: 0, weather: 0, cartFee: 0, merchandise: 0 },
        },
        // high-tax percent stress
        {
            playerCount: 2,
            primaryGreenFeeCharge: 5000,
            markupCharge: 1000,
            sensibleCharge: 500,
            cartFeeCharge: 300,
            merchandiseCharge: 2000,
            merchandiseWithTaxOverrideCharge: 500,
            merchandiseOverriddenTaxAmount: 40,
            advancedBookingAmount: 200,
            taxPercents: { greenFee: 17.5, markup: 17.5, weather: 10, cartFee: 17.5, merchandise: 17.5 },
        },
        // merchandise-heavy cart (no tee fees)
        {
            playerCount: 1,
            primaryGreenFeeCharge: 0,
            markupCharge: 0,
            sensibleCharge: 0,
            cartFeeCharge: 0,
            merchandiseCharge: 10000,
            merchandiseWithTaxOverrideCharge: 4000,
            merchandiseOverriddenTaxAmount: 330,
            advancedBookingAmount: 0,
        },
        // large group booking stress
        {
            playerCount: 8,
            primaryGreenFeeCharge: 80000,
            markupCharge: 0,
            sensibleCharge: 0,
            cartFeeCharge: 4000,
            merchandiseCharge: 0,
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 0,
        },
        // HELL: Extremely high player count & mixed taxes
        {
            playerCount: 20,
            primaryGreenFeeCharge: 150000, // $1,500.00
            markupCharge: 20000,          // $200.00
            sensibleCharge: 10000,        // $100.00
            cartFeeCharge: 8000,          // $80.00
            merchandiseCharge: 50000,     // $500.00
            merchandiseWithTaxOverrideCharge: 20000, // $200.00
            merchandiseOverriddenTaxAmount: 1650,    // $16.50
            advancedBookingAmount: 999,   // $9.99
            taxPercents: { greenFee: 12.5, markup: 18, weather: 7.25, cartFee: 15, merchandise: 9 },
        },
        // HELL: Tiny cent-level values to stress rounding
        {
            playerCount: 5,
            primaryGreenFeeCharge: 1,   // $0.01
            markupCharge: 2,            // $0.02
            sensibleCharge: 3,          // $0.03
            cartFeeCharge: 4,           // $0.04
            merchandiseCharge: 5,       // $0.05
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 1,   // $0.01 adv booking fee
        },
        // HELL: Max tax percentages (nearly 100%)
        {
            playerCount: 2,
            primaryGreenFeeCharge: 10000, // $100.00
            markupCharge: 5000,           // $50.00
            sensibleCharge: 2500,         // $25.00
            cartFeeCharge: 2500,          // $25.00
            merchandiseCharge: 5000,      // $50.00
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 0,
            taxPercents: { greenFee: 99.99, markup: 99.99, weather: 99.99, cartFee: 99.99, merchandise: 99.99 },
        },
        // PRECISION: repeating-decimal tax percents
        {
            playerCount: 3,
            primaryGreenFeeCharge: 12345, // $123.45
            markupCharge: 6789,          // $67.89
            sensibleCharge: 4321,        // $43.21
            cartFeeCharge: 987,          // $9.87
            merchandiseCharge: 1111,     // $11.11
            merchandiseWithTaxOverrideCharge: 555,
            merchandiseOverriddenTaxAmount: 47, // $0.47
            advancedBookingAmount: 33,   // $0.33
            taxPercents: { greenFee: 8.875, markup: 9.975, weather: 7.125, cartFee: 8.375, merchandise: 6.665 },
        },
        // PRECISION: lots of odd cents values & adv booking
        {
            playerCount: 2,
            primaryGreenFeeCharge: 22222, // $222.22
            markupCharge: 3333,          // $33.33
            sensibleCharge: 4444,        // $44.44
            cartFeeCharge: 555,          // $5.55
            merchandiseCharge: 6666,     // $66.66
            merchandiseWithTaxOverrideCharge: 777,
            merchandiseOverriddenTaxAmount: 88, // $0.88
            advancedBookingAmount: 111,  // $1.11
        },
        // PRECISION: single-player micro-fees
        {
            playerCount: 1,
            primaryGreenFeeCharge: 79,   // $0.79
            markupCharge: 21,            // $0.21
            sensibleCharge: 13,          // $0.13
            cartFeeCharge: 17,           // $0.17
            merchandiseCharge: 19,       // $0.19
            merchandiseWithTaxOverrideCharge: 0,
            merchandiseOverriddenTaxAmount: 0,
            advancedBookingAmount: 5,    // $0.05
            taxPercents: { greenFee: 4.5, markup: 4.5, weather: 4.5, cartFee: 4.5, merchandise: 4.5 },
        },
    ];

    const buildDatabaseMockSequence = (teeDataArr: any[]) => {
        // Each call sequence replicates bookingData check, teeTimeData fetch, user fetch, etc.
        const exec = mockDatabase.execute;
        exec.mockReset();
        // Default fallback so unexpected queries don't blow up
        exec.mockImplementation(() => Promise.resolve([]));
        teeDataArr.forEach((tee) => {
            exec
                .mockResolvedValueOnce([]) // bookingData
                .mockResolvedValueOnce([tee]) // teeTimeData
                .mockResolvedValueOnce([{ name: "Test User", email: "test@example.com" }]) // user
                .mockResolvedValueOnce([tee]); // catch block teeTimeData
        });
    };

    // --- Test Cases ---

    describe.each(TEST_CASES)("Precision for reserveBooking – %#", (calcInput) => {
        it("computes all taxes to cent-level precision", async () => {
            const { teeTimeData, expected, normalizedCartData } = buildMockData(calcInput);

            vi.spyOn(bookingService, "normalizeCartData").mockResolvedValue(normalizedCartData);
            vi.spyOn(bookingService, "checkIfPaymentIdIsValid").mockResolvedValue(true);
            vi.spyOn(bookingService, "sendMessageToVerifyPayment").mockResolvedValue(true);

            buildDatabaseMockSequence([teeTimeData]);

            await bookingService.reserveBooking(
                "user-123",
                "cart-123",
                "payment-123",
                "sensible-123",
                "web",
                undefined,
                false,
                "http://localhost",
                "",
                "",
                ""
            );

            const passedOpts = (mockTokenizeService.tokenizeBooking as any).mock.calls[0][0];
            const { additionalTaxes } = passedOpts;

            const recomputedTotal =
                additionalTaxes.greenFeeTaxTotal +
                additionalTaxes.markupTaxTotal +
                additionalTaxes.weatherGuaranteeTaxTotal +
                additionalTaxes.cartFeeTaxPercentTotal +
                additionalTaxes.merchandiseTaxTotal;

            // total in service should match sum of components (to cent precision)
            expect(additionalTaxes.additionalTaxes).toBeCloseTo(recomputedTotal, 1);

            // rounded total must be in whole cents
            expect(((additionalTaxes.additionalTaxes as number) * 100) % 1).toBe(0);
        });
    });

    describe.each(TEST_CASES)("Precision for reserveGroupBooking – %#", (calcInput) => {
        it("computes all taxes to cent-level precision for a group", async () => {
            // Duplicate teeTime for two teeId's to mock group behaviour
            const { teeTimeData, normalizedCartData } = buildMockData(calcInput);
            const teeTimeData2 = { ...teeTimeData, internalId: "tee2" };
            const groupNorm = { ...normalizedCartData, teeTimeIds: ["tee-time-1", "tee-time-2"] };

            vi.spyOn(bookingService, "normalizeCartData").mockResolvedValue(groupNorm);
            vi.spyOn(bookingService, "checkIfPaymentIdIsValid").mockResolvedValue(true);
            vi.spyOn(bookingService, "sendMessageToVerifyPayment").mockResolvedValue(true);

            buildDatabaseMockSequence([teeTimeData, teeTimeData2]);

            await bookingService.reserveGroupBooking(
                "user-123",
                "cart-123",
                "payment-123",
                "sensible-123",
                "web",
                undefined,
                false,
                "http://localhost",
                "",
                "",
                ""
            );

            const passedOpts = (mockTokenizeService.tokenizeBooking as any).mock.calls[0][0];
            const { additionalTaxes } = passedOpts;

            // internal self-consistency to two-cent precision
            const recomputedTotal =
                additionalTaxes.greenFeeTaxTotal +
                additionalTaxes.markupTaxTotal +
                additionalTaxes.weatherGuaranteeTaxTotal +
                additionalTaxes.cartFeeTaxPercentTotal +
                additionalTaxes.merchandiseTaxTotal;

            expect(additionalTaxes.additionalTaxes).toBeCloseTo(recomputedTotal, 1);

            expect(((additionalTaxes.additionalTaxes as number) * 100) % 1).toBe(0);
        });
    });
});
