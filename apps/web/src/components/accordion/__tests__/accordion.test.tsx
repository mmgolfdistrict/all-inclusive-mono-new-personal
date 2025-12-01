import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import * as Accordion from "@radix-ui/react-accordion";
import { AccordionRoot } from "../accordion";

describe("AccordionRoot", () => {
    it("collapses and expands when trigger is clicked", async () => {
        render(
            <AccordionRoot defaultValue="item-1">
                <Accordion.Item value="item-1">
                    <Accordion.Header>
                        <Accordion.Trigger>Trigger</Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content>Content</Accordion.Content>
                </Accordion.Item>
            </AccordionRoot>
        );

        const trigger = screen.getByRole("button", { name: "Trigger" });
        const content = screen.getByRole("region", { name: "Trigger" });

        // Initially open
        expect(trigger).toHaveAttribute("aria-expanded", "true");
        expect(content).toHaveAttribute("data-state", "open");

        // Collapse
        await userEvent.click(trigger);
        await waitFor(() => {
            expect(trigger).toHaveAttribute("aria-expanded", "false");
            expect(content).toHaveAttribute("data-state", "closed");
        });

        // Expand again
        await userEvent.click(trigger);
        await waitFor(() => {
            expect(trigger).toHaveAttribute("aria-expanded", "true");
            expect(content).toHaveAttribute("data-state", "open");
        });
    });

    it("collapses and expands visibility correctly", async () => {
        render(
            <AccordionRoot defaultValue="item-1">
                <Accordion.Item value="item-1">
                    <Accordion.Header>
                        <Accordion.Trigger>Trigger</Accordion.Trigger>
                    </Accordion.Header>
                    <Accordion.Content>Content</Accordion.Content>
                </Accordion.Item>
            </AccordionRoot>
        );

        const trigger = screen.getByRole("button", { name: "Trigger" });
        const content = screen.getByRole("region", { name: "Trigger" });

        // Initially open
        expect(content).toBeVisible();

        // Collapse
        await userEvent.click(trigger);
        await waitFor(() => {
            expect(content).not.toBeVisible();
        });

        // Expand again
        await userEvent.click(trigger);
        await waitFor(() => {
            expect(content).toBeVisible();
        });
    });
});
