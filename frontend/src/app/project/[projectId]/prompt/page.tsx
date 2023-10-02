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
		</div>
	);
}
