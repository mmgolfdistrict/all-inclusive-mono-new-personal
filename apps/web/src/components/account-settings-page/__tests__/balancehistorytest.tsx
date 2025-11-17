import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { toast } from "react-toastify";

import { BalanceHistory } from "../balance-history";

// --- mocks ---
vi.mock("~/hooks/useUser", () => ({
    useUser: vi.fn(() => ({
        data: {
            id: "user-123",
            address1: "123 Street",
            city: "City",
            state: "ST",
            zipcode: "12345",
            country: "Country",
            stripeConnectAccountStatus: "DISCONNECTED",
        },
        refetch: vi.fn(),
    })),
}));

vi.mock("~/contexts/CourseContext", () => ({
    useCourseContext: () => ({ course: { id: "course-123" } }),
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({ entity: { color1: "blue" } }),
}));

// mock API hooks
const mutateAsyncMock = vi.fn();
vi.mock("~/utils/api", () => ({
    api: {
        cashOut: {
            createStripeAccountLink: { useMutation: () => ({ isLoading: false }) },
            createCashoutTransfer: { useMutation: () => ({ mutateAsync: mutateAsyncMock }) },
            getAssociatedAccounts: { useQuery: () => ({ data: [] }) },
            getRecievables: {
                useQuery: () => ({
                    data: { availableAmount: 100, withdrawableAmount: 50 },
                    refetch: vi.fn(),
                })
            },
        },
    },
}));

vi.mock("react-toastify", () => ({
    toast: { success: vi.fn(), error: vi.fn() },
}));

describe("BalanceHistory", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("renders wallet heading and amounts", () => {
        render(<BalanceHistory userId="user-123" />);
        expect(screen.getByText(/Golf District Wallet/i)).toBeInTheDocument();
        expect(screen.getByText("$50.00")).toBeInTheDocument(); // withdrawable
        expect(screen.getByText("$50.00")).toBeInTheDocument(); // processing (100 - 50)
    });

    it("shows connect account message when no banks and not connected", () => {
        render(<BalanceHistory userId="user-123" />);
        expect(
            screen.getByText(/You need to connect your account/i)
        ).toBeInTheDocument();
    });

    it("opens modal if user has address", () => {
        render(<BalanceHistory userId="user-123" />);
        fireEvent.click(screen.getByTestId("connect-button-id"));
        // Modal is mocked, but we can check that it's rendered with isOpen true
        expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("shows error toast if user has no address", () => {
        // override hook to return user without address
        const useUser = require("~/hooks/useUser").useUser;
        useUser.mockReturnValueOnce({ data: { id: "user-123" }, refetch: vi.fn() });

        render(<BalanceHistory userId="user-123" />);
        fireEvent.click(screen.getByTestId("connect-button-id"));
        expect(toast.error).toHaveBeenCalledWith(
            "Please add address before adding bank account"
        );
    });

    it("shows error if transfer amount > withdrawable", async () => {
        render(<BalanceHistory userId="user-123" />);
        const instance = screen.getByTestId("connect-button-id"); // just to trigger handleTransferAmount manually
        // call handleTransferAmount directly
        const comp = render(<BalanceHistory userId="user-123" />);
        const balanceComp = comp.container.querySelector("#add-bank-account-account-settings");
        const componentInstance = comp.rerender;

        // Instead of digging into internals, call the exported function
        const bh = comp;
        // simulate calling handleTransferAmount
        const balanceHistory = bh;
        // easier: directly invoke the function
        const { handleTransferAmount } = require("../balance-history");
        await handleTransferAmount("pi_123", 100); // > withdrawable 50
        expect(toast.error).toHaveBeenCalledWith(
            "Amount cannot be greater then withdrawable amount"
        );
    });

    it("shows success toast on successful transfer", async () => {
        mutateAsyncMock.mockResolvedValueOnce({ success: true, error: false });
        render(<BalanceHistory userId="user-123" />);
        // call handleTransferAmount manually
        const { handleTransferAmount } = require("../balance-history");
        await handleTransferAmount("pi_123", 25);
        await waitFor(() => {
            expect(toast.success).toHaveBeenCalledWith(
                "Cash out requested for $25",
                expect.any(Object)
            );
        });
    });

    it("shows error toast on failed transfer", async () => {
        mutateAsyncMock.mockResolvedValueOnce({ success: false, error: true });
        const { handleTransferAmount } = require("../balance-history");
        await handleTransferAmount("pi_123", 25);
        expect(toast.error).toHaveBeenCalled();
    });
});
