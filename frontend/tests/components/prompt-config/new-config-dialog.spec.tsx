import { fireEvent, screen } from '@testing-library/react';
import { useTranslations } from 'next-intl';
import { ApplicationFactory } from 'tests/factories';
import { routerReplaceMock } from 'tests/mocks';
import { render, renderHook } from 'tests/test-utils';

import { NewConfigDialog } from '@/components/prompt-config/new-config-dialog';

describe('NewConfigDialog tests', () => {
	const {
		result: { current: t },
	} = renderHook(() => useTranslations('promptTesting'));
	const applicationsMock = ApplicationFactory.batchSync(2);
	const projectIdMock = 'project1';
	const handleCloseMock = vi.fn();

	it('renders correctly with texts a create disabled', () => {
		render(
			<NewConfigDialog
				applications={applicationsMock}
				projectId={projectIdMock}
				handleClose={handleCloseMock}
			/>,
		);

		expect(
			screen.getByTestId('test-create-config-dialog'),
		).toBeInTheDocument();
		expect(screen.getByTestId('create-dialog-title')).toHaveTextContent(
			t('createConfig'),
		);
		expect(
			screen.getByTestId('create-dialog-description'),
		).toHaveTextContent(t('createConfigDescription'));
		expect(
			screen.getByTestId('create-dialog-name-input'),
		).toBeInTheDocument();
		expect(screen.getByTestId('create-dialog-create-btn')).toBeDisabled();
	});

	it('enables create button when both app and name are selected', () => {
		render(
			<NewConfigDialog
				applications={applicationsMock}
				projectId={projectIdMock}
				handleClose={handleCloseMock}
			/>,
		);

		fireEvent.change(screen.getByTestId('create-dialog-name-input'), {
			target: { value: 'New Config Name' },
		});
		expect(screen.getByTestId('create-dialog-create-btn')).toBeDisabled();
		fireEvent.change(screen.getByTestId(`create-dialog-app-dropdown`), {
			target: { value: applicationsMock[0].id },
		});
		expect(screen.getByTestId('create-dialog-create-btn')).toBeEnabled();
	});

	it('cancel calls handleClose', () => {
		render(
			<NewConfigDialog
				applications={applicationsMock}
				projectId={projectIdMock}
				handleClose={handleCloseMock}
			/>,
		);

		fireEvent.click(screen.getByTestId('create-dialog-cancel-btn'));
		expect(handleCloseMock).toHaveBeenCalled();
	});

	it('navigates to new page when create is clicked', () => {
		render(
			<NewConfigDialog
				applications={applicationsMock}
				projectId={projectIdMock}
				handleClose={handleCloseMock}
			/>,
		);
		fireEvent.change(screen.getByTestId('create-dialog-name-input'), {
			target: { value: 'New Config Name' },
		});
		fireEvent.change(screen.getByTestId('create-dialog-app-dropdown'), {
			target: { value: applicationsMock[0].id },
		});

		fireEvent.click(screen.getByTestId('create-dialog-create-btn'));
		expect(routerReplaceMock).toHaveBeenCalled();
	});
});
