import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { expect, vi, describe, it, beforeEach } from "vitest";
import CurrentUser from "../page";

// 🧩 Mock the UserContext
vi.mock("~/contexts/UserContext", () => ({
    useUserContext: vi.fn(),
}));

import { useUserContext } from "~/contexts/UserContext";

// --- Types (match your actual context) ---
interface User {
    id: string;
    name: string;
    email: string;
    image: string;
    phone: string;
}

// These imports are only needed for correct return typing of refetchMe:
import type {
    QueryObserverResult,
} from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { BuildProcedure } from "@trpc/server";
import { Session } from "@golf-district/auth";

type RefetchReturn = Promise<
    QueryObserverResult<
        Session | null,
        TRPCClientErrorLike<BuildProcedure<"query", any, unknown>>
    >
>;

interface UserContextType {
    user: User | null;
    isLoadingMe: boolean;
    refetchMe: () => RefetchReturn;
}

describe("CurrentUser component", () => {
    const mockPostMessage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        (window.parent as any).postMessage = mockPostMessage;
    });

    // ✅ Helper to provide properly typed mock return
    const mockUseUserContext = (value: Partial<UserContextType>) => {
        const mockRefetchMe = vi.fn(
            async () =>
            ({
                data: null,
                error: null,
                status: "success",
            } as any)
        );

        vi.mocked(useUserContext).mockReturnValue({
            user: null,
            isLoadingMe: false,
            refetchMe: mockRefetchMe,
            ...value,
        });
    };

    it("renders 'Not Logged In' when user is null", () => {
        mockUseUserContext({ user: null });

        render(<CurrentUser />);

        expect(screen.getByText(/Not Logged In/i)).toBeInTheDocument();
        expect(mockPostMessage).not.toHaveBeenCalled();
    });

    it("renders user's email when user exists", () => {
        const mockUser: User = {
            id: "u1",
            name: "John Doe",
            email: "john@example.com",
            image: "https://example.com/image.jpg",
            phone: "+1234567890",
        };

        mockUseUserContext({ user: mockUser });

        render(<CurrentUser />);

        expect(screen.getByText(/Current User Email:/i)).toBeInTheDocument();
        expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
    });

    it("calls window.parent.postMessage with correct payload when user exists", () => {
        const mockUser: User = {
            id: "u2",
            name: "Alice",
            email: "alice@example.com",
            image: "https://example.com/alice.png",
            phone: "+1987654321",
        };

        mockUseUserContext({ user: mockUser });

        render(<CurrentUser />);

        expect(mockPostMessage).toHaveBeenCalledWith(
            {
                source: "iframe-current-user",
                payload: mockUser,
            },
            window.location.origin
        );
    });

    it("does not call postMessage when user is null", () => {
        mockUseUserContext({ user: null });

        render(<CurrentUser />);

        expect(mockPostMessage).not.toHaveBeenCalled();
    });
});