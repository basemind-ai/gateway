package com.basemind.client

import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.Metadata
import io.grpc.Context
import io.grpc.Contexts
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
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables
import uk.org.webcompere.systemstubs.jupiter.SystemStub
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension


/*
* A gRPC interceptor that ready the metadata auth header and sets it on the server
*/
class HeaderServerInterceptor(private val server: MockAPIGatewayServer) : ServerInterceptor {
    override fun <ReqT, RespT> interceptCall(
        call: ServerCall<ReqT, RespT>,
        requestHeaders: Metadata,
        serverCallHandler: ServerCallHandler<ReqT, RespT>
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

//    @SystemStub
//    private val environment: EnvironmentVariables = EnvironmentVariables()

    @Test
    fun client_throws_exception_when_api_key_is_empty() {
        assertThrows(
            MissingAPIKeyException::class.java,
            { BaseMindClient("") },
            "empty apiToken should throw",
        )
    }

    @Test
    fun client_does_not_throw_exception_when_api_key_is_provided() {
        assertDoesNotThrow {
            BaseMindClient("abc")
        }
    }

    @Test
    fun request_prompt_method_returns_expected_response() {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(this, mock)

        runBlocking {
            val response = testClient.requestPrompt(HashMap())
            assertEquals("test prompt", response.content)
            assertEquals("Bearer testToken", mock.authHeader)

        }
    }

    @Test
    fun request_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument() {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, mock)

        runBlocking {
            try {
                testClient.requestPrompt(HashMap())
            } catch (e: Exception) {
                assertEquals(MissingPromptVariableException::class.java, e.javaClass)
            }
        }
    }

    @Test
    fun request_prompt_method_throws_api_gateway_exception_for_grpc_status_other_than_missing_argument() {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, mock)

        runBlocking {
            try {
                testClient.requestPrompt(HashMap())
            } catch (e: Exception) {
                assertEquals(APIGatewayException::class.java, e.javaClass)
            }
        }
    }

    @Test
    fun request_streaming_prompt_method_returns_expected_response() {
        val mock = MockAPIGatewayServer()
        val testClient = createTestClientForServer(this, mock)
        val response = testClient.requestStream(HashMap())

        runBlocking {
            val results: MutableList<String> = mutableListOf()
            response.collect { chunk -> results.add(chunk.content) }
            assertEquals(listOf("1", "2", "3"), results)
            assertEquals("Bearer testToken", mock.authHeader)
        }
    }

    @Test
    fun request_streaming_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument() {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, mock)

        runBlocking {
            try {
                testClient.requestStream(HashMap())
            } catch (e: Exception) {
                assertEquals(MissingPromptVariableException::class.java, e.javaClass)
            }
        }
    }

    @Test
    fun request_streaming_prompt_method_throws_api_gateway_exception_for_grpc_status_other_than_missing_argument() {
        val mock = MockAPIGatewayServer()
        mock.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, mock)

        runBlocking {
            try {
                testClient.requestStream(HashMap())
            } catch (e: Exception) {
                assertEquals(APIGatewayException::class.java, e.javaClass)
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
        ): BaseMindClient {
            // we create a server name to register, this is basically a UUID
            val serverName: String = InProcessServerBuilder.generateName()

            val interceptor = HeaderServerInterceptor(mockServer)
            val intercept =  ServerInterceptors.intercept(mockServer, interceptor)

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

            return createTestClient(channel)
        }
    }
}
