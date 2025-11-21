import { render, screen } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import TermsOfService from "../page";
import { api } from "~/utils/api";

// --- Mock child components ---
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <a data-testid="go-back" href={href}>
            {text}
        </a>
    ),
}));

// --- Mock API ---
vi.mock("~/utils/api", () => ({
    api: {
        user: {
            getS3HtmlContent: {
                useQuery: vi.fn(),
            },
        },
        systemNotification: {
            getSystemNotification: {
                useQuery: vi.fn(),
            },
            getCourseGlobalNotification: {
                useQuery: vi.fn(),
            },
        },
    },
}));

describe("TermsOfService Component", () => {
    const params = { course: "course123" };

    beforeEach(() => {
        vi.clearAllMocks();
        (api.systemNotification.getSystemNotification.useQuery as any).mockReturnValue({ data: [] });
        (api.systemNotification.getCourseGlobalNotification.useQuery as any).mockReturnValue({ data: [] });
    });

    it("renders loading state when isLoading is true", () => {
        (api.user.getS3HtmlContent.useQuery as any).mockReturnValue({
            data: null,
            isLoading: true,
        });

        render(<TermsOfService params={params} />);
        expect(screen.getByTestId("loading-container")).toHaveTextContent("Loading...");
    });

    it("renders GoBack button with correct text", () => {
        (api.user.getS3HtmlContent.useQuery as any).mockReturnValue({
            data: null,
            isLoading: false,
        });

        render(<TermsOfService params={params} />);
        const goBack = screen.getByTestId("go-back");
        expect(goBack).toBeInTheDocument();
        expect(goBack).toHaveTextContent("Back");
    });

    it("renders terms of service HTML when data is available", () => {
        (api.user.getS3HtmlContent.useQuery as any).mockReturnValue({
            data: "<p>Terms of Service Content</p>",
            isLoading: false,
        });

        render(<TermsOfService params={params} />);
        expect(screen.getByText("Terms of Service Content")).toBeInTheDocument();
    });

    it("calculates marginTop correctly when notifications exist", () => {
        (api.user.getS3HtmlContent.useQuery as any).mockReturnValue({
            data: null,
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as any).mockReturnValue({
            data: [{ id: 1 }, { id: 2 }],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as any).mockReturnValue({
            data: [{ id: 3 }],
        });

        render(<TermsOfService params={params} />);
        const goBackContainer = screen.getByTestId("go-back").parentElement;
        expect(goBackContainer?.style.marginTop).toBe(`${(3 * 30) + 125}px`);
    });

    it("uses default marginTop when no notifications exist", () => {
        (api.user.getS3HtmlContent.useQuery as any).mockReturnValue({
            data: null,
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as any).mockReturnValue({ data: [] });
        (api.systemNotification.getCourseGlobalNotification.useQuery as any).mockReturnValue({ data: [] });

        render(<TermsOfService params={params} />);
        const goBackContainer = screen.getByTestId("go-back").parentElement;
    });
});
