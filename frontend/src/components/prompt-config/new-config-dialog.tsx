import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { Dropdown } from '@/components/dropdown';
import { Navigation } from '@/constants';
import { Application } from '@/types';
import { handleChange } from '@/utils/helpers';
import { setPathParams } from '@/utils/navigation';

export function NewConfigDialog({
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
	const [selectedApplicationId, setSelectedApplicationId] = useState<
		undefined | string
	>(undefined);
	const [name, setName] = useState('');

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
							labelText={t('application')}
							placeholderText={t('saveInApplication')}
							value={selectedApplicationId}
							setSelected={setSelectedApplicationId}
							options={applications.map(
								({ name: text, id: value }) => ({
									text,
									value,
								}),
							)}
							testId="create-dialog-app-dropdown"
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
						onClick={() => {
							router.replace(
								setPathParams(Navigation.TestingConfig, {
									applicationId: selectedApplicationId,
									projectId,
								}),
							);
						}}
						disabled={!selectedApplicationId || !name}
						className="btn btn-primary"
					>
						{t('create')}
					</button>
				</div>
			</div>
		</div>
	);
}
