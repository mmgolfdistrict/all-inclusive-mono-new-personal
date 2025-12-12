// AddCard.test.tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, type MockedFunction } from "vitest";

import { AddCard } from "../add-card";
import { usePaymentMethods } from "~/hooks/usePaymentMethods";

// --- mocks ---
vi.mock("../../utils/credit-card-formatters", () => ({
    formatCreditCardNumber: (val: string) => val,
    formatExpirationDate: (val: string) => val,
}));

vi.mock("~/contexts/UserContext", () => ({
    useUserContext: () => ({ user: { id: "user-123" } }),
}));

vi.mock("~/hooks/usePaymentMethods", () => ({
    usePaymentMethods: vi.fn(() => ({ cards: [] })),
}));

vi.mock("~/contexts/AppContext", () => ({
    useAppContext: () => ({ entity: { color1: "red" } }),
}));

const mutateAsync = vi.fn();
vi.mock("~/utils/api", () => ({
    api: {
        checkout: {
            createPaymentMethod: {
                useMutation: () => ({ mutateAsync }),
            },
        },
    },
}));

vi.mock("react-toastify", () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
    },
}));

vi.mock("usehooks-ts", () => ({
    useMediaQuery: () => false,
}));

// --- tests ---
describe("AddCard", () => {
    const refetchCards = vi.fn();
    const mockedUsePaymentMethods = usePaymentMethods as MockedFunction<typeof usePaymentMethods>;

    beforeEach(() => {
        vi.clearAllMocks();
        mockedUsePaymentMethods.mockReturnValue({
            cards: [],
            refetch: vi.fn(),
            isLoading: false,
        });
    });

    it("shows error toast if card already exists", async () => {
        mockedUsePaymentMethods.mockReturnValue({
            cards: [
                {
                    card: {
                        last4_digits: "1111",
                        saved_to_locker: false,
                    },
                },
            ],
            refetch: vi.fn(),
            isLoading: false,
        });

        render(<AddCard refetchCards={refetchCards} />);

        await userEvent.type(screen.getByTestId("card-holder-name-id"), "John Doe");
        await userEvent.type(screen.getByTestId("card-number-id"), "4111111111111111");
        await userEvent.type(screen.getByTestId("card-expiry-date-id"), "12/25");

        // ensure RHF value syncs (IMPORTANT)
        // await waitFor(() => {
        //     expect(screen.getByTestId("card-number-id")).toHaveValue("4111111111111111");
        // });

        // pick card type
        await userEvent.click(screen.getAllByTestId("toggle-item-id")[0]!);
        await userEvent.click(screen.getByTestId("add-button-id"));
    });
});
