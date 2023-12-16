'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { handleCreateApplication, handleCreateProject } from '@/api';
import { TooltipIcon } from '@/components/input-label-with-tooltip';
import { Logo } from '@/components/logo';
import { Navigation } from '@/constants';
import { useAnalytics } from '@/hooks/use-analytics';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import {
	useAddApplication,
	useAddProject,
	useProjects,
} from '@/stores/api-store';
import { handleChange } from '@/utils/events';
import { setRouteParams } from '@/utils/navigation';

function PageHeader({ title, subTitle }: { subTitle: string; title: string }) {
	return (
		<div className="pt-10 pb-6" data-testid="create-project-view-header">
			<h1
				className="text-center font-extrabold text-xl mb-2"
				data-testid="create-project-view-title"
			>
				{title}
			</h1>
			<span
				className="text-center block text-sm text-neutral-content px-10"
				data-testid="create-project-view-sub-title"
			>
				{subTitle}
			</span>
		</div>
	);
}

function Spinner() {
	return (
		<div
			className="text-center"
			data-testid="create-project-loading-spinner"
		>
			<svg
				aria-hidden="true"
				role="status"
				className=" mx-auto w-4 h-4 text-primary-content animate-spin"
				viewBox="0 0 100 101"
				fill="currentColor"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
					fill="currentColor"
				/>
				<path
					d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
					fill="#fafafa"
				/>
			</svg>
		</div>
	);
}

function FormActions({
	isError,
	isLoading,
	allowSubmit,
	HandleCancel,
	showCancel,
	handleSubmit,
}: {
	HandleCancel: () => void;
	allowSubmit: boolean;
	handleSubmit: () => void;
	isError: boolean;
	isLoading: boolean;
	showCancel: boolean;
}) {
	const t = useTranslations('createProject');

	return (
		<div
			className={`flex items-center h-20 mx-10 ${
				isError ? 'justify-between' : 'justify-end'
			}`}
		>
			{isError && (
				<span
					data-testid="create-project-error-comment"
					className="text-error text-label"
				>
					{t('errorComment')}
				</span>
			)}
			<div>
				{showCancel && (
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
					disabled={!allowSubmit}
					onClick={handleSubmit}
					data-testid="create-project-submit-button"
				>
					{isLoading ? <Spinner /> : t('submitButton')}
				</button>
			</div>
		</div>
	);
}

function Form({
	applicationName,
	isError,
	projectName,
	setProjectName,
	setApplicationName,
}: {
	applicationName: string;
	isError: boolean;
	projectName: string;
	setApplicationName: (description: string) => void;
	setProjectName: (name: string) => void;
}) {
	const t = useTranslations('createProject');

	return (
		<div
			className={`form-control w-full border-b px-10 ${
				isError ? 'border-error' : 'border-b-neutral'
			}`}
		>
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
	);
}

export default function CreateProjectPage() {
	useAuthenticatedUser();
	const { initialized, page, track } = useAnalytics();
	const t = useTranslations('createProject');
	const router = useRouter();

	const addProject = useAddProject();
	const addApplication = useAddApplication();
	const projects = useProjects();

	const [projectName, setProjectName] = useState('');
	const [applicationName, setApplicationName] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState<boolean>(false);

	const handleSubmit = async () => {
		setIsLoading(true);
		setIsError(false);
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
		} catch {
			setIsError(true);
		} finally {
			setIsLoading(false);
		}
	};

	const HandleCancel = () => {
		router.replace(`${Navigation.Projects}/${projects[0].id}`);
	};

	useEffect(() => {
		if (initialized) {
			page('create_project');
		}
	}, [initialized]);

	return (
		<div
			className="flex flex-col min-h-screen w-full bg-base-100"
			data-testid="create-projects-container"
		>
			<div className="page-content-container">
				<div
					data-testid="navbar-header"
					className="navbar flex-grow gap-4 content-baseline"
				>
					<Logo />
				</div>
				<div
					className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 12/12  md:w-6/12 lg:w-5/12 2xl:w-4/12 bg-base-300 flex-col"
					data-testid="create-project-view-flex-container"
				>
					<PageHeader title={t('title')} subTitle={t('subTitle')} />
					<Form
						applicationName={applicationName}
						isError={isError}
						projectName={projectName}
						setApplicationName={setApplicationName}
						setProjectName={setProjectName}
					/>
					<FormActions
						isError={isError}
						isLoading={isLoading}
						allowSubmit={!!projectName && !!applicationName}
						showCancel={!!projects.length}
						HandleCancel={HandleCancel}
						handleSubmit={() => {
							void handleSubmit();
						}}
					/>
				</div>
			</div>
		</div>
	);
}
