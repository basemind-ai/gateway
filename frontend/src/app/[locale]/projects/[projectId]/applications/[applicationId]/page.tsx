'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { CodeSquare, Gear, KeyFill, Speedometer2 } from 'react-bootstrap-icons';

import { Navbar } from '@/components/navbar';
import { ApiKeys } from '@/components/projects/[projectId]/applications/[applicationId]/api-keys';
import { ApplicationAnalyticsPage } from '@/components/projects/[projectId]/applications/[applicationId]/application-analytics-page';
import { ApplicationDeletion } from '@/components/projects/[projectId]/applications/[applicationId]/application-deletion';
import { ApplicationGeneralSettings } from '@/components/projects/[projectId]/applications/[applicationId]/application-general-settings';
import { ApplicationPromptConfigs } from '@/components/projects/[projectId]/applications/[applicationId]/application-prompt-configs';
import { CreatePromptConfigView } from '@/components/projects/[projectId]/applications/[applicationId]/create-prompt-config';
import { TabData, TabNavigation } from '@/components/tab-navigation';
import { useAuthenticatedUser } from '@/hooks/use-authenticated-user';
import { useProjectBootstrap } from '@/hooks/use-project-bootstrap';
import { useApplication, useProject, useProjects } from '@/stores/api-store';
import { ModelVendor } from '@/types';

enum TAB_NAMES {
	OVERVIEW,
	TEST_PROMPT,
	SETTINGS,
	API_KEYS,
}

export default function Application({
	params: { projectId, applicationId },
}: {
	params: { applicationId: string; projectId: string };
}) {
	useAuthenticatedUser();
	useProjectBootstrap(false);

	const t = useTranslations('application');
	const application = useApplication(projectId, applicationId);
	const project = useProject(projectId);
	const projects = useProjects();

	const tabs: TabData<TAB_NAMES>[] = [
		{
			icon: <Speedometer2 className="w-3.5 h-3.5" />,
			id: TAB_NAMES.OVERVIEW,
			text: t('overview'),
		},
		{
			icon: <CodeSquare className="w-3.5 h-3.5" />,
			id: TAB_NAMES.TEST_PROMPT,
			text: t('testPrompt'),
		},
		{
			icon: <Gear className="w-3.5 h-3.5" />,
			id: TAB_NAMES.SETTINGS,
			text: t('settings'),
		},
		{
			icon: <KeyFill className="w-3.5 h-3.5" />,
			id: TAB_NAMES.API_KEYS,
			text: t('apiKeys'),
		},
	];
	const [selectedTab, setSelectedTab] = useState(TAB_NAMES.OVERVIEW);

	if (!application || !project) {
		return null;
	}

	const tabComponents: Record<TAB_NAMES, React.FC> = {
		[TAB_NAMES.OVERVIEW]: () => (
			<>
				<ApplicationAnalyticsPage
					applicationId={applicationId}
					projectId={projectId}
				/>
				<ApplicationPromptConfigs
					applicationId={applicationId}
					projectId={projectId}
				/>
			</>
		),
		[TAB_NAMES.TEST_PROMPT]: () => (
			<div data-testid="application-prompt-testing-container">
				<CreatePromptConfigView
					// we hardcode here to openai
					// TODO: make this dynamic when we support other vendors
					modelVendor={ModelVendor.OpenAI}
					projectId={projectId}
					applicationId={applicationId}
				/>
			</div>
		),
		[TAB_NAMES.SETTINGS]: () => (
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
		),
		[TAB_NAMES.API_KEYS]: () => (
			<ApiKeys applicationId={applicationId} projectId={projectId} />
		),
	};

	const TabComponent = tabComponents[selectedTab];

	return (
		<div data-testid="application-page" className="my-8 mx-32">
			<Navbar
				project={project}
				headerText={`${t('application')} / ${application.name}`}
				showSelect={projects.length > 1}
			/>
			<div className="mt-3.5 w-full mb-8">
				<TabNavigation<TAB_NAMES>
					tabs={tabs}
					selectedTab={selectedTab}
					onTabChange={setSelectedTab}
					trailingLine={true}
				/>
			</div>
			<TabComponent />
		</div>
	);
}
