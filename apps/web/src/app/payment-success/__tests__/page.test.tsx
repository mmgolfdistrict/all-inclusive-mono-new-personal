/**
 * @vitest-environment jsdom
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SplitPaymentSuccessPage from "../page";
import React from "react";

// -----------------------------
// Mock next/navigation
// -----------------------------
const mockPush = vi.fn();
let mockParams: Record<string, string> = {};

vi.mock("next/navigation", () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useSearchParams: () => ({
        get: (key: string) => mockParams[key] || null,
    }),
}));

// -----------------------------
// Mock contexts
// -----------------------------
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({
        course: { logo: "test-logo.png" },
    }),
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({
        entity: { color1: "#123456" },
    }),
}));

// -----------------------------
// Mock Loader component
// -----------------------------
vi.mock("~/components/loading/spinner", () => ({
    Loader: () => <div data-testid="loader">Loading...</div>,
}));

// -----------------------------
// Mock tRPC / API
// -----------------------------
let errorTriggered = false;

const mockUseQuery = vi.fn();

vi.mock("~/utils/api", () => ({
    api: {
        checkout: {
            updateSplitPaymentStatus: {
                useQuery: (...args: any[]) => mockUseQuery(...args),
            },
        },
    },
}));

// -----------------------------
// Test Suite
// -----------------------------
describe("SplitPaymentSuccessPage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        errorTriggered = false;

        mockParams = {
            payment_id: "123",
            finixReferencePaymentId: "ref-123",
            status: "succeeded",
        };
    });

    // 1️⃣ Loading state
    it("renders loader when isLoading = true", () => {
        mockUseQuery.mockReturnValue({
            data: null,
            isLoading: true,
            error: null,
        });

        render(<SplitPaymentSuccessPage />);

        expect(screen.getByTestId("loader")).toBeInTheDocument();
    });

    // 2️⃣ Success UI
    it("renders success UI when status = succeeded", () => {
        mockParams.status = "succeeded";

        mockUseQuery.mockReturnValue({
            data: {},
            isLoading: false,
            error: null,
        });

        render(<SplitPaymentSuccessPage />);

        expect(screen.getByText("Payment Successful")).toBeInTheDocument();
        expect(
            screen.getByText("Your payment has been processed successfully.")
        ).toBeInTheDocument();
    });

    // 3️⃣ Failed UI
    it("renders failed UI when status != succeeded", () => {
        mockParams.status = "failed";

        mockUseQuery.mockReturnValue({
            data: {},
            isLoading: false,
            error: null,
        });

        render(<SplitPaymentSuccessPage />);

        expect(screen.getByText("Payment Failed")).toBeInTheDocument();
        expect(
            screen.getByText("Unfortunately, your payment could not be completed.")
        ).toBeInTheDocument();
    });

    // 4️⃣ ErrorMessage UI (mock onError only once)
    it("renders custom errorMessage UI when onError triggers", () => {
        mockUseQuery.mockImplementation((_params, opts) => {
            if (!errorTriggered) {
                errorTriggered = true;
                opts?.onError?.(new Error("Some error occurred"));
            }

            return {
                data: null,
                isLoading: false,
                error: new Error("Some error occurred"),
            };
        });

        render(<SplitPaymentSuccessPage />);

        expect(screen.getByText("Payment Status")).toBeInTheDocument();
        expect(screen.getByText("Some error occurred")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: "Go to Dashboard" })
        ).toBeInTheDocument();
    });

    // 5️⃣ Button click → redirect
    it("redirects to dashboard when button clicked", () => {
        mockUseQuery.mockReturnValue({
            data: {},
            isLoading: false,
            error: null,
        });

        render(<SplitPaymentSuccessPage />);

        const button = screen.getByRole("button", { name: "Go to Dashboard" });

        fireEvent.click(button);

        expect(mockPush).toHaveBeenCalledWith("/");
    });
});
