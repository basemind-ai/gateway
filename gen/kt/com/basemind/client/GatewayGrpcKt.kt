package com.basemind.client

import com.basemind.client.APIGatewayServiceGrpc.getServiceDescriptor
import io.grpc.CallOptions
import io.grpc.CallOptions.DEFAULT
import io.grpc.Channel
import io.grpc.Metadata
import io.grpc.MethodDescriptor
import io.grpc.ServerServiceDefinition
import io.grpc.ServerServiceDefinition.builder
import io.grpc.ServiceDescriptor
import io.grpc.Status
import io.grpc.Status.UNIMPLEMENTED
import io.grpc.StatusException
import io.grpc.kotlin.AbstractCoroutineServerImpl
import io.grpc.kotlin.AbstractCoroutineStub
import io.grpc.kotlin.ClientCalls
import io.grpc.kotlin.ClientCalls.serverStreamingRpc
import io.grpc.kotlin.ClientCalls.unaryRpc
import io.grpc.kotlin.ServerCalls
import io.grpc.kotlin.ServerCalls.serverStreamingServerMethodDefinition
import io.grpc.kotlin.ServerCalls.unaryServerMethodDefinition
import io.grpc.kotlin.StubFor
import kotlin.String
import kotlin.coroutines.CoroutineContext
import kotlin.coroutines.EmptyCoroutineContext
import kotlin.jvm.JvmOverloads
import kotlin.jvm.JvmStatic
import kotlinx.coroutines.flow.Flow

/**
 * Holder for Kotlin coroutine-based client and server APIs for gateway.v1.APIGatewayService.
 */
public object APIGatewayServiceGrpcKt {
  public const val SERVICE_NAME: String = APIGatewayServiceGrpc.SERVICE_NAME

  @JvmStatic
  public val serviceDescriptor: ServiceDescriptor
    get() = APIGatewayServiceGrpc.getServiceDescriptor()

  public val requestPromptConfigMethod:
      MethodDescriptor<Gateway.PromptConfigRequest, Gateway.PromptConfigResponse>
    @JvmStatic
    get() = APIGatewayServiceGrpc.getRequestPromptConfigMethod()

  public val requestPromptMethod: MethodDescriptor<Gateway.PromptRequest, Gateway.PromptResponse>
    @JvmStatic
    get() = APIGatewayServiceGrpc.getRequestPromptMethod()

  public val requestStreamingPromptMethod:
      MethodDescriptor<Gateway.PromptRequest, Gateway.StreamingPromptResponse>
    @JvmStatic
    get() = APIGatewayServiceGrpc.getRequestStreamingPromptMethod()

  /**
   * A stub for issuing RPCs to a(n) gateway.v1.APIGatewayService service as suspending coroutines.
   */
  @StubFor(APIGatewayServiceGrpc::class)
  public class APIGatewayServiceCoroutineStub @JvmOverloads constructor(
    channel: Channel,
    callOptions: CallOptions = DEFAULT,
  ) : AbstractCoroutineStub<APIGatewayServiceCoroutineStub>(channel, callOptions) {
    public override fun build(channel: Channel, callOptions: CallOptions):
        APIGatewayServiceCoroutineStub = APIGatewayServiceCoroutineStub(channel, callOptions)

    /**
     * Executes this RPC and returns the response message, suspending until the RPC completes
     * with [`Status.OK`][Status].  If the RPC completes with another status, a corresponding
     * [StatusException] is thrown.  If this coroutine is cancelled, the RPC is also cancelled
     * with the corresponding exception as a cause.
     *
     * @param request The request message to send to the server.
     *
     * @param headers Metadata to attach to the request.  Most users will not need this.
     *
     * @return The single response from the server.
     */
    public suspend fun requestPromptConfig(request: Gateway.PromptConfigRequest, headers: Metadata =
        Metadata()): Gateway.PromptConfigResponse = unaryRpc(
      channel,
      APIGatewayServiceGrpc.getRequestPromptConfigMethod(),
      request,
      callOptions,
      headers
    )

    /**
     * Executes this RPC and returns the response message, suspending until the RPC completes
     * with [`Status.OK`][Status].  If the RPC completes with another status, a corresponding
     * [StatusException] is thrown.  If this coroutine is cancelled, the RPC is also cancelled
     * with the corresponding exception as a cause.
     *
     * @param request The request message to send to the server.
     *
     * @param headers Metadata to attach to the request.  Most users will not need this.
     *
     * @return The single response from the server.
     */
    public suspend fun requestPrompt(request: Gateway.PromptRequest, headers: Metadata =
        Metadata()): Gateway.PromptResponse = unaryRpc(
      channel,
      APIGatewayServiceGrpc.getRequestPromptMethod(),
      request,
      callOptions,
      headers
    )

    /**
     * Returns a [Flow] that, when collected, executes this RPC and emits responses from the
     * server as they arrive.  That flow finishes normally if the server closes its response with
     * [`Status.OK`][Status], and fails by throwing a [StatusException] otherwise.  If
     * collecting the flow downstream fails exceptionally (including via cancellation), the RPC
     * is cancelled with that exception as a cause.
     *
     * @param request The request message to send to the server.
     *
     * @param headers Metadata to attach to the request.  Most users will not need this.
     *
     * @return A flow that, when collected, emits the responses from the server.
     */
    public fun requestStreamingPrompt(request: Gateway.PromptRequest, headers: Metadata =
        Metadata()): Flow<Gateway.StreamingPromptResponse> = serverStreamingRpc(
      channel,
      APIGatewayServiceGrpc.getRequestStreamingPromptMethod(),
      request,
      callOptions,
      headers
    )
  }

  /**
   * Skeletal implementation of the gateway.v1.APIGatewayService service based on Kotlin coroutines.
   */
  public abstract class APIGatewayServiceCoroutineImplBase(
    coroutineContext: CoroutineContext = EmptyCoroutineContext,
  ) : AbstractCoroutineServerImpl(coroutineContext) {
    /**
     * Returns the response to an RPC for gateway.v1.APIGatewayService.RequestPromptConfig.
     *
     * If this method fails with a [StatusException], the RPC will fail with the corresponding
     * [Status].  If this method fails with a [java.util.concurrent.CancellationException], the RPC
     * will fail
     * with status `Status.CANCELLED`.  If this method fails for any other reason, the RPC will
     * fail with `Status.UNKNOWN` with the exception as a cause.
     *
     * @param request The request from the client.
     */
    public open suspend fun requestPromptConfig(request: Gateway.PromptConfigRequest):
        Gateway.PromptConfigResponse = throw
        StatusException(UNIMPLEMENTED.withDescription("Method gateway.v1.APIGatewayService.RequestPromptConfig is unimplemented"))

    /**
     * Returns the response to an RPC for gateway.v1.APIGatewayService.RequestPrompt.
     *
     * If this method fails with a [StatusException], the RPC will fail with the corresponding
     * [Status].  If this method fails with a [java.util.concurrent.CancellationException], the RPC
     * will fail
     * with status `Status.CANCELLED`.  If this method fails for any other reason, the RPC will
     * fail with `Status.UNKNOWN` with the exception as a cause.
     *
     * @param request The request from the client.
     */
    public open suspend fun requestPrompt(request: Gateway.PromptRequest): Gateway.PromptResponse =
        throw
        StatusException(UNIMPLEMENTED.withDescription("Method gateway.v1.APIGatewayService.RequestPrompt is unimplemented"))

    /**
     * Returns a [Flow] of responses to an RPC for
     * gateway.v1.APIGatewayService.RequestStreamingPrompt.
     *
     * If creating or collecting the returned flow fails with a [StatusException], the RPC
     * will fail with the corresponding [Status].  If it fails with a
     * [java.util.concurrent.CancellationException], the RPC will fail with status
     * `Status.CANCELLED`.  If creating
     * or collecting the returned flow fails for any other reason, the RPC will fail with
     * `Status.UNKNOWN` with the exception as a cause.
     *
     * @param request The request from the client.
     */
    public open fun requestStreamingPrompt(request: Gateway.PromptRequest):
        Flow<Gateway.StreamingPromptResponse> = throw
        StatusException(UNIMPLEMENTED.withDescription("Method gateway.v1.APIGatewayService.RequestStreamingPrompt is unimplemented"))

    public final override fun bindService(): ServerServiceDefinition =
        builder(getServiceDescriptor())
      .addMethod(unaryServerMethodDefinition(
      context = this.context,
      descriptor = APIGatewayServiceGrpc.getRequestPromptConfigMethod(),
      implementation = ::requestPromptConfig
    ))
      .addMethod(unaryServerMethodDefinition(
      context = this.context,
      descriptor = APIGatewayServiceGrpc.getRequestPromptMethod(),
      implementation = ::requestPrompt
    ))
      .addMethod(serverStreamingServerMethodDefinition(
      context = this.context,
      descriptor = APIGatewayServiceGrpc.getRequestStreamingPromptMethod(),
      implementation = ::requestStreamingPrompt
    )).build()
  }
}
