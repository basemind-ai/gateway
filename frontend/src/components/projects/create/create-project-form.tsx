import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';

import { handleCreateApplication, handleCreateProject } from '@/api';
import { TooltipIcon } from '@/components/input-label-with-tooltip';
import { MIN_NAME_LENGTH, Navigation } from '@/constants';
import { TrackEvents } from '@/constants/analytics';
import { useAnalytics } from '@/hooks/use-analytics';
import { useHandleError } from '@/hooks/use-handle-error';
import { useAddApplication, useAddProject } from '@/stores/api-store';
import { handleChange } from '@/utils/events';
import { setRouteParams } from '@/utils/navigation';

export function CreateProjectForm({
	handleCancel,
	allowCancel,
	validateProjectName,
	validateApplicationName,
	setLoading,
	isLoading,
}: {
	allowCancel: boolean;
	handleCancel: () => void;
	isLoading: boolean;
	setLoading: (value: boolean) => void;
	validateApplicationName: (value: string) => boolean;
	validateProjectName: (value: string) => boolean;
}) {
	const t = useTranslations('createProject');

	const addApplication = useAddApplication();
	const addProject = useAddProject();
	const handleError = useHandleError();
	const router = useRouter();

	const { track, group } = useAnalytics();

	const [applicationName, setApplicationName] = useState('');
	const [projectName, setProjectName] = useState('');

	const handleSubmit = async () => {
		setLoading(true);
		try {
			const project = await handleCreateProject({
				data: { name: projectName },
			});
			group(project.id, {
				accountId: project.id,
				accountName: project.name,
				accountType: 'project',
			});
			track(
				TrackEvents.AccountCreated,
				{
					accountId: project.id,
					accountName: project.name,
				},
				{ accountId: project.id },
			);
			addProject(project);
			const application = await handleCreateApplication({
				data: { name: applicationName },
				projectId: project.id,
			});
			track(
				TrackEvents.ApplicationCreated,
				{
					accountId: project.id,
					applicationId: application.id,
					applicationName: application.name,
					isFirst: true,
				},
				{ accountId: project.id },
			);
			addApplication(project.id, application);
			router.replace(
				setRouteParams(Navigation.ConfigCreateWizard, {
					applicationId: application.id,
					projectId: project.id,
				}),
			);
		} catch (e) {
			setLoading(false);
			handleError(e);
		}
	};

	const projectNameIsValid = useMemo(
		() =>
			projectName.length >= MIN_NAME_LENGTH &&
			validateProjectName(projectName),
		[projectName, validateProjectName],
	);

	const applicationNameIsValid = useMemo(
		() =>
			applicationName.length >= MIN_NAME_LENGTH &&
			validateApplicationName(applicationName),
		[applicationName, validateApplicationName],
	);

	const showProjectValidationError = projectName && !projectNameIsValid;

	const showApplicationValidationError =
		applicationName && !applicationNameIsValid;

	const createValidationError = (value: string, nameIsValid: boolean) =>
		value.length >= MIN_NAME_LENGTH ? (
			nameIsValid ? (
				<br className="pt-2" data-testid="name-message-placeholder" />
			) : (
				<p
					className="text-sm text-error text-center pt-2"
					data-testid="invalid-name-message"
				>
					{t('invalidNameErrorMessage')}
				</p>
			)
		) : (
			<p
				className="text-sm text-error text-center pt-2"
				data-testid="invalid-length-message"
			>
				{t('invalidLengthErrorMessage', {
					numCharacters: MIN_NAME_LENGTH,
				})}
			</p>
		);

	return (
		<div data-testid="create-prject-form-container">
			<div className="w-full border-b border-neutral px-10 pb-12">
				<div className="form-control">
					<label className="label">
						<span className="flex gap-2">
							<span className="label-text text-neutral-content">
								{t('projectInputLabel')}
							</span>
							<TooltipIcon
								tooltip={t('projectInputTooltip')}
								dataTestId="project-name-tooltip"
							/>
						</span>
						{!projectNameIsValid && (
							<span
								className="label-text-alt"
								data-testid="label-help-text"
							>
								{t('nameInputAltLabel')}
							</span>
						)}
					</label>
					<input
						type="text"
						data-testid="create-project-name-input"
						className={
							showProjectValidationError
								? 'card-input border-red-500 min-w-full'
								: 'card-input min-w-full'
						}
						value={projectName}
						disabled={isLoading}
						placeholder={t('projectInputPlaceholder')}
						onChange={handleChange((v: string) => {
							setProjectName(v.trim());
						})}
					/>
					{showProjectValidationError &&
						createValidationError(
							projectName,
							validateProjectName(projectName),
						)}
				</div>
				<div className="card-section-divider" />
				<div className="form-control w-full">
					<label className="label">
						<span className="flex justify-start gap-2 text-base-content">
							<span className="label-text text-neutral-content">
								{t('applicationNameInputLabel')}
							</span>
							<TooltipIcon
								tooltip={t('applicationNameTooltip')}
								dataTestId="application-name-tooltip"
							/>
						</span>
						{!applicationNameIsValid && (
							<span
								className="label-text-alt"
								data-testid="label-help-text"
							>
								{t('nameInputAltLabel')}
							</span>
						)}
					</label>
					<input
						type="text"
						data-testid="create-application-name-input"
						className={
							showApplicationValidationError
								? 'card-input border-red-500 min-w-full'
								: 'card-input min-w-full'
						}
						value={applicationName}
						disabled={isLoading}
						placeholder={t('applicationNameInputPlaceholder')}
						onChange={handleChange((v: string) => {
							setApplicationName(v.trim());
						})}
					/>
					{showApplicationValidationError &&
						createValidationError(
							applicationName,
							validateApplicationName(applicationName),
						)}
				</div>
			</div>
			<div className="flex items-center p-10 justify-end">
				<div>
					{allowCancel && (
						<button
							className="btn rounded-btn btn-neutral h-9 mr-6"
							onClick={handleCancel}
							disabled={isLoading}
							data-testid="create-project-cancel-button"
						>
							{t('cancelButton')}
						</button>
					)}
					<button
						className="btn rounded-btn btn-primary h-9"
						disabled={
							isLoading ||
							!projectNameIsValid ||
							!applicationNameIsValid
						}
						onClick={() => {
							void handleSubmit();
						}}
						data-testid="create-project-submit-button"
					>
						{isLoading ? (
							<svg
								className="animate-spin h-5 w-5 m-auto"
								viewBox="0 0 24 24"
							/>
						) : (
							t('submitButton')
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
