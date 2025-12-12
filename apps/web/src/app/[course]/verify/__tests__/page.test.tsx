import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import Verify from "../page";
import { useAppContext } from "~/contexts/AppContext";
import { useCourseContext } from "~/contexts/CourseContext";
import { useSearchParams } from "next/navigation";
import { api } from "~/utils/api";
import userEvent from "@testing-library/user-event";

// --- Mock dependencies ---
vi.mock("~/contexts/AppContext", () => ({
    useAppContext: vi.fn(),
}));

vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(),
}));

vi.mock("~/utils/api", () => ({
    api: {
        user: {
            addCourseUser: {
                useMutation: vi.fn(),
            },
        },
        register: {
            verifyEmail: {
                useMutation: vi.fn(),
            },
        },
    },
}));

vi.mock("react-toastify", () => ({
    toast: {
        error: vi.fn(),
    },
}));

// --- Setup ---
const mockSetPrevPath = vi.fn();
const mockCourse = { id: "course123" };
const mockEntity = { color1: "#000" };

describe("Verify Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();

        (useAppContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            entity: mockEntity,
            setPrevPath: mockSetPrevPath,
        });

        (useCourseContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            course: mockCourse,
        });

        (useSearchParams as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            get: (key: string) => {
                if (key === "userId") return "user123";
                if (key === "verificationToken") return "token123";
                return null;
            },
        });
    });

    it("renders initial verify message when not loading, success, or error", () => {
        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            isLoading: false,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn(),
        });
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn(),
        });

        render(<Verify />);
        expect(screen.getByText("Verify Your Email Address")).toBeInTheDocument();
    });

    it("shows loading state when verifyEmail is loading", () => {
        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            isLoading: true,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn(),
        });
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn(),
        });

        render(<Verify />);
        expect(screen.getByText("Verifying Email...")).toBeInTheDocument();
    });

    it("shows success state after verification", async () => {
        const verifyEmailMock = {
            isLoading: false,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn().mockResolvedValue({}),
        };
        const addCourseUserMock = {
            mutateAsync: vi.fn().mockResolvedValue({}),
        };

        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            verifyEmailMock
        );
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            addCourseUserMock
        );

        render(<Verify />);

        await waitFor(() =>
            expect(screen.getByText("Verified Email!")).toBeInTheDocument()
        );
        expect(
            screen.getByText("Your email address has been verified!")
        ).toBeInTheDocument();
        expect(screen.getByTestId("login-button-id")).toBeInTheDocument();
    });

    it("shows error state when verification fails", async () => {
        const verifyEmailMock = {
            isLoading: false,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn().mockRejectedValue(new Error("Verification failed")),
        };
        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            verifyEmailMock
        );
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn(),
        });

        render(<Verify />);

        await waitFor(() =>
            expect(screen.getByText("Something went wrong.")).toBeInTheDocument()
        );
    });

    it("navigates to Sign Up and Back to Login links", () => {
        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            isLoading: false,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn(),
        });
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            mutateAsync: vi.fn(),
        });

        render(<Verify />);
        expect(screen.getByTestId("signup-button-id")).toHaveAttribute(
            "href",
            "/course123/register"
        );
        expect(screen.getByTestId("back-to-login-button-id")).toHaveAttribute(
            "href",
            "/course123/login"
        );
    });

    it("calls setPrevPath when login button clicked", async () => {
        const verifyEmailMock = {
            isLoading: false,
            isError: false,
            isSuccess: false,
            mutateAsync: vi.fn().mockResolvedValue({}),
        };
        const addCourseUserMock = {
            mutateAsync: vi.fn().mockResolvedValue({}),
        };

        (api.register.verifyEmail.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            verifyEmailMock
        );
        (api.user.addCourseUser.useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            addCourseUserMock
        );

        render(<Verify />);
        await waitFor(() => screen.getByTestId("login-button-id"));

        await userEvent.click(screen.getByText("Login"));
        expect(mockSetPrevPath).toHaveBeenCalledWith(
            expect.objectContaining({
                path: "/course123",
            })
        );
    });
});
