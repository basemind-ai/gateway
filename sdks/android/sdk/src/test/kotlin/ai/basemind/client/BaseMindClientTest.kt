@file:Suppress("MaxLineLength")

package ai.basemind.client

import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.Context
import io.grpc.Contexts
import io.grpc.ManagedChannel
import io.grpc.Metadata
import io.grpc.ServerCall
import io.grpc.ServerCallHandler
import io.grpc.ServerInterceptor
import io.grpc.ServerInterceptors
import io.grpc.StatusException
import io.grpc.inprocess.InProcessChannelBuilder
import io.grpc.inprocess.InProcessServerBuilder
import io.grpc.testing.GrpcCleanupRule
import io.kotest.assertions.throwables.shouldNotThrow
import io.kotest.assertions.throwables.shouldThrow
import io.kotest.matchers.shouldBe
import io.kotest.matchers.string.shouldContain
import io.kotest.matchers.string.shouldNotContain
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertTrue
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.ValueSource
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables
import uk.org.webcompere.systemstubs.jupiter.SystemStub
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension
import java.io.ByteArrayOutputStream
import java.io.PrintStream

/**
 * Creates a client instance that uses the provided channel.
 *
 * @param channel the channel to use for communication.
 * @apiToken the API token to use for authentication. This parameter is optional.
 * @options an options object. This parameter is optional.
 *
 * Note: This should be used *only* for unit testing code!
 */
@BasemindClientDsl
fun createTestClient(
    channel: ManagedChannel,
    apiToken: String = "testToken",
    config: Options.() -> Unit = {},
): BaseMindClient {
    val client = BaseMindClient(apiToken, Options().apply(config))
    client.grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)
    return client
}

private const val METADATA_AUTHORIZATION_KEY = "authorization"

/*
* A gRPC interceptor that ready the metadata auth header and sets it on the server
*/
class HeaderServerInterceptor(private val server: MockAPIGatewayServer) : ServerInterceptor {
    override fun <ReqT, RespT> interceptCall(
        call: ServerCall<ReqT, RespT>,
        requestHeaders: Metadata,
        serverCallHandler: ServerCallHandler<ReqT, RespT>,
    ): ServerCall.Listener<ReqT> {
        val key = Metadata.Key.of(METADATA_AUTHORIZATION_KEY, Metadata.ASCII_STRING_MARSHALLER)
        server.authHeader = requestHeaders.get(key)
        return Contexts.interceptCall(Context.current(), call, requestHeaders, serverCallHandler)
    }
}

/*
* Helper class to emulate the backend server
*/
class MockAPIGatewayServer : APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineImplBase() {
    var exc: StatusException? = null
    var authHeader: String? = null

    override suspend fun requestPrompt(request: PromptRequest): PromptResponse {
        if (exc != null) {
            throw exc!!
        }
        return PromptResponse.newBuilder().setContent("test prompt").build()
    }

    override fun requestStreamingPrompt(request: PromptRequest): Flow<StreamingPromptResponse> {
        if (exc != null) {
            throw exc!!
        }
        return arrayOf("1", "2", "3").map {
            StreamingPromptResponse.newBuilder().setContent(it).build()
        }.asFlow()
    }
}

@ExtendWith(SystemStubsExtension::class)
class BaseMindClientTest {
    @ExtendWith
    val grpcCleanup: GrpcCleanupRule = GrpcCleanupRule()

    private val originalOut = System.out
    private val systemOutStream = ByteArrayOutputStream()

    @BeforeEach
    fun setupSystem() {
        System.setOut(PrintStream(systemOutStream))
    }

    @AfterEach
    fun restoreSystem() {
        System.setOut(originalOut)
    }

    @SystemStub
    private val environment: EnvironmentVariables = EnvironmentVariables()

    @Test
    fun `client throws exception when api key is empty`() {
        shouldThrow<MissingAPIKeyException> {
            BaseMindClient("")
        }
    }

    @Test
    fun client_does_not_throw_exception_when_api_key_is_provided() {
        shouldNotThrow<Throwable> {
            BaseMindClient("abc")
        }
    }

    @Test
    fun client_does_not_log_when_debug_is_false() {
        BaseMindClient("abc", Options())

        systemOutStream.toString() shouldNotContain "Connecting to"
    }

    @Test
    fun client_logs_when_debug_is_true() {
        BaseMindClient("abc", Options(debug = true))

        systemOutStream.toString() shouldContain "Connecting to"
    }

    @Test
    fun client_uses_passed_in_log_handler() {
        var result = ""

        fun logHandler(
            tag: String,
            message: String,
        ) {
            result = "$tag: $message"
        }

        BaseMindClient("abc", Options(debug = true, debugLogger = { tag, message -> logHandler(tag, message) }))

        result shouldBe "$LOGGING_TAG: Connecting to $DEFAULT_API_GATEWAY_ADDRESS:$DEFAULT_API_GATEWAY_PORT"
    }

    @Test
    fun uses_default_address_when_env_variables_are_not_specified() {
        BaseMindClient("abc", Options(debug = true))

        systemOutStream.toString() shouldContain "Connecting to $DEFAULT_API_GATEWAY_ADDRESS:$DEFAULT_API_GATEWAY_PORT"
    }

    @Test
    fun uses_custom_address_when_env_variables_are_specified() {
        environment.set(ENV_API_GATEWAY_ADDRESS, "0.0.0.0")
        environment.set(ENV_API_GATEWAY_PORT, "5000")

        BaseMindClient("abc", Options(debug = true))

        systemOutStream.toString() shouldContain "Connecting to 0.0.0.0:5000"
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_prompt_method_returns_expected_response(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(this, mock, isDebug)

        runBlocking {
            val response = testClient.requestPrompt(HashMap())
            assertEquals("test prompt", response.content)
            assertEquals("Bearer testToken", mock.authHeader)

            with(systemOutStream.toString()) {
                "requesting prompt".let {
                    if (isDebug) {
                        this shouldContain it
                    } else {
                        this shouldNotContain it
                    }
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, mock, isDebug)

        runBlocking {
            try {
                testClient.requestPrompt(HashMap())
            } catch (e: BaseMindException) {
                assertEquals(MissingPromptVariableException::class.java, e.javaClass)

                with(systemOutStream.toString()) {
                    "exception requesting prompt".let {
                        if (isDebug) {
                            this shouldContain it
                        } else {
                            this shouldNotContain it
                        }
                    }
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_prompt_method_throws_api_gateway_exception_for_grpc_status_other_than_missing_argument(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, mock, isDebug)

        runBlocking {
            try {
                testClient.requestPrompt(HashMap())
            } catch (e: BaseMindException) {
                assertEquals(APIGatewayException::class.java, e.javaClass)

                with(systemOutStream.toString()) {
                    "exception requesting prompt".let {
                        if (isDebug) {
                            this shouldContain it
                        } else {
                            this shouldNotContain it
                        }
                    }
                }
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_streaming_prompt_method_returns_expected_response(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(this, mock, isDebug)
        val response = testClient.requestStream(HashMap())

        runBlocking {
            val results: MutableList<String> = mutableListOf()
            response.collect { chunk -> results.add(chunk.content) }
            assertEquals(listOf("1", "2", "3"), results)
            assertEquals("Bearer testToken", mock.authHeader)

            val containsLogMessage = systemOutStream.toString().contains("requesting streaming prompt")
            if (isDebug) {
                assertTrue(containsLogMessage)
            } else {
                assertFalse(containsLogMessage)
            }
            // maybe put all of these in a data (parameterized) test to avoid duplication?
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_streaming_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, mock, isDebug)

        try {
            testClient.requestStream(HashMap())
        } catch (e: BaseMindException) {
            assertEquals(MissingPromptVariableException::class.java, e.javaClass)

            val containsLogMessage = systemOutStream.toString().contains("exception requesting streaming prompt")
            if (isDebug) {
                assertTrue(containsLogMessage)
            } else {
                assertFalse(containsLogMessage)
            }
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun request_streaming_prompt_method_throws_api_gateway_exception_for_grpc_status_other_than_missing_argument(isDebug: Boolean) {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, mock, isDebug)

        try {
            testClient.requestStream(HashMap())
        } catch (e: BaseMindException) {
            assertEquals(APIGatewayException::class.java, e.javaClass)

            val containsLogMessage = systemOutStream.toString().contains("exception requesting streaming prompt")
            if (isDebug) {
                assertTrue(containsLogMessage)
            } else {
                assertFalse(containsLogMessage)
            }
        }
    }

    companion object {
        /**
         * Helper method to create test client that have different bound mock servers
         */
        private fun createTestClientForServer(
            baseMindClientTest: BaseMindClientTest,
            mockServer: MockAPIGatewayServer,
            isDebug: Boolean = false,
        ): BaseMindClient {
            // we create a server name to register, this is basically a UUID
            val serverName: String = InProcessServerBuilder.generateName()

            val interceptor = HeaderServerInterceptor(mockServer)
            val intercept = ServerInterceptors.intercept(mockServer, interceptor)

            // we create an inprocess server and register it for cleanup
            baseMindClientTest.grpcCleanup.register(
                InProcessServerBuilder
                    .forName(serverName)
                    .directExecutor()
                    .addService(intercept)
                    .build()
                    .start(),
            )

            // we create an in-process channel to connect to the server and register it for cleanup
            // returning this value to register the client.
            val channel =
                baseMindClientTest.grpcCleanup.register(
                    InProcessChannelBuilder
                        .forName(serverName)
                        .directExecutor()
                        .build(),
                )

            return createTestClient(channel) {
                debug = isDebug
            }
        }
    }
}
