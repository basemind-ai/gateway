// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "ptesting/v1/ptesting.proto" (package "ptesting.v1", syntax proto3)
// tslint:disable
// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "ptesting/v1/ptesting.proto" (package "ptesting.v1", syntax proto3)
// tslint:disable
import { PromptTestingStreamingPromptResponse } from "./ptesting";
import { PromptTestRequest } from "./ptesting";
/**
 * @grpc/grpc-js definition for the protobuf service ptesting.v1.PromptTestingService.
 *
 * Usage: Implement the interface IPromptTestingService and add to a grpc server.
 *
 * ```typescript
 * const server = new grpc.Server();
 * const service: IPromptTestingService = ...
 * server.addService(promptTestingServiceDefinition, service);
 * ```
 */
export const promptTestingServiceDefinition = {
    testPrompt: {
        path: "/ptesting.v1.PromptTestingService/TestPrompt",
        originalName: "TestPrompt",
        requestStream: false,
        responseStream: true,
        responseDeserialize: bytes => PromptTestingStreamingPromptResponse.fromBinary(bytes),
        requestDeserialize: bytes => PromptTestRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(PromptTestingStreamingPromptResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(PromptTestRequest.toBinary(value))
    }
};
