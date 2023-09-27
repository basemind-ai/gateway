// Generated by the protocol buffer compiler.  DO NOT EDIT!
// source: gateway/v1/gateway.proto

package com.basemind.client.grpc;

/**
 * <pre>
 * A response for a prompt configuration - retrieving the expected prompt variables
 * </pre>
 *
 * Protobuf type {@code gateway.v1.PromptConfigResponse}
 */
public  final class PromptConfigResponse extends
    com.google.protobuf.GeneratedMessageLite<
        PromptConfigResponse, PromptConfigResponse.Builder> implements
    // @@protoc_insertion_point(message_implements:gateway.v1.PromptConfigResponse)
    PromptConfigResponseOrBuilder {
  private PromptConfigResponse() {
    expectedPromptVariables_ = com.google.protobuf.GeneratedMessageLite.emptyProtobufList();
  }
  public static final int EXPECTED_PROMPT_VARIABLES_FIELD_NUMBER = 1;
  private com.google.protobuf.Internal.ProtobufList<java.lang.String> expectedPromptVariables_;
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @return A list containing the expectedPromptVariables.
   */
  @java.lang.Override
  public java.util.List<java.lang.String> getExpectedPromptVariablesList() {
    return expectedPromptVariables_;
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @return The count of expectedPromptVariables.
   */
  @java.lang.Override
  public int getExpectedPromptVariablesCount() {
    return expectedPromptVariables_.size();
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param index The index of the element to return.
   * @return The expectedPromptVariables at the given index.
   */
  @java.lang.Override
  public java.lang.String getExpectedPromptVariables(int index) {
    return expectedPromptVariables_.get(index);
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param index The index of the value to return.
   * @return The bytes of the expectedPromptVariables at the given index.
   */
  @java.lang.Override
  public com.google.protobuf.ByteString
      getExpectedPromptVariablesBytes(int index) {
    return com.google.protobuf.ByteString.copyFromUtf8(
        expectedPromptVariables_.get(index));
  }
  private void ensureExpectedPromptVariablesIsMutable() {
    com.google.protobuf.Internal.ProtobufList<java.lang.String> tmp =
        expectedPromptVariables_;  if (!tmp.isModifiable()) {
      expectedPromptVariables_ =
          com.google.protobuf.GeneratedMessageLite.mutableCopy(tmp);
     }
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param index The index to set the value at.
   * @param value The expectedPromptVariables to set.
   */
  private void setExpectedPromptVariables(
      int index, java.lang.String value) {
    java.lang.Class<?> valueClass = value.getClass();
  ensureExpectedPromptVariablesIsMutable();
    expectedPromptVariables_.set(index, value);
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param value The expectedPromptVariables to add.
   */
  private void addExpectedPromptVariables(
      java.lang.String value) {
    java.lang.Class<?> valueClass = value.getClass();
  ensureExpectedPromptVariablesIsMutable();
    expectedPromptVariables_.add(value);
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param values The expectedPromptVariables to add.
   */
  private void addAllExpectedPromptVariables(
      java.lang.Iterable<java.lang.String> values) {
    ensureExpectedPromptVariablesIsMutable();
    com.google.protobuf.AbstractMessageLite.addAll(
        values, expectedPromptVariables_);
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   */
  private void clearExpectedPromptVariables() {
    expectedPromptVariables_ = com.google.protobuf.GeneratedMessageLite.emptyProtobufList();
  }
  /**
   * <pre>
   * The expected prompt variables
   * </pre>
   *
   * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
   * @param value The bytes of the expectedPromptVariables to add.
   */
  private void addExpectedPromptVariablesBytes(
      com.google.protobuf.ByteString value) {
    checkByteStringIsUtf8(value);
    ensureExpectedPromptVariablesIsMutable();
    expectedPromptVariables_.add(value.toStringUtf8());
  }

  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      java.nio.ByteBuffer data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      java.nio.ByteBuffer data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data, extensionRegistry);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      com.google.protobuf.ByteString data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      com.google.protobuf.ByteString data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data, extensionRegistry);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(byte[] data)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      byte[] data,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws com.google.protobuf.InvalidProtocolBufferException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, data, extensionRegistry);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(java.io.InputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, input);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, input, extensionRegistry);
  }

  public static com.basemind.client.grpc.PromptConfigResponse parseDelimitedFrom(java.io.InputStream input)
      throws java.io.IOException {
    return parseDelimitedFrom(DEFAULT_INSTANCE, input);
  }

  public static com.basemind.client.grpc.PromptConfigResponse parseDelimitedFrom(
      java.io.InputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return parseDelimitedFrom(DEFAULT_INSTANCE, input, extensionRegistry);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      com.google.protobuf.CodedInputStream input)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, input);
  }
  public static com.basemind.client.grpc.PromptConfigResponse parseFrom(
      com.google.protobuf.CodedInputStream input,
      com.google.protobuf.ExtensionRegistryLite extensionRegistry)
      throws java.io.IOException {
    return com.google.protobuf.GeneratedMessageLite.parseFrom(
        DEFAULT_INSTANCE, input, extensionRegistry);
  }

  public static Builder newBuilder() {
    return (Builder) DEFAULT_INSTANCE.createBuilder();
  }
  public static Builder newBuilder(com.basemind.client.grpc.PromptConfigResponse prototype) {
    return DEFAULT_INSTANCE.createBuilder(prototype);
  }

  /**
   * <pre>
   * A response for a prompt configuration - retrieving the expected prompt variables
   * </pre>
   *
   * Protobuf type {@code gateway.v1.PromptConfigResponse}
   */
  public static final class Builder extends
      com.google.protobuf.GeneratedMessageLite.Builder<
        com.basemind.client.grpc.PromptConfigResponse, Builder> implements
      // @@protoc_insertion_point(builder_implements:gateway.v1.PromptConfigResponse)
      com.basemind.client.grpc.PromptConfigResponseOrBuilder {
    // Construct using com.basemind.client.grpc.PromptConfigResponse.newBuilder()
    private Builder() {
      super(DEFAULT_INSTANCE);
    }


    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @return A list containing the expectedPromptVariables.
     */
    @java.lang.Override
    public java.util.List<java.lang.String>
        getExpectedPromptVariablesList() {
      return java.util.Collections.unmodifiableList(
          instance.getExpectedPromptVariablesList());
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @return The count of expectedPromptVariables.
     */
    @java.lang.Override
    public int getExpectedPromptVariablesCount() {
      return instance.getExpectedPromptVariablesCount();
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param index The index of the element to return.
     * @return The expectedPromptVariables at the given index.
     */
    @java.lang.Override
    public java.lang.String getExpectedPromptVariables(int index) {
      return instance.getExpectedPromptVariables(index);
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param index The index of the value to return.
     * @return The bytes of the expectedPromptVariables at the given index.
     */
    @java.lang.Override
    public com.google.protobuf.ByteString
        getExpectedPromptVariablesBytes(int index) {
      return instance.getExpectedPromptVariablesBytes(index);
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param index The index to set the value at.
     * @param value The expectedPromptVariables to set.
     * @return This builder for chaining.
     */
    public Builder setExpectedPromptVariables(
        int index, java.lang.String value) {
      copyOnWrite();
      instance.setExpectedPromptVariables(index, value);
      return this;
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param value The expectedPromptVariables to add.
     * @return This builder for chaining.
     */
    public Builder addExpectedPromptVariables(
        java.lang.String value) {
      copyOnWrite();
      instance.addExpectedPromptVariables(value);
      return this;
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param values The expectedPromptVariables to add.
     * @return This builder for chaining.
     */
    public Builder addAllExpectedPromptVariables(
        java.lang.Iterable<java.lang.String> values) {
      copyOnWrite();
      instance.addAllExpectedPromptVariables(values);
      return this;
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @return This builder for chaining.
     */
    public Builder clearExpectedPromptVariables() {
      copyOnWrite();
      instance.clearExpectedPromptVariables();
      return this;
    }
    /**
     * <pre>
     * The expected prompt variables
     * </pre>
     *
     * <code>repeated string expected_prompt_variables = 1 [json_name = "expectedPromptVariables"];</code>
     * @param value The bytes of the expectedPromptVariables to add.
     * @return This builder for chaining.
     */
    public Builder addExpectedPromptVariablesBytes(
        com.google.protobuf.ByteString value) {
      copyOnWrite();
      instance.addExpectedPromptVariablesBytes(value);
      return this;
    }

    // @@protoc_insertion_point(builder_scope:gateway.v1.PromptConfigResponse)
  }
  @java.lang.Override
  @java.lang.SuppressWarnings({"unchecked", "fallthrough"})
  protected final java.lang.Object dynamicMethod(
      com.google.protobuf.GeneratedMessageLite.MethodToInvoke method,
      java.lang.Object arg0, java.lang.Object arg1) {
    switch (method) {
      case NEW_MUTABLE_INSTANCE: {
        return new com.basemind.client.grpc.PromptConfigResponse();
      }
      case NEW_BUILDER: {
        return new Builder();
      }
      case BUILD_MESSAGE_INFO: {
          java.lang.Object[] objects = new java.lang.Object[] {
            "expectedPromptVariables_",
          };
          java.lang.String info =
              "\u0000\u0001\u0000\u0000\u0001\u0001\u0001\u0000\u0001\u0000\u0001\u021a";
          return newMessageInfo(DEFAULT_INSTANCE, info, objects);
      }
      // fall through
      case GET_DEFAULT_INSTANCE: {
        return DEFAULT_INSTANCE;
      }
      case GET_PARSER: {
        com.google.protobuf.Parser<com.basemind.client.grpc.PromptConfigResponse> parser = PARSER;
        if (parser == null) {
          synchronized (com.basemind.client.grpc.PromptConfigResponse.class) {
            parser = PARSER;
            if (parser == null) {
              parser =
                  new DefaultInstanceBasedParser<com.basemind.client.grpc.PromptConfigResponse>(
                      DEFAULT_INSTANCE);
              PARSER = parser;
            }
          }
        }
        return parser;
    }
    case GET_MEMOIZED_IS_INITIALIZED: {
      return (byte) 1;
    }
    case SET_MEMOIZED_IS_INITIALIZED: {
      return null;
    }
    }
    throw new UnsupportedOperationException();
  }


  // @@protoc_insertion_point(class_scope:gateway.v1.PromptConfigResponse)
  private static final com.basemind.client.grpc.PromptConfigResponse DEFAULT_INSTANCE;
  static {
    PromptConfigResponse defaultInstance = new PromptConfigResponse();
    // New instances are implicitly immutable so no need to make
    // immutable.
    DEFAULT_INSTANCE = defaultInstance;
    com.google.protobuf.GeneratedMessageLite.registerDefaultInstance(
      PromptConfigResponse.class, defaultInstance);
  }

  public static com.basemind.client.grpc.PromptConfigResponse getDefaultInstance() {
    return DEFAULT_INSTANCE;
  }

  private static volatile com.google.protobuf.Parser<PromptConfigResponse> PARSER;

  public static com.google.protobuf.Parser<PromptConfigResponse> parser() {
    return DEFAULT_INSTANCE.getParserForType();
  }
}
