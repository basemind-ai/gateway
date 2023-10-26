'use client';

import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import {
	Activity,
	Cash,
	Eraser,
	Front,
	Gear,
	KeyFill,
	PencilFill,
	Plus,
	Search,
	Speedometer2,
} from 'react-bootstrap-icons';
import { DateValueType } from 'react-tailwindcss-datepicker';

import {
	handleApplicationAnalytics,
	handleCreateToken,
	handleDeleteApplication,
	handleDeleteToken,
	handleRetrievePromptConfigs,
	handleRetrieveTokens,
	handleSetDefaultPromptConfig,
	handleUpdateApplication,
} from '@/api';
import { DataCard } from '@/components/dashboard/data-card';
import { DatePicker } from '@/components/dashboard/date-picker';
import { ResourceDeletionBanner } from '@/components/resource-deletion-banner';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { MIN_NAME_LENGTH, Navigation } from '@/constants';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import {
	useApplication,
	useDeleteApplication,
	usePromptConfig,
	useSetPromptConfig,
	useSetTokens,
	useTokens,
	useUpdateApplication,
} from '@/stores/project-store';
import { useDateFormat } from '@/stores/user-config-store';
import { ApplicationAnalytics, Token } from '@/types';
import { copyToClipboard, handleChange } from '@/utils/helpers';

enum TAB_NAMES {
	OVERVIEW,
	SETTINGS,
	TOKENS,
}

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { projectId: string; applicationId: string };
}) {
	useAuthenticatedUser();
	useProjectBootstrap(false);
	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);

	const tabs: TabData<TAB_NAMES>[] = [
		{
			id: TAB_NAMES.OVERVIEW,
			text: t('overview'),
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.SETTINGS,
			text: t('settings'),
			icon: <Gear className="w-3.5 h-3.5" />,
		},
		{
			id: TAB_NAMES.TOKENS,
			text: t('tokens'),
			icon: <KeyFill className="w-3.5 h-3.5" />,
		},
	];
	const [selectedTab, setSelectedTab] = useState(TAB_NAMES.OVERVIEW);

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-page" className="my-8 mx-32">
			<h1
				data-testid="application-page-title"
				className="text-2xl font-semibold text-base-content"
			>
				{t('application')} / {application.name}
			</h1>
			<div className="mt-3.5 w-full mb-9">
				<TabNavigation<TAB_NAMES>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			{selectedTab === TAB_NAMES.OVERVIEW && (
				<>
					<ApplicationAnalytics
						applicationId={applicationId}
						projectId={projectId}
					/>
					<ApplicationPromptConfigs
						applicationId={applicationId}
						projectId={projectId}
					/>
				</>
			)}
			{selectedTab === TAB_NAMES.SETTINGS && (
				<>
					<ApplicationGeneralSettings
						applicationId={applicationId}
						projectId={projectId}
					/>
					<ApplicationDeletion
						applicationId={applicationId}
						projectId={projectId}
					/>
				</>
			)}
			{selectedTab === TAB_NAMES.TOKENS && (
				<ApiKeys applicationId={applicationId} projectId={projectId} />
			)}
		</div>
	);
}

export function ApplicationAnalytics({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const dateFormat = useDateFormat();

	const oneWeekAgo = new Date();
	oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

	const [dateRange, setDateRange] = useState<DateValueType>({
		startDate: oneWeekAgo,
		endDate: new Date(),
	});

	const [analytics, setAnalytics] = useState<ApplicationAnalytics | null>(
		null,
	);

	useEffect(() => {
		(async () => {
			const applicationAnalytics = await handleApplicationAnalytics({
				applicationId,
				projectId,
				fromDate: dateRange?.startDate,
				toDate: dateRange?.endDate,
			});
			setAnalytics(applicationAnalytics);
		})();
	}, [dateRange]);

	return (
		<div data-testid="application-analytics-container">
			<div className="flex justify-between items-center">
				<h2 className="font-semibold text-white text-xl">
					{t('status')}
				</h2>
				<DatePicker
					displayFormat={dateFormat}
					showShortcuts={true}
					useRange={true}
					value={dateRange}
					onValueChange={setDateRange}
				/>
			</div>
			<div className="flex items-center justify-between custom-card">
				<DataCard
					imageSrc={<Activity className="text-secondary w-6 h-6" />}
					metric={t('apiCalls')}
					totalValue={analytics?.totalRequests ?? ''}
					percentage={'100'}
					currentValue={'324'}
				/>
				<div className="w-px h-12 bg-gray-200 mx-4" />
				<DataCard
					imageSrc={<Cash className="text-secondary w-6 h-6" />}
					metric={t('modelsCost')}
					totalValue={`${analytics?.projectedCost ?? ''}$`}
					percentage={'103'}
					currentValue={'3.3'}
				/>
			</div>
		</div>
	);
}

export function ApplicationPromptConfigs({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const setPromptConfig = useSetPromptConfig();
	const promptConfigs = usePromptConfig();

	async function fetchPromptConfig() {
		const promptConfigRes = await handleRetrievePromptConfigs({
			applicationId,
			projectId,
		});
		setPromptConfig(applicationId, promptConfigRes);
	}

	useEffect(() => {
		void fetchPromptConfig();
	}, []);

	return (
		<div data-testid="application-prompt-config-container" className="mt-9">
			<h2 className="font-semibold text-white text-xl	">
				{t('promptConfiguration')}
			</h2>
			<div className="custom-card">
				<table className="custom-table">
					<thead>
						<tr>
							<th>{t('name')}</th>
							<th>{t('type')}</th>
							<th>{t('model')}</th>
							<th>ID</th>
							<th>{t('test')}</th>
							<th>{t('edit')}</th>
						</tr>
					</thead>
					<tbody>
						{promptConfigs[applicationId]?.map(
							({ name, modelType, modelVendor, id }) => (
								<tr key={id}>
									<td>{name}</td>
									<td>{modelType}</td>
									<td>{modelVendor}</td>
									<td>
										<button
											data-testid="prompt-config-copy-btn"
											onClick={() => {
												copyToClipboard(id);
												// TODO: add a toast
											}}
										>
											<Front className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
									<td>
										<button>
											<Search className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
									<td>
										<button>
											<PencilFill className="w-3.5 h-3.5 text-secondary" />
										</button>
									</td>
								</tr>
							),
						)}
					</tbody>
				</table>
				<button className="mt-16 flex gap-2 items-center text-secondary hover:brightness-90">
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newConfiguration')}</span>
				</button>
			</div>
		</div>
	);
}

export function ApplicationGeneralSettings({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);
	const updateApplication = useUpdateApplication();

	const [name, setName] = useState(application?.name);
	const [description, setDescription] = useState(application?.description);

	const [initialPromptConfig, setInitialPromptConfig] = useState<
		string | undefined
	>();
	const [defaultPromptConfig, setDefaultPromptConfig] = useState<
		string | undefined
	>();
	const setPromptConfig = useSetPromptConfig();
	const promptConfigs = usePromptConfig();

	const isChanged =
		name !== application?.name ||
		description !== application?.description ||
		initialPromptConfig !== defaultPromptConfig;

	const isValid =
		name &&
		description &&
		name.trim().length >= MIN_NAME_LENGTH &&
		description.trim().length >= MIN_NAME_LENGTH;

	async function fetchPromptConfig() {
		const promptConfigRes = await handleRetrievePromptConfigs({
			applicationId,
			projectId,
		});
		setPromptConfig(applicationId, promptConfigRes);

		const defaultConfig = promptConfigRes.find(
			(promptConfig) => promptConfig.isDefault,
		)?.id;
		setInitialPromptConfig(defaultConfig);
		setDefaultPromptConfig(defaultConfig);
	}

	async function saveSettings() {
		if (
			name !== application?.name ||
			description !== application?.description
		) {
			const updatedApplication = await handleUpdateApplication({
				applicationId,
				projectId,
				data: {
					name,
					description,
				},
			});
			updateApplication(projectId, applicationId, updatedApplication);
		}

		if (
			defaultPromptConfig &&
			initialPromptConfig !== defaultPromptConfig
		) {
			await handleSetDefaultPromptConfig({
				projectId,
				applicationId,
				promptConfigId: defaultPromptConfig,
			});
			await fetchPromptConfig();
		}
	}

	useEffect(() => {
		void fetchPromptConfig();
	}, []);

	if (!application) {
		return null;
	}

	return (
		<div data-testid="application-general-settings-container">
			<h2 className="font-semibold text-white text-xl">{t('general')}</h2>
			<div className="custom-card flex flex-col">
				<div>
					<label
						htmlFor="app-name"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('applicationName')}
					</label>
					<input
						type="text"
						id="app-name"
						data-testid="application-name-input"
						className="input mt-2.5 bg-neutral min-w-[70%]"
						value={name}
						onChange={handleChange(setName)}
					/>
				</div>
				<div className="mt-8">
					<label
						htmlFor="app-desc"
						className="font-medium text-xl text-neutral-content block"
					>
						{t('applicationDescription')}
					</label>
					<input
						type="text"
						id="app-desc"
						data-testid="application-description-input"
						className="input mt-2.5 bg-neutral w-full"
						value={description}
						onChange={handleChange(setDescription)}
					/>
				</div>

				<div className="mt-8 border border-neutral rounded-3xl py-6 px-8 text-neutral-content">
					<h6 className="font-semibold text-lg">
						{t('defaultPromptConfig')}
					</h6>
					<p className="mt-3.5 font-medium text-sm ">
						{t('defaultPromptConfigMessage')}
					</p>
					<select
						data-testid="application-default-prompt"
						className="mt-16 select select-bordered w-full max-w-xs bg-neutral text-base-content font-bold"
						value={defaultPromptConfig}
						onChange={handleChange(setDefaultPromptConfig)}
					>
						{promptConfigs[applicationId]?.map((promptConfig) => (
							<option
								key={promptConfig.id}
								className="text-base-content font-bold"
								value={promptConfig.id}
							>
								{promptConfig.name || promptConfig.id}
							</option>
						))}
					</select>
				</div>

				<button
					data-testid="application-setting-save-btn"
					disabled={!isChanged || !isValid}
					className="btn btn-primary ml-auto mt-8 capitalize"
					onClick={() => void saveSettings()}
				>
					{t('save')}
				</button>
			</div>
		</div>
	);
}

export function ApplicationDeletion({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const router = useRouter();
	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);
	const deleteApplicationHook = useDeleteApplication();
	const dialogRef = useRef<HTMLDialogElement>(null);

	function openDeleteConfirmationPopup() {
		dialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		dialogRef.current?.close();
	}

	async function deleteApplication() {
		await handleDeleteApplication({ projectId, applicationId });
		deleteApplicationHook(projectId, applicationId);
		closeDeleteConfirmationPopup();
		router.replace(Navigation.Projects);
		// 	TODO: Toast to show successful deletion
	}

	if (!application) {
		return null;
	}
	return (
		<div data-testid="application-deletion-container" className="mt-8">
			<h2 className="font-semibold text-white text-xl">
				{t('applicationDeletion')}
			</h2>
			<div className="custom-card flex items-center justify-between text-neutral-content">
				<div>
					<h6 className="font-medium ">
						{t('deleteYourApplication')}
					</h6>
					<p className="font-light text-xs mt-2.5">
						{t('deleteYourApplicationMessage')}
					</p>
				</div>
				<button
					data-testid="application-delete-btn"
					className="btn bg-error text-accent-content py-2.5 px-4 rounded-3xl capitalize min-h-0 h-full leading-4"
					onClick={openDeleteConfirmationPopup}
				>
					{t('delete')}
				</button>
				<dialog ref={dialogRef} className="modal">
					<div className="modal-box p-0 border border-neutral max-w-[43rem]">
						<ResourceDeletionBanner
							title={t('warning')}
							description={t('warningMessageApplication')}
							placeholder={t('deletePlaceholderApplication')}
							resourceName={application.name}
							onCancel={closeDeleteConfirmationPopup}
							onConfirm={() => void deleteApplication()}
						/>
					</div>
					<form method="dialog" className="modal-backdrop">
						<button />
					</form>
				</dialog>
			</div>
		</div>
	);
}

export function ApiKeys({
	projectId,
	applicationId,
}: {
	projectId: string;
	applicationId: string;
}) {
	const t = useTranslations('application');
	const dateFormat = useDateFormat();

	const tokens = useTokens(applicationId);
	const setTokens = useSetTokens();

	const deletionDialogRef = useRef<HTMLDialogElement>(null);
	const creationDialogRef = useRef<HTMLDialogElement>(null);
	const [deletionToken, setDeletionToken] = useState<Pick<
		Token,
		'name' | 'id'
	> | null>(null);

	function openDeleteConfirmationPopup(tokenId: string, tokenName: string) {
		setDeletionToken({ id: tokenId, name: tokenName });
		deletionDialogRef.current?.showModal();
	}

	function closeDeleteConfirmationPopup() {
		setDeletionToken(null);
		deletionDialogRef.current?.close();
	}

	function openCreationPopup() {
		creationDialogRef.current?.showModal();
	}

	function closeCreationPopup() {
		creationDialogRef.current?.close();
	}

	async function getTokens() {
		const tokens = await handleRetrieveTokens({ projectId, applicationId });
		setTokens(applicationId, tokens);
		closeCreationPopup();
	}

	async function deleteToken(tokenId: string) {
		await handleDeleteToken({ projectId, applicationId, tokenId });
		closeDeleteConfirmationPopup();
		await getTokens();
	}

	useEffect(() => {
		void getTokens();
	}, []);

	return (
		<>
			<h2
				data-testid="api-keys-title"
				className="font-semibold text-white text-xl"
			>
				{t('apiKeys')}
			</h2>
			<div className="custom-card">
				<table className="custom-table">
					<thead>
						<tr>
							<th>{t('name')}</th>
							<th>{t('createdAt')}</th>
							<th>{t('delete')}</th>
						</tr>
					</thead>
					<tbody>
						{tokens?.map(({ name, createdAt, id }) => (
							<tr data-testid="api-token-row" key={id}>
								<td data-testid="api-token-name">{name}</td>
								<td>{dayjs(createdAt).format(dateFormat)}</td>
								<td>
									<button
										data-testid="api-token-delete-btn"
										onClick={() => {
											openDeleteConfirmationPopup(
												id,
												name,
											);
										}}
									>
										<Eraser className="w-3.5 h-3.5 text-accent" />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
				<button
					data-testid="api-token-create-btn"
					onClick={openCreationPopup}
					className="mt-16 flex gap-2 items-center text-secondary hover:brightness-90"
				>
					<Plus className="text-secondary w-4 h-4 hover:brightness-90" />
					<span>{t('newApiKey')}</span>
				</button>
				<dialog ref={deletionDialogRef} className="modal">
					<div className="modal-box p-0 border border-neutral max-w-[43rem]">
						{deletionToken && (
							<ResourceDeletionBanner
								title={t('warning')}
								description={t('warningMessageToken')}
								placeholder={t('deletePlaceholderToken')}
								resourceName={deletionToken.name}
								onCancel={closeDeleteConfirmationPopup}
								onConfirm={() =>
									void deleteToken(deletionToken.id)
								}
							/>
						)}
					</div>
					<form method="dialog" className="modal-backdrop">
						<button />
					</form>
				</dialog>
				<dialog ref={creationDialogRef} className="modal">
					<div className="modal-box p-0 border border-neutral max-w-[43rem]">
						<CreateApiKey
							projectId={projectId}
							applicationId={applicationId}
							onCancel={closeCreationPopup}
							onSubmit={() => void getTokens()}
						/>
					</div>
				</dialog>
			</div>
		</>
	);
}

export function CreateApiKey({
	projectId,
	applicationId,
	onSubmit,
	onCancel,
}: {
	projectId: string;
	applicationId: string;
	onSubmit: () => void;
	onCancel: () => void;
}) {
	const t = useTranslations('application');
	const [tokenName, setTokenName] = useState('');
	const [tokenHash, setTokenHash] = useState('');

	const tokenNameValid = tokenName.trim().length >= MIN_NAME_LENGTH;

	async function createToken() {
		const token = await handleCreateToken({
			applicationId,
			projectId,
			data: { name: tokenName },
		});
		setTokenHash(token.hash);
	}

	function close() {
		if (tokenHash) {
			onSubmit();
		} else {
			onCancel();
		}
		setTokenName('');
		setTokenHash('');
	}

	return (
		<div className="bg-base-300">
			<div className="p-10 flex flex-col items-center border-b border-neutral">
				<h1
					data-testid="create-token-title"
					className="text-base-content font-bold text-xl"
				>
					{t('createApiKey')}
				</h1>
				<p className="mt-2.5 font-medium ">
					{t('createApiKeyDescription')}
				</p>
				{!tokenHash && (
					<div className="mt-8 self-start w-full">
						<label
							htmlFor="create-token-input"
							className="text-sm font-semibold text-neutral-content"
						>
							{t('name')}
						</label>
						<input
							type="text"
							id="create-token-input"
							data-testid="create-token-input"
							className="input mt-2.5 bg-neutral w-full text-neutral-content font-medium"
							placeholder={t('createApiKeyPlaceholder')}
							value={tokenName}
							onChange={handleChange(setTokenName)}
						/>
					</div>
				)}
				{tokenHash && (
					<div className="mt-8 self-start w-full">
						<label
							htmlFor="create-token-input"
							className="text-sm font-semibold text-neutral-content"
						>
							{t('apiKey')}
						</label>
						<div className="flex relative items-center gap-4 mt-2.5">
							<KeyFill className="w-4 h-4 text-neutral-content" />
							<input
								data-testid="create-token-hash-input"
								className="font-medium text-success bg-transparent w-full focus:border-none"
								value={tokenHash}
								onChange={() => {
									return;
								}}
							/>
							<button
								data-testid="api-token-copy-btn"
								onClick={() => {
									copyToClipboard(tokenHash);
									// TODO: add a toast
								}}
							>
								<Front className="w-3.5 h-3.5 text-secondary" />
							</button>
						</div>
					</div>
				)}
			</div>
			<div className="flex items-center justify-end py-8 px-5 gap-4">
				<button
					data-testid="create-token-close-btn"
					onClick={close}
					className="btn btn-neutral capitalize font-semibold text-neutral-content"
				>
					{tokenHash ? t('close') : t('cancel')}
				</button>
				{!tokenHash && (
					<button
						data-testid="create-token-submit-btn"
						onClick={() => void createToken()}
						disabled={!tokenNameValid}
						className={`btn btn-primary capitalize font-semibold ${
							tokenNameValid ? '' : 'opacity-60'
						}`}
					>
						{t('create')}
					</button>
				)}
			</div>
		</div>
	);
}
