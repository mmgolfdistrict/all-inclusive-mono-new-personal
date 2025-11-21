import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";

// ---- Component under test ----
import TeeTimePage from "../page";

// ---- Mock all child components (pure functional stubs) ----
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: any) => (
        <div data-testid="go-back">
            go-back-mock | href={href} | text={text}
        </div>
    ),
}));

vi.mock("~/components/cards/tee-time-details", () => ({
    TeeTimeDetails: ({ teeTimeId }: any) => (
        <div data-testid="tee-time-details">tee-time-details-mock {teeTimeId}</div>
    ),
}));

vi.mock("~/components/cards/transaction-history", () => ({
    TransactionHistory: ({ teeTimeId }: any) => (
        <div data-testid="transaction-history">
            transaction-history-mock {teeTimeId}
        </div>
    ),
}));

vi.mock("~/components/tee-time-page/course-description", () => ({
    CourseDescription: () => (
        <div data-testid="course-description">course-description-mock</div>
    ),
}));

// ---- Mock appSettingService.get() ----
vi.mock("@golf-district/service/src/app-settings/initialized", () => {
    return {
        appSettingService: {
            get: vi.fn(), // <-- this is the ONLY correct way
        },
    };
});

// Import after mocking
import { appSettingService } from "@golf-district/service/src/app-settings/initialized";

describe("TeeTimePage", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    const params = {
        "tee-time": "123",
        course: "abc-course",
    };

    // Utility to render server component in Vitest
    const renderServerComponent = async () => {
        const Component = await TeeTimePage({ params });
        return render(Component);
    };

    // ===========================
    // TEST 1 — Renders Base Layout
    // ===========================
    it("renders GoBack and TeeTimeDetails", async () => {
        (appSettingService.get as any).mockResolvedValue("false"); // hide transaction history

        await renderServerComponent();

        expect(screen.getByTestId("go-back")).toHaveTextContent(
            "href=/abc-course"
        );

        expect(screen.getByTestId("tee-time-details")).toHaveTextContent("123");
    });

    // =============================================
    // TEST 2 — Shows TransactionHistory when enabled
    // =============================================
    it("renders TransactionHistory when setting is true", async () => {
        (appSettingService.get as any).mockResolvedValue("true");

        await renderServerComponent();

        expect(screen.getByTestId("transaction-history")).toBeInTheDocument();
        expect(screen.getByTestId("transaction-history")).toHaveTextContent("123");
    });

    // ==========================================================
    // TEST 3 — Does NOT show TransactionHistory when disabled
    // ==========================================================
    it("does not render TransactionHistory when setting is false", async () => {
        (appSettingService.get as any).mockResolvedValue("false");

        await renderServerComponent();

        expect(screen.queryByTestId("transaction-history")).not.toBeInTheDocument();
    });

    // =========================================
    // TEST 4 — Renders CourseDescription Twice
    // (Desktop + Mobile)
    // =========================================
    it("renders CourseDescription in both desktop and mobile sections", async () => {
        (appSettingService.get as any).mockResolvedValue("false");

        await renderServerComponent();

        const descriptions = screen.getAllByTestId("course-description");
        expect(descriptions.length).toBe(2); // desktop + mobile
    });
});
