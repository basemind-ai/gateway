package com.basemind.client

import android.util.Log
import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.ManagedChannel
import io.grpc.ManagedChannelBuilder
import io.grpc.Metadata
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.flow.Flow
import java.io.Closeable
import java.util.concurrent.TimeUnit

internal const val LOGGING_TAG = "BaseMindClient"
internal const val DEFAULT_API_GATEWAY_ADDRESS = "localhost"
internal const val DEFAULT_API_GATEWAY_PORT = 4000
internal const val DEFAULT_API_GATEWAY_HTTPS = false

/**
 * BaseMindClient Options
 *
 * This dataclass is used for configuring the client.
 */
data class Options(
    /**
     * The amount of seconds a channel shutdown should wait before force terminating requests.
     *
     * Defaults to 5 seconds.
     */
    val terminationDelaySeconds: Long = 5L,
    /**
     * Controls outputting debug log messages. Defaults to 'false'.
     */
    val debug: Boolean = false,
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
        let {
            val serverAddress = System.getenv("BASEMIND_API_GATEWAY_ADDRESS") ?: DEFAULT_API_GATEWAY_ADDRESS
            val serverPort = System.getenv("BASEMIND_API_GATEWAY_PORT")?.toInt() ?: DEFAULT_API_GATEWAY_PORT
            val useHttps = System.getenv("BASEMIND_API_GATEWAY_HTTPS")?.toBoolean() ?: DEFAULT_API_GATEWAY_HTTPS

            if (options.debug) {
                Log.d(LOGGING_TAG, "Connecting to $serverAddress:$serverPort")
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
        }!!

    internal var grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)

    /**
     * closes the connection to the API gateway.
     *
     * Note: Existing calls are allowed to finish, but all new calls will be declined after close is called.
     */
    override fun close() {
        channel.shutdown().awaitTermination(options.terminationDelaySeconds, TimeUnit.SECONDS)
    }

    private fun createPromptRequest(templateVariables: HashMap<String, String>): PromptRequest {
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
                Log.d(LOGGING_TAG, "requesting prompt")
            }

            return grpcStub.requestPrompt(createPromptRequest(templateVariables), createMetadata())
        } catch (e: StatusException) {
            if (options.debug) {
                Log.d(LOGGING_TAG, "exception requesting prompt: $e")
            }

            if (e.status.code == io.grpc.Status.Code.INVALID_ARGUMENT) {
                throw MissingPromptVariableException(e.message ?: "Missing prompt variable", e)
            }

            throw APIGatewayException(e.message ?: "API Gateway error", e)
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
                Log.d(LOGGING_TAG, "requesting streaming prompt")
            }

            return grpcStub.requestStreamingPrompt(createPromptRequest(templateVariables), createMetadata())
        } catch (e: StatusException) {
            if (options.debug) {
                Log.d(LOGGING_TAG, "exception requesting streaming prompt: $e")
            }

            if (e.status.code == io.grpc.Status.Code.INVALID_ARGUMENT) {
                throw MissingPromptVariableException(e.message ?: "Missing prompt variable", e)
            }

            throw APIGatewayException(e.message ?: "API Gateway error", e)
        }
    }
}

/**
 * Creates a client instance that uses the provided channel.
 *
 * @param channel the channel to use for communication.
 * @apiToken the API token to use for authentication. This parameter is optional.
 * @options an options object. This parameter is optional.
 *
 * Note: This should be used *only* for unit testing code!
 */
fun createTestClient(
    channel: ManagedChannel,
    apiToken: String = "testToken",
    options: Options = Options(),
): BaseMindClient {
    val client = BaseMindClient(apiToken, options)
    client.grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)
    return client
}
