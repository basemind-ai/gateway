import { Activity } from 'react-bootstrap-icons';
import { render, screen } from 'tests/test-utils';

import { DataCard } from '@/components/dashboard/data-card';

describe('Data Card tests', () => {
	it('render Data Card metric API Call', () => {
		render(
			<DataCard
				imageSrc={<Activity />}
				metric={'API Calls'}
				totalValue={'32k'}
				currentValue={'16000'}
				percentage={'100%'}
			/>,
		);

		const metric = screen.getByText('API Calls');
		expect(metric).toBeInTheDocument();
	});

	it('render Data Card metric Users', () => {
		render(
			<DataCard
				imageSrc={<Activity />}
				metric={'Users'}
				totalValue={'32k'}
				currentValue={'16000'}
				percentage={'100%'}
			/>,
		);

		const metric = screen.getByText('Users');
		expect(metric).toBeInTheDocument();
	});

	it('render Data Card metric Models Cost', () => {
		render(
			<DataCard
				imageSrc={<Activity />}
				metric={'Models Cost'}
				totalValue={'32k'}
				currentValue={'16000'}
				percentage={'100%'}
			/>,
		);

		const metric = screen.getByText('Models Cost');
		expect(metric).toBeInTheDocument();
	});

	it('render Data Card total value', () => {
		render(
			<DataCard
				imageSrc={<Activity />}
				metric={'Models Cost'}
				totalValue={'32k'}
				currentValue={'16000'}
				percentage={'100%'}
			/>,
		);

		const totalValue = screen.getByText('32k');
		expect(totalValue).toBeInTheDocument();
	});
});
