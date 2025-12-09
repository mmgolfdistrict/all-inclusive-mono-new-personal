import { render, screen } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import VerifyEmail from "../page"; // adjust path if needed
import { useCourseContext } from "~/contexts/CourseContext";

// --- Mock CourseContext ---
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: vi.fn(),
}));

const mockCourse = { id: "course123" };

describe("VerifyEmail Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (useCourseContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            course: mockCourse,
        });
    });

    it("renders heading and description text", () => {
        render(<VerifyEmail />);
        expect(
            screen.getByText("Verify Your Email Address")
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                /A verification link was just sent to the email provided/i
            )
        ).toBeInTheDocument();
    });

    it("renders Sign Up link with correct href", () => {
        render(<VerifyEmail />);
        const signUpLink = screen.getByTestId("signup-button-id");
        expect(signUpLink).toBeInTheDocument();
        expect(signUpLink).toHaveAttribute("href", "/course123/register");
        expect(signUpLink).toHaveTextContent("Sign Up");
    });

    it("renders Back to Login link with correct href", () => {
        render(<VerifyEmail />);
        const backToLoginLink = screen.getByTestId("back-to-login-button-id");
        expect(backToLoginLink).toBeInTheDocument();
        expect(backToLoginLink).toHaveAttribute("href", "/course123/login");
        expect(backToLoginLink).toHaveTextContent("Back to Login");
    });

    it("renders 'Don't have an account?' text", () => {
        render(<VerifyEmail />);
        expect(
            screen.getByText(/Don't have an account\?/i)
        ).toBeInTheDocument();
    });

    it("handles missing course gracefully", () => {
        (useCourseContext as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            course: undefined,
        });
        render(<VerifyEmail />);
        // Links should still render but with "undefined" in href
        expect(screen.getByTestId("signup-button-id")).toHaveAttribute(
            "href",
            "/undefined/register"
        );
        expect(screen.getByTestId("back-to-login-button-id")).toHaveAttribute(
            "href",
            "/undefined/login"
        );
    });
});
