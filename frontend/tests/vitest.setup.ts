// eslint-disable-next-line no-restricted-imports
import '@testing-library/react';
import 'vitest-canvas-mock';

import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import * as matchers from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
	// noinspection JSUnusedGlobalSymbols
	type Assertion<T = any> = TestingLibraryMatchers<T, void>;
}

expect.extend(matchers);

beforeAll(() => {
	// we need to set this to false because we get bombarded by warning about using act.
	// see: https://github.com/testing-library/react-testing-library/issues/1108
	// @ts-expect-error
	global.IS_REACT_ACT_ENVIRONMENT = false;
});
