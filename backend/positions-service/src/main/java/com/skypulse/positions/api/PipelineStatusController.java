package com.skypulse.positions.api;

import com.skypulse.positions.api.dto.PipelineStatusDto;
import com.skypulse.positions.service.PipelineStatusService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pipeline-status")
public class PipelineStatusController {

    private final PipelineStatusService service;

    public PipelineStatusController(PipelineStatusService service) {
        this.service = service;
    }

    @GetMapping
    public PipelineStatusDto current() {
        return PipelineStatusDto.from(service.current());
    }
}
