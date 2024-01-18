import { useTranslations } from 'next-intl';

export function MobileNotSupported() {
	const t = useTranslations('common');
	return (
		<>
			<div className="text-2xl font-bold text-center">
				{t('mobileNotSupported')}
			</div>
			<div className="text-center mt-4">
				{t('mobileNotSupportedDescription')}
			</div>
		</>
	);
}
