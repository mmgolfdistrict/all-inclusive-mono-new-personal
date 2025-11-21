import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import StopNotification from "../page";
import React from "react";

// ----------------------
// Mock the TRPC api
// ----------------------
const mutateAsyncMock = vi.fn();

vi.mock("~/utils/api", () => ({
    api: {
        userWaitlist: {
            deleteWaitlistNotification: {
                useMutation: () => ({
                    mutateAsync: mutateAsyncMock,
                }),
            },
        },
    },
}));

// ----------------------
// Mock next/link
// ----------------------
vi.mock("next/link", () => ({
    __esModule: true,
    default: ({ href, children }: any) => (
        <a href={href} data-testid="mock-link">
            {children}
        </a>
    ),
}));

beforeEach(() => {
    vi.clearAllMocks();
});

// ----------------------
// Test Suite
// ----------------------

describe("StopNotification Component", () => {
    const params = { notification: "notif-123" };

    it("calls mutateAsync with correct notification ID on mount", async () => {
        render(<StopNotification params={params} />);

        await waitFor(() => {
            expect(mutateAsyncMock).toHaveBeenCalledTimes(1);
            expect(mutateAsyncMock).toHaveBeenCalledWith({
                ids: ["notif-123"],
            });
        });
    });

    it("renders the success message", () => {
        render(<StopNotification params={params} />);

        expect(
            screen.getByText("Stopped notification successfully")
        ).toBeInTheDocument();
    });

    it("renders Return to home link", () => {
        render(<StopNotification params={params} />);

        const link = screen.getByTestId("mock-link");
        expect(link).toHaveAttribute("href", "/");
        expect(link).toHaveTextContent("Return to home");
    });
});
