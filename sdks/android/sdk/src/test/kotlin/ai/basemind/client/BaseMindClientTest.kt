@file:Suppress("MaxLineLength")

package ai.basemind.client

import ai.basemind.grpc.APIGatewayServiceGrpcKt
import ai.basemind.grpc.PromptRequest
import ai.basemind.grpc.PromptResponse
import ai.basemind.grpc.StreamingPromptResponse
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
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertFalse
import org.junit.jupiter.api.Assertions.assertNotEquals
import org.junit.jupiter.api.Assertions.assertThrows
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
fun createTestClient(
    channel: ManagedChannel,
    apiToken: String = "testToken",
    options: Options = Options(),
): BaseMindClient {
    val client = BaseMindClient.getInstance(apiToken = apiToken, options = options)
    client.grpcStub = APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineStub(channel)
    return client
}

/*
* A gRPC interceptor that ready the metadata auth header and sets it on the server
*/
class HeaderServerInterceptor(private val server: MockAPIGatewayServer) : ServerInterceptor {
    override fun <ReqT, RespT> interceptCall(
        call: ServerCall<ReqT, RespT>,
        requestHeaders: Metadata,
        serverCallHandler: ServerCallHandler<ReqT, RespT>,
    ): ServerCall.Listener<ReqT> {
        val key = Metadata.Key.of("authorization", Metadata.ASCII_STRING_MARSHALLER)
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

    private fun createTestClientForServer(
        mockServer: MockAPIGatewayServer,
        isDebug: Boolean = false,
    ): BaseMindClient {
        // we create a server name to register, this is basically a UUID
        val serverName: String = InProcessServerBuilder.generateName()

        val interceptor = HeaderServerInterceptor(mockServer)
        val intercept = ServerInterceptors.intercept(mockServer, interceptor)

        // we create an inprocess server and register it for cleanup
        grpcCleanup.register(
            InProcessServerBuilder
                .forName(serverName)
                .directExecutor()
                .addService(intercept)
                .build()
                .start(),
        )

        // we create an in-process channel to connect to the server and register it for cleanup
        // returning this value to register the api.
        val channel =
            grpcCleanup.register(
                InProcessChannelBuilder
                    .forName(serverName)
                    .directExecutor()
                    .build(),
            )

        return createTestClient(channel, options = Options(debug = isDebug))
    }

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
    fun clientThrowsExceptionWhenApiKeyIsEmpty() {
        assertThrows(
            MissingAPIKeyException::class.java,
            { BaseMindClient.getInstance("") },
            "empty apiToken should throw",
        )
    }

    @Test
    fun clientDoesNotThrowExceptionWhenApiKeyIsProvided() {
        assertDoesNotThrow {
            BaseMindClient.getInstance(this.toString())
        }
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun clientLogsWhenDebug(isDebug: Boolean) {
        BaseMindClient.getInstance(this.toString(), options = Options(debug = isDebug))
        if (isDebug) {
            assertTrue(systemOutStream.toString().contains("Connecting to"))
        } else {
            assertFalse(systemOutStream.toString().contains("Connecting to"))
        }
    }

    @Test
    fun clientUsesPassedInLogHandler() {
        var result = ""

        fun logHandler(
            tag: String,
            message: String,
        ) {
            result = "$tag: $message"
        }
        BaseMindClient.getInstance(
            this.toString(),
            options =
            Options(debug = true, debugLogger = {
                    tag,
                    message,
                ->
                logHandler(tag, message)
            }),
        )
        assertEquals("$LOGGING_TAG: Connecting to $DEFAULT_API_GATEWAY_ADDRESS:$DEFAULT_API_GATEWAY_PORT", result)
    }

    @Test
    fun createsSingletons() {
        val client1 = BaseMindClient.getInstance(this.toString())
        val client2 = BaseMindClient.getInstance(this.toString())
        assertEquals(client1, client2)

        val client3 = BaseMindClient.getInstance("abcdefg")
        assertNotEquals(client1, client3)
    }

    @Test
    fun usesDefaultAddressWhenEnvVariablesAreNotSpecified() {
        BaseMindClient.getInstance(this.toString(), options = Options(debug = true))
        assertTrue(
            systemOutStream.toString().contains("Connecting to $DEFAULT_API_GATEWAY_ADDRESS:$DEFAULT_API_GATEWAY_PORT"),
        )
    }

    @Test
    fun usesCustomAddressWhenEnvVariablesAreSpecified() {
        environment.set(ENV_API_GATEWAY_ADDRESS, "0.0.0.0")
        environment.set(ENV_API_GATEWAY_PORT, "5000")
        BaseMindClient.getInstance(this.toString(), options = Options(debug = true))
        assertTrue(systemOutStream.toString().contains("Connecting to 0.0.0.0:5000"))
    }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestPromptMethodReturnsExpectedResponse(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            val testClient = createTestClientForServer(mock, isDebug)

            val response = testClient.requestPrompt(HashMap())
            assertEquals("test prompt", response.content)
            assertEquals("Bearer testToken", mock.authHeader)

            val containsLogMessage = systemOutStream.toString().contains("requesting prompt")
            if (isDebug) {
                assertTrue(containsLogMessage)
            } else {
                assertFalse(containsLogMessage)
            }
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestPromptMethodThrowsMissingPromptVariableExceptionForGrpcStatusMissingArgument(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

            val testClient = createTestClientForServer(mock, isDebug)

            try {
                testClient.requestPrompt(HashMap())
            } catch (e: BaseMindException) {
                assertEquals(MissingPromptVariableException::class.java, e.javaClass)

                val containsLogMessage = systemOutStream.toString().contains("exception requesting prompt")
                if (isDebug) {
                    assertTrue(containsLogMessage)
                } else {
                    assertFalse(containsLogMessage)
                }
            }
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestPromptMethodThrowsApiGatewayExceptionForGrpcStatusOtherThanMissingArgument(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

            val testClient = createTestClientForServer(mock, isDebug)

            try {
                testClient.requestPrompt(HashMap())
            } catch (e: BaseMindException) {
                assertEquals(APIGatewayException::class.java, e.javaClass)

                val containsLogMessage = systemOutStream.toString().contains("exception requesting prompt")
                if (isDebug) {
                    assertTrue(containsLogMessage)
                } else {
                    assertFalse(containsLogMessage)
                }
            }
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestStreamingPromptMethodReturnsExpectedResponse(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            val testClient = createTestClientForServer(mock, isDebug)
            val response = testClient.requestStream(HashMap())

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
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestStreamingPromptMethodThrowsMissingPromptVariableExceptionForGrpcStatusMissingArgument(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

            val testClient = createTestClientForServer(mock, isDebug)

            try {
                testClient.requestStream(HashMap())
            } catch (e: BaseMindException) {
                assertEquals(MissingPromptVariableException::class.java, e.javaClass)

                val containsLogMessage =
                    systemOutStream.toString().contains("exception requesting streaming prompt")
                if (isDebug) {
                    assertTrue(containsLogMessage)
                } else {
                    assertFalse(containsLogMessage)
                }
            }
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestStreamingPromptMethodThrowsApiGatewayExceptionForGrpcStatusOtherThanMissingArgument(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

            val testClient = createTestClientForServer(mock, isDebug)

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
}

suspend fun getPrompt(userInput: String): String {
    val client = BaseMindClient.getInstance(apiToken = "myToken")

    val templateVariables = mutableMapOf<String, String>()
    templateVariables["userInput"] = userInput

    val result = client.requestPrompt(templateVariables)
    return result.content
}
