// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "cohere/v1/cohere.proto" (package "cohere.v1", syntax proto3)
// tslint:disable
// @generated by protobuf-ts 2.9.4 with parameter generate_dependencies,long_type_string,output_javascript_es2020,server_grpc1,force_client_none
// @generated from protobuf file "cohere/v1/cohere.proto" (package "cohere.v1", syntax proto3)
// tslint:disable
import { CohereStreamResponse } from "./cohere";
import { CoherePromptResponse } from "./cohere";
import { CoherePromptRequest } from "./cohere";
/**
 * @grpc/grpc-js definition for the protobuf service cohere.v1.CohereService.
 *
 * Usage: Implement the interface ICohereService and add to a grpc server.
 *
 * ```typescript
 * const server = new grpc.Server();
 * const service: ICohereService = ...
 * server.addService(cohereServiceDefinition, service);
 * ```
 */
export const cohereServiceDefinition = {
    coherePrompt: {
        path: "/cohere.v1.CohereService/CoherePrompt",
        originalName: "CoherePrompt",
        requestStream: false,
        responseStream: false,
        responseDeserialize: bytes => CoherePromptResponse.fromBinary(bytes),
        requestDeserialize: bytes => CoherePromptRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(CoherePromptResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(CoherePromptRequest.toBinary(value))
    },
    cohereStream: {
        path: "/cohere.v1.CohereService/CohereStream",
        originalName: "CohereStream",
        requestStream: false,
        responseStream: true,
        responseDeserialize: bytes => CohereStreamResponse.fromBinary(bytes),
        requestDeserialize: bytes => CoherePromptRequest.fromBinary(bytes),
        responseSerialize: value => Buffer.from(CohereStreamResponse.toBinary(value)),
        requestSerialize: value => Buffer.from(CoherePromptRequest.toBinary(value))
    }
};
