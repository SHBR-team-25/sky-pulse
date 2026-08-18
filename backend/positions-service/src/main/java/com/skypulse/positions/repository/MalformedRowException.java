package com.skypulse.positions.repository;

/**
 * В строке ответа YT нет значения, без которого она бессмысленна. Это тот же
 * «источник отдал негодное»: одиночная запись превращается в 503, а в списке
 * такая строка пропускается, чтобы не терять всю выдачу из-за одной.
 */
public class MalformedRowException extends DataSourceUnavailableException {

    public MalformedRowException(String field) {
        super("В строке ответа YT нет обязательного поля " + field);
    }

    public MalformedRowException(String message, Throwable cause) {
        super(message, cause);
    }
}
