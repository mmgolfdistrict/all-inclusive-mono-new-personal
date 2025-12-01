import { render, screen } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import Watchlist from "../page"; // adjust path if needed

// --- Mock child components ---
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <a data-testid="go-back" href={href}>
            {text}
        </a>
    ),
}));

vi.mock("~/components/watchlist-page/watchlist-table", () => ({
    WatchlistTable: () => <div data-testid="watchlist-table">Mocked Table</div>,
}));

describe("Watchlist Component", () => {
    const params = { course: "course123" };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders heading and description", () => {
        render(<Watchlist params={params} />);
        expect(screen.getByText("Watchlist")).toBeInTheDocument();
        expect(
            screen.getByText(/View all the tee times you're watching/i)
        ).toBeInTheDocument();
    });

    it("renders GoBack with correct href and text", () => {
        render(<Watchlist params={params} />);
        const goBackLink = screen.getByTestId("go-back");
        expect(goBackLink).toBeInTheDocument();
        expect(goBackLink).toHaveAttribute("href", "/course123");
        expect(goBackLink).toHaveTextContent("Back to tee times");
    });

    it("renders WatchlistTable", () => {
        render(<Watchlist params={params} />);
        expect(screen.getByTestId("watchlist-table")).toBeInTheDocument();
        expect(screen.getByText("Mocked Table")).toBeInTheDocument();
    });

    it("handles different courseId param", () => {
        render(<Watchlist params={{ course: "anotherCourse" }} />);
        const goBackLink = screen.getByTestId("go-back");
        expect(goBackLink).toHaveAttribute("href", "/anotherCourse");
    });
});
