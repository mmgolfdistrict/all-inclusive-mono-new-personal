import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within, waitFor } from "@testing-library/react";
import CustomTimePicker from "../../CustomTimePicker";

function getHourSelect() {
    const el = screen.queryByTestId("hour-select");
    if (!el) throw new Error("hour-select not found");
    return el as HTMLSelectElement;
}

function getMinuteSelect() {
    const el = screen.queryByTestId("minute-select");
    if (!el) throw new Error("minute-select not found");
    return el as HTMLSelectElement;
}


describe("CustomTimePicker", () => {
    const setup = () => {
        const setTime = vi.fn();
        render(<CustomTimePicker label="Start Time" setTime={setTime} />);
        return { setTime };
    };

    const getHourSelect = () => {
        const selects = screen.getAllByRole("combobox");
        expect(selects.length).toBeGreaterThan(1);
        return selects[0];
    };

    const getMinuteSelect = () => {
        const selects = screen.getAllByRole("combobox");
        expect(selects.length).toBeGreaterThan(1);
        return selects[1];
    };

    it("renders label and selects", () => {
        const { setTime } = setup();

        expect(screen.getByText("Start Time")).toBeInTheDocument();
        expect(screen.getByText("HH")).toBeInTheDocument();
        expect(screen.getByText("mm")).toBeInTheDocument();
        expect(screen.getByLabelText("AM")).toBeInTheDocument();
        expect(screen.getByLabelText("PM")).toBeInTheDocument();

        expect(setTime).not.toHaveBeenCalled();
    });

    it("calls setTime when hour, minute, and AM/PM are selected", async () => {
        const { setTime } = setup();

        const hourSelect = getHourSelect();
        const minuteSelect = getMinuteSelect();
        const amRadio = screen.getByLabelText("AM");

        fireEvent.change(hourSelect as HTMLElement, { target: { value: "3" } });
        fireEvent.change(minuteSelect as HTMLElement, { target: { value: "30" } });
        fireEvent.click(amRadio);

        await waitFor(() => expect(setTime).toHaveBeenCalled());

        const payload = setTime.mock.calls[0]![0];

        expect(payload.hour()).toBe(3);
        expect(payload.minute()).toBe(30);
    });

    it("converts PM hours correctly", async () => {
        const setTime = vi.fn();
        render(<CustomTimePicker label="Time" setTime={setTime} />);

        const hourSelect = getHourSelect();
        const minuteSelect = getMinuteSelect();
        const pmRadio = screen.getByLabelText("PM");

        fireEvent.change(hourSelect as HTMLElement, { target: { value: "1" } });
        fireEvent.change(minuteSelect as HTMLElement, { target: { value: "00" } });
        fireEvent.click(pmRadio);

        await waitFor(() => expect(setTime).toHaveBeenCalled());

        const payload = setTime.mock.calls[0]![0];

        expect(payload.hour()).toBe(1);
        expect(payload.minute()).toBe(0);
    });

    it("handles 12 PM correctly", async () => {
        const setTime = vi.fn();
        render(<CustomTimePicker label="Time" setTime={setTime} />);

        const hourSelect = getHourSelect();
        const minuteSelect = getMinuteSelect();
        const pmRadio = screen.getByLabelText("PM");

        fireEvent.change(hourSelect as HTMLElement, { target: { value: "12" } });
        fireEvent.change(minuteSelect as HTMLElement, { target: { value: "15" } });
        fireEvent.click(pmRadio);

        await waitFor(() => expect(setTime).toHaveBeenCalled());

        const payload = setTime.mock.calls[0]![0];

        expect(payload.hour()).toBe(0);
        expect(payload.minute()).toBe(15);
    });

    it("handles 12 AM correctly", async () => {
        const { setTime } = setup();

        const hourSelect = getHourSelect();
        const minuteSelect = getMinuteSelect();
        const amRadio = screen.getByLabelText("AM");

        fireEvent.change(hourSelect as HTMLElement, { target: { value: "12" } });
        fireEvent.change(minuteSelect as HTMLElement, { target: { value: "45" } });
        fireEvent.click(amRadio);

        await waitFor(() => expect(setTime).toHaveBeenCalled());

        const payload = setTime.mock.calls[0]![0];

        expect(payload.hour()).toBe(0);
        expect(payload.minute()).toBe(45);
    });

    it("applies flag styling correctly", () => {
        render(<CustomTimePicker label="Test" setTime={() => { }} flag={true} />);

        const hourSelect = getHourSelect();
        expect(hourSelect).toHaveClass("ml-2");
    });

    it("does not call setTime until both hour and minute are selected", () => {
        const setTime = vi.fn();
        render(<CustomTimePicker label="Test" setTime={setTime} />);

        const hourSelect = getHourSelect();

        fireEvent.change(hourSelect as HTMLElement, { target: { value: "10" } });

        expect(setTime).not.toHaveBeenCalled();
    });

});
