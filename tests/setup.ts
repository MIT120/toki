// Jest setup file for electricity calculation tests

// Global test configuration
global.console = {
    ...console,
    // Suppress console.log during tests unless explicitly needed
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
};

// Custom matchers for electricity calculations
expect.extend({
    toBeCloseToPercentage(received: number, expected: number, precision = 2) {
        const pass = Math.abs(received - expected) < Math.pow(10, -precision);
        return {
            message: () =>
                `expected ${received} to be close to ${expected} within ${precision} decimal places`,
            pass,
        };
    },

    toBeValidTimestamp(received: number) {
        const isValid = received > 0 && received < Date.now() / 1000 + 86400; // Not in future
        return {
            message: () => `expected ${received} to be a valid timestamp`,
            pass: isValid,
        };
    },

    toBeValidPrice(received: number) {
        const isValid = received >= 0 && received <= 1000; // Reasonable price range
        return {
            message: () => `expected ${received} to be a valid price`,
            pass: isValid,
        };
    },
});

// Type declarations for custom matchers
declare global {
    namespace jest {
        interface Matchers<R> {
            toBeCloseToPercentage(expected: number, precision?: number): R;
            toBeValidTimestamp(): R;
            toBeValidPrice(): R;
        }
    }
}

// Make this a module to fix TypeScript error
export { };
