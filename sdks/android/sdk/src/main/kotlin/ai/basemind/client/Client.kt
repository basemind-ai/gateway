@file:Suppress("MaxLineLength")

package ai.basemind.client

import android.util.Log
import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.ManagedChannelBuilder
import io.grpc.Metadata
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.flow.Flow
import java.io.Closeable
import java.util.concurrent.TimeUnit

internal const val DEFAULT_API_GATEWAY_ADDRESS = "localhost"
internal const val DEFAULT_API_GATEWAY_HTTPS = false
internal const val DEFAULT_API_GATEWAY_PORT = 4000
internal const val ENV_API_GATEWAY_ADDRESS = "BASEMIND_API_GATEWAY_ADDRESS"
internal const val ENV_API_GATEWAY_HTTPS = "BASEMIND_API_GATEWAY_HTTPS"
internal const val ENV_API_GATEWAY_PORT = "BASEMIND_API_GATEWAY_PORT"
internal const val LOGGING_TAG = "BaseMindClient"
private const val DEFAULT_TERMINATION_DELAY_S = 5L

@DslMarker
annotation class BasemindClientDsl

/**
 * BaseMindClient Options
 *
 * This dataclass is used for configuring the client.
 */

@BasemindClientDsl
data class Options(
    /**
     * The amount of seconds a channel shutdown should wait before force terminating requests.
     *
     * Defaults to 5 seconds.
     */
    var terminationDelaySeconds: Long = DEFAULT_TERMINATION_DELAY_S,
    /**
     * Controls outputting debug log messages. Defaults to 'false'.
     */
    var debug: Boolean = false,
    /**
     * A logging handler function. Defaults to android's Log.d.
     */
    var debugLogger: (String, String) -> Unit = { tag, message -> Log.d(tag, message) },
)

/**
 * BaseMindClient is an API client that uses gRPC for communication with the BaseMind.AI API gateway.
 * @property apiToken the API token to use for authentication. This parameter is required.
 * @property options an options object. This parameter is optional.
 * @constructor instantiates a new client instance.
 */
class BaseMindClient(private val apiToken: String, private val options: Options = Options()) : Closeable {
    init {
        if (apiToken.isEmpty()) {
            throw MissingAPIKeyException()
        }
    }

    private val channel =
        run {
            val serverAddress = System.getenv(ENV_API_GATEWAY_ADDRESS) ?: DEFAULT_API_GATEWAY_ADDRESS
            val serverPort = System.getenv(ENV_API_GATEWAY_PORT)?.toInt() ?: DEFAULT_API_GATEWAY_PORT
            val useHttps = System.getenv(ENV_API_GATEWAY_HTTPS)?.toBoolean() ?: DEFAULT_API_GATEWAY_HTTPS

            if (options.debug) {
                options.debugLogger(LOGGING_TAG, "Connecting to $serverAddress:$serverPort")
            }

            /**
             * creates a gRPC channel builder instance, which allows us to set options
             */
            val builder = ManagedChannelBuilder.forAddress(serverAddress, serverPort)

            if (useHttps) {
                builder.useTransportSecurity()
            } else {
                builder.usePlaintext()
            }

            builder.executor(Dispatchers.IO.asExecutor()).build()
        }

    internal var grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)

    /**
     * closes the connection to the API gateway.
     *
     * Note: Existing calls are allowed to finish, but all new calls will be declined after close is called.
     */
    override fun close() {
        channel.shutdown().awaitTermination(options.terminationDelaySeconds, TimeUnit.SECONDS)
    }

    private fun createPromptRequest(templateVariables: Map<String, String>): PromptRequest {
        return PromptRequest.newBuilder().apply {
            templateVariables.forEach { (key, value) ->
                putTemplateVariables(key, value)
            }
        }.build()
    }

    private fun createMetadata(): Metadata {
        val metadata = Metadata()

        metadata.put(Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER), "Bearer $apiToken")

        return metadata
    }

    /**
     * Requests an AI prompt. The prompt is returned as a single response.
     *
     * @param templateVariables a map of template variables to use for the prompt request.
     * @throws MissingPromptVariableException if a template variable is missing.
     * @throws APIGatewayException if the API gateway returns an error.
     */
    suspend fun requestPrompt(templateVariables: HashMap<String, String>): PromptResponse {
        try {
            if (options.debug) {
                options.debugLogger(LOGGING_TAG, "requesting prompt")
            }

            return grpcStub.requestPrompt(createPromptRequest(templateVariables), createMetadata())
        } catch (e: StatusException) {
            if (options.debug) {
                options.debugLogger(LOGGING_TAG, "exception requesting prompt: $e")
            }

            when (e.status.code) {
                io.grpc.Status.Code.INVALID_ARGUMENT -> throw MissingPromptVariableException(
                    e.message ?: "Missing prompt variable",
                    e,
                )

                else -> throw APIGatewayException(e.message ?: "API Gateway error", e)
            }
        }
    }

    /**
     * Requests an AI streaming prompt. The prompt is streamed from the API gateway in chunks.
     *
     * @param templateVariables a map of template variables to use for the prompt request.
     * @throws MissingPromptVariableException if a template variable is missing.
     * @throws APIGatewayException if the API gateway returns an error.
     */
    fun requestStream(templateVariables: HashMap<String, String>): Flow<StreamingPromptResponse> {
        try {
            if (options.debug) {
                options.debugLogger(LOGGING_TAG, "requesting streaming prompt")
            }

            return grpcStub.requestStreamingPrompt(createPromptRequest(templateVariables), createMetadata())
        } catch (e: StatusException) {
            if (options.debug) {
                options.debugLogger(LOGGING_TAG, "exception requesting streaming prompt: $e")
            }

            when (e.status.code) {
                io.grpc.Status.Code.INVALID_ARGUMENT -> throw MissingPromptVariableException(
                    e.message ?: "Missing prompt variable",
                    e,
                )

                else -> throw APIGatewayException(e.message ?: "API Gateway error", e)
            }
        }
    }
}
