/* eslint-disable no-restricted-imports,import/export */
import {
	render,
	renderHook,
	RenderHookOptions,
	RenderHookResult,
	RenderOptions,
} from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context.shared-runtime';
import { NextIntlClientProvider } from 'next-intl';
import locales from 'public/messages/en.json';
import { SWRConfig } from 'swr';
import { nextRouterMock } from 'tests/mocks';

import { ToastWrapper } from '@/components/toast';

const customRender = (
	ui: React.ReactElement,
	options?: RenderOptions<any, any, any>,
) => {
	return render(ui, {
		wrapper: ({ children }: any) => {
			return (
				<RouterContext.Provider value={nextRouterMock}>
					<NextIntlClientProvider locale="en" messages={locales}>
						<SWRConfig value={{ provider: () => new Map() }}>
							<ToastWrapper>
								<SWRConfig
									value={{
										provider: () => new Map(),
										refreshInterval: 0,
									}}
								>
									{children}
								</SWRConfig>
							</ToastWrapper>
						</SWRConfig>
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

export function getLocaleNamespace(
	key: keyof typeof locales,
): Record<string, string> {
	return locales[key];
}

// the order of the exports here is important - the exports from the testing-library/react override those from dom
// and the exports of the custom render functions override the testing library ones.
export * from '@testing-library/dom';
export * from '@testing-library/react';
export { customRender as render, customRenderHook as renderHook };
