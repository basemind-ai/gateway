import { DocsThemeConfig } from 'nextra-theme-docs';

import { Logo } from '@/components/logo';

const config: DocsThemeConfig = {
	chat: {
		link: 'https://discord.gg/BzH7TQVVYy',
	},
	footer: {
		text: 'Nextra Docs Template',
	},
	logo: <Logo />,
};

export default config;
