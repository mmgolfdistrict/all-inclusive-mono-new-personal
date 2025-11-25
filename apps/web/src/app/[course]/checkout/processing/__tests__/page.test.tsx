import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import CheckoutProcessing from "../../processing/page";
import { vi } from "vitest";

// ------------------ mock next/navigation ------------------

const routerPushMock = vi.fn();

let searchParamsData = {
    status: "succeeded",
    payment_intent_client_secret: "pi_123secret_abc",
    teeTimeId: "T1",
    payment_id: "P1",
    cart_id: "C1",
    need_rentals: "false",
    listing_id: "",
};

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: routerPushMock,
    }),

    useSearchParams: () =>
        new URLSearchParams(searchParamsData),
}));


// ------------------ mock contexts ------------------
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({
        course: { id: "COURSE1" },
    }),
}));

vi.mock("~/contexts/UserContext", () => ({
    useUserContext: () => ({
        user: { id: "U1", email: "test@test.com", phone: "999999" },
    }),
}));

vi.mock("~/contexts/BookingSourceContext", () => ({
    useBookingSourceContext: () => ({
        bookingSource: "",
        setBookingSource: vi.fn(),
    }),
}));

vi.mock("~/contexts/CheckoutContext", () => ({
    useCheckoutContext: () => ({
        sensibleData: { id: "QUOTE1" },
        amountOfPlayers: 2,
        setReservationData: vi.fn(),
    }),
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({
        entity: { color1: "#123456" },
    }),
}));

// ------------------ mock toast ------------------
vi.mock("react-toastify", () => ({
    toast: { error: vi.fn() },
}));

// ------------------ mock TRPC API ------------------
const mockApi = vi.hoisted(() => ({
    checkout: {
        retrivePaymentIntent: {
            useQuery: vi.fn(),
        },
        checkMaxReservationsAndMaxRounds: {
            useQuery: vi.fn(),
        },
    },
    teeBox: {
        reserveBooking: { useMutation: vi.fn() },
        reserveSecondHandBooking: { useMutation: vi.fn() },
        checkIfTeeTimeAvailableOnProvider: { useMutation: vi.fn() },
        checkIfTeeTimeStillListedByListingId: { useQuery: vi.fn() },
    },
    course: {
        getCourseById: { useQuery: vi.fn() },
    },
    webhooks: {
        cancelHyperswitchPaymentById: { useMutation: vi.fn() },
    },
    systemNotification: {
        getSystemNotification: { useQuery: vi.fn() },
        getCourseGlobalNotification: { useQuery: vi.fn() },
    },
}));

vi.mock("~/utils/api", () => ({
    api: mockApi,
}));

// ------------------ helper render ------------------
function setup() {
    return render(<CheckoutProcessing />);
}

// -----------------------------------------------------
//                   TESTS START HERE
// -----------------------------------------------------

describe("CheckoutProcessing Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Notifications
        mockApi.systemNotification.getSystemNotification.useQuery.mockReturnValue({
            data: [],
        });
        mockApi.systemNotification.getCourseGlobalNotification.useQuery.mockReturnValue({
            data: [],
        });

        // Not disabled
        mockApi.course.getCourseById.useQuery.mockReturnValue({
            data: { isBookingDisabled: 0 },
        });

        // Max reservation OK
        mockApi.checkout.checkMaxReservationsAndMaxRounds.useQuery.mockReturnValue({
            data: { success: true },
        });

        // Default: tee time available
        mockApi.teeBox.checkIfTeeTimeAvailableOnProvider.useMutation.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue(true),
        });

        // Default: listing check
        mockApi.teeBox.checkIfTeeTimeStillListedByListingId.useQuery.mockReturnValue({
            refetch: vi.fn().mockResolvedValue({ data: true }),
        });

        // Default mutations
        mockApi.teeBox.reserveBooking.useMutation.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue({
                bookingId: "B1",
                providerBookingId: "PB1",
                status: "ok",
                isEmailSend: true,
                isValidForCollectPayment: false,
            }),
        });

        mockApi.teeBox.reserveSecondHandBooking.useMutation.mockReturnValue({
            mutateAsync: vi.fn().mockResolvedValue({
                bookingId: "B2",
            }),
        });

        mockApi.webhooks.cancelHyperswitchPaymentById.useMutation.mockReturnValue({
            mutateAsync: vi.fn(),
        });
    });

    // -----------------------------------------------------
    // test("1. Renders spinner before any message appears", () => {
    //     mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
    //         data: undefined,
    //         isLoading: true,
    //     });

    //     setup();
    //     expect(screen.getByRole("status")).toBeInTheDocument();
    // });

    // -----------------------------------------------------
    // test("2. Handles failed payment status", async () => {
    //     searchParamsData = { ...searchParamsData, status: "failed" };

    //     mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
    //         data: { status: "failed" },
    //         isLoading: false,
    //     });

    //     setup();

    //     await waitFor(() => {
    //         expect(
    //             screen.getByText(
    //                 "Something went wrong while making payment, Please try again."
    //             )
    //         ).toBeInTheDocument();
    //     });
    // });


    // -----------------------------------------------------
    test("3. Shows max reservation error", async () => {
        mockApi.checkout.checkMaxReservationsAndMaxRounds.useQuery.mockReturnValue({
            data: { success: false, message: "Max reservation exceeded" },
        });

        mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
            data: { status: "succeeded" },
            isLoading: false,
        });

        setup();

        await waitFor(() => {
            expect(screen.getByText("Max reservation exceeded")).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------
    test("4. Handles successful first-hand booking and redirects", async () => {
        routerPushMock.mockReset();

        searchParamsData = {
            ...searchParamsData,
            status: "succeeded",
            teeTimeId: "T1",
            payment_id: "P1",
            cart_id: "C1",
        };

        mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
            data: { status: "succeeded" },
            isLoading: false,
        });

        setup();

        await waitFor(() => {
            expect(routerPushMock).toHaveBeenCalled();
        });
    });


    // -----------------------------------------------------
    test("5. Shows 'Booking Successful' message", async () => {
        mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
            data: { status: "succeeded" },
            isLoading: false,
        });

        setup();

        await waitFor(() => {
            expect(screen.getByText("Booking Successful")).toBeInTheDocument();
        });
    });

    // -----------------------------------------------------
    test("6. Shows Go To My Tee Box link on error message", async () => {
        mockApi.checkout.retrivePaymentIntent.useQuery.mockReturnValue({
            data: { status: "processing" },
            isLoading: false,
        });

        setup();

        await waitFor(() => {
            expect(
                screen.getByTestId("go-to-my-tee-box-button-id")
            ).toBeInTheDocument();
        });
    });
});
