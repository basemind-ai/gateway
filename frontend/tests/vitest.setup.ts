import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import * as matchers from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
	// noinspection JSUnusedGlobalSymbols
	type Assertion<T = any> = TestingLibraryMatchers<T, void>;
}

expect.extend(matchers);
