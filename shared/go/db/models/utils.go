package models

import (
	"fmt"
	"slices"
)

var (
	openAIModels = []string{
		string(ModelTypeGpt35Turbo),
		string(ModelTypeGpt35Turbo16k),
		string(ModelTypeGpt4),
		string(ModelTypeGpt432k),
	}
	cohereModels = []string{
		string(ModelTypeCommand),
		string(ModelTypeCommandLight),
		string(ModelTypeCommandNightly),
		string(ModelTypeCommandLightNightly),
	}
)

func ValidateModelType(vendor ModelVendor, modelType ModelType) error {
	if vendor == ModelVendorOPENAI && slices.Contains(openAIModels, string(modelType)) {
		return nil
	}
	if vendor == ModelVendorCOHERE && slices.Contains(cohereModels, string(modelType)) {
		return nil
	}

	return fmt.Errorf("unsupported model type {%s}", modelType)
}
