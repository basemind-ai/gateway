package com.ai.basemind.client.testapp

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ai.basemind.client.testapp.ui.ChatScreen
import com.ai.basemind.client.testapp.ui.ConfigScreen
import com.ai.basemind.client.testapp.ui.MainViewModel
import com.ai.basemind.client.testapp.ui.model.ChatUiModel
import com.ai.basemind.client.testapp.ui.theme.BaseMindAITheme

class MainActivity : ComponentActivity() {
    private val viewModel: MainViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            BaseMindAITheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background,
                ) {
                    App(viewModel)
                }
            }
        }
    }
}

@Composable
fun App(vm: MainViewModel) {
    val navController = rememberNavController()
    val conversation = vm.conversation.collectAsState()

    NavHost(navController, startDestination = "config") {
        composable(route = "config") {
            ConfigScreen(navController)
        }
        composable(route = "chat") {
            ChatScreen(
                model =
                ChatUiModel(
                    messages = conversation.value,
                    addressee = ChatUiModel.Author.bot,
                ),
                onSendChatClickListener = { msg -> vm.sendPromt(msg) },
                modifier = Modifier,
            )
        }
    }
}
