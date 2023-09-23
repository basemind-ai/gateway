import Image from 'next/image';
import useTranslation from 'next-translate/useTranslation';

export function Logo() {
	const { t } = useTranslation('common');

	return (
		<div className="align-baseline flex" data-testid="logo-component">
			<Image
				priority
				width="26"
				height="26"
				src="/images/pinecone-transparent-bg.svg"
				alt="Logo"
			/>
			<span className="text-2xl font-bold text-primary">
				{t('basemindName')}
			</span>
		</div>
	);
}
