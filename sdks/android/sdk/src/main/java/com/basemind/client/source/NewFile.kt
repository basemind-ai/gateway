package com.basemind.client.source

import com.basemind.client.gateway.APIGatewayServiceGrpc
import io.grpc.ManagedChannelBuilder

const val PORT = 8980
val channel = ManagedChannelBuilder.forAddress("localhost", PORT).usePlaintext().build()
var stub = APIGatewayServiceGrpc.newBlockingStub(channel)
