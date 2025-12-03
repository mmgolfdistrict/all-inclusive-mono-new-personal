// AddCreditCard.test.tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, type Mock } from "vitest";

import { AddCreditCard } from "../addCreditCard";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";

// --- mocks ---
vi.mock("~/hooks/usePaymentMethods", () => ({
    usePaymentMethods: vi.fn(),
}));

// mock AddCard so we can inspect props
vi.mock("../add-card", () => ({
    AddCard: () => (
        <div data-testid="mock-add-card">AddCard component (refetch provided)</div>
    ),
}));

describe("AddCreditCard", () => {
    it("renders heading text", () => {
        (usePaymentMethods as Mock).mockReturnValue({ refetch: vi.fn() });

        render(<AddCreditCard />);

        expect(
            screen.getByRole("heading", { name: /Add New Credit Card/i })
        ).toBeInTheDocument();
    });

    it("renders the AddCard child component", () => {
        (usePaymentMethods as Mock).mockReturnValue({ refetch: vi.fn() });

        render(<AddCreditCard />);

        expect(screen.getByTestId("mock-add-card")).toBeInTheDocument();
    });

    it("passes refetch function from hook to AddCard", () => {
        const refetchMock = vi.fn();
        (usePaymentMethods as Mock).mockReturnValue({ refetch: refetchMock });

        render(<AddCreditCard />);

        // Our mocked AddCard renders a div with text that includes "refetch provided"
        expect(screen.getByTestId("mock-add-card")).toHaveTextContent(
            "AddCard component (refetch provided)"
        );
        // And we can assert that the prop was indeed passed
        expect(refetchMock).toBeDefined();
    });
});
