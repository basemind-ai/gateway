import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateApplication, handleCreateProject } from '@/api';
import { useAddProject } from '@/stores/api-store';
import { handleChange } from '@/utils/helpers';

export async function handleCreateProjectAndApplication({
	projectName,
	applicationName,
}: {
	projectName: string;
	applicationName: string;
}) {
	// TODO: the logic below is based on the UI - which couples the creation of an application
	// with the creation of a project. For now we are keeping this as is - but we must revisit
	// this decision.
	const project = await handleCreateProject({ data: { name: projectName } });
	const application = await handleCreateApplication({
		projectId: project.id,
		data: { name: applicationName },
	});
	project.applications = [application];

	return project;
}

export function CreateProjectView({
	cancelHandler,
}: {
	cancelHandler: () => void;
}) {
	const t = useTranslations('createProject');
	const [projectName, setProjectName] = useState('');
	const [applicationName, setApplicationName] = useState('');

	const addProject = useAddProject();

	const handleSubmit = async () => {
		const project = await handleCreateProjectAndApplication({
			projectName,
			applicationName,
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
							className="input input-bordered w-[85%]"
							aria-description={t('projectInputHelperText')}
							value={projectName}
							onChange={handleChange(setProjectName)}
						/>
					</div>
					<div className="pl-10 pt-2 pb-10">
						<label className="label text-left font-bold">
							<span className="label-text">
								{t('applicationInputLabel')}
							</span>
						</label>
						<input
							type="text"
							placeholder={t('applicationInputPlaceholder')}
							className="input input-bordered w-[85%]"
							aria-description={t('applicationInputHelperText')}
							value={applicationName}
							onChange={handleChange(setApplicationName)}
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
						disabled={
							projectName.length === 0 ||
							applicationName.length === 0
						}
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
