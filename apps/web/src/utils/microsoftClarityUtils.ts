interface Clarity {
    (action: string, ...args: unknown[]): void;
    set(action: string, data: object): void;
}

declare global {
    interface Window {
        clarity?: Clarity;
    }
}

export const microsoftClarityEvent = ({ action, category, label, value }: { action: string; category: string; label: string; value?: string }) => {
    if (window.clarity) {
        window.clarity('set', 'customEvent', {
            action,
            category,
            label,
            value
        });
        // console.log(action,
        //     category,
        //     label,
        //     value, "microsoftClarityEvent");
    } else {
        console.warn('Microsoft Clarity is not loaded or not available.');
    }
};