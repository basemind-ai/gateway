@file:Suppress("MaxLineLength")

package ai.basemind.client

import ai.basemind.grpc.APIGatewayServiceGrpcKt
import ai.basemind.grpc.PromptRequest
import ai.basemind.grpc.PromptResponse
import ai.basemind.grpc.StreamingPromptResponse
import io.grpc.*
import io.grpc.inprocess.InProcessChannelBuilder
import io.grpc.inprocess.InProcessServerBuilder
import io.grpc.testing.GrpcCleanupRule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.Assertions.*
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
    promptConfigId: String? = null,
    options: Options = Options(),
): BaseMindClient {
    val client = BaseMindClient.getInstance(apiToken = apiToken, promptConfigId = promptConfigId, options = options)
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
    var exc: Exception? = null
    var authHeader: String? = null
    var templateVariableValue: String? = null
    var promptConfigId: String? = null

    override suspend fun requestPrompt(request: PromptRequest): PromptResponse {
        if (exc != null) {
            throw exc!! // skipcq: KT-E1010
        }

        promptConfigId = request.promptConfigId
        templateVariableValue = request.templateVariablesMap["key"]
        return PromptResponse.newBuilder().setContent("test prompt").build()
    }

    override fun requestStreamingPrompt(request: PromptRequest): Flow<StreamingPromptResponse> {
        if (exc != null) {
            throw exc!! // skipcq: KT-E1010
        }

        promptConfigId = request.promptConfigId
        templateVariableValue = request.templateVariablesMap["key"]
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
        promptConfigId: String? = null,
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

        return createTestClient(channel, promptConfigId = promptConfigId, options = Options(debug = isDebug))
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

    @Test
    fun requestPromptMethodSendsTemplateVariables() = runTest {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(mock)

        testClient.requestPrompt(hashMapOf("key" to "value"))
        assertEquals("value", mock.templateVariableValue)
    }

    @Test
    fun requestPromptMethodSetsPromptConfigId() = runTest {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(mock, promptConfigId = "testPromptConfigId")

        testClient.requestPrompt(HashMap())
        assertEquals("testPromptConfigId", mock.promptConfigId)
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

    @Test
    fun requestStreamingPromptMethodSendsTemplateVariables() =
        runTest {
            val mock = MockAPIGatewayServer()
            val testClient = createTestClientForServer(mock)
            val response = testClient.requestStream(hashMapOf("key" to "value"))

            val results: MutableList<String> = mutableListOf()
            response.collect { chunk -> results.add(chunk.content) }
            assertEquals(listOf("1", "2", "3"), results)

            assertEquals("value", mock.templateVariableValue)
        }

    @Test
    fun requestStreamingPromptMethodSetsPromptConfigId() =
        runTest {
            val mock = MockAPIGatewayServer()
            val testClient = createTestClientForServer(mock, promptConfigId = "testPromptConfigId")
            val response = testClient.requestStream(HashMap())

            val results: MutableList<String> = mutableListOf()
            response.collect { chunk -> results.add(chunk.content) }
            assertEquals(listOf("1", "2", "3"), results)

            assertEquals("testPromptConfigId", mock.promptConfigId)
        }

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestStreamingPromptMethodThrowsMissingPromptVariableExceptionForGrpcStatusMissingArgument(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

            val testClient = createTestClientForServer(mock, isDebug)
            val results: MutableList<String> = mutableListOf()

            try {
                val response = testClient.requestStream(HashMap())
                response.collect { chunk -> results.add(chunk.content) }
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
            val results: MutableList<String> = mutableListOf()

            try {
                val response = testClient.requestStream(HashMap())
                response.collect { chunk -> results.add(chunk.content) }
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

    @ParameterizedTest
    @ValueSource(booleans = [true, false])
    fun requestStreamingPromptMethodReThrowsNonStatusException(isDebug: Boolean) =
        runTest {
            val mock = MockAPIGatewayServer()
            mock.exc = Exception("test exception")

            val testClient = createTestClientForServer(mock, isDebug)
            val results: MutableList<String> = mutableListOf()

            try {
                val response = testClient.requestStream(HashMap())
                response.collect { chunk -> results.add(chunk.content) }
            } catch (e: Exception) {
                assertNotEquals(BaseMindException::class.java, e.javaClass)

                val containsLogMessage = systemOutStream.toString().contains("exception requesting streaming prompt")
                if (isDebug) {
                    assertTrue(containsLogMessage)
                } else {
                    assertFalse(containsLogMessage)
                }
            }
        }

    @Test
    fun TestClientClose() {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(mock)
        assertDoesNotThrow { testClient.close() }
    }
}
