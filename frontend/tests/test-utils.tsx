import {
	render,
	renderHook,
	RenderHookOptions,
	RenderHookResult,
	RenderOptions,
} from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { NextIntlClientProvider } from 'next-intl';
import locales from 'public/locales/en.json';
import { nextRouterMock } from 'tests/mocks';

const customRender = (
	ui: React.ReactElement,
	options?: RenderOptions<any, any, any>,
) => {
	return render(ui, {
		wrapper: ({ children }: any) => {
			return (
				<RouterContext.Provider value={nextRouterMock}>
					<NextIntlClientProvider locale="en" messages={locales}>
						{children}
					</NextIntlClientProvider>
				</RouterContext.Provider>
			);
		},
		...options,
	});
};

const customRenderHook = (
	initialProps: any,
	options?: RenderHookOptions<any, any, any, any>,
): RenderHookResult<any, any> => {
	return renderHook(initialProps, {
		wrapper: ({ children }: any) => {
			return (
				<RouterContext.Provider value={nextRouterMock}>
					<NextIntlClientProvider locale="en" messages={locales}>
						{children}
					</NextIntlClientProvider>
				</RouterContext.Provider>
			);
		},
		...options,
	});
};

export * from '@testing-library/dom';

export { customRender as render, customRenderHook as renderHook };

export { act } from '@testing-library/react';
export { routerReplaceMock } from 'tests/mocks';
