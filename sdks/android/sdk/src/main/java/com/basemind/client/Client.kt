package com.basemind.client

import com.basemind.client.gateway.APIGatewayServiceGrpc
import io.grpc.ManagedChannelBuilder

/**
 * BaseMindClient is an API client that uses gRPC for communication with the BaseMind.AI API gateway.
 */
public class BaseMindClient(apiToken: String) {
    private val serverAddress = System.getenv("BASEMIND_API_GATEWAY_ADDRESS") ?: "default_value"
    private val serverPortAddress = (System.getenv("BASEMIND_API_GATEWAY_PORT") ?: "4000").toInt()

    init {
        if (apiToken.isEmpty()) {
            throw Exception("An API Token is required")
        }
    }

    private val channel = ManagedChannelBuilder.forAddress(serverAddress, serverPortAddress).usePlaintext().build()
    private val blockingStub = APIGatewayServiceGrpc.newBlockingStub(channel)
    private val nonBlockingStub = APIGatewayServiceGrpc.newStub(channel)


    /**
     * closes the connection to the API gateway. Existing calls are finishes, but new calls are declined.
     */
    fun close() {
        channel.shutdown()
    }

    /**
     * Requests a prompt. The prompt is returned as a single response.
     */
    fun RequestPrompt() {}

    /**
     * Requests a streaming prompt. The prompt is streamed from the API gateway in chunks.
     */
    fun RequestStream() {}
}
