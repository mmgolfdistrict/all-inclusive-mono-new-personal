vi.mock("usehooks-ts", () => ({
    useMediaQuery: vi.fn(), // NOW it's a mock function
}));

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import MyTeeBox from "~/app/[course]/my-tee-box/page";

// ---------------- Mocks ----------------

vi.mock("next/dynamic", () => ({
    default: () => () => <div>MockDynamic</div>,
}));

vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: any) => (
        <a data-testid="go-back" href={href}>
            {text}
        </a>
    ),
}));

vi.mock("~/components/icons/down-chevron", () => ({
    DownChevron: () => <div data-testid="down-chevron" />,
}));

vi.mock("~/components/my-tee-box-page/table-view-mobile", () => ({
    __esModule: true,
    default: () => <div data-testid="table-mobile">Mobile View</div>,
}));

vi.mock("~/components/my-tee-box-page/table-view", () => ({
    __esModule: true,
    TableView: () => <div data-testid="table-desktop">Desktop View</div>,
}));

// ---- Import mock AFTER mocking ----
const { useMediaQuery } = await import("usehooks-ts");

// Reset before each test
beforeEach(() => {
    vi.clearAllMocks();
});

// ---------------- Test Suite ----------------

describe("MyTeeBox Page", () => {
    const defaultParams = {
        searchParams: { section: "owned" },
        params: { course: "mock-course" },
    };

    it("renders heading, description, and tip", () => {
        (useMediaQuery as any).mockReturnValue(false); // desktop

        render(<MyTeeBox {...defaultParams} />);

        expect(
            screen.getByText("My Tee Box owned", { exact: false })
        ).toBeInTheDocument();

        expect(
            screen.getByText("View, sell, and manage tee times you own.")
        ).toBeInTheDocument();

        expect(
            screen.getByText(/Tip: If you know you can’t make your time/i)
        ).toBeInTheDocument();
    });

    it("renders GoBack button with correct href", () => {
        (useMediaQuery as any).mockReturnValue(false);

        render(<MyTeeBox {...defaultParams} />);

        expect(screen.getByTestId("go-back")).toHaveAttribute(
            "href",
            "/mock-course"
        );
        expect(screen.getByTestId("go-back")).toHaveTextContent(
            "Back to tee times"
        );
    });

    it("falls back to 'owned' when invalid section provided", () => {
        (useMediaQuery as any).mockReturnValue(false);

        render(
            <MyTeeBox
                searchParams={{ section: "invalid" }}
                params={{ course: "mock-course" }}
            />
        );

        expect(
            screen.getByText("My Tee Box owned", { exact: false })
        ).toBeInTheDocument();
    });

    it("renders correct description for offers-received", () => {
        (useMediaQuery as any).mockReturnValue(false);

        render(
            <MyTeeBox
                searchParams={{ section: "offers-received" }}
                params={{ course: "mock-course" }}
            />
        );

        expect(
            screen.getByText("View and manage received offers below.")
        ).toBeInTheDocument();
    });
});
