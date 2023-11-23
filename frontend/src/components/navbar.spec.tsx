import { render, screen } from '@testing-library/react';
import { ProjectFactory } from 'tests/factories';

import { Navbar } from '@/components/navbar';

describe('Navbar tests', () => {
	const project = ProjectFactory.buildSync();

	it('should show the header text', () => {
		const project = ProjectFactory.buildSync();
		render(
			<Navbar
				project={project}
				headerText={'MyHeader'}
				showSelect={true}
			/>,
		);

		const header = screen.getByTestId('navbar-header');
		expect(header).toBeInTheDocument();
		expect(header).toHaveTextContent('MyHeader');
	});

	it('should render the projects select if condition is true', () => {
		render(
			<Navbar
				project={project}
				headerText={'MyHeader'}
				showSelect={true}
			/>,
		);
		const select = screen.getByTestId('project-select-component');
		expect(select).toBeInTheDocument();
	});

	it('should not render the projects select if condition is false', () => {
		render(
			<Navbar
				project={project}
				headerText={'MyHeader'}
				showSelect={false}
			/>,
		);
		const select = screen.queryByTestId('project-select-component');
		expect(select).not.toBeInTheDocument();
	});
});
