import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import React from "react";
import { Confirmation } from "~/components/auction-page/confirmation";

// Mock the contexts
vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({ course: { id: "course-1" } }),
}));

vi.mock("~/contexts/UserContext", () => ({
    useUserContext: () => ({ user: { id: "user-1" } }),
}));

// Mock FilledButton
vi.mock("../buttons/filled-button", () => ({
    FilledButton: ({ children }: { children: React.ReactNode }) => <button>{children}</button>,
}));

describe("Confirmation component", () => {
    it("renders the video element", () => {
        render(<Confirmation />);
        const video = document.querySelector("video");
        expect(video).toBeInTheDocument();
        expect(video?.getAttribute("src")).toBe("/videos/confirmation.mp4");
    });

    it("renders the heading", () => {
        render(<Confirmation />);
        expect(
            screen.getByRole("heading", { name: /Thanks For Your Auction Purchase!/i })
        ).toBeInTheDocument();
    });

    it("renders two paragraphs", () => {
        render(<Confirmation />);
        const paragraphs = screen.getAllByText(/lorem ipsum/i);
        expect(paragraphs).toHaveLength(2);
    });

    it("renders the 'Go to Profile' button with correct link", () => {
        render(<Confirmation />);
        const link = screen.getByTestId("go-to-profile-button-id") as HTMLAnchorElement;
        expect(link).toBeInTheDocument();
        expect(link.getAttribute("href")).toBe("/course-1/profile/user-1");
        expect(screen.getByRole("button", { name: /Go to Profile/i })).toBeInTheDocument();
    });
});
