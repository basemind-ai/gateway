import { useTranslations } from 'next-intl';

export function Logo({ textSize = 'text-2xl' }: { textSize?: string }) {
	const t = useTranslations('common');

	return (
		<div
			className="pl-3 flex justify-start items-center"
			data-testid="logo-component"
		>
			<span
				className={`font-bold text-primary  ${textSize}`}
				data-testid="logo-text"
			>
				{t('basemindName')}
			</span>
		</div>
	);
}
