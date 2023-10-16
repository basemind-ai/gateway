package com.ai.basemind.client.testapp.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.ai.basemind.client.testapp.ui.model.ConfigModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ConfigScreen(navController: NavController) {
    var apiKey by remember { mutableStateOf(TextFieldValue("")) }

    val valid = apiKey.text != ""

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text("Test App")
                },
            )
        },
    ) { innerPadding ->
        Surface(
            modifier = Modifier.fillMaxSize().padding(innerPadding),
            color = MaterialTheme.colorScheme.background,
        ) {
            Column(
                modifier = Modifier.fillMaxSize().padding(16.dp),
                verticalArrangement = Arrangement.Center,
                horizontalAlignment = Alignment.CenterHorizontally,
            ) {
                TextField(
                    label = { Text("API Key") },
                    value = apiKey,
                    onValueChange = { newText ->
                        apiKey = newText
                        ConfigModel.apiKey = newText.text
                        println(ConfigModel.apiKey)
                    },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text(text = "Enter the API Key") },
                )
                Spacer(Modifier.height(16.dp))

                Button(onClick = {
                    navController.navigate("chat")
                    ConfigModel.streamingPrompt = false
                }, modifier = Modifier.fillMaxWidth(), enabled = valid) {
                    Text("Launch Prompt Example")
                }
                Spacer(Modifier.height(12.dp))
                Button(onClick = {
                    navController.navigate("chat")
                    ConfigModel.streamingPrompt = true
                }, modifier = Modifier.fillMaxWidth(), enabled = valid) {
                    Text("Launch Streaming Prompt Example")
                }
            }
        }
    }
}
