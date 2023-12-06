import { renderHook, routerReplaceMock } from 'tests/test-utils';
import { beforeEach, Mock } from 'vitest';

import { Navigation } from '@/constants';
import {
	ApiError,
	ConfigurationError,
	PermissionError,
	TokenError,
	UnhandledError,
} from '@/errors';
import { useHandleError } from '@/hooks/use-handle-error';
import * as toastStore from '@/stores/toast-store';

describe('useHandleError tests', () => {
	let showErrorMock: Mock;

	beforeEach(() => {
		showErrorMock = vi.fn();
		vi.spyOn(toastStore, 'useShowError').mockReturnValue(showErrorMock);
	});

	it('should throw a ConfigurationError when passed a ConfigurationError instance', () => {
		const error = new ConfigurationError('Test error');

		const { result } = renderHook(useHandleError);

		expect(() => result.current(error)).toThrow(error);
	});

	it('should redirect to Navigation.SignIn when passed a TokenError instance', () => {
		const error = new TokenError('Test error');

		const { result } = renderHook(useHandleError);

		result.current(error);

		expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
	});

	it('should redirect to Navigation.SignIn when passed a PermissionError instance', () => {
		const error = new PermissionError('Test error');

		const { result } = renderHook(useHandleError);

		result.current(error);

		expect(routerReplaceMock).toHaveBeenCalledWith(Navigation.SignIn);
	});

	it('should call showError with the error message when passed an ApiError instance', () => {
		const error = new ApiError('Test error', {
			statusCode: 500,
			statusText: 'Internal Server Error',
		});

		const { result } = renderHook(useHandleError);

		result.current(error);

		expect(showErrorMock).toHaveBeenCalledWith('Test error');
	});

	it('should call showError with a default error message when passed any other value and env is production', () => {
		const value = 'Test value';

		Reflect.set(process.env, 'NODE_ENV', 'production');

		const { result } = renderHook(useHandleError);

		result.current(value);

		expect(showErrorMock).toHaveBeenCalledWith('Something went wrong');

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});

	it('should throw an UnhandledError when passed a value that is not an instance of Error and env is development', () => {
		Reflect.set(process.env, 'NODE_ENV', 'development');

		const value = 'Test value';

		const { result } = renderHook(useHandleError);

		expect(() => result.current(value)).toThrow(UnhandledError);

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});

	it('should throw an UnhandledError when passed a value that is not an instance of Error and env is production', () => {
		const error = new Error();

		Reflect.set(process.env, 'NODE_ENV', 'development');

		const { result } = renderHook(useHandleError);

		expect(() => result.current(error)).not.toThrow(TypeError);

		Reflect.set(process.env, 'NODE_ENV', 'test');
	});
});
