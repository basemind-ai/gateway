import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateApplication, handleCreateProject } from '@/api';
import { TooltipIcon } from '@/components/input-label-with-tooltip';
import { Spinner } from '@/components/spinner';
import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useHandleError } from '@/hooks/use-handle-error';
import { useAddApplication, useAddProject } from '@/stores/api-store';
import { handleChange } from '@/utils/events';
import { setRouteParams } from '@/utils/navigation';

export function CreateProjectForm({
	HandleCancel,
	allowCancel,
}: {
	HandleCancel: () => void;
	allowCancel: boolean;
}) {
	const t = useTranslations('createProject');

	const addApplication = useAddApplication();
	const addProject = useAddProject();
	const handleError = useHandleError();
	const router = useRouter();

	const { track } = useAnalytics();

	const [isLoading, setIsLoading] = useState(false);
	const [applicationName, setApplicationName] = useState('');
	const [projectName, setProjectName] = useState('');

	const handleSubmit = async () => {
		setIsLoading(true);
		try {
			const project = await handleCreateProject({
				data: { name: projectName },
			});
			addProject(project);
			track('created_project', project);

			const application = await handleCreateApplication({
				data: { name: applicationName },
				projectId: project.id,
			});
			addApplication(project.id, application);
			track('created_application', application);

			router.replace(
				setRouteParams(Navigation.ConfigCreateWizard, {
					applicationId: application.id,
					projectId: project.id,
				}),
			);
		} catch (e) {
			handleError(e);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div data-testid="create-prject-form-container">
			<div className={'form-control w-full border-b px-10'}>
				<div className="pb-12">
					<label className="label text-left justify-start gap-1">
						<span className="label-text text-neutral-content">
							{t('projectInputLabel')}
						</span>
						<TooltipIcon
							tooltip={t('projectInputTooltip')}
							dataTestId="project-name-tooltip"
						/>
					</label>
					<input
						type="text"
						data-testid="create-project-name-input"
						placeholder={t('projectInputPlaceholder')}
						className="input w-full"
						value={projectName}
						onChange={handleChange(setProjectName)}
					/>
					<label
						htmlFor="createApiKey"
						className="label text-left justify-start gap-1 pt-4"
					>
						<span className="label-text text-neutral-content">
							{t('applicationNameInputLabel')}
						</span>
						<TooltipIcon
							tooltip={t('applicationNameTooltip')}
							dataTestId="application-name-tooltip"
						/>
					</label>

					<input
						data-testid="create-application-name-input"
						type="text"
						placeholder={t('applicationNameInputPlaceholder')}
						className="input w-full"
						value={applicationName}
						onChange={handleChange(setApplicationName)}
					/>
				</div>
			</div>
			<div className="flex items-center h-20 mx-10 justify-end">
				<div>
					{allowCancel && (
						<button
							className="btn-sm rounded-btn btn-neutral h-9 mr-6"
							onClick={HandleCancel}
							data-testid="create-project-cancel-button"
						>
							{t('cancelButton')}
						</button>
					)}
					<button
						className="btn btn-sm rounded-btn btn-primary h-9"
						disabled={isLoading}
						onClick={() => {
							void handleSubmit;
						}}
						data-testid="create-project-submit-button"
					>
						{isLoading ? <Spinner /> : t('submitButton')}
					</button>
				</div>
			</div>
			;
		</div>
	);
}
