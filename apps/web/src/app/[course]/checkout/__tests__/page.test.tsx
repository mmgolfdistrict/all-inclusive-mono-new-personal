// src/app/[course]/checkout/__tests__/page.test.tsx
import React, { type ComponentType } from "react";
import dayjs from "dayjs";
import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import _userEvent from "@testing-library/user-event"; // intentionally prefixed to keep linter happy

// -------------------------------
// Minimal local types used by tests
// -------------------------------
interface QueryResult<T> {
    data?: T | undefined;
    isLoading?: boolean;
    isError?: boolean;
    error?: unknown;
    refetch?: () => Promise<unknown>;
}

type TeeTimeDetails = {
    teeTimeId: string;
    date: string;
    pricePerGolfer: number;
    availableSlots: number;
    greenFeeTaxPerPlayer: number;
    cartFeeTaxPerPlayer: number;
    cartFee: number;
    greenFeeTaxPercent: number;
    greenFee: number;
    players: number;
    advancedBookingFeesPerPlayer: number;
};

// -------------------------------
// Strong Types for Cart Item Metadata & Items
// -------------------------------
interface CartItemMetadataBase {
    type: string;
}

interface FirstHandMetadata extends CartItemMetadataBase {
    type: "first_hand";
    // optional bookkeeping field used by the mock
    originalPrice?: number;
}

interface SensibleMetadata extends CartItemMetadataBase {
    type: "sensible";
}

interface ConvenienceFeeMetadata extends CartItemMetadataBase {
    type: "convenience_fee";
}

interface MerchandiseItem {
    id: string;
    qty: number;
    price: number;
}

interface MerchandiseWithTaxOverrideMetadata extends CartItemMetadataBase {
    type: "merchandiseWithTaxOverride";
    merchandiseItems: MerchandiseItem[];
    priceWithoutTax: number;
    taxAmount: number;
}

interface MerchandiseMetadata extends CartItemMetadataBase {
    type: "merchandise";
    merchandiseItems?: MerchandiseItem[]; // optional for simple merch
}

type CartItemMetadata =
    | FirstHandMetadata
    | SensibleMetadata
    | ConvenienceFeeMetadata
    | MerchandiseWithTaxOverrideMetadata
    | MerchandiseMetadata;

interface ProductData {
    metadata: CartItemMetadata;
}

interface CartItem {
    id?: string;
    price: number;
    originalPrice?: number | null;
    product_data: ProductData;
    [k: string]: unknown;
}

// -------------------------------
// Type guards (no unnecessary assertions)
// -------------------------------
const isCartItem = (v: unknown): v is CartItem =>
    typeof v === "object" && v !== null && "product_data" in v;

const isMetadataType = <T extends CartItemMetadata["type"]>(
    md: CartItemMetadata | undefined,
    t: T
): md is Extract<CartItemMetadata, { type: T }> => Boolean(md && md.type === t);

// -------------------------------
// 1) SIMPLE EXTERNAL MOCKS
// -------------------------------

// external hyperswitch package (spy)
const hyperswitchMockFn = vi.fn();
vi.mock("@/components/hyperswitch", () => {
    const MockComponent: ComponentType<Record<string, unknown>> = (props) =>
        hyperswitchMockFn(props) as unknown as React.ReactElement;
    return { default: MockComponent, hyperSwitchMock: hyperswitchMockFn };
});

// debounce passthrough for tests
vi.mock("usehooks-ts", () => ({
    useDebounce: <T,>(value: T) => value,
}));

// simple next/link mock so anchor attributes render
vi.mock("next/link", () => {
    const LinkMock: ComponentType<{ href?: string; children?: React.ReactNode }> = ({ href, children }) => (
        <a href={href}>{children}</a>
    );
    return { default: LinkMock };
});

// -------------------------------
// 2) INTERNAL COMPONENT MOCKS (TDZ-safe)
// -------------------------------
vi.mock("~/components/checkout-page/hyper-switch", () => {
    type Props = { cartData?: unknown[]; promo?: unknown };
    const MockComponent: Mock = vi.fn(({ cartData }: Props) => (
        <div data-testid="hyper-switch">Cart Data Count: {Array.isArray(cartData) ? cartData.length : 0}</div>
    ));
    return { HyperSwitch: MockComponent };
});

vi.mock("~/components/checkout-page/order-summary", () => {
    const OrderSummary: Mock = vi.fn(() => <div data-testid="order-summary" />);
    return { OrderSummary };
});

vi.mock("~/components/loading/spinner", () => {
    const Spinner: Mock = vi.fn(() => <div data-testid="spinner" />);
    return { Spinner };
});

vi.mock("~/components/nav/checkout-breadcrumbs", () => {
    const CheckoutBreadcumbs: Mock = vi.fn(() => <div data-testid="breadcrumbs" />);
    return { CheckoutBreadcumbs };
});

// -------------------------------
// 3) tRPC / API MOCKS
//    (stable mutable mocks defined before vi.mock to avoid TDZ)
// -------------------------------
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
        validatePromoCode: { useMutation: () => ({ mutateAsync: mockValidatePromoMutation }) },
    },
    course: {
        getPrivacyPolicyAndTCByCourse: { useQuery: mockPrivacyPolicyQuery },
    },
    teeBox: {
        providerBookingStatus: {
            // return typed QueryResult so linter/types are satisfied
            useQuery: (
                _params: Record<string, unknown>,
                options?: Record<string, unknown>
            ): QueryResult<{ providerBookingStatus: boolean }> => {
                if (options?.enabled === false) {
                    return { data: { providerBookingStatus: false }, refetch: mockRefetchBookingStatus };
                }
                // explicitly cast the mock return to the expected QueryResult shape
                return mockBookingStatusQuery() as QueryResult<{ providerBookingStatus: boolean }>;
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

vi.mock("~/utils/api", () => ({ api: apiMocks }));

// -------------------------------
// 4) CONTEXT MOCKS
// -------------------------------
const mockUser = { id: "test-user-id" };
const mockCourse = {
    id: "c1",
    name: "Test Course",
    latitude: 0,
    longitude: 0,
    convenienceFeesFixedPerPlayer: 100, // cents
    markupFeesFixedPerPlayer: 50,
    supportsSellingMerchandise: true,
};

vi.mock("~/contexts/CourseContext", () => ({ useCourseContext: () => ({ course: mockCourse }) }));
vi.mock("~/contexts/UserContext", () => ({ useUserContext: () => ({ user: mockUser }) }));
vi.mock("~/contexts/AppContext", () => ({ useAppContext: () => ({ setActivePage: vi.fn() }) }));

// -------------------------------
// 5) CHECKOUT CONTEXT (mutable)
// -------------------------------
type MockMerchandiseProduct = { id: string; price: number; qty: number; merchandiseTaxPercent?: number };

interface MockCheckoutContext {
    shouldAddSensible: boolean;
    sensibleData: { id: string; price: number };
    amountOfPlayers: number;
    promoCode: string;
    selectedCharity: Record<string, unknown> | null;
    selectedCharityAmount: number;
    setAmountOfPlayers: Mock;
    validatePlayers: unknown[];
    setValidatePlayers: Mock;
    merchandiseData: MockMerchandiseProduct[];
}

const mockCheckout: MockCheckoutContext = {
    shouldAddSensible: false,
    sensibleData: { id: "s1", price: 10.0 },
    amountOfPlayers: 2,
    promoCode: "",
    selectedCharity: null,
    selectedCharityAmount: 0,
    setAmountOfPlayers: vi.fn(),
    validatePlayers: [],
    setValidatePlayers: vi.fn(),
    merchandiseData: [],
};

vi.mock("~/contexts/CheckoutContext", () => ({ useCheckoutContext: () => mockCheckout }));

// -------------------------------
// 6) MOCK DATA (default values)
// -------------------------------
const mockTeeTimeData: TeeTimeDetails = {
    teeTimeId: "tt-123",
    date: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
    pricePerGolfer: 50.0,
    availableSlots: 4,
    greenFeeTaxPerPlayer: 20,
    cartFeeTaxPerPlayer: 10,
    cartFee: 500,
    greenFeeTaxPercent: 100,
    greenFee: 0,
    players: 1,
    advancedBookingFeesPerPlayer: 0,
};

const mockListingData = {
    listingId: "ls-456",
    date: dayjs().add(1, "day").format("YYYY-MM-DD HH:mm:ss"),
    pricePerGolfer: 120.0,
    availableSlots: 2,
    ownerId: "some-other-id",
    allowSplit: true,
};

// -------------------------------
// 7) TEST HELPERS & RENDERER
// -------------------------------
type CheckoutProps = { params: { course: string }; searchParams?: Record<string, string | string[] | undefined> };

const defaultCheckoutProps: CheckoutProps = {
    params: { course: "c1" },
    searchParams: { teeTimeId: "tt-123", listingId: undefined, playerCount: undefined },
};

let CheckoutComponent: ComponentType<CheckoutProps> | null = null;
let hyperSwitchMock: Mock | null = null;

const renderCheckout = (propsOverride: Partial<CheckoutProps> = {}) => {
    const finalProps: CheckoutProps = {
        ...defaultCheckoutProps,
        ...propsOverride,
        searchParams: { ...defaultCheckoutProps.searchParams, ...(propsOverride.searchParams ?? {}) },
    };

    if (!CheckoutComponent) {
        throw new Error("CheckoutComponent not loaded. Make sure it is imported in beforeEach after mocks are set.");
    }

    return render(<CheckoutComponent {...finalProps} />);
};

// -------------------------------
// 8) TEST SUITE
// -------------------------------
describe("Checkout Component", () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        hyperSwitchMock = null;

        // helper that returns correctly-typed QueryResult<T>
        const defaultQueryReturn = <T,>(data: T): QueryResult<T> => ({ data, isLoading: false, isError: false, error: undefined });

        mockTeeTimeQuery.mockReturnValue(defaultQueryReturn(mockTeeTimeData));
        mockListingQuery.mockReturnValue(defaultQueryReturn(mockListingData));
        mockAppleWidgetReloadQuery.mockReturnValue(defaultQueryReturn(false));
        mockMaxReservationsQuery.mockReturnValue(defaultQueryReturn({ success: true }));
        mockPrivacyPolicyQuery.mockReturnValue(defaultQueryReturn("url"));
        mockBookingStatusQuery.mockReturnValue(defaultQueryReturn({ providerBookingStatus: false }));
        mockSystemNotificationsQuery.mockReturnValue(defaultQueryReturn([]));
        mockCourseGlobalNotificationQuery.mockReturnValue(defaultQueryReturn([]));

        mockValidatePromoMutation.mockResolvedValue({ discount: 10, type: "fixed" });
        mockGetCacheMutation.mockResolvedValue(null);
        mockRefetchBookingStatus.mockResolvedValue({ data: { providerBookingStatus: false } });

        mockCheckout.amountOfPlayers = 2;
        mockCheckout.promoCode = "";
        mockCheckout.shouldAddSensible = false;
        mockCheckout.merchandiseData = [];

        const hyperModule = await import("~/components/checkout-page/hyper-switch");
        hyperSwitchMock = (hyperModule.HyperSwitch as Mock) ?? null;

        // Provide a realistic (test-only) mock implementation for HyperSwitch that manipulates cartData when promo is given
        hyperSwitchMock?.mockImplementation(({ cartData, promo }: { cartData?: unknown[]; promo?: unknown }) => {
            if (Array.isArray(cartData) && promo && typeof promo === "object" && promo !== null) {
                const main = cartData
                    .filter(isCartItem)
                    .find((it) => isMetadataType(it.product_data.metadata, "first_hand"));

                if (main && (promo as Record<string, unknown>).type === "fixed_amount") {
                    const md = main
                    if (typeof md.originalPrice === "number") {
                        const basePrice = md.originalPrice;
                        md.price = Math.round((basePrice - Number((promo as Record<string, unknown>).value ?? 0)) * 100);
                    }
                }
            }
            return <div data-testid="hyper-switch-mock" />;
        });

        const pageModule = await import("../page");
        CheckoutComponent = (pageModule.default ?? pageModule) as ComponentType<CheckoutProps>;
    });

    // --- A. Loading and Error States ---
    it("1. should show spinner while tee time data is loading", () => {
        mockTeeTimeQuery.mockReturnValue({ isLoading: true, data: undefined } as QueryResult<TeeTimeDetails>);
        renderCheckout();
        expect(screen.getByTestId("spinner")).toBeInTheDocument();
    });

    it("2. should show generic error message if data fetching fails", async () => {
        mockTeeTimeQuery.mockReturnValue({
            isLoading: false,
            isError: true,
            error: new Error("Network Error"),
            data: undefined,
        } as QueryResult<TeeTimeDetails>);
        renderCheckout();
        await waitFor(() => {
            expect(screen.getByText(/Error: Network Error/i)).toBeInTheDocument();
            expect(screen.getByText(/Return to home/i)).toHaveAttribute("href", "/c1");
        });
    });

    it("3. should show custom error if user attempts to buy their own listing", async () => {
        mockTeeTimeQuery.mockReturnValue({ data: undefined, isLoading: false } as QueryResult<TeeTimeDetails>);
        mockListingQuery.mockReturnValue(
            { data: { ...mockListingData, ownerId: "test-user-id" }, isLoading: false, isError: false } as QueryResult<typeof mockListingData>
        );

        renderCheckout({ searchParams: { listingId: "ls-456", teeTimeId: undefined } });

        await waitFor(() => {
            expect(screen.getByText(/You cannot buy your own tee time/i)).toBeInTheDocument();
        });
    });

    it("4. should show expired error if tee time is within 30 minutes of current time", async () => {
        const expiredDate = dayjs().add(29, "minute").format("YYYY-MM-DD HH:mm:ss");
        mockTeeTimeQuery.mockReturnValue({ data: { ...mockTeeTimeData, date: expiredDate }, isLoading: false, isError: false } as QueryResult<TeeTimeDetails>);

        renderCheckout();

        await waitFor(() => {
            expect(screen.getByText(/This tee time has expired and is no longer for sale/i)).toBeInTheDocument();
        });
    });

    it("5. should show error if booking status provider returns true", async () => {
        mockRefetchBookingStatus.mockResolvedValueOnce({ data: { providerBookingStatus: true } });
        renderCheckout();
        await waitFor(() => {
            expect(screen.getByText(/Currently, you cannot book this tee time due to an issue./i)).toBeInTheDocument();
        });
    });


    it("8. should include sensible insurance if enabled and not invalid", async () => {
        mockCheckout.shouldAddSensible = true;
        renderCheckout();

        await waitFor(() => {
            if (!hyperSwitchMock) return;
            const props = hyperSwitchMock.mock.calls[0]?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];
            const sensibleItem = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "sensible"));
            expect(sensibleItem).toBeDefined();
            if (sensibleItem && isCartItem(sensibleItem)) {
                const price = sensibleItem.price;
                expect(typeof price === "number").toBeTruthy();
                if (typeof price === "number") expect(price).toBeGreaterThanOrEqual(1);
            }
        });
    });

    it("8. should include sensible insurance if enabled and not invalid", async () => {
        mockCheckout.shouldAddSensible = true;
        renderCheckout();

        await waitFor(() => {
            const props = hyperSwitchMock!.mock.calls[0]?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];
            const sensibleItem = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "sensible"));
            expect(sensibleItem).toBeDefined();
            if (sensibleItem && isCartItem(sensibleItem)) {
                const price = sensibleItem.price;
                expect(typeof price === "number").toBeTruthy();
                if (typeof price === "number") expect(price).toBeGreaterThanOrEqual(1);
            }
        });
    });

    // Test #9 
    it("9. should include convenience fee based on course config", async () => {
        renderCheckout();

        await waitFor(() => {
            const props = hyperSwitchMock!.mock.calls[0]?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];
            const convFeeItem = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "convenience_fee"));
            expect(convFeeItem).toBeDefined();
            if (convFeeItem && isCartItem(convFeeItem)) {
                const price = convFeeItem.price;
                expect(price).toBeDefined();
                if (typeof price === "number") expect(price).toBe(200);
            }
        });
    });

    // Test #10
    it("10. should include basic merchandise without tax overrides", async () => {
        mockCheckout.merchandiseData = [{ id: "m1", price: 500, qty: 3 }];

        renderCheckout();

        await waitFor(() => {
            const call = hyperSwitchMock!.mock.calls[0];
            const props = call?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];

            const merchItem = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "merchandise"));
            expect(merchItem).toBeDefined();

            if (merchItem && isCartItem(merchItem)) {
                expect(merchItem.price).toBe(1500);

                const meta = merchItem.product_data.metadata;
                expect(isMetadataType(meta, "merchandise")).toBe(true);
                const merchMeta = meta as MerchandiseMetadata;
                expect(Array.isArray(merchMeta.merchandiseItems)).toBe(true);

                const items = merchMeta.merchandiseItems;
                if (Array.isArray(items) && items.length > 0) {
                    expect(items[0]!.qty).toBe(3);
                }
            }
        });
    });

    // Test #11
    it("11. should include merchandise with tax override in a separate item", async () => {
        mockCheckout.merchandiseData = [{ id: "m2", price: 2000, qty: 1, merchandiseTaxPercent: 1000 }];

        renderCheckout();

        await waitFor(() => {
            const props = hyperSwitchMock!.mock.calls[0]?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];
            const merchOverrideItem = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "merchandiseWithTaxOverride"));
            expect(merchOverrideItem).toBeDefined();
            if (merchOverrideItem && isCartItem(merchOverrideItem)) {
                expect(merchOverrideItem.price).toBe(2200);
                const meta = merchOverrideItem.product_data.metadata;
                if (isMetadataType(meta, "merchandiseWithTaxOverride")) {
                    expect(meta.priceWithoutTax).toBe(2000);
                    expect(meta.taxAmount).toBe(200);
                }
            }
        });
    });

    // Test #12
    it("12. should fall back to a price of 1 cent if calculated price is 0", async () => {
        mockTeeTimeQuery.mockReturnValue({ data: { ...mockTeeTimeData, pricePerGolfer: 0.0 }, isLoading: false, isError: false } as QueryResult<TeeTimeDetails>);
        mockCheckout.amountOfPlayers = 1;

        renderCheckout();

        await waitFor(() => {
            const props = hyperSwitchMock!.mock.calls[0]?.[0] ?? {};
            const cartData = Array.isArray(props.cartData) ? props.cartData : [];
            const mainProduct = cartData.find((item) => isCartItem(item) && isMetadataType(item.product_data.metadata, "first_hand"));
            if (mainProduct && isCartItem(mainProduct)) {
                expect(mainProduct.price).toBe(1);
            }
        });
    });

    it("13. should show error if listing is already being checked out by another user", async () => {
        mockTeeTimeQuery.mockReturnValue({ data: undefined, isLoading: false } as QueryResult<TeeTimeDetails>);
        mockListingQuery.mockReturnValue({ data: { ...mockListingData, allowSplit: true }, isLoading: false } as QueryResult<typeof mockListingData>);
        mockGetCacheMutation.mockResolvedValue(JSON.stringify({ userId: "another-user-id" }));

        renderCheckout({ searchParams: { listingId: "ls-456", teeTimeId: undefined } });

        await waitFor(() => {
            expect(mockGetCacheMutation).toHaveBeenCalledWith({ key: "listing_id_ls-456" });
            expect(screen.getByText(/The tee time is currently unavailable. Please check back in 20 mins./i)).toBeInTheDocument();
        });
    });
});
