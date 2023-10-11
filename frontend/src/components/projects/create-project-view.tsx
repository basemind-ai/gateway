import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateProject } from '@/api';
import { useAddProject } from '@/stores/api-store';
import { handleChange } from '@/utils/helpers';

export function CreateProjectView({
	cancelHandler,
}: {
	cancelHandler: () => void;
}) {
	const t = useTranslations('createProject');
	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const addProject = useAddProject();

	const handleSubmit = async () => {
		const project = await handleCreateProject({
			data: { name, description },
		});
		addProject(project);
	};

	return (
		<div
			className="flex justify-center h-full items-center"
			data-testid="create-project-view-outer-container"
		>
			<div
				className="min-w-[33%] w-[50%] bg-base-300 flex-col"
				data-testid="create-project-view-flex-container"
			>
				<div
					className="p-10 pb-10"
					data-testid="create-project-view-header"
				>
					<h1
						className="text-center font-extrabold text-xl mb-2 h-6"
						data-testid="create-project-view-title"
					>
						{t('title')}
					</h1>
					<span
						className="text-center block h-6"
						data-testid="create-project-view-sub-title"
					>
						{t('Subtitle')}
					</span>
				</div>
				<div className="form-control w-full border-b-gray-600 border-b-2">
					<div className="pl-10 pt-2 pb-2">
						<label className="label text-left font-bold">
							<span className="label-text">
								{t('projectInputLabel')}
							</span>
						</label>
						<input
							type="text"
							placeholder={t('projectInputPlaceholder')}
							className="input input-bordered w-[60%]"
							aria-description={t('projectInputHelperText')}
							value={name}
							onChange={handleChange(setName)}
						/>
					</div>
					<div className="pl-10 pr-10 pt-2 pb-10">
						<label className="label text-left font-bold">
							<span className="label-text">
								{t('projectDescriptionInputLabel')}
							</span>
							<span className="label-text-alt text-xs text-base-content/30">
								{t('optional')}
							</span>
						</label>
						<input
							type="text"
							placeholder={t(
								'projectDescriptionInputPlaceholder',
							)}
							className="input input-bordered w-full"
							aria-description={t(
								'projectDescriptionInputHelperText',
							)}
							value={description}
							onChange={handleChange(setDescription)}
						/>
					</div>
				</div>
				<div className="flex justify-end items-center h-20">
					<button
						aria-description={t('cancelButtonHelperText')}
						className="btn-sm rounded-btn btn-neutral h-9 mr-6"
						onClick={cancelHandler}
					>
						{t('cancelButton')}
					</button>
					<button
						aria-description={t('submitButtonHelperText')}
						className="btn-sm rounded-btn btn-primary h-9 mr-5"
						disabled={name.length === 0}
						onClick={() => {
							void handleSubmit();
						}}
					>
						{t('submitButton')}
					</button>
				</div>
			</div>
		</div>
	);
}
