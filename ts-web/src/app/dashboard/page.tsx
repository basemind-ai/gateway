'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { login } from '@/api/login-api';
import { PrelineComponentWrapper } from '@/client-components/preline-component-wrapper';
import { useSetProjects } from '@/stores/project-store';
import { useUser } from '@/stores/user-store';
import { getFirebaseAuth } from '@/utils/firebase';

export default function Dashboard() {
	const user = useUser();
	const router = useRouter();
	const setProjects = useSetProjects();

	async function fetchLoginData() {
		const { projects } = await login();
		if (projects.length === 0) {
			return;
		}

		setProjects(projects);
		const [project] = projects;
		router.push(`/project/${project.id}`);
	}

	useEffect(() => {
		if (!user) {
			router.replace('/');
		}

		void fetchLoginData();
	}, []);

	async function logout() {
		const auth = await getFirebaseAuth();
		await auth.signOut();
		router.replace('/');
	}

	if (!user) {
		return;
	}

	return (
		<PrelineComponentWrapper>
			<div>
				<h1 data-testid="dashboard-display-name">
					Username: {user.displayName}
				</h1>
				<button
					data-testid="dashboard-logout-btn"
					onClick={() => void logout()}
				>
					Logout
				</button>
			</div>
		</PrelineComponentWrapper>
	);
}
