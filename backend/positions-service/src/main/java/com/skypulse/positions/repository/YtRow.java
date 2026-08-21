package com.skypulse.positions.repository;

import com.fasterxml.jackson.databind.JsonNode;
import com.skypulse.positions.repository.exception.MalformedRowException;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;
import org.slf4j.Logger;

/**
 * Чтение полей строки YT. Jackson на пустом и нечисловом поле молча отдаёт ноль,
 * поэтому обязательные поля читаются отдельными методами: пропущенная координата
 * должна быть ошибкой, а не самолётом в точке (0, 0).
 */
final class YtRow {

    private YtRow() {
    }

    static String requiredText(JsonNode row, String field) {
        String value = text(row, field);
        if (value == null) {
            throw new MalformedRowException(field);
        }
        return value;
    }

    static long requiredLong(JsonNode row, String field) {
        return number(row, field).asLong();
    }

    static double requiredDouble(JsonNode row, String field) {
        return number(row, field).asDouble();
    }

    static Double nullableDouble(JsonNode row, String field) {
        JsonNode value = row.get(field);
        return value == null || value.isNull() ? null : value.asDouble();
    }

    static Long nullableLong(JsonNode row, String field) {
        JsonNode value = row.get(field);
        return value == null || value.isNull() ? null : value.asLong();
    }

    static boolean flag(JsonNode row, String field) {
        return row.path(field).asBoolean();
    }

    static String text(JsonNode row, String field) {
        JsonNode value = row.get(field);
        if (value == null || value.isNull()) {
            return null;
        }
        String asText = value.asText();
        return asText.isBlank() ? null : asText;
    }

    /** Битая строка — дефект пайплайна, а не повод уронить всю выдачу. */
    static <T> List<T> mapSkippingBroken(List<JsonNode> rows, Function<JsonNode, T> mapper, Logger log) {
        List<T> mapped = new ArrayList<>(rows.size());
        List<String> skipped = new ArrayList<>();
        for (JsonNode row : rows) {
            try {
                mapped.add(mapper.apply(row));
            } catch (MalformedRowException e) {
                skipped.add(e.getMessage());
            }
        }
        if (!skipped.isEmpty()) {
            log.warn("Пропущено строк с негодными данными: {} из {}. Первая: {}",
                    skipped.size(), rows.size(), skipped.getFirst());
        }
        return mapped;
    }

    private static JsonNode number(JsonNode row, String field) {
        JsonNode value = row.get(field);
        if (value == null || !(value.isNumber() || isNumericText(value))) {
            throw new MalformedRowException(field);
        }
        return value;
    }

    private static boolean isNumericText(JsonNode value) {
        if (!value.isTextual()) {
            return false;
        }
        try {
            Double.parseDouble(value.asText());
            return true;
        } catch (NumberFormatException e) {
            return false;
        }
    }
}
