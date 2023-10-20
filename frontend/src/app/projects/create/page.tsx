'use client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import { handleCreateProject } from '@/api';
import { Logo } from '@/components/logo';
import { Navigation } from '@/constants';
import { useAddProject, useProjects } from '@/stores/project-store';
import { handleChange } from '@/utils/helpers';

function PageHeader({ title, subTitle }: { title: string; subTitle: string }) {
	return (
		<div className="pt-10 pb-6" data-testid="create-project-view-header">
			<h1
				className="text-center font-extrabold text-xl mb-2 h-6"
				data-testid="create-project-view-title"
			>
				{title}
			</h1>
			<span
				className="text-center block h-6"
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
	isError: boolean;
	isLoading: boolean;
	allowSubmit: boolean;
	showCancel: boolean;
	HandleCancel: () => void;
	handleSubmit: () => void;
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
						aria-description={t('cancelButtonHelperText')}
						className="btn-sm rounded-btn btn-neutral h-9 mr-6"
						onClick={HandleCancel}
						data-testid="create-project-cancel-button"
					>
						{t('cancelButton')}
					</button>
				)}
				<button
					aria-description={t('submitButtonHelperText')}
					className="btn-sm rounded-btn btn-primary h-9"
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
	description,
	isError,
	name,
	setDescription,
	setName,
}: {
	description: string;
	isError: boolean;
	name: string;
	setDescription: (description: string) => void;
	setName: (name: string) => void;
}) {
	const t = useTranslations('createProject');

	return (
		<div
			className={`form-control w-full border-b px-10 ${
				isError ? 'border-error' : 'border-b-neutral'
			}`}
		>
			<label className="label text-left font-bold">
				<span className="label-text">{t('projectInputLabel')}</span>
			</label>
			<input
				type="text"
				data-testid="create-project-name-input"
				placeholder={t('projectInputPlaceholder')}
				className="input input-bordered w-[60%]"
				aria-description={t('projectInputHelperText')}
				value={name}
				onChange={handleChange(setName)}
			/>
			<div className=" pt-2 pb-10">
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
					placeholder={t('projectDescriptionInputPlaceholder')}
					className="input input-bordered w-full"
					aria-description={t('projectDescriptionInputHelperText')}
					value={description}
					onChange={handleChange(setDescription)}
				/>
			</div>
		</div>
	);
}

export default function CreateProjectPage() {
	const t = useTranslations('createProject');
	const router = useRouter();

	const addProject = useAddProject();
	const projects = useProjects();

	const [name, setName] = useState('');
	const [description, setDescription] = useState('');
	const [isLoading, setIsLoading] = useState(false);
	const [isError, setIsError] = useState<boolean>(false);

	const handleSubmit = async () => {
		setIsLoading(true);
		setIsError(false);
		try {
			const project = await handleCreateProject({
				data: { name, description },
			});
			addProject(project);
			router.replace(`${Navigation.Projects}/${project.id}`);
		} catch {
			setIsError(true);
		} finally {
			setIsLoading(false);
		}
	};

	const HandleCancel = () => {
		router.replace(`${Navigation.Projects}/${projects[0].id}`);
	};

	return (
		<div
			className="bg-base-100 flex h-full w-full"
			data-testid="create-projects-container"
		>
			<div className="flex flex-col pt-6 px-8 h-full w-2/12 bg-base-200 justify-between opacity-40">
				<Logo />
			</div>
			<div className="w-full">
				<div
					className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 12/12  md:w-6/12 lg:w-5/12 2xl:w-4/12 bg-base-300 flex-col"
					data-testid="create-project-view-flex-container"
				>
					<PageHeader title={t('title')} subTitle={t('subTitle')} />
					<Form
						description={description}
						isError={isError}
						name={name}
						setDescription={setDescription}
						setName={setName}
					/>
					<FormActions
						isError={isError}
						isLoading={isLoading}
						allowSubmit={!!name}
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
