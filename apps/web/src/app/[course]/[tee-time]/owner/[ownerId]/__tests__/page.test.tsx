// src/app/[course]/[tee-time]/unlisted/[ownerId]/__tests__/page.test.tsx
import { describe, it, beforeEach, vi, expect } from "vitest";
import { render, screen, act } from "@testing-library/react";
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
        <div data-testid="mock-go-back">
            {text} - {href}
        </div>
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

// ================= Async Server Component Wrapper =================
const AsyncWrapper = ({ promise }: { promise: Promise<JSX.Element> }) => {
    const [element, setElement] = React.useState<JSX.Element | null>(null);

    React.useEffect(() => {
        let mounted = true;

        void promise.then((resolved) => {
            if (mounted) setElement(resolved);
        });

        return () => {
            mounted = false;
        };
    }, [promise]);

    return element;
};

// ================= Tests =================
describe("UnlistedPage Component", () => {
    const mockGet = vi.mocked(appSettingService.get);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    // Helper to render the server component properly
    const renderPage = async (params: {
        course: string;
        "tee-time": string;
        ownerId: string;
    }) => {
        const pagePromise = UnlistedPage({ params });

        await act(async () => {
            render(<AsyncWrapper promise={pagePromise} />);
            await pagePromise; // ensures no floating promise
        });
    };

    it("renders correctly when transaction history = true", async () => {
        mockGet.mockResolvedValue("true");

        await renderPage({ course: "c1", "tee-time": "t1", ownerId: "o1" });

        expect(await screen.findByTestId("mock-go-back"))
            .toHaveTextContent("Back to tee times - /c1");

        expect(screen.getByTestId("mock-owner-details"))
            .toHaveTextContent("t1 | c1 | o1 | true");
    });

    it("renders correctly when transaction history = false", async () => {
        mockGet.mockResolvedValue("false");

        await renderPage({ course: "c2", "tee-time": "t2", ownerId: "o2" });

        expect(await screen.findByTestId("mock-go-back"))
            .toHaveTextContent("Back to tee times - /c2");

        expect(screen.getByTestId("mock-owner-details"))
            .toHaveTextContent("t2 | c2 | o2 | false");
    });

    it("calls appSettingService.get with correct key", async () => {
        mockGet.mockResolvedValue("true");

        await renderPage({ course: "c3", "tee-time": "t3", ownerId: "o3" });

        expect(mockGet).toHaveBeenCalledWith(
            "ShowTeeTimeDetailTransactionHistory"
        );
    });
});
