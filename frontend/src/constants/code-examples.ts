export const KotlinCode = `suspend fun getPrompt(userInput: String): String {
	val client = BaseMindClient.getInstance(apiToken = "myToken")

	val templateVariables = mutableMapOf<String, String>()
	templateVariables["userInput"] = userInput

	val result = client.requestPrompt(templateVariables)
	return result.content'
}`;
