export const debounceFunction = (func, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func(...args);
        }, delay);
    };
};