import React, { type ImgHTMLAttributes } from "react";
import { render, screen } from "@testing-library/react";
import AuctionsPage from "../page";
import { useCourseContext } from "~/contexts/CourseContext";
import { useAuction } from "~/hooks/useAuction";
import { redirect } from "next/navigation";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";
type SkeletonProps = Record<string, unknown>;

interface DescriptionProps {
    title: string;
    date: string;
    location: string;
    time: string;
    body: string;
}

interface BiddingProps {
    highestBid: number;
    startingPrice: number;
    bidCount: number;
}

interface TitleProps {
    title: string;
    subtitle: string;
}

interface GoBackProps {
    text: string;
    href: string;
}

interface BlurImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    alt: string;
    src: string;
}

vi.mock("~/contexts/CourseContext");
vi.mock("~/hooks/useAuction");

vi.mock("next/navigation", () => ({
    redirect: vi.fn(),
}));

// Typed Skeleton Component
vi.mock("../skeleton", () => ({
    Skeleton: (props: SkeletonProps) => <div data-testid="skeleton" {...props} />,
}));

// Typed Description Component
vi.mock("~/components/auction-page/description", () => ({
    Description: ({ title, date, location, time, body }: DescriptionProps) => (
        <div data-testid="description">
            {title}-{date}-{location}-{time}-{body}
        </div>
    ),
}));

// Typed Bidding
vi.mock("~/components/auction-page/bidding", () => ({
    Bidding: ({ highestBid, startingPrice, bidCount }: BiddingProps) => (
        <div data-testid="bidding">
            {highestBid}-{startingPrice}-{bidCount}
        </div>
    ),
}));

// Typed Title
vi.mock("~/components/auction-page/title", () => ({
    Title: ({ title, subtitle }: TitleProps) => (
        <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
        </div>
    ),
}));

// Typed GoBack
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ text, href }: GoBackProps) => <a href={href}>{text}</a>,
}));

// Typed BlurImage
vi.mock("~/components/images/blur-image", () => ({
    BlurImage: ({ alt, src }: BlurImageProps) => (
        /* eslint-disable @next/next/no-img-element */
        <img alt={alt} src={src} />
        /* eslint-enable @next/next/no-img-element */
    ),
}));

describe("AuctionsPage", () => {
    const params = { course: "course-1", auction: "auction-1" };

    beforeEach(() => {
        vi.clearAllMocks();

        (useCourseContext as unknown as Mock).mockReturnValue({
            course: { allowAuctions: true, timezoneCorrection: 0 },
        });

        (useAuction as unknown as Mock).mockReturnValue({
            auctionData: null,
            isLoading: false,
            refetch: vi.fn(),
        });
    });

    it("redirects if course is not available", () => {
        (useCourseContext as Mock).mockReturnValue({ course: null });

        render(<AuctionsPage params={params} />);
        expect(redirect).toHaveBeenCalledWith("/course-1");
    });

    it("redirects if course.allowAuctions is false", () => {
        (useCourseContext as Mock).mockReturnValue({
            course: { allowAuctions: false },
        });

        render(<AuctionsPage params={params} />);
        expect(redirect).toHaveBeenCalledWith("/course-1");
    });

    it("renders Skeleton while loading", () => {
        (useAuction as Mock).mockReturnValue({
            auctionData: null,
            isLoading: true,
            refetch: vi.fn(),
        });

        render(<AuctionsPage params={params} />);
        expect(screen.getByTestId("skeleton")).toBeInTheDocument();
    });

    it("renders all main subcomponents when data is loaded", () => {
        const auctionData = {
            auction: {
                name: "Test Auction",
                eventDate: "2025-11-10T10:00:00Z",
                eventLocation: "Test Location",
                eventTime: "10:00",
                extendedDescription: "Description",
                endDate: "2025-11-12T10:00:00Z",
                startingPrice: 100,
                buyNowPrice: 500,
            },
            assetUrl: "/image.jpg",
            highestBid: 150,
            bidCount: 5,
        };

        (useAuction as Mock).mockReturnValue({
            auctionData,
            isLoading: false,
            refetch: vi.fn(),
        });

        render(<AuctionsPage params={params} />);

        // GoBack
        expect(screen.getByText("Back to tee times")).toBeInTheDocument();

        // Title & subtitle
        expect(screen.getByText("Test Auction")).toBeInTheDocument();
        const locationElements = screen.getAllByText(/Test Location/i);
        expect(locationElements.length).toBeGreaterThan(0);

        // Description
        expect(screen.getByTestId("description")).toHaveTextContent(
            "Test Auction-2025-11-10T10:00:00Z-Test Location-10:00-Description"
        );

        // BlurImage
        expect(screen.getByAltText("Auction Placeholder")).toHaveAttribute(
            "src",
            "/image.jpg"
        );

        // Bidding
        expect(screen.getByTestId("bidding")).toHaveTextContent("150-100-5");
    });
});
