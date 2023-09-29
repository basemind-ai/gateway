// @generated by protobuf-ts 2.9.1 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "gateway/v1/gateway.proto" (package "gateway.v1", syntax proto3)
// tslint:disable
// @generated by protobuf-ts 2.9.1 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "gateway/v1/gateway.proto" (package "gateway.v1", syntax proto3)
// tslint:disable
import { StreamingPromptResponse } from "./gateway";
import { PromptResponse } from "./gateway";
import { PromptRequest } from "./gateway";
import { PromptConfigResponse } from "./gateway";
import { PromptConfigRequest } from "./gateway";
/**
 * @grpc/grpc-js definition for the protobuf service gateway.v1.APIGatewayService.
 *
 * Usage: Implement the interface IAPIGatewayService and add to a grpc server.
 *
 * ```typescript
 * const server = new grpc.Server();
 * const service: IAPIGatewayService = ...
 * server.addService(aPIGatewayServiceDefinition, service);
 * ```
 */
export const aPIGatewayServiceDefinition = {
    requestPromptConfig: {
        path: "/gateway.v1.APIGatewayService/RequestPromptConfig",
        originalName: "RequestPromptConfig",
        requestStream: false,
        responseStream: false,
        responseDeserialize: bytes => PromptConfigResponse.fromBinary(bytes),
        requestDeserialize: bytes => PromptConfigRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(PromptConfigResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(PromptConfigRequest.toBinary(value))
    },
    requestPrompt: {
        path: "/gateway.v1.APIGatewayService/RequestPrompt",
        originalName: "RequestPrompt",
        requestStream: false,
        responseStream: false,
        responseDeserialize: bytes => PromptResponse.fromBinary(bytes),
        requestDeserialize: bytes => PromptRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(PromptResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(PromptRequest.toBinary(value))
    },
    requestStreamingPrompt: {
        path: "/gateway.v1.APIGatewayService/RequestStreamingPrompt",
        originalName: "RequestStreamingPrompt",
        requestStream: false,
        responseStream: true,
        responseDeserialize: bytes => StreamingPromptResponse.fromBinary(bytes),
        requestDeserialize: bytes => PromptRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(StreamingPromptResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(PromptRequest.toBinary(value))
    }
};
