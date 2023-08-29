import Head from 'next/head';
import { useEffect, useState } from 'react';

import { ThemeContext } from '@/context';
import { ThemeColors } from '@/types';

export const DEFAULT_THEME = 'dracula';

export function extractThemeColorsFromDOM(): ThemeColors {
	const computedStyles = getComputedStyle(document.querySelector(':root')!);
	return {
		primary: `hsl(${computedStyles.getPropertyValue('--p')}`,
		primaryFocus: `hsl(${computedStyles.getPropertyValue('--pf')}`,
		primaryContent: `hsl(${computedStyles.getPropertyValue('--pc')}`,
		secondary: `hsl(${computedStyles.getPropertyValue('--s')}`,
		secondaryFocus: `hsl(${computedStyles.getPropertyValue('--sf')}`,
		secondaryContent: `hsl(${computedStyles.getPropertyValue('--sc')}`,
		accent: `hsl(${computedStyles.getPropertyValue('--a')}`,
		accentFocus: `hsl(${computedStyles.getPropertyValue('--af')}`,
		accentContent: `hsl(${computedStyles.getPropertyValue('--ac')}`,
		neutral: `hsl(${computedStyles.getPropertyValue('--n')}`,
		neutralFocus: `hsl(${computedStyles.getPropertyValue('--nf')}`,
		neutralContent: `hsl(${computedStyles.getPropertyValue('--nc')}`,
		base100: `hsl(${computedStyles.getPropertyValue('--b1')}`,
		base200: `hsl(${computedStyles.getPropertyValue('--b2')}`,
		base300: `hsl(${computedStyles.getPropertyValue('--b3')}`,
		baseContent: `hsl(${computedStyles.getPropertyValue('--bc')}`,
		info: `hsl(${computedStyles.getPropertyValue('--in')}`,
		infoContent: `hsl(${computedStyles.getPropertyValue('--inc')}`,
		success: `hsl(${computedStyles.getPropertyValue('--su')}`,
		successContent: `hsl(${computedStyles.getPropertyValue('--suc')}`,
		warning: `hsl(${computedStyles.getPropertyValue('--wa')}`,
		warningContent: `hsl(${computedStyles.getPropertyValue('--wac')}`,
		error: `hsl(${computedStyles.getPropertyValue('--er')}`,
		errorContent: `hsl(${computedStyles.getPropertyValue('--erc')}`,
	};
}

export function AppWrapper({
	children,
}: {
	children: string | React.ReactElement | React.ReactElement[];
}) {
	const [theme, setTheme] = useState(DEFAULT_THEME);
	const [themeColors, setThemeColors] = useState<ThemeColors | undefined>();

	const handleThemeChange = (themeName: string) => {
		document.querySelector('html')?.setAttribute('data-theme', theme);

		setTheme(themeName);
	};

	useEffect(() => {
		setThemeColors(extractThemeColorsFromDOM);
	}, [theme]);

	return (
		<>
			<Head>
				<title>DevLingo</title>
				<link rel="shortcut icon" href="/favicon.ico" />
				<meta name="description" content="Devlingo" key="desc" />
			</Head>
			<ThemeContext.Provider
				value={{
					themeColors,
					currentTheme: theme,
					setTheme: handleThemeChange,
				}}
			>
				{children}
			</ThemeContext.Provider>
		</>
	);
}
