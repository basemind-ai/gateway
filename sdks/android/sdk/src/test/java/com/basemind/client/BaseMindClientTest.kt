package com.basemind.client

import com.basemind.client.grpc.APIGatewayServiceGrpcKt
import com.basemind.client.grpc.PromptRequest
import com.basemind.client.grpc.PromptResponse
import com.basemind.client.grpc.StreamingPromptResponse
import io.grpc.Server
import io.grpc.inprocess.InProcessChannelBuilder
import io.grpc.inprocess.InProcessServerBuilder
import io.grpc.testing.GrpcCleanupRule
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.asFlow
import kotlinx.coroutines.runBlocking
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.ExtendWith
import uk.org.webcompere.systemstubs.environment.EnvironmentVariables
import uk.org.webcompere.systemstubs.jupiter.SystemStub
import uk.org.webcompere.systemstubs.jupiter.SystemStubsExtension

class MockAPIGatewayServer : APIGatewayServiceGrpcKt.APIGatewayServiceCoroutineImplBase() {
    override suspend fun requestPrompt(request: PromptRequest): PromptResponse {
        return PromptResponse.newBuilder().setContent("test prompt").build()
    }

    override fun requestStreamingPrompt(request: PromptRequest): Flow<StreamingPromptResponse> {
        return arrayOf("1", "2", "3").map {
            StreamingPromptResponse.newBuilder().setContent(it).build()
        }.asFlow()
    }
}

@ExtendWith(SystemStubsExtension::class)
class BaseMindClientTest {
    @ExtendWith
    val grpcCleanup: GrpcCleanupRule = GrpcCleanupRule()

    @SystemStub
    private val environment: EnvironmentVariables = EnvironmentVariables()

    /**
     * To test the server, make calls with a real stub using the in-process channel, and verify
     * behaviors or state changes from the client side.
     */

    private val serverName: String = InProcessServerBuilder.generateName()

    private val server: Server = grpcCleanup.register(
        InProcessServerBuilder
            .forName(serverName)
            .directExecutor()
            .addService(MockAPIGatewayServer())
            .build()
            .start()
    )

    private val channel = grpcCleanup.register(
        InProcessChannelBuilder
            .forName(serverName)
            .directExecutor()
            .build()
    )

    @Test
    fun test_request_prompt() {
        val client = BaseMindClient("abc", Options(channel = channel))

        runBlocking {
            val response = client.requestPrompt(HashMap())
            assertEquals("test prompt", response.content)
        }

    }

    @Test
    fun throws_exception_when_api_key_is_empty() {
        assertThrows(
            MissingAPIKeyException::class.java,
            { BaseMindClient("") },
            "empty apiToken should throw",
        )
    }

    @Test
    fun does_not_throw_exception_when_api_key_is_provided() {
        assertDoesNotThrow {
            BaseMindClient("abc")
        }
    }
}
