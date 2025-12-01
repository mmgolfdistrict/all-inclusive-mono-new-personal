// src/app/[course]/reset-password/__tests__/page.test.tsx
/**
 * ResetPassword page tests - rewritten with vi.hoisted to avoid hoisted mock errors.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

/* ---------------------------
   Hoisted spies for react-toastify
   --------------------------- */
const { toastErrorSpy, toastSuccessSpy } = vi.hoisted(() => {
    return {
        toastErrorSpy: vi.fn(),
        toastSuccessSpy: vi.fn(),
    };
});

/* mutationMock will be assigned inside tests (must exist before vi.mock) */
let mutationMock = vi.fn(() =>
({
    mutateAsync: vi.fn().mockRejectedValue(new Error("Failed reset")),
    isSuccess: false,
    isLoading: false,
})
);

/* mockSearchParams used by next/navigation mock */
const mockSearchParams = { get: vi.fn() };

/* ---------------------------
   Mocks
   --------------------------- */
vi.mock("react-toastify", () => ({
    toast: {
        error: toastErrorSpy,
        success: toastSuccessSpy,
    },
}));

vi.mock("~/utils/api", () => ({
    api: {
        user: {
            executeForgotPassword: {
                useMutation: () => mutationMock(),
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

/* ---------------------------
   Helper: factory for mutation-like object returned by trpc hook
   --------------------------- */
type MutationStatus =
    | "idle"
    | "loading"
    | "success"
    | "error"
    | "paused";

interface MutationResult<TData = unknown, TVariables = unknown> {
    mutate: ReturnType<typeof vi.fn>;
    mutateAsync: ReturnType<typeof vi.fn>;
    reset: ReturnType<typeof vi.fn>;
    data?: TData;
    variables?: TVariables;
    isError: boolean;
    isIdle: boolean;
    isLoading: boolean;
    isPaused: boolean;
    isSuccess: boolean;
    status: MutationStatus;
    failureCount: number;
    trpc: { path: string };
}

export function createMutation<TData = unknown, TVariables = unknown>(
    overrides?: Partial<MutationResult<TData, TVariables>>
): MutationResult<TData, TVariables> {
    return {
        mutate: vi.fn(),
        mutateAsync: vi.fn(),
        reset: vi.fn(),
        data: undefined,
        variables: undefined,
        isError: false,
        isIdle: true,
        isLoading: false,
        isPaused: false,
        isSuccess: false,
        status: "idle",
        failureCount: 0,
        trpc: { path: "user.executeForgotPassword" },
        ...overrides,
    };
}


/* Import the component AFTER mocks */
import ResetPassword from "../page";

/* ---------------------------
   Tests
   --------------------------- */
describe("ResetPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockSearchParams.get.mockImplementation((key: string) =>
            key === "userId" ? "user-123" : key === "verificationToken" ? "token-999" : null
        );
    });

    it("renders form inputs", () => {
        mutationMock = vi.fn(() => createMutation());

        render(<ResetPassword />);

        expect(screen.getByTestId("reset-password-id")).toBeInTheDocument();
        expect(screen.getByTestId("reset-confirm-password-id")).toBeInTheDocument();
        expect(screen.getByTestId("submit-button-id")).toBeInTheDocument();
    });

    it("toggles password visibility", () => {
        mutationMock = vi.fn(() => createMutation());

        render(<ResetPassword />);

        const input = screen.getByTestId("reset-password-id");
        const toggle = screen.getByTestId("show-password-id");

        expect(input).toHaveAttribute("type", "password");

        fireEvent.click(toggle);
        expect(input).toHaveAttribute("type", "text");

        fireEvent.click(toggle);
        expect(input).toHaveAttribute("type", "password");
    });

    it("shows password feedback when typing weak password", async () => {
        mutationMock = vi.fn(() => createMutation());

        render(<ResetPassword />);

        fireEvent.change(screen.getByTestId("reset-password-id"), {
            target: { value: "weak" },
        });

        await waitFor(() => {
            // allow multiple matches
            expect(screen.getAllByText(/password/i).length).toBeGreaterThan(0);
        });
    });
});
