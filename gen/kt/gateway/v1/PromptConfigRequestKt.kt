// Generated by the protocol buffer compiler. DO NOT EDIT!
// source: gateway/v1/gateway.proto

// Generated files should ignore deprecation warnings
@file:Suppress("DEPRECATION")
package gateway.v1;

@kotlin.jvm.JvmName("-initializepromptConfigRequest")
public inline fun promptConfigRequest(block: gateway.v1.PromptConfigRequestKt.Dsl.() -> kotlin.Unit): gateway.v1.Gateway.PromptConfigRequest =
  gateway.v1.PromptConfigRequestKt.Dsl._create(gateway.v1.Gateway.PromptConfigRequest.newBuilder()).apply { block() }._build()
/**
 * ```
 * A request for a prompt configuration - retrieving the expected prompt variables
 * ```
 *
 * Protobuf type `gateway.v1.PromptConfigRequest`
 */
public object PromptConfigRequestKt {
  @kotlin.OptIn(com.google.protobuf.kotlin.OnlyForUseByGeneratedProtoCode::class)
  @com.google.protobuf.kotlin.ProtoDslMarker
  public class Dsl private constructor(
    private val _builder: gateway.v1.Gateway.PromptConfigRequest.Builder
  ) {
    public companion object {
      @kotlin.jvm.JvmSynthetic
      @kotlin.PublishedApi
      internal fun _create(builder: gateway.v1.Gateway.PromptConfigRequest.Builder): Dsl = Dsl(builder)
    }

    @kotlin.jvm.JvmSynthetic
    @kotlin.PublishedApi
    internal fun _build(): gateway.v1.Gateway.PromptConfigRequest = _builder.build()

    /**
     * ```
     * The application ID, this value represents the APP ID as configured in our db.
     * ```
     *
     * `string application_id = 1 [json_name = "applicationId"];`
     */
    public var applicationId: kotlin.String
      @JvmName("getApplicationId")
      get() = _builder.getApplicationId()
      @JvmName("setApplicationId")
      set(value) {
        _builder.setApplicationId(value)
      }
    /**
     * ```
     * The application ID, this value represents the APP ID as configured in our db.
     * ```
     *
     * `string application_id = 1 [json_name = "applicationId"];`
     */
    public fun clearApplicationId() {
      _builder.clearApplicationId()
    }
  }
}
@kotlin.jvm.JvmSynthetic
public inline fun gateway.v1.Gateway.PromptConfigRequest.copy(block: `gateway.v1`.PromptConfigRequestKt.Dsl.() -> kotlin.Unit): gateway.v1.Gateway.PromptConfigRequest =
  `gateway.v1`.PromptConfigRequestKt.Dsl._create(this.toBuilder()).apply { block() }._build()