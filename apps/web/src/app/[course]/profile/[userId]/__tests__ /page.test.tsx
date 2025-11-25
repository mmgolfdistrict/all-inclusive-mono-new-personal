import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Import the component under test
import Profile from "../page";

// ---- Mock child components ----

// Mock GoBack component
vi.mock("~/components/buttons/go-back", () => ({
    GoBack: ({ href, text }: { href: string; text: string }) => (
        <div data-testid="go-back">
            <span data-testid="go-back-href">{href}</span>
            <span data-testid="go-back-text">{text}</span>
        </div>
    ),
}));

// Mock ProfileDetails
vi.mock("~/components/profile-page/profile-details", () => ({
    ProfileDetails: ({ isThirdPartyProfile }: { isThirdPartyProfile: boolean }) => (
        <div data-testid="profile-details">
            <span data-testid="third-party-flag">
                {isThirdPartyProfile ? "true" : "false"}
            </span>
        </div>
    ),
}));

describe("Profile Page", () => {
    const params = {
        course: "golf-hills",
        userId: "user123",
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders without crashing", () => {
        render(<Profile params={params} />);

        expect(screen.getByTestId("go-back")).toBeInTheDocument();
        expect(screen.getByTestId("profile-details")).toBeInTheDocument();
    });

    it("passes correct href and text to GoBack", () => {
        render(<Profile params={params} />);

        expect(screen.getByTestId("go-back-href").textContent).toBe("/golf-hills");
        expect(screen.getByTestId("go-back-text").textContent).toBe(
            "Back to tee times"
        );
    });

    it("renders ProfileDetails with isThirdPartyProfile=true", () => {
        render(<Profile params={params} />);

        expect(screen.getByTestId("third-party-flag").textContent).toBe("true");
    });

    it("does NOT render UpcomingTeeTimes or TeeTimeHistory (commented)", () => {
        render(<Profile params={params} />);

        // These elements should not exist since the components are commented out
        expect(screen.queryByText(/Upcoming Tee Times/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/Tee Time History/i)).not.toBeInTheDocument();
    });

    it("correctly receives course & user IDs in params", () => {
        render(<Profile params={params} />);

        // GoBack uses only courseId, so this validates the params indirectly
        expect(screen.getByTestId("go-back-href").textContent).toBe("/golf-hills");
    });
});
