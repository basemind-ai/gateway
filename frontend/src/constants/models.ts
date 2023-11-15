import { ModelsRecord, ModelType, ModelVendor } from '@/types';

const openAIIcon = 'openAI-icon.svg';
const tempatureTooltip =
	'Controls randomness: Lowering results in less random completions. As the temperature approaches zero, the model will become deterministic and repetitive. Higher temperature results in more random completions.';
const topPTooltip =
	'Controls diversity via nucleus sampling: 0.5 means half of all likelihood-weighted options are considered. As the top_p approaches 1, the model will become deterministic and repetitive.';
const frequencyPenaltyTooltip =
	"How much to penalize new tokens based on their existing frequency in the text so far. Decreases the model's likelihood to repeat the same line verbatim.";
const presencePenaltyTooltip =
	'How much to penalize new tokens based on whether they appear in the text so far. Increases the model’s likelihood to talk about new topics.';
const maxTokensTooltip =
	'The maximum number of tokens to generate. Requests can use up to 2048 tokens shared between prompt and response.';

export const models: ModelsRecord = {
	[ModelVendor.OpenAI]: {
		[ModelType.Gpt4]: {
			icon: openAIIcon,
			name: 'GPT-4',
			parameters: {
				frequencyPenalty: { max: 2, min: 0, step: 0.1 },
				maxTokens: { max: 8192, min: 2, step: 10 },
				presencePenalty: { max: 2, min: 0, step: 0.1 },
				temperature: { max: 2, min: 0, step: 0.1 },
				topP: { max: 2, min: 0, step: 0.1 },
			},
		},
		[ModelType.Gpt35Turbo]: {
			icon: openAIIcon,
			name: 'GPT-3.5',
			parameters: {
				frequencyPenalty: { max: 2, min: 0, step: 0.1 },
				maxTokens: { max: 4096, min: 2, step: 10 },
				presencePenalty: { max: 2, min: 0, step: 0.1 },
				temperature: { max: 1, min: 0, step: 0.1 },
				topP: { max: 1, min: 0, step: 0.1 },
			},
		},
		[ModelType.Gpt3516K]: {
			icon: openAIIcon,
			name: 'GPT-3.5 16K',
			parameters: {
				frequencyPenalty: { max: 2, min: 0, step: 0.1 },
				maxTokens: { max: 16_384, min: 2, step: 10 },
				presencePenalty: { max: 2, min: 0, step: 0.1 },
				temperature: { max: 1, min: 0, step: 0.1 },
				topP: { max: 1, min: 0, step: 0.1 },
			},
		},
		[ModelType.Gpt432K]: {
			icon: openAIIcon,
			name: 'GPT-4 32K',
			parameters: {
				frequencyPenalty: { max: 2, min: 0, step: 0.1 },
				maxTokens: { max: 32_768, min: 2, step: 10 },
				presencePenalty: { max: 2, min: 0, step: 0.1 },
				temperature: { max: 1, min: 0, step: 0.1 },
				topP: { max: 1, min: 0, step: 0.1 },
			},
		},
	},
};

export const ToolTipText = {
	frequencyPenalty: frequencyPenaltyTooltip,
	maxTokens: maxTokensTooltip,
	presencePenalty: presencePenaltyTooltip,
	temperature: tempatureTooltip,
	topP: topPTooltip,
};
