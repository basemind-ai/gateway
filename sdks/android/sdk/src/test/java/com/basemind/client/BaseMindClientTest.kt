package com.basemind.client

import org.junit.jupiter.api.Assertions.assertDoesNotThrow
import org.junit.jupiter.api.Assertions.assertThrows
import org.junit.jupiter.api.Test

class BaseMindClientTest {
    @Test
    fun throws_exception_when_api_key_is_empty() {
        assertThrows(
            MissingAPIKeyException::class.java,
            {BaseMindClient("")},
            "empty apiToken should throw"
        )
    }

    @Test
    fun does_not_throw_exception_when_api_key_is_provided() {
        assertDoesNotThrow {
            BaseMindClient("abc")
        }
    }
}
