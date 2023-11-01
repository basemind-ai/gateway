export /**
 * The wait function returns a promise that resolves after the specified timeout.
 *
 * @param timeout number Set the amount of time to wait before resolving
 *
 * @returns a void promise;
 */
function wait(timeout: number): Promise<void> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve();
		}, timeout);
	});
}
