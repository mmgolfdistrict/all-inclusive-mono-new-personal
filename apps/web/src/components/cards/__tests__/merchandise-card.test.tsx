import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MerchandiseCard from "../merchandise-card";
import type { MerchandiseItem } from '../../checkout-page/merchandise-carousel';

// Mock OutlineButton so we don’t test its internals
vi.mock("../buttons/outline-button", () => ({
    OutlineButton: (props: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button {...props}>{props.children}</button>
    ),
}));

// Mock Tooltip (not relevant to logic)
vi.mock("../tooltip", () => ({
    Tooltip: ({
        trigger,
    }: {
        trigger: React.ReactNode;
    }) => <>{trigger}</>,
}));

// Mock formatMoney
vi.mock("~/utils/formatters", () => ({
    formatMoney: (n: number) => `$${n.toFixed(2)}`,
}));

const baseItem: MerchandiseItem = {
    id: "item-1",
    caption: "Golf Cap",
    description: "A very good cap for golfers",
    price: 5000,
    qoh: 10,
    maxQtyToAdd: 5,
    logoURL: null,
    merchandiseTaxPercent: 5,
    tooltip: 'Golf Cap Item'
};

describe("<MerchandiseCard />", () => {
    const user = userEvent.setup();

    let onQuantityChange: ReturnType<typeof vi.fn>;
    let onCardClick: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        onQuantityChange = vi.fn();
        onCardClick = vi.fn();
    });

    // ---------------------------------------------------------
    // INITIAL RENDER
    // ---------------------------------------------------------
    it("renders item caption, price, and description preview", () => {
        render(
            <MerchandiseCard
                item={baseItem}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        expect(screen.getByText("Golf Cap")).toBeInTheDocument();
        expect(screen.getByText("$50.00")).toBeInTheDocument();
        expect(screen.getByText("A very good cap for golfers")).toBeInTheDocument();
        expect(
            screen.getByRole("button", { name: /add golf cap to cart/i })
        ).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    // ADD BUTTON
    // ---------------------------------------------------------
    it("adds item and fires callback when clicking Add", async () => {
        render(
            <MerchandiseCard
                item={baseItem}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", {
            name: /add golf cap to cart/i,
        });

        await user.click(addBtn);

        expect(onQuantityChange).toHaveBeenCalledWith(
            "item-1",
            1,
            5000,
            5
        );

        expect(screen.getByText("1")).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    // INCREMENT
    // ---------------------------------------------------------
    it("increments quantity and fires callback", async () => {
        render(
            <MerchandiseCard
                item={baseItem}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", {
            name: /add golf cap to cart/i,
        });
        await user.click(addBtn);

        const incBtn = screen.getByRole("button", {
            name: /increase quantity/i,
        });

        await user.click(incBtn);

        expect(onQuantityChange).toHaveBeenCalledWith("item-1", 2, 5000, 5);
        expect(screen.getByText("2")).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    // DECREMENT
    // ---------------------------------------------------------
    it("decrements quantity and fires callback", async () => {
        render(
            <MerchandiseCard
                item={baseItem}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", {
            name: /add golf cap to cart/i,
        });
        await user.click(addBtn);

        const decBtn = screen.getByRole("button", {
            name: /decrease quantity/i,
        });

        await user.click(decBtn);

        expect(onQuantityChange).toHaveBeenCalledWith("item-1", 0, 5000, 5);
    });

    // ---------------------------------------------------------
    // DISABLE INCREMENT: QOH LIMIT
    // ---------------------------------------------------------
    it("disables increment when quantity reaches QOH", async () => {
        const item = { ...baseItem, qoh: 2 };

        render(
            <MerchandiseCard
                item={item}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", { name: /add/i });
        await user.click(addBtn);

        const incBtn = screen.getByRole("button", {
            name: /increase quantity/i,
        });

        await user.click(incBtn); // quantity = 2

        expect(incBtn).toBeDisabled();
    });

    // ---------------------------------------------------------
    // DISABLE INCREMENT: maxQtyToAdd LIMIT
    // ---------------------------------------------------------
    it("disables increment when maxQtyToAdd reached", async () => {
        const item = { ...baseItem, maxQtyToAdd: 1 };

        render(
            <MerchandiseCard
                item={item}
                maxQuantity={10}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", { name: /add/i });
        await user.click(addBtn);

        const incBtn = screen.getByRole("button", {
            name: /increase quantity/i,
        });

        expect(incBtn).toBeDisabled();
    });

    // ---------------------------------------------------------
    // DISABLE INCREMENT: maxQuantity LIMIT
    // ---------------------------------------------------------
    it("disables increment when global maxQuantity reached", async () => {
        render(
            <MerchandiseCard
                item={{ ...baseItem, maxQtyToAdd: 0 }}
                maxQuantity={1}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", { name: /add/i });
        await user.click(addBtn);

        const incBtn = screen.getByRole("button", {
            name: /increase quantity/i,
        });

        expect(incBtn).toBeDisabled();
    });

    // ---------------------------------------------------------
    // Read More / Read Less
    // ---------------------------------------------------------
    it("toggles description on Read More / Read Less", async () => {
        const longItem = {
            ...baseItem,
            description: "A".repeat(60),
        };

        render(
            <MerchandiseCard
                item={longItem}
                maxQuantity={10}
            />
        );

        const readMore = screen.getByText(/read more/i);
        await user.click(readMore);

        expect(screen.getByText(/read less/i)).toBeInTheDocument();
    });

    // ---------------------------------------------------------
    // Card click callback
    // ---------------------------------------------------------
    it("fires onCardClick when clicking the card wrapper", async () => {
        render(
            <MerchandiseCard
                item={baseItem}
                maxQuantity={10}
                onCardClick={onCardClick}
            />
        );

        const card = screen.getByText("Golf Cap").closest("div");
        expect(card).not.toBeNull();

        await user.click(card!);

        expect(onCardClick).toHaveBeenCalledWith(
            baseItem,
            expect.any(Object) // event
        );
    });

    // ---------------------------------------------------------
    // useEffect maxQuantity enforcement
    // ---------------------------------------------------------
    it("clamps quantity when maxQuantity decreases", async () => {
        const { rerender } = render(
            <MerchandiseCard
                item={{ ...baseItem, maxQtyToAdd: 0 }}
                maxQuantity={3}
                onQuantityChange={onQuantityChange}
            />
        );

        const addBtn = screen.getByRole("button", { name: /add/i });
        await user.click(addBtn);

        // artificially increment to 3
        const incBtn = screen.getByRole("button", {
            name: /increase quantity/i,
        });
        await user.click(incBtn);
        await user.click(incBtn);

        expect(screen.getByText("3")).toBeInTheDocument();

        rerender(
            <MerchandiseCard
                item={{ ...baseItem, maxQtyToAdd: 0 }}
                maxQuantity={1}
                onQuantityChange={onQuantityChange}
            />
        );

        // useEffect should clamp quantity to 1 and fire callback
        expect(onQuantityChange).toHaveBeenCalledWith(
            "item-1",
            1,
            5000,
            5
        );
    });
});
