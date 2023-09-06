// @generated by protobuf-ts 2.9.1 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "proto/openai/service/v1/openai.proto" (package "openai.service.v1", syntax proto3)
// tslint:disable
import type { BinaryWriteOptions } from "@protobuf-ts/runtime";
import type { IBinaryWriter } from "@protobuf-ts/runtime";
import type { BinaryReadOptions } from "@protobuf-ts/runtime";
import type { IBinaryReader } from "@protobuf-ts/runtime";
import type { PartialMessage } from "@protobuf-ts/runtime";
import { MessageType } from "@protobuf-ts/runtime";
/**
 * An OpenAI function call
 *
 * @generated from protobuf message openai.service.v1.OpenAIFunctionCall
 */
export interface OpenAIFunctionCall {
    /**
     * The signature of the function arguments
     *
     * @generated from protobuf field: string arguments = 1;
     */
    arguments: string;
    /**
     * The function name
     *
     * @generated from protobuf field: string name = 2;
     */
    name: string;
}
/**
 * An OpenAI Chat Message
 *
 * @generated from protobuf message openai.service.v1.OpenAIMessage
 */
export interface OpenAIMessage {
    /**
     * The content of the message
     *
     * @generated from protobuf field: optional string content = 1;
     */
    content?: string;
    /**
     * The role of the message
     *
     * @generated from protobuf field: openai.service.v1.OpenAIMessageRole role = 2;
     */
    role: OpenAIMessageRole;
    /**
     * Name of the message author or function name
     *
     * @generated from protobuf field: optional string name = 3;
     */
    name?: string;
    /**
     * The signature function to invoke, if any
     *
     * @generated from protobuf field: optional openai.service.v1.OpenAIFunctionCall function_call = 4;
     */
    functionCall?: OpenAIFunctionCall;
}
/**
 * A Request for an OpenAI regular LLM Prompt
 *
 * @generated from protobuf message openai.service.v1.OpenAIPromptRequest
 */
export interface OpenAIPromptRequest {
    /**
     * OpenAI Model identifier
     *
     * @generated from protobuf field: openai.service.v1.OpenAIModel model = 1;
     */
    model: OpenAIModel;
    /**
     * Prompt Messages
     *
     * @generated from protobuf field: repeated openai.service.v1.OpenAIMessage messages = 2 [packed = true];
     */
    messages: OpenAIMessage[];
    /**
     * Temperature Sampling: https://platform.openai.com/docs/api-reference/chat/create#temperature
     *
     * @generated from protobuf field: optional float temperature = 3;
     */
    temperature?: number;
    /**
     * Nucleus Sampling: https://platform.openai.com/docs/api-reference/chat/create#top_p
     *
     * @generated from protobuf field: optional float top_p = 4;
     */
    topP?: number;
    /**
     * Maximum Tokens after which the prompt will stop generating a response;
     *
     * @generated from protobuf field: optional uint32 max_tokens = 5;
     */
    maxTokens?: number;
    /**
     * Unique user ID to keep track of conversations;
     *
     * @generated from protobuf field: optional string user_id = 6;
     */
    userId?: string;
    /**
     * Penalize New tokens: https://platform.openai.com/docs/api-reference/chat/create#presence_penalty
     *
     * @generated from protobuf field: optional float presence_penalty = 7;
     */
    presencePenalty?: number;
    /**
     * Penalize Repeated tokens: https://platform.openai.com/docs/api-reference/chat/create#frequency_penalty
     *
     * @generated from protobuf field: optional float frequency_penalty = 8;
     */
    frequencyPenalty?: number;
}
/**
 * An OpenAI Prompt Response Message
 *
 * @generated from protobuf message openai.service.v1.OpenAIPromptResponse
 */
export interface OpenAIPromptResponse {
    /**
     * Prompt Content
     *
     * @generated from protobuf field: string content = 1;
     */
    content: string;
    /**
     * Number of tokens used for the prompt
     *
     * @generated from protobuf field: uint32 prompt_tokens = 2;
     */
    promptTokens: number;
    /**
     * Number of tokens used to generate the completion
     *
     * @generated from protobuf field: uint32 completion_tokens = 3;
     */
    completionTokens: number;
    /**
     * Total number of tokens used to generate the response
     *
     * @generated from protobuf field: uint32 total_tokens = 4;
     */
    totalTokens: number;
}
/**
 * An OpenAI Streaming Response Message
 *
 * @generated from protobuf message openai.service.v1.OpenAIStreamResponse
 */
export interface OpenAIStreamResponse {
    /**
     * Prompt Content
     *
     * @generated from protobuf field: string content = 1;
     */
    content: string;
    /**
     * Finish reason, if this is the last message
     *
     * @generated from protobuf field: optional string finish_reason = 2;
     */
    finishReason?: string;
}
/**
 * Type of OpenAI Model
 *
 * @generated from protobuf enum openai.service.v1.OpenAIModel
 */
export declare enum OpenAIModel {
    /**
     * OpenAI Model is not Specified
     *
     * @generated from protobuf enum value: OPEN_AI_MODEL_UNSPECIFIED = 0;
     */
    OPEN_AI_MODEL_UNSPECIFIED = 0,
    /**
     * OpenAI GPT3.5 Turbo 4K
     *
     * @generated from protobuf enum value: OPEN_AI_MODEL_GPT3_5_TURBO_4K = 1;
     */
    OPEN_AI_MODEL_GPT3_5_TURBO_4K = 1,
    /**
     * OpenAI GPT3.5 Turbo 16K
     *
     * @generated from protobuf enum value: OPEN_AI_MODEL_GPT3_5_TURBO_16K = 2;
     */
    OPEN_AI_MODEL_GPT3_5_TURBO_16K = 2,
    /**
     * OpenAI GPT4 8K
     *
     * @generated from protobuf enum value: OPEN_AI_MODEL_GPT4_8K = 3;
     */
    OPEN_AI_MODEL_GPT4_8K = 3,
    /**
     * OpenAI GPT4 32K
     *
     * @generated from protobuf enum value: OPEN_AI_MODEL_GPT4_32K = 4;
     */
    OPEN_AI_MODEL_GPT4_32K = 4
}
/**
 * Type of OpenAI Message
 *
 * @generated from protobuf enum openai.service.v1.OpenAIMessageRole
 */
export declare enum OpenAIMessageRole {
    /**
     * OpenAI Message type is not Specified
     *
     * @generated from protobuf enum value: OPEN_AI_MESSAGE_ROLE_UNSPECIFIED = 0;
     */
    OPEN_AI_MESSAGE_ROLE_UNSPECIFIED = 0,
    /**
     * OpenAI System message
     *
     * @generated from protobuf enum value: OPEN_AI_MESSAGE_ROLE_SYSTEM = 1;
     */
    OPEN_AI_MESSAGE_ROLE_SYSTEM = 1,
    /**
     * OpenAI User message
     *
     * @generated from protobuf enum value: OPEN_AI_MESSAGE_ROLE_USER = 2;
     */
    OPEN_AI_MESSAGE_ROLE_USER = 2,
    /**
     * OpenAI Assistant message
     *
     * @generated from protobuf enum value: OPEN_AI_MESSAGE_ROLE_ASSISTANT = 3;
     */
    OPEN_AI_MESSAGE_ROLE_ASSISTANT = 3,
    /**
     * OpenAI Function message
     *
     * @generated from protobuf enum value: OPEN_AI_MESSAGE_ROLE_FUNCTION = 4;
     */
    OPEN_AI_MESSAGE_ROLE_FUNCTION = 4
}
declare class OpenAIFunctionCall$Type extends MessageType<OpenAIFunctionCall> {
    constructor();
    create(value?: PartialMessage<OpenAIFunctionCall>): OpenAIFunctionCall;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OpenAIFunctionCall): OpenAIFunctionCall;
    internalBinaryWrite(message: OpenAIFunctionCall, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message openai.service.v1.OpenAIFunctionCall
 */
export declare const OpenAIFunctionCall: OpenAIFunctionCall$Type;
declare class OpenAIMessage$Type extends MessageType<OpenAIMessage> {
    constructor();
    create(value?: PartialMessage<OpenAIMessage>): OpenAIMessage;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OpenAIMessage): OpenAIMessage;
    internalBinaryWrite(message: OpenAIMessage, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message openai.service.v1.OpenAIMessage
 */
export declare const OpenAIMessage: OpenAIMessage$Type;
declare class OpenAIPromptRequest$Type extends MessageType<OpenAIPromptRequest> {
    constructor();
    create(value?: PartialMessage<OpenAIPromptRequest>): OpenAIPromptRequest;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OpenAIPromptRequest): OpenAIPromptRequest;
    internalBinaryWrite(message: OpenAIPromptRequest, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message openai.service.v1.OpenAIPromptRequest
 */
export declare const OpenAIPromptRequest: OpenAIPromptRequest$Type;
declare class OpenAIPromptResponse$Type extends MessageType<OpenAIPromptResponse> {
    constructor();
    create(value?: PartialMessage<OpenAIPromptResponse>): OpenAIPromptResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OpenAIPromptResponse): OpenAIPromptResponse;
    internalBinaryWrite(message: OpenAIPromptResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message openai.service.v1.OpenAIPromptResponse
 */
export declare const OpenAIPromptResponse: OpenAIPromptResponse$Type;
declare class OpenAIStreamResponse$Type extends MessageType<OpenAIStreamResponse> {
    constructor();
    create(value?: PartialMessage<OpenAIStreamResponse>): OpenAIStreamResponse;
    internalBinaryRead(reader: IBinaryReader, length: number, options: BinaryReadOptions, target?: OpenAIStreamResponse): OpenAIStreamResponse;
    internalBinaryWrite(message: OpenAIStreamResponse, writer: IBinaryWriter, options: BinaryWriteOptions): IBinaryWriter;
}
/**
 * @generated MessageType for protobuf message openai.service.v1.OpenAIStreamResponse
 */
export declare const OpenAIStreamResponse: OpenAIStreamResponse$Type;
/**
 * @generated ServiceType for protobuf service openai.service.v1.OpenAIService
 */
export declare const OpenAIService: any;
export {};
