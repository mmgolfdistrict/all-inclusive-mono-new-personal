import '@testing-library/jest-dom';
import { cleanup, configure } from '@testing-library/react';
import { afterEach } from 'vitest';
// Increase the async timeout to 5000ms for diagnosis
configure({ asyncUtilTimeout: 5000 });
// automatically unmount and cleanup DOM after the test is finished.
afterEach(() => {
    cleanup();
});