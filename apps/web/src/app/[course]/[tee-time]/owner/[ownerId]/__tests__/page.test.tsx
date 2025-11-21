// src/app/[course]/[tee-time]/unlisted/[ownerId]/__tests__/page.test.tsx
import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import UnlistedPage from "../page";

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
        <div data-testid="mock-go-back">{text} - {href}</div>
    ),
}));

vi.mock("~/components/my-tee-box-page/OwnerTeeTimeDetails", () => ({
    default: ({
        teeTimeId,
        courseId,
        ownerId,
        isTransactionHistoryVisible,
    }: {
        teeTimeId: string;
        courseId: string;
        ownerId: string;
        isTransactionHistoryVisible: string;
    }) => (
        <div data-testid="mock-owner-details">
            {teeTimeId} | {courseId} | {ownerId} | {isTransactionHistoryVisible}
        </div>
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
        return () => { isMounted = false; };
    }, [children]);

    return content;
};

// ================= Tests =================
describe("UnlistedPage Component", () => {
    const mockGet = vi.mocked(appSettingService.get);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders GoBack and OwnerTeeTimeDetails correctly when transaction history is true", async () => {
        mockGet.mockResolvedValue("true");

        render(
            <AsyncWrapper>
                {UnlistedPage({ params: { course: "c1", "tee-time": "t1", ownerId: "o1" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("mock-go-back");

        expect(screen.getByTestId("mock-go-back")).toHaveTextContent("Back to tee times - /c1");
        expect(screen.getByTestId("mock-owner-details")).toHaveTextContent("t1 | c1 | o1 | true");
    });

    it("renders GoBack and OwnerTeeTimeDetails correctly when transaction history is false", async () => {
        mockGet.mockResolvedValue("false");

        render(
            <AsyncWrapper>
                {UnlistedPage({ params: { course: "c2", "tee-time": "t2", ownerId: "o2" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("mock-go-back");

        expect(screen.getByTestId("mock-go-back")).toHaveTextContent("Back to tee times - /c2");
        expect(screen.getByTestId("mock-owner-details")).toHaveTextContent("t2 | c2 | o2 | false");
    });

    it("calls appSettingService.get with correct key", async () => {
        mockGet.mockResolvedValue("true");

        render(
            <AsyncWrapper>
                {UnlistedPage({ params: { course: "c3", "tee-time": "t3", ownerId: "o3" } })}
            </AsyncWrapper>
        );

        await screen.findByTestId("mock-go-back");
        expect(mockGet).toHaveBeenCalledWith("ShowTeeTimeDetailTransactionHistory");
    });
});
