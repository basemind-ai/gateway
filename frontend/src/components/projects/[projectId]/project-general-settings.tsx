import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleUpdateProject } from '@/api';
import { MIN_NAME_LENGTH } from '@/constants';
import { ApiError } from '@/errors';
import { useProject, useUpdateProject } from '@/stores/api-store';
import { useShowError } from '@/stores/toast-store';
import { handleChange } from '@/utils/events';

export function ProjectGeneralSettings({ projectId }: { projectId: string }) {
	const t = useTranslations('projectSettings');
	const project = useProject(projectId)!;
	const updateProject = useUpdateProject();

	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description ?? '');
	const [loading, setLoading] = useState(false);

	const showError = useShowError();

	const isChanged =
		name !== project.name || description !== project.description;

	const isValid =
		name.trim().length >= MIN_NAME_LENGTH &&
		description.trim().length >= MIN_NAME_LENGTH;

	async function saveSettings() {
		/* c8 ignore start */
		if (loading) {
			return null;
		}
		/* c8 ignore end */

		try {
			setLoading(true);
			const updatedProject = await handleUpdateProject({
				data: {
					description: description.trim(),
					name: name.trim(),
				},
				projectId,
			});
			updateProject(projectId, updatedProject);
		} catch (e) {
			showError((e as ApiError).message);
		} finally {
			setLoading(false);
		}
	}

	return (
		<div data-testid="project-general-settings-container">
			<h2 className="font-semibold text-white text-xl">{t('general')}</h2>
			<div className="custom-card flex flex-col">
				<div>
					<label
						htmlFor="project-name"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('projectName')}
					</label>
					<input
						type="text"
						id="project-name"
						data-testid="project-name-input"
						className="input mt-2.5 bg-neutral min-w-[70%]"
						value={name}
						onChange={handleChange(setName)}
					/>
				</div>
				<div className="mt-8">
					<label
						htmlFor="project-desc"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('projectDescription')}
					</label>
					<input
						type="text"
						id="project-desc"
						data-testid="project-description-input"
						className="input mt-2.5 bg-neutral w-full"
						value={description}
						onChange={handleChange(setDescription)}
					/>
				</div>

				<button
					data-testid="project-setting-save-btn"
					disabled={!isChanged || !isValid}
					className="btn btn-primary ml-auto mt-8 capitalize"
					onClick={() => void saveSettings()}
				>
					{loading ? (
						<span className="loading loading-spinner loading-sm mx-2" />
					) : (
						t('save')
					)}
				</button>
			</div>
		</div>
	);
}
