package com.skypulse.analytics.model;

import java.util.List;

/** asOf — момент запроса: борта берутся из текущего снапшота позиций, а не из агрегатов. */
public record Emergencies(long asOf, List<EmergencyFlight> flights) {
}
