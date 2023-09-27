package com.basemind.client.grpc;

import static io.grpc.MethodDescriptor.generateFullMethodName;

/**
 * <pre>
 * The API Gateway service definition.
 * </pre>
 */
@javax.annotation.Generated(
    value = "by gRPC proto compiler (version 1.58.0)",
    comments = "Source: gateway/v1/gateway.proto")
@io.grpc.stub.annotations.GrpcGenerated
public final class APIGatewayServiceGrpc {

  private APIGatewayServiceGrpc() {}

  public static final java.lang.String SERVICE_NAME = "gateway.v1.APIGatewayService";

  // Static method descriptors that strictly reflect the proto.
  private static volatile io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptConfigRequest,
      com.basemind.client.grpc.PromptConfigResponse> getRequestPromptConfigMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RequestPromptConfig",
      requestType = com.basemind.client.grpc.PromptConfigRequest.class,
      responseType = com.basemind.client.grpc.PromptConfigResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptConfigRequest,
      com.basemind.client.grpc.PromptConfigResponse> getRequestPromptConfigMethod() {
    io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptConfigRequest, com.basemind.client.grpc.PromptConfigResponse> getRequestPromptConfigMethod;
    if ((getRequestPromptConfigMethod = APIGatewayServiceGrpc.getRequestPromptConfigMethod) == null) {
      synchronized (APIGatewayServiceGrpc.class) {
        if ((getRequestPromptConfigMethod = APIGatewayServiceGrpc.getRequestPromptConfigMethod) == null) {
          APIGatewayServiceGrpc.getRequestPromptConfigMethod = getRequestPromptConfigMethod =
              io.grpc.MethodDescriptor.<com.basemind.client.grpc.PromptConfigRequest, com.basemind.client.grpc.PromptConfigResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RequestPromptConfig"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.PromptConfigRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.PromptConfigResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getRequestPromptConfigMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest,
      com.basemind.client.grpc.PromptResponse> getRequestPromptMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RequestPrompt",
      requestType = com.basemind.client.grpc.PromptRequest.class,
      responseType = com.basemind.client.grpc.PromptResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.UNARY)
  public static io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest,
      com.basemind.client.grpc.PromptResponse> getRequestPromptMethod() {
    io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest, com.basemind.client.grpc.PromptResponse> getRequestPromptMethod;
    if ((getRequestPromptMethod = APIGatewayServiceGrpc.getRequestPromptMethod) == null) {
      synchronized (APIGatewayServiceGrpc.class) {
        if ((getRequestPromptMethod = APIGatewayServiceGrpc.getRequestPromptMethod) == null) {
          APIGatewayServiceGrpc.getRequestPromptMethod = getRequestPromptMethod =
              io.grpc.MethodDescriptor.<com.basemind.client.grpc.PromptRequest, com.basemind.client.grpc.PromptResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.UNARY)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RequestPrompt"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.PromptRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.PromptResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getRequestPromptMethod;
  }

  private static volatile io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest,
      com.basemind.client.grpc.StreamingPromptResponse> getRequestStreamingPromptMethod;

  @io.grpc.stub.annotations.RpcMethod(
      fullMethodName = SERVICE_NAME + '/' + "RequestStreamingPrompt",
      requestType = com.basemind.client.grpc.PromptRequest.class,
      responseType = com.basemind.client.grpc.StreamingPromptResponse.class,
      methodType = io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
  public static io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest,
      com.basemind.client.grpc.StreamingPromptResponse> getRequestStreamingPromptMethod() {
    io.grpc.MethodDescriptor<com.basemind.client.grpc.PromptRequest, com.basemind.client.grpc.StreamingPromptResponse> getRequestStreamingPromptMethod;
    if ((getRequestStreamingPromptMethod = APIGatewayServiceGrpc.getRequestStreamingPromptMethod) == null) {
      synchronized (APIGatewayServiceGrpc.class) {
        if ((getRequestStreamingPromptMethod = APIGatewayServiceGrpc.getRequestStreamingPromptMethod) == null) {
          APIGatewayServiceGrpc.getRequestStreamingPromptMethod = getRequestStreamingPromptMethod =
              io.grpc.MethodDescriptor.<com.basemind.client.grpc.PromptRequest, com.basemind.client.grpc.StreamingPromptResponse>newBuilder()
              .setType(io.grpc.MethodDescriptor.MethodType.SERVER_STREAMING)
              .setFullMethodName(generateFullMethodName(SERVICE_NAME, "RequestStreamingPrompt"))
              .setSampledToLocalTracing(true)
              .setRequestMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.PromptRequest.getDefaultInstance()))
              .setResponseMarshaller(io.grpc.protobuf.lite.ProtoLiteUtils.marshaller(
                  com.basemind.client.grpc.StreamingPromptResponse.getDefaultInstance()))
              .build();
        }
      }
    }
    return getRequestStreamingPromptMethod;
  }

  /**
   * Creates a new async stub that supports all call types for the service
   */
  public static APIGatewayServiceStub newStub(io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceStub>() {
        @java.lang.Override
        public APIGatewayServiceStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new APIGatewayServiceStub(channel, callOptions);
        }
      };
    return APIGatewayServiceStub.newStub(factory, channel);
  }

  /**
   * Creates a new blocking-style stub that supports unary and streaming output calls on the service
   */
  public static APIGatewayServiceBlockingStub newBlockingStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceBlockingStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceBlockingStub>() {
        @java.lang.Override
        public APIGatewayServiceBlockingStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new APIGatewayServiceBlockingStub(channel, callOptions);
        }
      };
    return APIGatewayServiceBlockingStub.newStub(factory, channel);
  }

  /**
   * Creates a new ListenableFuture-style stub that supports unary calls on the service
   */
  public static APIGatewayServiceFutureStub newFutureStub(
      io.grpc.Channel channel) {
    io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceFutureStub> factory =
      new io.grpc.stub.AbstractStub.StubFactory<APIGatewayServiceFutureStub>() {
        @java.lang.Override
        public APIGatewayServiceFutureStub newStub(io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
          return new APIGatewayServiceFutureStub(channel, callOptions);
        }
      };
    return APIGatewayServiceFutureStub.newStub(factory, channel);
  }

  /**
   * <pre>
   * The API Gateway service definition.
   * </pre>
   */
  public interface AsyncService {

    /**
     * <pre>
     * Request the configuration for making prompt requests
     * </pre>
     */
    default void requestPromptConfig(com.basemind.client.grpc.PromptConfigRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptConfigResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRequestPromptConfigMethod(), responseObserver);
    }

    /**
     * <pre>
     * Request a regular LLM prompt
     * </pre>
     */
    default void requestPrompt(com.basemind.client.grpc.PromptRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRequestPromptMethod(), responseObserver);
    }

    /**
     * <pre>
     * Request a streaming LLM prompt
     * </pre>
     */
    default void requestStreamingPrompt(com.basemind.client.grpc.PromptRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.StreamingPromptResponse> responseObserver) {
      io.grpc.stub.ServerCalls.asyncUnimplementedUnaryCall(getRequestStreamingPromptMethod(), responseObserver);
    }
  }

  /**
   * Base class for the server implementation of the service APIGatewayService.
   * <pre>
   * The API Gateway service definition.
   * </pre>
   */
  public static abstract class APIGatewayServiceImplBase
      implements io.grpc.BindableService, AsyncService {

    @java.lang.Override public final io.grpc.ServerServiceDefinition bindService() {
      return APIGatewayServiceGrpc.bindService(this);
    }
  }

  /**
   * A stub to allow clients to do asynchronous rpc calls to service APIGatewayService.
   * <pre>
   * The API Gateway service definition.
   * </pre>
   */
  public static final class APIGatewayServiceStub
      extends io.grpc.stub.AbstractAsyncStub<APIGatewayServiceStub> {
    private APIGatewayServiceStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected APIGatewayServiceStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new APIGatewayServiceStub(channel, callOptions);
    }

    /**
     * <pre>
     * Request the configuration for making prompt requests
     * </pre>
     */
    public void requestPromptConfig(com.basemind.client.grpc.PromptConfigRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptConfigResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRequestPromptConfigMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Request a regular LLM prompt
     * </pre>
     */
    public void requestPrompt(com.basemind.client.grpc.PromptRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncUnaryCall(
          getChannel().newCall(getRequestPromptMethod(), getCallOptions()), request, responseObserver);
    }

    /**
     * <pre>
     * Request a streaming LLM prompt
     * </pre>
     */
    public void requestStreamingPrompt(com.basemind.client.grpc.PromptRequest request,
        io.grpc.stub.StreamObserver<com.basemind.client.grpc.StreamingPromptResponse> responseObserver) {
      io.grpc.stub.ClientCalls.asyncServerStreamingCall(
          getChannel().newCall(getRequestStreamingPromptMethod(), getCallOptions()), request, responseObserver);
    }
  }

  /**
   * A stub to allow clients to do synchronous rpc calls to service APIGatewayService.
   * <pre>
   * The API Gateway service definition.
   * </pre>
   */
  public static final class APIGatewayServiceBlockingStub
      extends io.grpc.stub.AbstractBlockingStub<APIGatewayServiceBlockingStub> {
    private APIGatewayServiceBlockingStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected APIGatewayServiceBlockingStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new APIGatewayServiceBlockingStub(channel, callOptions);
    }

    /**
     * <pre>
     * Request the configuration for making prompt requests
     * </pre>
     */
    public com.basemind.client.grpc.PromptConfigResponse requestPromptConfig(com.basemind.client.grpc.PromptConfigRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRequestPromptConfigMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Request a regular LLM prompt
     * </pre>
     */
    public com.basemind.client.grpc.PromptResponse requestPrompt(com.basemind.client.grpc.PromptRequest request) {
      return io.grpc.stub.ClientCalls.blockingUnaryCall(
          getChannel(), getRequestPromptMethod(), getCallOptions(), request);
    }

    /**
     * <pre>
     * Request a streaming LLM prompt
     * </pre>
     */
    public java.util.Iterator<com.basemind.client.grpc.StreamingPromptResponse> requestStreamingPrompt(
        com.basemind.client.grpc.PromptRequest request) {
      return io.grpc.stub.ClientCalls.blockingServerStreamingCall(
          getChannel(), getRequestStreamingPromptMethod(), getCallOptions(), request);
    }
  }

  /**
   * A stub to allow clients to do ListenableFuture-style rpc calls to service APIGatewayService.
   * <pre>
   * The API Gateway service definition.
   * </pre>
   */
  public static final class APIGatewayServiceFutureStub
      extends io.grpc.stub.AbstractFutureStub<APIGatewayServiceFutureStub> {
    private APIGatewayServiceFutureStub(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      super(channel, callOptions);
    }

    @java.lang.Override
    protected APIGatewayServiceFutureStub build(
        io.grpc.Channel channel, io.grpc.CallOptions callOptions) {
      return new APIGatewayServiceFutureStub(channel, callOptions);
    }

    /**
     * <pre>
     * Request the configuration for making prompt requests
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.basemind.client.grpc.PromptConfigResponse> requestPromptConfig(
        com.basemind.client.grpc.PromptConfigRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRequestPromptConfigMethod(), getCallOptions()), request);
    }

    /**
     * <pre>
     * Request a regular LLM prompt
     * </pre>
     */
    public com.google.common.util.concurrent.ListenableFuture<com.basemind.client.grpc.PromptResponse> requestPrompt(
        com.basemind.client.grpc.PromptRequest request) {
      return io.grpc.stub.ClientCalls.futureUnaryCall(
          getChannel().newCall(getRequestPromptMethod(), getCallOptions()), request);
    }
  }

  private static final int METHODID_REQUEST_PROMPT_CONFIG = 0;
  private static final int METHODID_REQUEST_PROMPT = 1;
  private static final int METHODID_REQUEST_STREAMING_PROMPT = 2;

  private static final class MethodHandlers<Req, Resp> implements
      io.grpc.stub.ServerCalls.UnaryMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ServerStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.ClientStreamingMethod<Req, Resp>,
      io.grpc.stub.ServerCalls.BidiStreamingMethod<Req, Resp> {
    private final AsyncService serviceImpl;
    private final int methodId;

    MethodHandlers(AsyncService serviceImpl, int methodId) {
      this.serviceImpl = serviceImpl;
      this.methodId = methodId;
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public void invoke(Req request, io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        case METHODID_REQUEST_PROMPT_CONFIG:
          serviceImpl.requestPromptConfig((com.basemind.client.grpc.PromptConfigRequest) request,
              (io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptConfigResponse>) responseObserver);
          break;
        case METHODID_REQUEST_PROMPT:
          serviceImpl.requestPrompt((com.basemind.client.grpc.PromptRequest) request,
              (io.grpc.stub.StreamObserver<com.basemind.client.grpc.PromptResponse>) responseObserver);
          break;
        case METHODID_REQUEST_STREAMING_PROMPT:
          serviceImpl.requestStreamingPrompt((com.basemind.client.grpc.PromptRequest) request,
              (io.grpc.stub.StreamObserver<com.basemind.client.grpc.StreamingPromptResponse>) responseObserver);
          break;
        default:
          throw new AssertionError();
      }
    }

    @java.lang.Override
    @java.lang.SuppressWarnings("unchecked")
    public io.grpc.stub.StreamObserver<Req> invoke(
        io.grpc.stub.StreamObserver<Resp> responseObserver) {
      switch (methodId) {
        default:
          throw new AssertionError();
      }
    }
  }

  public static final io.grpc.ServerServiceDefinition bindService(AsyncService service) {
    return io.grpc.ServerServiceDefinition.builder(getServiceDescriptor())
        .addMethod(
          getRequestPromptConfigMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.basemind.client.grpc.PromptConfigRequest,
              com.basemind.client.grpc.PromptConfigResponse>(
                service, METHODID_REQUEST_PROMPT_CONFIG)))
        .addMethod(
          getRequestPromptMethod(),
          io.grpc.stub.ServerCalls.asyncUnaryCall(
            new MethodHandlers<
              com.basemind.client.grpc.PromptRequest,
              com.basemind.client.grpc.PromptResponse>(
                service, METHODID_REQUEST_PROMPT)))
        .addMethod(
          getRequestStreamingPromptMethod(),
          io.grpc.stub.ServerCalls.asyncServerStreamingCall(
            new MethodHandlers<
              com.basemind.client.grpc.PromptRequest,
              com.basemind.client.grpc.StreamingPromptResponse>(
                service, METHODID_REQUEST_STREAMING_PROMPT)))
        .build();
  }

  private static volatile io.grpc.ServiceDescriptor serviceDescriptor;

  public static io.grpc.ServiceDescriptor getServiceDescriptor() {
    io.grpc.ServiceDescriptor result = serviceDescriptor;
    if (result == null) {
      synchronized (APIGatewayServiceGrpc.class) {
        result = serviceDescriptor;
        if (result == null) {
          serviceDescriptor = result = io.grpc.ServiceDescriptor.newBuilder(SERVICE_NAME)
              .addMethod(getRequestPromptConfigMethod())
              .addMethod(getRequestPromptMethod())
              .addMethod(getRequestStreamingPromptMethod())
              .build();
        }
      }
    }
    return result;
  }
}
