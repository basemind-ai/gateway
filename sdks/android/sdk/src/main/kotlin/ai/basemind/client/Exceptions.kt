package ai.basemind.client

/**
 * Abstract base exception for all BaseMind exceptions.
 */
abstract class BaseMindException(message: String, cause: Throwable? = null) : Exception(message, cause)

/**
 * Thrown when the API key is an empty string.
 */
class MissingAPIKeyException : BaseMindException("The 'apiToken' parameter cannot be empty")

/**
 * Thrown when a client method is called without passing in at least one expected prompt variable key.
 */
class MissingPromptVariableException(message: String, cause: Throwable) : BaseMindException(message, cause)

/**
 * Thrown when the API gateway returns an error other than an invalid argument.
 */
class APIGatewayException(message: String, cause: Throwable) : BaseMindException(message, cause)
