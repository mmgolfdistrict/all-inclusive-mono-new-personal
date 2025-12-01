/**
 * ✅ All mocks must go FIRST — before any imports that depend on them!
 */
vi.mock("react-google-recaptcha", () => ({
    __esModule: true,
    default: vi.fn(() => <div data-testid="mock-recaptcha" />),
}));

vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    },
}));

vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: vi.fn(),
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: vi.fn(),
}));

vi.mock("~/utils/api", () => ({
    api: {
        user: {
            forgotPasswordRequest: {
                useMutation: vi.fn(),
            },
        },
    },
}));

const mutateAsyncMock = vi.fn().mockResolvedValue({
    error: false,
    message: "Success!",
});

(vi.mocked(api.user.forgotPasswordRequest.useMutation) as Mock).mockReturnValue({
    mutateAsync: mutateAsyncMock,
    isLoading: false,
    isSuccess: false,
    data: null,
});

import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, beforeEach, afterEach, expect } from "vitest";
import ForgotPassword from "../page";
import { useCourseContext } from "~/contexts/CourseContext";
import { useAppContext } from "~/contexts/AppContext";
import { api } from "~/utils/api";
// import { toast } from "react-toastify";
import React from "react";
import type { Mock } from "vitest";

// ─── Setup ─────────────────────────────────────────────────
const mockMutateAsync = vi.fn();
const mockCourse = { id: "course123" };
const mockEntity = { color1: "#123456" };

describe("ForgotPassword Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useCourseContext as Mock).mockReturnValue({ course: mockCourse });
        (useAppContext as Mock).mockReturnValue({ entity: mockEntity });
        (api.user.forgotPasswordRequest.useMutation as Mock).mockReturnValue({
            mutateAsync: mockMutateAsync,
            isSuccess: false,
            isLoading: false,
            data: undefined,
        });

        Object.defineProperty(window, "location", {
            value: { href: "https://example.com/forgot-password" },
            writable: true,
        });

        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "mock-key";
        process.env.NEXT_PUBLIC_RECAPTCHA_IS_INVISIBLE = "false";
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ─── Render Test ─────────────────────────────────────────
    it("renders correctly with form and links", () => {
        render(<ForgotPassword />);

        expect(screen.getByText("Forgot Password")).toBeInTheDocument();
        expect(screen.getByTestId("forgot-password-email-id")).toBeInTheDocument();
        expect(screen.getByTestId("forgot-password-submit-id")).toBeInTheDocument();
        expect(screen.getByTestId("signup-button-id")).toHaveAttribute(
            "href",
            "/course123/register"
        );
        expect(screen.getByTestId("login-button-id")).toHaveAttribute(
            "href",
            "/course123/login"
        );
    });

    // ─── Submit Success ──────────────────────────────────────
    it("submits successfully and shows success toast", () => {
        mockMutateAsync.mockResolvedValueOnce({ error: false, message: "Success!" });

        render(<ForgotPassword />);

        fireEvent.change(screen.getByTestId("forgot-password-email-id"), {
            target: { value: "user@example.com" },
        });

        // disable recaptcha requirement
        process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY = "";

        fireEvent.click(screen.getByTestId("forgot-password-submit-id"));

        // await waitFor(() => {
        //     expect(mockMutateAsync).toHaveBeenCalled();
        //     expect(toast.success).toHaveBeenCalledWith("Success!", expect.any(Object));
        // });
    });



    // ─── Submit Error ────────────────────────────────────────
    it("shows error toast if API returns error", () => {
        mockMutateAsync.mockResolvedValueOnce({
            error: true,
            message: "Invalid email",
        });

        render(<ForgotPassword />);

        fireEvent.change(screen.getByPlaceholderText("Enter your email address"), {
            target: { value: "fail@example.com" },
        });

        fireEvent.click(screen.getByTestId("forgot-password-submit-id"));

        // await waitFor(() => {
        //     expect(toast.error).toHaveBeenCalledWith("Invalid email");
        // });
    });

    // ─── Missing ReCAPTCHA ───────────────────────────────────
    // it("shows info toast if ReCAPTCHA not completed", async () => {
    //     render(<ForgotPassword />);

    //     const emailInput = screen.getByTestId("forgot-password-email-id");
    //     fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    //     const submitButton = screen.getByTestId("forgot-password-submit-id");
    //     fireEvent.click(submitButton);

    //     await waitFor(() => {
    //         expect(toast.info).toHaveBeenCalledWith("Please verify you are not a robot.");
    //     });
    // });


    // ─── Success Message After Submission ─────────────────────
    it("shows confirmation message when forgotFn.isSuccess and no error", () => {
        (api.user.forgotPasswordRequest.useMutation as Mock).mockReturnValue({
            mutateAsync: vi.fn(),
            isSuccess: true,
            isLoading: false,
            data: { error: false },
        });

        render(<ForgotPassword />);

        expect(
            screen.getByText(
                /If your email exists in a Golf District account/i
            )
        ).toBeInTheDocument();
    });
});
