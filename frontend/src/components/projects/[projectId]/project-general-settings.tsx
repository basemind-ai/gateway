import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';

import { handleUpdateProject } from '@/api';
import { EntityNameInput } from '@/components/entity-name-input';
import { useHandleError } from '@/hooks/use-handle-error';
import { useProjects, useUpdateProject } from '@/stores/api-store';
import { Project } from '@/types';
import { handleChange } from '@/utils/events';

export function ProjectGeneralSettings({ project }: { project: Project }) {
	const t = useTranslations('projectSettings');
	const updateProject = useUpdateProject();
	const handleError = useHandleError();
	const projects = useProjects();

	const [name, setName] = useState(project.name);
	const [description, setDescription] = useState(project.description ?? '');
	const [isLoading, setIsLoading] = useState(false);
	const [isValid, setIsValid] = useState(false);

	const isChanged =
		name !== project.name || description !== project.description;

	const validateName = useCallback(
		(value: string) =>
			!projects
				.filter(Boolean)
				.filter((p) => p.id !== project.id)
				.map((p) => p.name)
				.includes(value),
		[projects, project],
	);

	async function saveSettings() {
		try {
			setIsLoading(true);
			const updatedProject = await handleUpdateProject({
				data: {
					description: description.trim(),
					name: name.trim(),
				},
				projectId: project.id,
			});
			updateProject(project.id, updatedProject);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div data-testid="project-general-settings-container">
			<h2 className="card-header">{t('general')}</h2>
			<div className="rounded-data-card flex flex-col">
				<EntityNameInput
					dataTestId="project-name-input"
					isLoading={isLoading}
					setIsValid={setIsValid}
					setValue={setName}
					validateValue={validateName}
					value={name}
				/>
				<div className="form-control">
					<label htmlFor="project-desc" className="label">
						<span className="label-text">
							{t('projectDescription')}
						</span>
					</label>
					<textarea
						id="project-desc"
						data-testid="project-description-input"
						className="card-textarea"
						value={description}
						onChange={handleChange(setDescription)}
					/>
				</div>
				<div className="flex justify-end pt-6">
					<button
						data-testid="project-setting-save-btn"
						disabled={!isChanged || !isValid}
						className="card-action-button invalid:disabled btn-primary text-primary-content"
						onClick={() => void saveSettings()}
					>
						{isLoading ? (
							<span className="loading loading-spinner loading-sm mx-2" />
						) : (
							t('save')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
