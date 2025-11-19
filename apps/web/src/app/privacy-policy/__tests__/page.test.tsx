import { render, screen } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import PrivacyPolicy from "../page"; // adjust path if needed
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

describe("PrivacyPolicy Component", () => {
    const params = { course: "course123" };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading state when isLoading is true", () => {
        (api.user.getS3HtmlContent.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: null,
            isLoading: true,
        });
        (api.systemNotification.getSystemNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });

        render(<PrivacyPolicy params={params} />);
        const loadingContainer = screen.getByTestId("loading-container");
        expect(loadingContainer).toHaveTextContent("Loading...");
    });

    it("renders GoBack button with correct text", () => {
        (api.user.getS3HtmlContent.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: null,
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });

        render(<PrivacyPolicy params={params} />);
        const goBack = screen.getByTestId("go-back");
        expect(goBack).toBeInTheDocument();
        expect(goBack).toHaveTextContent("Back");
    });

    it("renders privacy policy HTML when data is available", () => {
        (api.user.getS3HtmlContent.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: "<p>Privacy Policy Content</p>",
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });

        render(<PrivacyPolicy params={params} />);
        expect(screen.getByText("Privacy Policy Content")).toBeInTheDocument();
    });

    it("calculates marginTop correctly when notifications exist", () => {
        (api.user.getS3HtmlContent.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: null,
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [{ id: 1 }, { id: 2 }],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [{ id: 3 }],
        });

        render(<PrivacyPolicy params={params} />);
        const container = screen.getByTestId("go-back").parentElement;
        expect(container?.style.marginTop).toBe(`${(3 * 1.875) + 7.8125}rem`);
    });

    it("uses default marginTop when no notifications exist", () => {
        (api.user.getS3HtmlContent.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: null,
            isLoading: false,
        });
        (api.systemNotification.getSystemNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            data: [],
        });

        render(<PrivacyPolicy params={params} />);
        const container = screen.getByTestId("go-back").parentElement;
        expect(container?.style.marginTop).toBe("7.8125rem");
    });
});
