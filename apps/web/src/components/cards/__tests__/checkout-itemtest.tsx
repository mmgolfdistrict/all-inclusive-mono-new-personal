import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

import { CheckoutItem } from "../checkout-item";
import {
    type SearchObject,
    type SensibleDataToMountCompType,
} from "~/utils/types";

// 1️⃣ Mock Next.js navigation utilities
vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    usePathname: () => "/checkout",
    useSearchParams: () => ({
        get: (key: string) => {
            if (key === "playerCount") return "2";
            if (key === "teeTimeId") return "tee_123";
            return null;
        },
    }),
}));

// 2️⃣ Mock your TRPC API — MUST match import path
vi.mock("~/utils/api", () => ({
    api: {
        course: {
            getCoursePreviewImage: {
                useQuery: vi.fn().mockReturnValue({
                    data: "https://example.com/mock-course.jpg",
                    isLoading: false,
                }),
            },
        },
    },
}));

// 4️⃣ Reusable mock props
const mockTeeTime: SearchObject = {
    soldById: "seller_1",
    soldByName: "John Doe",
    soldByImage: "https://example.com/seller.jpg",
    availableSlots: 4,
    pricePerGolfer: 150,
    teeTimeId: "tee_123",
    date: "2025-11-07",
    time: 930,
    includesCart: true,
    firstOrSecondHandTeeTime: "FIRST_HAND",
    isListed: true,
    weather: {
        name: "Sunny",
        shortForecast: "Clear skies",
        temperature: 29,
        iconCode: "01d" as any,
    },
    userWatchListed: false,
};

const mockSensibleData: SensibleDataToMountCompType = {
    partner_id: "p123",
    product_id: "prod_456",
    coverageStartDate: "2025-11-07",
    coverageEndDate: "2025-11-07",
    coverageStartHourNumber: 6,
    coverageEndHourNumber: 18,
    currency: "USD",
    langLocale: "en-US",
    exposureName: "Course A",
    exposureLatitude: 37.7749,
    exposureLongitude: -122.4194,
    exposureTotalCoverageAmount: 5000,
};

// 5️⃣ Tests
describe("CheckoutItem Component", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders course and tee time details", () => {
        render(
            <CheckoutItem
                teeTime={mockTeeTime}
                isLoading={false}
                isSensibleInvalid={false}
                sensibleDataToMountComp={mockSensibleData}
            />
        );

        expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
        expect(screen.getByText(/Sunny/i)).toBeInTheDocument();
        expect(screen.getByText(/\$?150/)).toBeInTheDocument();
    });

    it("renders loading skeleton when isLoading is true", () => {
        render(
            <CheckoutItem
                teeTime={mockTeeTime}
                isLoading={true}
                isSensibleInvalid={false}
                sensibleDataToMountComp={mockSensibleData}
            />
        );
        expect(screen.getByTestId("loading-skeleton")).toBeInTheDocument();
    });

    it("handles invalid sensible data gracefully", () => {
        render(
            <CheckoutItem
                teeTime={mockTeeTime}
                isLoading={false}
                isSensibleInvalid={true}
                sensibleDataToMountComp={mockSensibleData}
            />
        );
        expect(
            screen.getByText(/invalid configuration|not available/i)
        ).toBeInTheDocument();
    });
});
