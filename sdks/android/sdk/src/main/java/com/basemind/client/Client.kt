package com.basemind.client

import android.util.Log
import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.ManagedChannel
import io.grpc.ManagedChannelBuilder
import io.grpc.StatusException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.asExecutor
import kotlinx.coroutines.flow.Flow
import java.io.Closeable
import java.util.concurrent.TimeUnit

private const val LOGGING_TAG = "BaseMindClient"

/**
 * BaseMindClient Options
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
 */
class BaseMindClient(apiToken: String, options: Options? = null) : Closeable {
    init {
        if (apiToken.isEmpty()) {
            throw MissingAPIKeyException()
        }
    }

    private val opts = options ?: Options()

    private val channel =
        let {
            val serverAddress = System.getenv("BASEMIND_API_GATEWAY_ADDRESS") ?: "localhost"
            val serverPort = (System.getenv("BASEMIND_API_GATEWAY_PORT") ?: "4000").toInt()
            val useHttps = (System.getenv("BASEMIND_API_GATEWAY_HTTPS") ?: "false").toBoolean()

            if (opts.debug) {
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
        channel.shutdown().awaitTermination(opts.terminationDelaySeconds, TimeUnit.SECONDS)
    }

    private fun createPromptRequest(templateVariables: HashMap<String, String>): PromptRequest {
        return PromptRequest.newBuilder().apply {
            templateVariables.forEach { (key, value) ->
                putTemplateVariables(key, value)
            }
        }.build()
    }

    /**
     * Requests an AI prompt. The prompt is returned as a single response.
     */
    @Suppress("ThrowsCount")
    suspend fun requestPrompt(templateVariables: HashMap<String, String>): PromptResponse {
        try {
            if (opts.debug) {
                Log.d(LOGGING_TAG, "requesting prompt")
            }

            return grpcStub.requestPrompt(createPromptRequest(templateVariables))
        } catch (e: StatusException) {
            if (opts.debug) {
                Log.d(LOGGING_TAG, "exception requesting prompt: $e")
            }

            if (e.status.code == io.grpc.Status.Code.INVALID_ARGUMENT) {
                throw MissingPromptVariableException(e.message ?: "Missing prompt variable", e)
            }

            throw throw APIGatewayException(e.message ?: "API Gateway error", e)
        }
    }

    /**
     * Requests an AI streaming prompt. The prompt is streamed from the API gateway in chunks.
     */
    @Suppress("ThrowsCount")
    fun requestStream(templateVariables: HashMap<String, String>): Flow<StreamingPromptResponse> {
        try {
            if (opts.debug) {
                Log.d(LOGGING_TAG, "requesting streaming prompt")
            }

            return grpcStub.requestStreamingPrompt(createPromptRequest(templateVariables))
        } catch (e: StatusException) {
            if (opts.debug) {
                Log.d(LOGGING_TAG, "exception requesting streaming prompt: $e")
            }

            if (e.status.code == io.grpc.Status.Code.INVALID_ARGUMENT) {
                throw MissingPromptVariableException(e.message ?: "Missing prompt variable", e)
            }

            throw throw APIGatewayException(e.message ?: "API Gateway error", e)
        }
    }
}

/**
 * Creates a client instance that uses the provided channel.
 *
 * Note: This should be used *only* for unit testing code!
 */
fun createTestClient(
    channel: ManagedChannel,
    apiToken: String? = null,
    options: Options? = null,
): BaseMindClient {
    val client = BaseMindClient(apiToken ?: "test token", options)
    client.grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)
    return client
}
