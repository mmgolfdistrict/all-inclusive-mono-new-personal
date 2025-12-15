// src/app/[course]/reset-password/__tests__/page.test.tsx

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

/* -------------------------------------------------------
   HOISTED MOCK STATE (must be above vi.mock)
------------------------------------------------------- */

// Search params
const mockSearchParams = { get: vi.fn() };

// verify token mutation mock (CONTROLLED PER TEST)
const verifyMutationMock = vi.fn();

// reset password mutation mock (CONTROLLED PER TEST)
let resetMutationMock = vi.fn();

/* -------------------------------------------------------
   MODULE MOCKS (HOISTED)
------------------------------------------------------- */

vi.mock("~/utils/api", () => ({
    api: {
        user: {
            verifyForgotPasswordToken: {
                useMutation: () => verifyMutationMock(),
            },
            executeForgotPassword: {
                useMutation: () => resetMutationMock(),
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

vi.mock("next/navigation", () => ({
    useSearchParams: () => mockSearchParams,
}));

vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

/* -------------------------------------------------------
   MUTATION FACTORY (SAFE + PROMISE-CORRECT)
------------------------------------------------------- */

function createMutation(overrides: Partial<any> = {}) {
    return {
        mutate: vi.fn(),
        mutateAsync: vi.fn().mockResolvedValue(undefined), // IMPORTANT
        reset: vi.fn(),
        data: undefined,
        isError: false,
        isIdle: true,
        isLoading: false,
        isPaused: false,
        isSuccess: false,
        status: "idle",
        failureCount: 0,
        ...overrides,
    };
}

/* -------------------------------------------------------
   IMPORT COMPONENT (AFTER MOCKS)
------------------------------------------------------- */

import ResetPassword from "../page";

/* -------------------------------------------------------
   TESTS
------------------------------------------------------- */

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

        // Default: valid token
        verifyMutationMock.mockReturnValue(
            createMutation({
                data: { valid: true },
                isSuccess: true,
            })
        );

        resetMutationMock = vi.fn(() =>
            createMutation({
                isLoading: false,
                isSuccess: false,
            })
        );
    });

    it("renders form inputs when token is valid", () => {
        render(<ResetPassword />);

        expect(screen.getByTestId("reset-password-id")).toBeInTheDocument();
        expect(screen.getByTestId("reset-confirm-password-id")).toBeInTheDocument();
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
        verifyMutationMock.mockReturnValue(
            createMutation({
                data: { valid: false },
                isError: true,
            })
        );

        render(<ResetPassword />);

        expect(
            screen.getByText(/this link is no longer valid/i)
        ).toBeInTheDocument();
    });

    it("shows password feedback when typing weak password", async () => {
        render(<ResetPassword />);

        fireEvent.change(screen.getByTestId("reset-password-id"), {
            target: { value: "weak" },
        });

        await waitFor(() => {
            expect(screen.getAllByText(/password/i).length).toBeGreaterThan(0);
        });
    });
});
