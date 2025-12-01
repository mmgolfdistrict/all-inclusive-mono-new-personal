import React, {
    type ComponentProps,
    type PropsWithChildren,
    type ImgHTMLAttributes,
    type FC
} from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { Course } from "../course";
import { cleanup } from "@testing-library/react";


// Mock Next.js `Link` and `Image` since they have special behavior
vi.mock("next/link", () => {
    const LinkMock: FC<PropsWithChildren<ComponentProps<"a">>> = ({
        children,
        ...props
    }) => <a {...props}>{children}</a>;

    return { __esModule: true, default: LinkMock };
});

vi.mock("next/image", () => {
    const ImageMock: FC<ImgHTMLAttributes<HTMLImageElement>> = (props) => (
        <img {...props} alt="course" />
    );

    return { __esModule: true, default: ImageMock };
});

describe("Course Component", () => {
    const mockProps = {
        image: "/test-image.jpg",
        courseName: "Pebble Beach Golf Links",
        location: "California, USA",
        description: "A stunning seaside golf course with scenic ocean views.",
        courseId: "pebble-beach",
    };

    beforeEach(() => {
        render(<Course {...mockProps} />);
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("renders without crashing", () => {
        expect(screen.getByTestId("course-id")).toBeInTheDocument();
    });

    it("renders the course image with correct src and alt", () => {
        const img: HTMLImageElement = screen.getByAltText("course");
        expect(img).toBeInTheDocument();
        expect(img.src).toContain(mockProps.image);
    });

    it("renders the course name, location, and description", () => {
        expect(screen.getByText(mockProps.courseName)).toBeInTheDocument();
        expect(screen.getByText(mockProps.location)).toBeInTheDocument();
        expect(screen.getByText(mockProps.description)).toBeInTheDocument();
    });

    it("renders the 'Book Now' button", () => {
        const button = screen.getByRole("button", { name: /book now/i });
        expect(button).toBeInTheDocument();
        expect(button).toHaveClass("bg-black");
    });

    it("renders the correct link href", () => {
        const link = screen.getByRole("link");
        expect(link).toHaveAttribute("href", `/${mockProps.courseId}`);
    });

    it("includes correct data attributes", () => {
        const link = screen.getByTestId("course-id");
        expect(link).toHaveAttribute("data-test", mockProps.courseId);
        expect(link).toHaveAttribute("data-qa", mockProps.courseName);
    });
});
