import { fetcher } from '@/api/fetcher';
import { HttpMethod } from '@/constants';
import { SupportTicketCreateBody } from '@/types';

export async function handleCreateSupportTicket(
	data: SupportTicketCreateBody,
): Promise<void> {
	await fetcher<undefined>({
		data,
		method: HttpMethod.Post,
		url: 'support/',
	});
}
