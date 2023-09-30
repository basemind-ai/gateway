package com.basemind.client

import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
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

class MockAPIGatewayServer : APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineImplBase() {
    var exc: StatusException? = null

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
        val testClient = createTestClientForServer(this, MockAPIGatewayServer())

        runBlocking {
            val response = testClient.requestPrompt(HashMap())
            assertEquals("test prompt", response.content)
        }
    }

    @Test
    fun request_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument() {
        val server = MockAPIGatewayServer()
        server.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, server)

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
        val server = MockAPIGatewayServer()
        server.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, server)

        runBlocking {
            try {
                testClient.requestPrompt(HashMap())
            } catch (e: Exception) {
                assertEquals(APIGatewayException::class.java, e.javaClass)
            }
        }
    }

    @Test
    fun request_streaming_prompt_method_returns_exepected_response() {
        val testClient = createTestClientForServer(this, MockAPIGatewayServer())
        val response = testClient.requestStream(HashMap())

        runBlocking {
            val results: MutableList<String> = mutableListOf()
            response.collect { chunk -> results.add(chunk.content) }
            assertEquals(listOf("1", "2", "3"), results)
        }
    }

    @Test
    fun request_streaming_prompt_method_throws_missing_prompt_variable_exception_for_grpc_status_missing_argument() {
        val server = MockAPIGatewayServer()
        server.exc = StatusException(io.grpc.Status.INVALID_ARGUMENT, null)

        val testClient = createTestClientForServer(this, server)

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
        val server = MockAPIGatewayServer()
        server.exc = StatusException(io.grpc.Status.INTERNAL, null)

        val testClient = createTestClientForServer(this, server)

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

            // we create an inprocess server and register it for cleanup
            baseMindClientTest.grpcCleanup.register(
                InProcessServerBuilder
                    .forName(serverName)
                    .directExecutor()
                    .addService(mockServer)
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
