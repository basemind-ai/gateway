import { MetadataRoute } from 'next';

import { Navigation } from '@/constants';

const BASE_URL = 'https://basemind.ai';
const SitemapArray = [
	Navigation.Base,
	Navigation.SignIn,
	Navigation.PrivacyPolicy,
	Navigation.TOS,
	Navigation.Support,
	Navigation.CreateProject,
	Navigation.Settings,
	Navigation.Projects,
];
export default function SiteMap(): MetadataRoute.Sitemap {
	return SitemapArray.map((path, index) => {
		return {
			changeFrequency: 'weekly',
			lastModified: new Date(),
			priority: 1 - index,
			url: BASE_URL + path,
		};
	});
}
