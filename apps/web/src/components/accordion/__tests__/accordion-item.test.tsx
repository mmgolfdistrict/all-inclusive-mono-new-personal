import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import * as Accordion from "@radix-ui/react-accordion";
import { AccordionItem } from "../accordion-item";

describe("AccordionItem Component", () => {
    beforeEach(() => {
        document.body.innerHTML = "";
    });

    const setup = () =>
        render(
            <Accordion.Root type="single" collapsible>
                <AccordionItem title="Test Title" value="item-1">
                    <div data-testid="accordion-children">Child Content</div>
                </AccordionItem>
            </Accordion.Root>
        );

    it("renders the accordion title", () => {
        setup();
        expect(screen.getByText("Test Title")).toBeInTheDocument();
    });

    it("does NOT render children initially (Radix unmounts content)", () => {
        setup();
        expect(screen.queryByTestId("accordion-children")).toBeNull();
    });

    it("shows the content when opened", () => {
        setup();

        const trigger = screen.getByTestId("accordion-button-id");

        fireEvent.click(trigger);

        const children = screen.getByTestId("accordion-children");
        expect(children).toBeVisible();
    });

    it("mounts and unmounts content when toggled", () => {
        setup();

        const trigger = screen.getByTestId("accordion-button-id");

        // OPEN
        fireEvent.click(trigger);
        expect(screen.getByTestId("accordion-children")).toBeVisible();

        // CLOSE
        fireEvent.click(trigger);
        expect(screen.queryByTestId("accordion-children")).toBeNull();
    });

    it("chevron has data-state='open' when accordion is expanded", () => {
        setup();

        const trigger = screen.getByTestId("accordion-button-id");
        const content = document.querySelector("[role='region']");

        // initially closed
        expect(content?.getAttribute("data-state")).toBe("closed");

        fireEvent.click(trigger);

        expect(content?.getAttribute("data-state")).toBe("open");
    });
});
