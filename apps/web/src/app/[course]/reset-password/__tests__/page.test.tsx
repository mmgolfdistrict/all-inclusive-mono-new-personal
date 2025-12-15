// src/app/[course]/reset-password/__tests__/page.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

/* -------------------------------------------------
   Types
------------------------------------------------- */

type VerifyTokenData = { valid: boolean };

interface MockMutation<TData> {
    mutate: () => void;
    mutateAsync: () => Promise<unknown>;
    reset: () => void;
    data?: TData;
    isLoading: boolean;
    isError: boolean;
    isSuccess: boolean;
}

/* -------------------------------------------------
   Stable mutation instances (NO hoisting issues)
------------------------------------------------- */

const verifyTokenMutation: MockMutation<VerifyTokenData> = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    data: { valid: true },
    isLoading: false,
    isError: false,
    isSuccess: true,
};

const resetPasswordMutation: MockMutation<void> = {
    mutate: vi.fn(),
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    reset: vi.fn(),
    isLoading: false,
    isError: false,
    isSuccess: false,
};

/* -------------------------------------------------
   Module mocks (PURE, hoist-safe)
------------------------------------------------- */

vi.mock("~/utils/api", () => ({
    api: {
        user: {
            verifyForgotPasswordToken: {
                useMutation: () => verifyTokenMutation,
            },
            executeForgotPassword: {
                useMutation: () => resetPasswordMutation,
            },
        },
    },
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({
        setPrevPath: vi.fn(),
        entity: { color1: "#123456" },
    }),
}));

vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({
        course: { id: "test-course" },
    }),
}));

const mockSearchParams = { get: vi.fn() };

vi.mock("next/navigation", () => ({
    useSearchParams: () => mockSearchParams,
}));

vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

/* -------------------------------------------------
   Import component AFTER mocks
------------------------------------------------- */

import ResetPassword from "../page";

/* -------------------------------------------------
   Tests
------------------------------------------------- */

describe("ResetPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSearchParams.get.mockImplementation((key: string) =>
            key === "userId"
                ? "user-123"
                : key === "verificationToken"
                    ? "token-999"
                    : null
        );

        // reset mutation state
        verifyTokenMutation.data = { valid: true };
        verifyTokenMutation.isError = false;
        verifyTokenMutation.isLoading = false;
        verifyTokenMutation.isSuccess = true;

        resetPasswordMutation.isSuccess = false;
        resetPasswordMutation.isLoading = false;
    });

    it("renders form inputs when token is valid", () => {
        render(<ResetPassword />);

        expect(screen.getByTestId("reset-password-id")).toBeInTheDocument();
        expect(
            screen.getByTestId("reset-confirm-password-id")
        ).toBeInTheDocument();
        expect(screen.getByTestId("submit-button-id")).toBeInTheDocument();
    });

    it("toggles password visibility", () => {
        render(<ResetPassword />);

        const input = screen.getByTestId("reset-password-id");
        const toggle = screen.getByTestId("show-password-id");

        expect(input).toHaveAttribute("type", "password");

        fireEvent.click(toggle);
        expect(input).toHaveAttribute("type", "text");

        fireEvent.click(toggle);
        expect(input).toHaveAttribute("type", "password");
    });

    it("shows invalid link message when token is invalid", () => {
        verifyTokenMutation.data = { valid: false };
        verifyTokenMutation.isError = true;

        render(<ResetPassword />);

        expect(
            screen.getByText(/link is no longer valid/i)
        ).toBeInTheDocument();
    });

    it("shows password feedback for weak password", async () => {
        render(<ResetPassword />);

        fireEvent.change(screen.getByTestId("reset-password-id"), {
            target: { value: "weak" },
        });

        await waitFor(() => {
            expect(screen.getAllByText(/password/i).length).toBeGreaterThan(0);
        });
    });
});
