package com.skypulse.positions.repository;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class YtQueryClientTest {

    @Test
    void normalizesProxyUrlWithMissingScheme() {
        assertThat(YtQueryClient.normalizeProxyUrl("http-proxy-hackathon.demo.ytsaurus.tech"))
                .isEqualTo("https://http-proxy-hackathon.demo.ytsaurus.tech");
        assertThat(YtQueryClient.normalizeProxyUrl("https://already-has-scheme.tech"))
                .isEqualTo("https://already-has-scheme.tech");
        assertThat(YtQueryClient.normalizeProxyUrl("http://localhost:8000"))
                .isEqualTo("http://localhost:8000");
    }
}
