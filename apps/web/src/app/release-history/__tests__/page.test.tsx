import { render, screen } from "@testing-library/react";
import { describe, it, vi, beforeEach } from "vitest";
import ReleaseHistory from "../page";
import { api } from "~/utils/api";

// --- Mock child components ---
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <a data-testid="go-back" href={href}>
            {text}
        </a>
    ),
}));

vi.mock("~/components/accordion/accordion", () => ({
    AccordionRoot: ({ children }: { children: React.ReactNode }) => (
        <div data-testid="accordion-root">{children}</div>
    ),
}));

vi.mock("~/components/accordion/accordion-item", () => ({
    AccordionItem: ({
        title,
        children,
    }: {
        title: string;
        children: React.ReactNode;
        value: string;
    }) => (
        <div data-testid="accordion-item">
            <h2>{title}</h2>
            {children}
        </div>
    ),
}));

// --- Mock API ---
vi.mock("~/utils/api", () => ({
    api: {
        releaseHistory: {
            getReleaseHistory: {
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

describe("ReleaseHistory Component", () => {
    const params = { course: "course123" };

    beforeEach(() => {
        vi.clearAllMocks();
        (api.systemNotification.getSystemNotification.useQuery as any).mockReturnValue({ data: [] });
        (api.systemNotification.getCourseGlobalNotification.useQuery as any).mockReturnValue({ data: [] });
    });

    it("renders heading and GoBack button", () => {
        (api.releaseHistory.getReleaseHistory.useQuery as any).mockReturnValue({ data: [] });

        render(<ReleaseHistory params={params} />);
        expect(screen.getByText("Release History")).toBeInTheDocument();
        expect(screen.getByTestId("go-back")).toHaveTextContent("Back");
    });

    it("renders grouped release history data", () => {
        const mockData = [
            {
                releaseDateTime: "2025-11-18T10:00:00Z",
                name: "Feature A",
                description: "Description A",
                engineerName: "Engineer A",
            },
            {
                releaseDateTime: "2025-11-18T12:00:00Z",
                name: "Feature B",
                description: "Description B",
                engineerName: "Engineer B",
            },
        ];
        (api.releaseHistory.getReleaseHistory.useQuery as any).mockReturnValue({ data: mockData });

        render(<ReleaseHistory params={params} />);
        // Date grouping
        expect(screen.getByText("18-Nov-2025")).toBeInTheDocument();
        // Table content
        expect(screen.getByText("Feature A")).toBeInTheDocument();
        expect(screen.getByText("Description A")).toBeInTheDocument();
        expect(screen.getByText("Engineer A")).toBeInTheDocument();
        expect(screen.getByText("Feature B")).toBeInTheDocument();
    });

    it("renders multiple date groups", () => {
        const mockData = [
            {
                releaseDateTime: "2025-11-18T10:00:00Z",
                name: "Feature A",
                description: "Description A",
                engineerName: "Engineer A",
            },
            {
                releaseDateTime: "2025-11-19T10:00:00Z",
                name: "Feature B",
                description: "Description B",
                engineerName: "Engineer B",
            },
        ];
        (api.releaseHistory.getReleaseHistory.useQuery as any).mockReturnValue({ data: mockData });

        render(<ReleaseHistory params={params} />);
        expect(screen.getByText("18-Nov-2025")).toBeInTheDocument();
        expect(screen.getByText("19-Nov-2025")).toBeInTheDocument();
    });

    it("calculates marginTop correctly when notifications exist", () => {
        (api.releaseHistory.getReleaseHistory.useQuery as any).mockReturnValue({ data: [] });
        (api.systemNotification.getSystemNotification.useQuery as any).mockReturnValue({
            data: [{ id: 1 }],
        });
        (api.systemNotification.getCourseGlobalNotification.useQuery as any).mockReturnValue({
            data: [{ id: 2 }, { id: 3 }],
        });

        render(<ReleaseHistory params={params} />);
        const goBackContainer = screen.getByTestId("go-back").parentElement;
        expect(goBackContainer?.style.marginTop).toBe(`${(3 * 1.875) + 6.25}rem`);
    });
});
