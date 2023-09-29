'use client';

import { useTranslations } from 'next-intl';

export default function Prompt() {
	const t = useTranslations('prompt');

	return (
		<div data-testid="prompt" className="mx-12">
			<div className="mt-6 flex">
				<div className="font-semibold text-2xl w-10/12">
					{t('promptHeader')}
				</div>
				<div className="text-base bg-base-300 bg-opacity-25 flex justify-center items-center h-12 rounded-lg w-2/12">
					{t('promptGenerativeText')}
				</div>
			</div>
			<div className="font-medium text-lg">
				{t('promptSavedTemplates')}
			</div>
			<div className="mt-4 bg-base-300 bg-opacity-25 flex justify-center items-center h-12 rounded-lg p-2">
				<div className="w-4/12 ml-8 text-neutral-content ">
					{t('promptAlbumRecommendation')}
					<button className="bg-success text-base-200 px-2 rounded-full ml-2">
						{t('promptActiveStatus')}
					</button>
				</div>
				<div className="w-4/12 text-primary underline">
					{t('promptAlbumRecommendation')}
					<button className="bg-base-300 text-base-content px-2 rounded-full ml-2">
						{t('promptDraftStatus')}
					</button>
				</div>
				<div className="w-4/12 cursor-pointer">{t('promptNew')}</div>
			</div>
		</div>
	);
}
