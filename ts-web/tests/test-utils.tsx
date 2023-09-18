import {
	render,
	renderHook,
	RenderHookOptions,
	RenderHookResult,
	RenderOptions,
} from '@testing-library/react';
import { RouterContext } from 'next/dist/shared/lib/router-context';
import I18nProvider from 'next-translate/I18nProvider';
import enCommon from 'public/locales/en/common.json';
import enSignInBanner from 'public/locales/en/signin-banner.json';
import enSignIn from 'public/locales/en/signin-firebase.json';
import { nextRouterMock } from 'tests/mocks';

const namespaces = {
	common: enCommon,
	signIn: enSignIn,
	signInBanner: enSignInBanner,
};

const customRender = (
	ui: React.ReactElement,
	options?: RenderOptions<any, any, any>,
) => {
	return render(ui, {
		wrapper: ({ children }: any) => {
			return (
				<RouterContext.Provider value={nextRouterMock}>
					<I18nProvider lang="en" namespaces={namespaces}>
						{children}
					</I18nProvider>
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
					<I18nProvider lang="en" namespaces={namespaces}>
						{children}
					</I18nProvider>
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
