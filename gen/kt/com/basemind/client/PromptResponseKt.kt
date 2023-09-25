// Generated by the protocol buffer compiler. DO NOT EDIT!
// source: gateway/v1/gateway.proto

// Generated files should ignore deprecation warnings
@file:Suppress("DEPRECATION")
package com.basemind.client;

@kotlin.jvm.JvmName("-initializepromptResponse")
public inline fun promptResponse(block: com.basemind.client.PromptResponseKt.Dsl.() -> kotlin.Unit): com.basemind.client.Gateway.PromptResponse =
  com.basemind.client.PromptResponseKt.Dsl._create(com.basemind.client.Gateway.PromptResponse.newBuilder()).apply { block() }._build()
/**
 * ```
 * A Prompt Response Message
 * ```
 *
 * Protobuf type `gateway.v1.PromptResponse`
 */
public object PromptResponseKt {
  @kotlin.OptIn(com.google.protobuf.kotlin.OnlyForUseByGeneratedProtoCode::class)
  @com.google.protobuf.kotlin.ProtoDslMarker
  public class Dsl private constructor(
    private val _builder: com.basemind.client.Gateway.PromptResponse.Builder
  ) {
    public companion object {
      @kotlin.jvm.JvmSynthetic
      @kotlin.PublishedApi
      internal fun _create(builder: com.basemind.client.Gateway.PromptResponse.Builder): Dsl = Dsl(builder)
    }

    @kotlin.jvm.JvmSynthetic
    @kotlin.PublishedApi
    internal fun _build(): com.basemind.client.Gateway.PromptResponse = _builder.build()

    /**
     * ```
     * Prompt Content
     * ```
     *
     * `string content = 1 [json_name = "content"];`
     */
    public var content: kotlin.String
      @JvmName("getContent")
      get() = _builder.getContent()
      @JvmName("setContent")
      set(value) {
        _builder.setContent(value)
      }
    /**
     * ```
     * Prompt Content
     * ```
     *
     * `string content = 1 [json_name = "content"];`
     */
    public fun clearContent() {
      _builder.clearContent()
    }

    /**
     * ```
     * Number of tokens used for the prompt
     * ```
     *
     * `uint32 prompt_tokens = 2 [json_name = "promptTokens"];`
     */
    public var promptTokens: kotlin.Int
      @JvmName("getPromptTokens")
      get() = _builder.getPromptTokens()
      @JvmName("setPromptTokens")
      set(value) {
        _builder.setPromptTokens(value)
      }
    /**
     * ```
     * Number of tokens used for the prompt
     * ```
     *
     * `uint32 prompt_tokens = 2 [json_name = "promptTokens"];`
     */
    public fun clearPromptTokens() {
      _builder.clearPromptTokens()
    }
  }
}
@kotlin.jvm.JvmSynthetic
public inline fun com.basemind.client.Gateway.PromptResponse.copy(block: `com.basemind.client`.PromptResponseKt.Dsl.() -> kotlin.Unit): com.basemind.client.Gateway.PromptResponse =
  `com.basemind.client`.PromptResponseKt.Dsl._create(this.toBuilder()).apply { block() }._build()