export enum ApiVersions {
	V1 = '1',
}

export enum TimeUnit {
	OneHourInSeconds = 3600,
	OneSecondInMilliseconds = 1000,
}

export enum Environment {
	Development = 'development',
	Production = 'production',
	Test = 'test',
}

export enum HttpMethod {
	Get = 'GET',
	Post = 'POST',
	Patch = 'PATCH',
	Put = 'PUT',
	Delete = 'DELETE',
}

export enum DateFormat {
	ISO = 'DD/MM/YYYY',
	AMERICAN = 'MM/DD/YYYY',
	CHINESE = 'YYYY/MM/DD',
}
