import React from 'react';
import dayjs from 'dayjs';

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HyperSwitch } from '~/components/checkout-page/hyper-switch';


// -------------------------
// 1) SIMPLE EXTERNAL MOCKS
// -------------------------

vi.mock("@/components/hyperswitch", () => {
    const hyperSwitchMock = vi.fn();

    const MockComponent = (props: any) => {
        return hyperSwitchMock(props);
    };

    return { default: MockComponent, hyperSwitchMock };
});

// Keep debounce simple for tests
vi.mock('usehooks-ts', () => ({
    useDebounce: (value: any) => value,
}));

// Simplified Next Link (so anchor attrs work)
vi.mock('next/link', () => ({
    default: ({ children, href }: any) => <a href={href}>{children}</a>,
}));

// -------------------------
// 2) INTERNAL COMPONENT MOCKS (TDZ-safe)
// -------------------------

// We'll expose the mock by importing after mocks are set up in beforeEach.
// For safety, we still create the mock factory here.
vi.mock('~/components/checkout-page/hyper-switch', () => {
    const MockComponent = vi.fn(({ cartData }: any) => (
        <div data-testid="hyper-switch">Cart Data Count: {cartData?.length ?? 0}</div>
    ));
    return {
        HyperSwitch: MockComponent,
    };
});

vi.mock('~/components/checkout-page/order-summary', () => ({
    OrderSummary: vi.fn(() => <div data-testid="order-summary" />),
}));

vi.mock('~/components/loading/spinner', () => ({
    Spinner: vi.fn(() => <div data-testid="spinner" />),
}));

vi.mock('~/components/nav/checkout-breadcrumbs', () => ({
    CheckoutBreadcumbs: vi.fn(() => <div data-testid="breadcrumbs" />),
}));

// -------------------------
// 3) tRPC / API MOCKS
//    Define functions ahead of vi.mock so they're stable and mutable
// -------------------------

const mockTeeTimeQuery = vi.fn();
const mockListingQuery = vi.fn();
const mockAppleWidgetReloadQuery = vi.fn();
const mockMaxReservationsQuery = vi.fn();
const mockPrivacyPolicyQuery = vi.fn();
const mockBookingStatusQuery = vi.fn();
const mockSystemNotificationsQuery = vi.fn();
const mockCourseGlobalNotificationQuery = vi.fn();
const mockValidatePromoMutation = vi.fn();
const mockGetCacheMutation = vi.fn();
const mockRefetchBookingStatus = vi.fn();

const apiMocks = {
    searchRouter: {
        getTeeTimeById: { useQuery: mockTeeTimeQuery },
        getListingById: { useQuery: mockListingQuery },
    },
    checkout: {
        isAppleEnabledReloadWidget: { useQuery: mockAppleWidgetReloadQuery },
        checkMaxReservationsAndMaxRounds: { useQuery: mockMaxReservationsQuery },
        // Hybrid: keep promo validation mocked (so tests control promo outcomes)
        validatePromoCode: { useMutation: () => ({ mutateAsync: mockValidatePromoMutation }) },
    },
    course: {
        // Keep privacy policy mocked
        getPrivacyPolicyAndTCByCourse: { useQuery: mockPrivacyPolicyQuery },
    },
    teeBox: {
        providerBookingStatus: {
            useQuery: (params: any, options: any) => {
                // component sometimes calls with enabled: false - return a refetch handle in that case
                if (options?.enabled === false) {
                    return { data: { providerBookingStatus: false }, refetch: mockRefetchBookingStatus };
                }
                return mockBookingStatusQuery();
            },
        },
    },
    cache: {
        getCache: { useMutation: () => ({ mutateAsync: mockGetCacheMutation }) },
    },
    systemNotification: {
        getSystemNotification: { useQuery: mockSystemNotificationsQuery },
        getCourseGlobalNotification: { useQuery: mockCourseGlobalNotificationQuery },
    },
};

vi.mock('~/utils/api', () => ({
    api: apiMocks,
}));

// -------------------------
// 4) CONTEXT MOCKS
// -------------------------

const mockUser = { id: 'test-user-id' };
const mockCourse = {
    id: 'c1',
    name: 'Test Course',
    latitude: 0,
    longitude: 0,
    convenienceFeesFixedPerPlayer: 100, // cents
    markupFeesFixedPerPlayer: 50,
    supportsSellingMerchandise: true,
};

vi.mock('~/contexts/CourseContext', () => ({
    useCourseContext: () => ({ course: mockCourse }),
}));

vi.mock('~/contexts/UserContext', () => ({
    useUserContext: () => ({ user: mockUser }),
}));

vi.mock('~/contexts/AppContext', () => ({
    useAppContext: () => ({ setActivePage: vi.fn() }),
}));

// Checkout context: mutable object (we'll mutate in tests)
type MockMerchandiseProduct = {
    id: string;
    price: number; // in cents or dollars depending on component; tests treat as cents where needed
    qty: number;
    merchandiseTaxPercent?: number;
};

interface MockCheckoutContext {
    shouldAddSensible: boolean;
    sensibleData: { id: string; price: number };
    amountOfPlayers: number;
    promoCode: string;
    selectedCharity: any;
    selectedCharityAmount: number;
    setAmountOfPlayers: Mock;
    validatePlayers: any[];
    setValidatePlayers: Mock;
    merchandiseData: MockMerchandiseProduct[];
}

const mockCheckout: MockCheckoutContext = {
    shouldAddSensible: false,
    sensibleData: { id: 's1', price: 10.0 },
    amountOfPlayers: 2,
    promoCode: '',
    selectedCharity: null,
    selectedCharityAmount: 0,
    setAmountOfPlayers: vi.fn(),
    validatePlayers: [],
    setValidatePlayers: vi.fn(),
    merchandiseData: [],
};

vi.mock('~/contexts/CheckoutContext', () => ({
    useCheckoutContext: () => mockCheckout,
}));

// -------------------------
// 5) MOCK DATA (default values)
// -------------------------

const mockTeeTimeData = {
    teeTimeId: 'tt-123',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    pricePerGolfer: 50.0,
    availableSlots: 4,
    greenFeeTaxPerPlayer: 20,
    cartFeeTaxPerPlayer: 10,
    cartFee: 500,
    greenFeeTaxPercent: 100,
    markupFees: 0,
    weatherGuaranteeTaxPercent: 0,
    markupTaxPercent: 0,
    merchandiseTaxPercent: 0,
    advancedBookingFeesPerPlayer: 0,
};

const mockListingData = {
    listingId: 'ls-456',
    date: dayjs().add(1, 'day').format('YYYY-MM-DD HH:mm:ss'),
    pricePerGolfer: 120.0,
    availableSlots: 2,
    ownerId: 'some-other-id',
    allowSplit: true,
};

// -------------------------
// 6) TEST HELPERS & RENDERER
// -------------------------

type CheckoutProps = {
    params: { course: string };
    searchParams?: Record<string, string | string[] | undefined>;
};

const defaultCheckoutProps: CheckoutProps = {
    params: { course: 'c1' },
    searchParams: { teeTimeId: 'tt-123', listingId: undefined, playerCount: undefined },
};

// We'll dynamically import the page component and the hyper-switch mock after mocks are set up
let CheckoutComponent: any = null;
let hyperSwitchMock: Mock | null = null;

const renderCheckout = (propsOverride: Partial<CheckoutProps> = {}) => {
    const finalProps: CheckoutProps = {
        ...defaultCheckoutProps,
        ...propsOverride,
        searchParams: {
            ...defaultCheckoutProps.searchParams,
            ...(propsOverride.searchParams ?? {}),
        },
    };

    // Ensure component has been dynamically imported in beforeEach
    if (!CheckoutComponent) {
        throw new Error('CheckoutComponent not loaded. Make sure you import it in beforeEach after mocks are set.');
    }

    return render(<CheckoutComponent {...finalProps} />);
};

// -------------------------
// 7) TEST SUITE
// -------------------------

describe('Checkout Component', () => {
    beforeEach(async () => {
        // Reset mocks
        vi.clearAllMocks();
        hyperSwitchMock = null;

        // default query behavior
        const defaultQueryReturn = (data: any) => ({ data, isLoading: false, isError: false, error: undefined });

        mockTeeTimeQuery.mockReturnValue(defaultQueryReturn(mockTeeTimeData));
        mockListingQuery.mockReturnValue(defaultQueryReturn(mockListingData));
        mockAppleWidgetReloadQuery.mockReturnValue(defaultQueryReturn(false));
        mockMaxReservationsQuery.mockReturnValue(defaultQueryReturn({ success: true }));
        mockPrivacyPolicyQuery.mockReturnValue(defaultQueryReturn('url'));
        mockBookingStatusQuery.mockReturnValue(defaultQueryReturn({ providerBookingStatus: false }));
        mockSystemNotificationsQuery.mockReturnValue(defaultQueryReturn([]));
        mockCourseGlobalNotificationQuery.mockReturnValue(defaultQueryReturn([]));

        // default mutation / resolves
        mockValidatePromoMutation.mockResolvedValue({ discount: 10, type: 'fixed' });
        mockGetCacheMutation.mockResolvedValue(null);
        mockRefetchBookingStatus.mockResolvedValue({ data: { providerBookingStatus: false } });

        // reset checkout context defaults
        mockCheckout.amountOfPlayers = 2;
        mockCheckout.promoCode = '';
        mockCheckout.shouldAddSensible = false;
        mockCheckout.merchandiseData = [];

        // Dynamic imports (after all vi.mock calls). This avoids TDZ and ensures the mocked HyperSwitch is available.
        const hyperModule = await import('~/components/checkout-page/hyper-switch');
        hyperSwitchMock = hyperModule.HyperSwitch as Mock;

        hyperSwitchMock.mockImplementation(({ cartData, promo }) => {
            const mainProduct = cartData?.find(
                (item: any) => item.product_data.metadata.type === "first_hand"
            );

            if (mainProduct && promo) {
                const basePrice = mainProduct.originalPrice ?? mainProduct.price / 100;

                if (promo.type === "percentage") {
                    const discounted = basePrice - (basePrice * promo.value) / 100;
                    mainProduct.price = Math.round(discounted * 100);
                }

                if (promo.type === "fixed_amount") {
                    const discounted = basePrice - promo.value;
                    mainProduct.price = Math.round(discounted * 100);
                }
            }

            return <div data-testid="hyper-switch-mock" />;
        });


        // Import the page under test (dynamic import so mocks are installed first)
        const pageModule = await import('../page');
        CheckoutComponent = pageModule.default ?? pageModule;
    });

    // --- A. Loading and Error States ---

    it('1. should show spinner while tee time data is loading', async () => {
        // make teeTime query show loading
        mockTeeTimeQuery.mockReturnValue({ isLoading: true, data: undefined });
        renderCheckout();

        // spinner is part of mocked Spinner component
        expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });

    it('2. should show generic error message if data fetching fails', async () => {
        mockTeeTimeQuery.mockReturnValue({
            isLoading: false,
            isError: true,
            error: new Error('Network Error'),
        });

        renderCheckout();

        await waitFor(() => {
            // The page should render an error message containing the network error text
            expect(screen.getByText(/Error: Network Error/i)).toBeInTheDocument();
            // should provide a return link to the course
            expect(screen.getByText(/Return to home/i)).toHaveAttribute('href', '/c1');
        });
    });

    it('3. should show custom error if user attempts to buy their own listing', async () => {
        // switch to listing flow
        mockTeeTimeQuery.mockReturnValue({ data: undefined, isLoading: false });
        mockListingQuery.mockReturnValue({
            data: { ...mockListingData, ownerId: 'test-user-id' }, // simulate owner is current user
            isLoading: false,
            isError: false,
        });

        renderCheckout({
            searchParams: {
                listingId: 'ls-456',
                teeTimeId: undefined,
            },
        });

        await waitFor(() => {
            expect(screen.getByText(/You cannot buy your own tee time/i)).toBeInTheDocument();
        });
    });

    it('4. should show expired error if tee time is within 30 minutes of current time', async () => {
        // Set tee time date to be 29 minutes in the future (within expiry window)
        const expiredDate = dayjs().add(29, 'minute').format('YYYY-MM-DD HH:mm:ss');
        mockTeeTimeQuery.mockReturnValue({
            data: { ...mockTeeTimeData, date: expiredDate },
            isLoading: false,
            isError: false,
        });

        renderCheckout();

        await waitFor(() => {
            expect(screen.getByText(/This tee time has expired and is no longer for sale/i)).toBeInTheDocument();
        });
    });

    it('5. should show error if booking status provider returns true', async () => {
        mockRefetchBookingStatus.mockResolvedValueOnce({ data: { providerBookingStatus: true } });

        renderCheckout();

        await waitFor(() => {
            expect(screen.getByText(/Currently, you cannot book this tee time due to an issue./i)).toBeInTheDocument();
        });
    });

    // --- B. Cart Data Logic (`useMemo`) Tests ---

    // it('6. should calculate base price correctly for first_hand sale', async () => {
    //     // With default mockTeeTimeData (50.00 per golfer) and amountOfPlayers = 2
    //     renderCheckout();

    //     await waitFor(() => {
    //         expect(screen.getByTestId('hyper-switch')).toBeInTheDocument();

    //         // access the args passed to the HyperSwitch mock
    //         const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };

    //         const mainProduct = cartData.find((item: any) => item.product_data?.metadata?.type === 'first_hand');
    //         expect(mainProduct).toBeDefined();
    //         expect(mainProduct.price).toBe(10000); // 50 * 2 * 100
    //         expect(cartData.length).toBeGreaterThan(1);
    //     });
    // });

    // it('7. should correctly apply a fixed amount promo code', async () => {
    //     // Hybrid: promo validation is mocked; but we still need to simulate user applying the code in UI
    //     mockCheckout.promoCode = 'TEST_PROMO';
    //     // Make mutation resolve to $10 fixed discount
    //     mockValidatePromoMutation.mockResolvedValue({ discount: 10, type: 'fixed' });

    //     renderCheckout();

    //     // Find promo input & apply UI controls (selectors here assume your page has them)
    //     const promoInput = screen.queryByPlaceholderText(/promo code/i) ?? screen.queryByPlaceholderText(/Enter Promo Code/i);
    //     const applyButton = screen.queryByRole('button', { name: /apply/i }) ?? screen.queryByText(/apply/i);

    //     if (promoInput && applyButton) {
    //         await userEvent.type(promoInput, 'TEST_PROMO');
    //         await userEvent.click(applyButton);
    //     } else {
    //         // If the page's promo UI differs, fall back to checking the cart directly after render.
    //         // This branch ensures test doesn't throw unnecessarily in slightly different markup.
    //     }

    //     await waitFor(() => {
    //         const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
    //         const mainProduct = cartData.find((item: any) => item.product_data?.metadata?.type === 'first_hand');

    //         // (100.00 - 10) * 100 = 9000 cents
    //         expect(mainProduct.price).toBe(9000);
    //     });
    // });

    it('8. should include sensible insurance if enabled and not invalid', async () => {
        mockCheckout.shouldAddSensible = true;
        // sensibleData price is $10.00 (in mockCheckout)
        renderCheckout();

        await waitFor(() => {
            const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
            const sensibleItem = cartData.find((item: any) => item.product_data?.metadata?.type === 'sensible');
            expect(sensibleItem).toBeDefined();
            expect(sensibleItem.price).toBe(1000); // 10.00 * 100
        });
    });

    it('9. should include convenience fee based on course config', async () => {
        renderCheckout();

        await waitFor(() => {
            const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
            const convFeeItem = cartData.find((item: any) => item.product_data?.metadata?.type === 'convenience_fee');
            expect(convFeeItem).toBeDefined();
            expect(convFeeItem.price).toBe(200); // 100 cents/player * 2 players
        });
    });

    it('10. should include basic merchandise without tax overrides', async () => {
        mockCheckout.merchandiseData = [
            { id: 'm1', price: 500, qty: 3 } as MockMerchandiseProduct,
        ];

        renderCheckout();

        await waitFor(() => {
            const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
            const merchItem = cartData.find((item: any) => item.product_data?.metadata?.type === 'merchandise');
            expect(merchItem).toBeDefined();
            expect(merchItem.price).toBe(1500);
            expect(merchItem.product_data.metadata.merchandiseItems[0].qty).toBe(3);
        });
    });

    it('11. should include merchandise with tax override in a separate item', async () => {
        mockCheckout.merchandiseData = [
            { id: 'm2', price: 2000, qty: 1, merchandiseTaxPercent: 1000 } as MockMerchandiseProduct,
        ];

        renderCheckout();

        await waitFor(() => {
            const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
            const merchOverrideItem = cartData.find((item: any) => item.product_data?.metadata?.type === 'merchandiseWithTaxOverride');
            expect(merchOverrideItem).toBeDefined();
            expect(merchOverrideItem.price).toBe(2200);
            expect(merchOverrideItem.product_data.metadata.priceWithoutTax).toBe(2000);
            expect(merchOverrideItem.product_data.metadata.taxAmount).toBe(200);
        });
    });

    it('12. should fall back to a price of 1 cent if calculated price is 0', async () => {
        mockTeeTimeQuery.mockReturnValue({
            data: { ...mockTeeTimeData, pricePerGolfer: 0.0 },
            isLoading: false,
            isError: false,
        });
        mockCheckout.amountOfPlayers = 1;

        renderCheckout();

        await waitFor(() => {
            const { cartData } = (hyperSwitchMock! as Mock).mock.calls[0]?.[0] || { cartData: [] };
            const mainProduct = cartData.find((item: any) => item.product_data?.metadata?.type === 'first_hand');
            expect(mainProduct.price).toBe(1); // should be at least 1 cent
        });
    });

    it('13. should show error if listing is already being checked out by another user', async () => {
        mockTeeTimeQuery.mockReturnValue({ data: undefined, isLoading: false });
        mockListingQuery.mockReturnValue({
            data: { ...mockListingData, allowSplit: true },
            isLoading: false,
            isError: false,
        });

        mockGetCacheMutation.mockResolvedValue(JSON.stringify({ userId: 'another-user-id' }));

        renderCheckout({
            searchParams: {
                listingId: 'ls-456',
                teeTimeId: undefined,
            },
        });

        await waitFor(() => {
            expect(mockGetCacheMutation).toHaveBeenCalledWith({ key: 'listing_id_ls-456' });
            expect(screen.getByText(/The tee time is currently unavailable. Please check back in 20 mins./i)).toBeInTheDocument();
        });
    });
});
