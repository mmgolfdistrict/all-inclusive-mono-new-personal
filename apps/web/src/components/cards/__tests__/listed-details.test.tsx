import * as React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, vi, beforeEach, expect } from "vitest";
import { ListedDetails } from "~/components/cards/listed-details";
import { useSession } from "@golf-district/auth/nextjs-exports";

// 🧩 First define all variables BEFORE mocks
const mockPush = vi.fn();

// 🧩 Top-level mocks (safe order)
vi.mock("@golf-district/auth/nextjs-exports", () => ({
    useSession: vi.fn(() => ({ data: { user: { id: "u1" } } })),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: mockPush }),
}));

vi.mock("react-toastify", () => ({
    toast: {
        info: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("usehooks-ts", () => ({
    useCopyToClipboard: () => [null, vi.fn()],
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({
        setPrevPath: vi.fn(),
    }),
}));

vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({
        course: { id: "course_1", name: "Pebble Beach", timezoneCorrection: "PST" },
        getAllowedPlayersForTeeTime: () => ({ numberOfPlayers: 4 }),
    }),
}));

vi.mock("~/contexts/UserContext", () => ({
    useUserContext: () => ({
        user: { id: "u1", name: "John" },
    }),
}));

// 🧠 Mock utils/api (TRPC)
vi.mock("~/utils/api", () => {
    // Define mocks INSIDE the factory to avoid hoisting errors
    const mockUseQuery = vi.fn();
    const mockMutateAsync = vi.fn();
    const mockRefetch = vi.fn();

    return {
        api: {
            searchRouter: {
                getListingById: {
                    useQuery: mockUseQuery,
                },
            },
            teeBox: {
                checkIfTeeTimeStillListedByListingId: {
                    useQuery: vi.fn().mockReturnValue({ refetch: mockRefetch }),
                },
            },
            cache: {
                getCache: {
                    useMutation: vi.fn().mockReturnValue({ mutateAsync: mockMutateAsync }),
                },
            },
            watchlist: {
                toggleWatchlist: {
                    useMutation: vi.fn().mockReturnValue({ mutateAsync: mockMutateAsync }),
                },
            },
        },
    };
});


vi.mock("~/utils/formatters", () => ({
    formatMoney: (val: number) => `$${val}`,
    formatTime: () => `9:30 AM`,
}));

// 🧩 Mock nested components
vi.mock("~/components/buttons/filled-button", () => ({
    FilledButton: (props: any) => (
        <button {...props} data-testid="filled-button">
            {props.children}
        </button>
    ),
}));

vi.mock("~/components/buttons/outline-button", () => ({
    OutlineButton: (props: any) => (
        <button {...props} data-testid="outline-button">
            {props.children}
        </button>
    ),
}));

vi.mock("~/components/input/choose-players", () => ({
    ChoosePlayers: () => <div data-testid="choose-players" />,
}));

vi.mock("~/components/my-tee-box-page/manage-tee-time-listing", () => ({
    ManageTeeTimeListing: () => <div data-testid="manage-listing" />,
}));

vi.mock("~/components/loading/spinner", () => ({
    Spinner: () => <div role="status" data-testid="spinner" />,
}));

vi.mock("~/components/tooltip", () => ({
    Tooltip: (props: any) => <div data-testid="tooltip">{props.trigger}</div>,
}));

// 🧩 Local mock data
const mockListing = {
    date: "2025-11-07",
    availableSlots: 4,
    pricePerGolfer: 100,
    allowSplit: true,
    weather: {
        temperature: 75,
        name: "Sunny",
        shortForecast: "Clear skies",
        iconCode: "01d",
    },
    soldById: "seller_1",
    userWatchListed: false,
};

describe("ListedDetails Component", async () => {
    const { api } = await import("~/utils/api");
    const mockUseQuery = vi.mocked(api.searchRouter.getListingById.useQuery);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders loading skeleton when loading", () => {
        mockUseQuery.mockReturnValue({
            data: undefined,
            isLoading: true,
            isError: false,
            refetch: vi.fn(),
        } as any);

        render(<ListedDetails listingId="l1" teeTimeId="t1" />);
        expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    });

    it("renders listing details correctly", () => {
        mockUseQuery.mockReturnValue({
            data: mockListing,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as any);

        render(<ListedDetails listingId="l1" teeTimeId="t1" />);
        expect(screen.getByText("9:30 AM")).toBeInTheDocument();
        expect(screen.getByText("75°F")).toBeInTheDocument();
        expect(screen.getByText("$100")).toBeInTheDocument();
        expect(screen.getByTestId("choose-players")).toBeInTheDocument();
    });

    it("redirects to login when buying without user session", async () => {
        vi.mocked(useSession).mockReturnValue({
            data: null,
            status: "unauthenticated",
        } as any);

        mockUseQuery.mockReturnValue({
            data: mockListing,
            isLoading: false,
            isError: false,
            refetch: vi.fn(),
        } as any);

        render(<ListedDetails listingId="l1" teeTimeId="t1" />);

        const buyBtn = screen.getByTestId("filled-button");
        fireEvent.click(buyBtn);

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith("/course_1/login");
        });
    });
});
