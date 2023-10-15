package com.ai.basemind.client.testapp.ui

import ai.basemind.client.BaseMindClient
import ai.basemind.client.Options
import com.ai.basemind.client.testapp.ui.model.ChatUiModel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.ai.basemind.client.testapp.ui.model.ConfigModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch


class MainViewModel : ViewModel() {

    val conversation: StateFlow<List<ChatUiModel.Message>>
        get() = _conversation
    private val _conversation = MutableStateFlow(
        listOf(ChatUiModel.Message.initConv)
    )

    suspend fun emitBotMessage(message: String) {
        val botChat = ChatUiModel.Message(message, ChatUiModel.Author.bot)
        _conversation.emit(_conversation.value + botChat)
    }

    fun sendPromt(msg: String) {
        val myChat = ChatUiModel.Message(msg, ChatUiModel.Author.me)
        viewModelScope.launch {
            _conversation.emit(_conversation.value + myChat)

            val client = BaseMindClient.getInstance(ConfigModel.apiKey, options = Options(debug = true))
            try {
                val map = mapOf("userInput" to msg)

                if (ConfigModel.streamingPrompt) {
                    val response = client.requestStream(map)
                    response.collect {
                        emitBotMessage(it.content)
                    }
                } else {
                    val response = client.requestPrompt(map)
                    emitBotMessage(response.content)

                    val metaData = """
                        [MetaData]
                        Request Tokens: ${response.requestTokens}
                        Response Tokens: ${response.responseTokens}
                        Request Duration: ${response.requestDuration}
                    """.trimIndent()
                    emitBotMessage(metaData)
                }
            } catch (e: Exception) {
                val errorMessage = e.message.toString()
                emitBotMessage(errorMessage)
            }
        }
    }
}
