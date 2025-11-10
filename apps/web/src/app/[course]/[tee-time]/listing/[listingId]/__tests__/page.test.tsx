// src/app/[course]/[tee-time]/listing/[listingId]/__tests__/page.test.tsx
import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import ListedPage from "../page";

// ================= Mock appSettingService =================
vi.mock("@golf-district/service/src/app-settings/initialized", () => ({
    appSettingService: {
        get: vi.fn(),
    },
}));
import { appSettingService } from "@golf-district/service/src/app-settings/initialized";

// ================= Mock child components =================
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <div data-testid="go-back">{text} - {href}</div>
    ),
}));

vi.mock("~/components/cards/listed-details", () => ({
    ListedDetails: ({ listingId, teeTimeId }: { listingId: string; teeTimeId: string }) => (
        <div data-testid="listed-details">{listingId} | {teeTimeId}</div>
    ),
}));

vi.mock("~/components/cards/transaction-history", () => ({
    TransactionHistory: ({ teeTimeId }: { teeTimeId: string }) => (
        <div data-testid="transaction-history">{teeTimeId}</div>
    ),
}));

vi.mock("~/components/tee-time-page/course-description", () => ({
    CourseDescription: ({ "data-testid": testId }: { "data-testid": string }) => (
        <div data-testid={testId} />
    ),
}));

vi.mock("~/components/tee-time-page/invite-friends", () => ({
    InviteFriends: ({ teeTimeId }: { teeTimeId: string }) => (
        <div data-testid="invite-friends">{teeTimeId}</div>
    ),
}));

// ================= Async Wrapper for Server Component =================
const AsyncWrapper = ({ children }: { children: Promise<JSX.Element> }) => {
    const [content, setContent] = React.useState<JSX.Element | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        children.then((element) => {
            if (isMounted) setContent(element);
        });

        return () => {
            isMounted = false;
        };
    }, [children]);

    return content;
};

// ================= Tests =================
describe("ListedPage Component", () => {
    const mockGet = vi.mocked(appSettingService.get);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders all child components when transaction history is true", async () => {
        mockGet.mockResolvedValue("true");

        render(
            <AsyncWrapper>
                {ListedPage({ params: { course: "c1", "tee-time": "t1", listingId: "l1" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("go-back");

        expect(screen.getByTestId("go-back")).toHaveTextContent("Back to tee times - /c1");
        expect(screen.getByTestId("listed-details")).toHaveTextContent("l1 | t1");

        // Query both CourseDescription instances separately
        expect(screen.getByTestId("course-description")).toBeDefined();        // Desktop
        expect(screen.getByTestId("hidden-course-description")).toBeDefined(); // Mobile

        expect(screen.getByTestId("invite-friends")).toHaveTextContent("t1");
        expect(screen.getByTestId("transaction-history")).toHaveTextContent("t1");
    });

    it("does not render transaction history when setting is false", async () => {
        mockGet.mockResolvedValue("false");

        render(
            <AsyncWrapper>
                {ListedPage({ params: { course: "c2", "tee-time": "t2", listingId: "l2" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("go-back");

        expect(screen.getByTestId("go-back")).toHaveTextContent("Back to tee times - /c2");
        expect(screen.getByTestId("listed-details")).toHaveTextContent("l2 | t2");

        // Both CourseDescription instances
        expect(screen.getByTestId("course-description")).toBeDefined();
        expect(screen.getByTestId("hidden-course-description")).toBeDefined();

        expect(screen.getByTestId("invite-friends")).toHaveTextContent("t2");

        // Transaction history should NOT exist
        expect(screen.queryByTestId("transaction-history")).toBeNull();
    });

    it("calls appSettingService.get with correct key", async () => {
        mockGet.mockResolvedValue("true");

        render(
            <AsyncWrapper>
                {ListedPage({ params: { course: "c3", "tee-time": "t3", listingId: "l3" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("go-back");

        expect(mockGet).toHaveBeenCalledWith("ShowTeeTimeDetailTransactionHistory");
    });
});
