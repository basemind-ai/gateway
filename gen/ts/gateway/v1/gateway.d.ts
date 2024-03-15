// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "gateway/v1/gateway.proto" (package "gateway.v1", syntax proto3)
// tslint:disable
import { MessageType } from "@protobuf-ts/runtime";
/**
 * A request for a prompt - sending user input to the server.
 *
 * @generated from protobuf message gateway.v1.PromptRequest
 */
export interface PromptRequest {
    /**
     * The User prompt variables
     * This is a hash-map of variables that should have the same keys as those contained by the PromptConfigResponse
     *
     * @generated from protobuf field: map<string, string> template_variables = 1;
     */
    templateVariables: {
        [key: string]: string;
    };
    /**
     * Optional Identifier designating the prompt config ID to use. If not set, the default prompt config will be used.
     *
     * @generated from protobuf field: optional string prompt_config_id = 2;
     */
    promptConfigId?: string;
}
/**
 * A Prompt Response Message
 *
 * @generated from protobuf message gateway.v1.PromptResponse
 */
export interface PromptResponse {
    /**
     * Prompt Content
     *
     * @generated from protobuf field: string content = 1;
     */
    content: string;
    /**
     * Number of tokens used for the prompt request
     *
     * @generated from protobuf field: uint32 request_tokens = 2;
     */
    requestTokens: number;
    /**
     * Number of tokens used for the prompt response
     *
     * @generated from protobuf field: uint32 response_tokens = 3;
     */
    responseTokens: number;
    /**
     * Request duration
     *
     * @generated from protobuf field: uint32 request_duration = 4;
     */
    requestDuration: number;
}
/**
 * An Streaming Prompt Response Message
 *
 * @generated from protobuf message gateway.v1.StreamingPromptResponse
 */
export interface StreamingPromptResponse {
    /**
     * Prompt Content
     *
     * @generated from protobuf field: string content = 1;
     */
    content: string;
    /**
     * Finish reason, given when the stream ends
     *
     * @generated from protobuf field: optional string finish_reason = 2;
     */
    finishReason?: string;
    /**
     * Number of tokens used for the prompt request, given when the stream ends
     *
     * @generated from protobuf field: optional uint32 request_tokens = 3;
     */
    requestTokens?: number;
    /**
     * Number of tokens used for the prompt response, given when the stream ends
     *
     * @generated from protobuf field: optional uint32 response_tokens = 4;
     */
    responseTokens?: number;
    /**
     * Stream duration, given when the stream ends
     *
     * @generated from protobuf field: optional uint32 stream_duration = 5;
     */
    streamDuration?: number;
}
declare class PromptRequest$Type extends MessageType<PromptRequest> {
    constructor();
}
/**
 * @generated MessageType for protobuf message gateway.v1.PromptRequest
 */
export declare const PromptRequest: PromptRequest$Type;
declare class PromptResponse$Type extends MessageType<PromptResponse> {
    constructor();
}
/**
 * @generated MessageType for protobuf message gateway.v1.PromptResponse
 */
export declare const PromptResponse: PromptResponse$Type;
declare class StreamingPromptResponse$Type extends MessageType<StreamingPromptResponse> {
    constructor();
}
/**
 * @generated MessageType for protobuf message gateway.v1.StreamingPromptResponse
 */
export declare const StreamingPromptResponse: StreamingPromptResponse$Type;
/**
 * @generated ServiceType for protobuf service gateway.v1.APIGatewayService
 */
export declare const APIGatewayService: any;
export {};
