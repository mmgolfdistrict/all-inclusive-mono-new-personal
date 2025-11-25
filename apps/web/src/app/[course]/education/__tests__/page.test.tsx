import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { expect, vi, describe, it, beforeEach } from "vitest";
import Education from "../page";
import { useCourseContext } from "~/contexts/CourseContext";
import { useRouter } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";

// 🧩 Mock dependencies
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: vi.fn(),
}));

vi.mock("next/navigation", () => ({
    useRouter: vi.fn(),
}));

vi.mock("usehooks-ts", () => ({
    useMediaQuery: vi.fn(),
}));

// Import the actual type from your shared package
import type { Course } from "@golf-district/shared";
import { type AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

describe("Education component", () => {
    const mockPush = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useRouter).mockReturnValue({ push: mockPush } as unknown as AppRouterInstance);
    });

    // ✅ Properly shaped mock Course object to satisfy shared type
    const mockCourse: Course = {
        // --- CourseImagesType ---
        logo: "https://example.com/logo.png",
        images: ["https://example.com/course1.jpg"],

        // --- FullCourseType ---
        id: "course123",
        name: "Elite Golf Course",
        address: "123 Fairway Road",
        description: "A premium golf course",
        longitude: -122.4194,
        latitude: 37.7749,
        forecastApi: null,
        convenienceFeesFixedPerPlayer: 0,
        markupFeesFixedPerPlayer: 0,
        maxListPricePerGolferPercentage: 100,
        openTime: "06:00",
        closeTime: "20:00",
        supportCharity: false,
        supportSensibleWeather: true,
        timezoneCorrection: 0,
        highestListedTeeTime: 200,
        lowestListedTeeTime: 50,
        highestPrimarySaleTeeTime: 250,
        lowestPrimarySaleTeeTime: 60,
        allowAuctions: false,
        supportsOffers: true,
        supportsWatchlist: true,
        supportsPromocode: true,
        supportsWaitlist: true,
        sellerFee: 10,
        buyerFee: 5,
        furthestDayToBook: 14,
        roundUpCharityId: undefined,
        internalId: "INT-001",
        supportsPlayerNameChange: true,
        websiteURL: "https://elitegolf.com",
        courseOpenTime: 600,
        courseCloseTime: 2000,
        supportsGroupBooking: true,
        timezoneISO: "America/Los_Angeles",
        groupBookingMinSize: 2,
        groupBookingMaxSize: 8,
        isOnlyGroupOfFourAllowed: false,
        isAllowSpecialRequest: true,
        isAllowClubRental: true,
        groupStartTime: 700,
        groupEndTime: 1900,
        isAllowCourseSwitching: false,
        supportsSellingMerchandise: true,
        primaryMarketAllowedPlayers: 15,
        primaryMarketSellLeftoverSinglePlayer: true,
        courseAllowedTimeToSellSlots: [],
        supportedCharities: [],
    };

    it("renders correctly with course data", () => {
        vi.mocked(useCourseContext).mockReturnValue({
            course: mockCourse,
            getAllowedPlayersForTeeTime: vi.fn(),
        });
        vi.mocked(useMediaQuery).mockReturnValue(false);

        render(<Education />);

        expect(
            screen.getByText(/You can now sell your tee times/i)
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Book with freedom and comfort/i)
        ).toBeInTheDocument();

        expect(screen.getByText(/Book 0-14 days in advance/i)).toBeInTheDocument();

        expect(screen.getByTestId("book-tee-time-id")).toBeInTheDocument();
        expect(screen.getByTestId("sell-tee-time-id")).toBeInTheDocument();
    });

    it("navigates correctly when 'BOOK TEE TIME' is clicked", () => {
        vi.mocked(useCourseContext).mockReturnValue({
            course: mockCourse,
            getAllowedPlayersForTeeTime: vi.fn(),
        });
        vi.mocked(useMediaQuery).mockReturnValue(false);

        render(<Education />);
        fireEvent.click(screen.getByTestId("book-tee-time-id"));

        expect(mockPush).toHaveBeenCalledWith("/course123");
    });

    it("navigates correctly when 'SELL TEE TIME' is clicked", () => {
        vi.mocked(useCourseContext).mockReturnValue({
            course: mockCourse,
            getAllowedPlayersForTeeTime: vi.fn(),
        });
        vi.mocked(useMediaQuery).mockReturnValue(false);

        render(<Education />);
        fireEvent.click(screen.getByTestId("sell-tee-time-id"));

        expect(mockPush).toHaveBeenCalledWith("/course123/my-tee-box");
    });

    it("renders correctly on mobile (isMobile = true)", () => {
        vi.mocked(useCourseContext).mockReturnValue({
            course: mockCourse,
            getAllowedPlayersForTeeTime: vi.fn(),
        });
        vi.mocked(useMediaQuery).mockReturnValue(true);

        render(<Education />);
        expect(screen.getByText(/Protection from weather/i)).toBeInTheDocument();
    });

    it("handles undefined course gracefully", () => {
        vi.mocked(useCourseContext).mockReturnValue({
            course: undefined,
            getAllowedPlayersForTeeTime: vi.fn(),
        });
        vi.mocked(useMediaQuery).mockReturnValue(false);

        render(<Education />);
        expect(
            screen.getByText(/You can now sell your tee times/i)
        ).toBeInTheDocument();
    });
});
