// src/app/[course]/[tee-time]/listing/[listingId]/__tests__/page.test.tsx

import { describe, it, beforeEach, expect, vi } from "vitest";
import { screen, render } from "@testing-library/react";
import React from "react";
import ListedPage from "../page";

// =====================================================
// Mock: appSettingService
// =====================================================
vi.mock("@golf-district/service/src/app-settings/initialized", () => ({
    appSettingService: {
        get: vi.fn<() => Promise<string>>()
    },
}));

import { appSettingService } from "@golf-district/service/src/app-settings/initialized";

// =====================================================
// Mock: Child Components
// =====================================================
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <div data-testid="go-back">{text} - {href}</div>
    ),
}));

vi.mock("~/components/cards/listed-details", () => ({
    ListedDetails: ({
        listingId,
        teeTimeId,
    }: {
        listingId: string;
        teeTimeId: string;
    }) => <div data-testid="listed-details">{listingId} | {teeTimeId}</div>,
}));

vi.mock("~/components/cards/transaction-history", () => ({
    TransactionHistory: ({ teeTimeId }: { teeTimeId: string }) => (
        <div data-testid="transaction-history">{teeTimeId}</div>
    ),
}));

vi.mock("~/components/tee-time-page/course-description", () => ({
    CourseDescription: ({
        "data-testid": testId,
    }: {
        "data-testid": string;
    }) => <div data-testid={testId} />,
}));

vi.mock("~/components/tee-time-page/invite-friends", () => ({
    InviteFriends: ({ teeTimeId }: { teeTimeId: string }) => (
        <div data-testid="invite-friends">{teeTimeId}</div>
    ),
}));

// =====================================================
// Wrapper for async server components
// =====================================================
const ServerComponentWrapper = ({
    promise,
}: {
    promise: Promise<JSX.Element>;
}) => {
    const [node, setNode] = React.useState<JSX.Element | null>(null);

    React.useEffect(() => {
        let mounted = true;

        void promise.then((el) => {
            if (mounted) setNode(el);
        });

        return () => {
            mounted = false;
        };
    }, [promise]);

    return node;
};

const renderServerComponent = (promise: Promise<JSX.Element>) => {
    return render(<ServerComponentWrapper promise={promise} />);
};

// =====================================================
// TEST SUITE
// =====================================================
describe("ListedPage Component", () => {
    const mockGet = vi.mocked(appSettingService.get);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ------------------------------------------------
    // TEST 1 — All components render when setting is true
    // ------------------------------------------------
    it("renders all child components when transaction history is true", async () => {
        mockGet.mockResolvedValue("true");

        renderServerComponent(
            ListedPage({
                params: { course: "c1", "tee-time": "t1", listingId: "l1" },
            })
        );

        await screen.findByTestId("go-back");

        expect(screen.getByTestId("go-back")).toHaveTextContent(
            "Back to tee times - /c1"
        );

        expect(screen.getByTestId("listed-details")).toHaveTextContent("l1 | t1");

        expect(screen.getByTestId("course-description")).toBeDefined();
        expect(screen.getByTestId("hidden-course-description")).toBeDefined();

        expect(screen.getByTestId("invite-friends")).toHaveTextContent("t1");
        expect(screen.getByTestId("transaction-history")).toHaveTextContent("t1");
    });

    // ------------------------------------------------
    // TEST 2 — Transaction history hidden when false
    // ------------------------------------------------
    it("does not render transaction history when setting is false", async () => {
        mockGet.mockResolvedValue("false");

        renderServerComponent(
            ListedPage({
                params: { course: "c2", "tee-time": "t2", listingId: "l2" },
            })
        );

        await screen.findByTestId("go-back");

        expect(screen.getByTestId("listed-details")).toHaveTextContent("l2 | t2");

        expect(screen.queryByTestId("transaction-history")).toBeNull();
    });

    // ------------------------------------------------
    // TEST 3 — Correct key is passed to appSettingService.get
    // ------------------------------------------------
    it("calls appSettingService.get with correct key", async () => {
        mockGet.mockResolvedValue("true");

        renderServerComponent(
            ListedPage({
                params: { course: "c3", "tee-time": "t3", listingId: "l3" },
            })
        );

        await screen.findByTestId("go-back");

        expect(mockGet).toHaveBeenCalledWith(
            "ShowTeeTimeDetailTransactionHistory"
        );
    });
});
