package com.skypulse.positions.model;

public record PipelineHealth(PipelineStatus status, boolean stale) {
}
