package com.skypulse.positions.repository;

import com.skypulse.positions.model.PipelineStatus;
import java.util.Optional;

public interface PipelineStatusRepository {

    Optional<PipelineStatus> latest();
}
