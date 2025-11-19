import { render, screen } from "@testing-library/react";
import CheckoutConfirmation from "../page";
import React from "react";
import { vi } from "vitest";

/**
 * ─────────────────────────────────────────────────────────
 * MOCKS
 * ─────────────────────────────────────────────────────────
 */

// Mock CourseContext
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({
        course: { id: "course-123" },
    }),
}));

// Mock next/navigation search params
const mockGet = vi.fn();

vi.mock("next/navigation", () => ({
    useSearchParams: () => ({
        get: mockGet,
    }),
}));

// Mock API hooks
const mockSystemNotificationQuery = vi.fn();
const mockCourseGlobalNotificationQuery = vi.fn();

vi.mock("~/utils/api", () => ({
    api: {
        systemNotification: {
            getSystemNotification: {
                useQuery: (args: any) => mockSystemNotificationQuery(args),
            },
            getCourseGlobalNotification: {
                useQuery: (args: any) => mockCourseGlobalNotificationQuery(args),
            },
        },
    },
}));

// Mock Breadcrumb component
vi.mock("~/components/nav/checkout-breadcrumbs", () => ({
    CheckoutBreadcumbs: ({ status }: any) => (
        <div data-testid="breadcrumbs">{status}</div>
    ),
}));

// Mock Confirmation component
const mockConfirmation = vi.fn();
vi.mock("~/components/checkout-page/confirmation", () => ({
    Confirmation: (props: any) => {
        mockConfirmation(props);
        return <div data-testid="confirmation" />;
    },
}));


// Helper to render
const renderPage = () => render(<CheckoutConfirmation />);


describe("CheckoutConfirmation Page", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test("renders breadcrumbs and confirmation", () => {
        mockGet.mockImplementation((key: string) => {
            if (key === "teeTimeId") return "tee-999";
            if (key === "bookingId") return "booking-ABC";
            if (key === "isEmailSend") return "true";
            if (key === "isGroupBooking") return "false";
            if (key === "collectPayment") return "true";
            return null;
        });

        mockSystemNotificationQuery.mockReturnValue([]);
        mockCourseGlobalNotificationQuery.mockReturnValue([]);

        renderPage();

        expect(screen.getByTestId("breadcrumbs")).toBeInTheDocument();
        expect(screen.getByTestId("confirmation")).toBeInTheDocument();
    });

    test("passes correct props to Confirmation component", () => {
        mockGet.mockImplementation((key: string) => {
            const map: Record<string, string> = {
                teeTimeId: "tee-111",
                bookingId: "bk-222",
                isEmailSend: "true",
                isGroupBooking: "true",
                collectPayment: "false",
            };
            return map[key] ?? null;
        });

        mockSystemNotificationQuery.mockReturnValue([]);
        mockCourseGlobalNotificationQuery.mockReturnValue([]);

        renderPage();

        expect(mockConfirmation).toHaveBeenCalledWith({
            teeTimeId: "tee-111",
            bookingId: "bk-222",
            isEmailSend: true,
            isGroupBooking: true,
            isValidForCollectPayment: false,
        });
    });
});
