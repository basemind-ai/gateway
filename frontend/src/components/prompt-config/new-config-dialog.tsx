import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Dropdown, DropdownOption } from '@/components/dropdown';
import { Navigation } from '@/constants';
import { Application } from '@/types';
import { handleChange } from '@/utils/helpers';
import { populateLink } from '@/utils/navigation';

export default function NewConfigDialog({
	applications,
	projectId,
	handleClose,
}: {
	applications: Application[];
	handleClose: () => void;
	projectId: string;
}) {
	const t = useTranslations('promptTesting');
	const router = useRouter();
	const [selectedApp, setSelectedApp] = useState('');
	const [name, setName] = useState('');

	const appDropdownOption: DropdownOption[] = applications.map((app) => {
		return { text: app.name, value: app.id };
	});

	function handleCreate() {
		const link = populateLink(
			Navigation.TestingConfig,
			projectId,
			selectedApp,
			'new',
			name,
		);
		router.push(link);
	}

	return (
		<div
			className="modal-box p-0 border border-neutral max-w-[43rem]"
			data-testid="test-create-config-dialog"
		>
			<div className="bg-base-300">
				<div className="p-10 flex flex-col items-center border-b border-neutral">
					<h1
						data-testid="create-dialog-title"
						className="text-base-content font-bold text-xl"
					>
						{t('createConfig')}
					</h1>
					<p
						data-testid="create-dialog-description"
						className="text-base-content/80 mt-2.5 font-medium"
					>
						{t('createConfigDescription')}
					</p>
					<div className="mt-8 self-start">
						<div className=" mb-4">
							<label className="label">
								<span className="label-text">{t('name')}</span>
							</label>
							<input
								data-testid="create-dialog-name-input"
								type="text"
								placeholder={t('namePlaceholder')}
								className="input input-bordered bg-neutral w-full max-w-sm"
								value={name}
								onChange={handleChange(setName)}
							/>
						</div>
						<Dropdown
							headline={t('saveInApplication')}
							selected={selectedApp}
							setSelected={setSelectedApp}
							options={appDropdownOption}
						/>
					</div>
				</div>
				<div className="flex grow gap-4 items-center justify-end py-8 px-5">
					<button
						data-testid="create-dialog-cancel-btn"
						onClick={handleClose}
						className="btn btn-neutral"
					>
						{t('cancel')}
					</button>
					<button
						data-testid="create-dialog-create-btn"
						onClick={handleCreate}
						disabled={!selectedApp || !name}
						className="btn btn-primary"
					>
						{t('create')}
					</button>
				</div>
			</div>
		</div>
	);
}
