package com.skypulse.positions.api;

import com.skypulse.positions.repository.DataSourceRejectedException;
import com.skypulse.positions.repository.DataSourceUnavailableException;
import com.skypulse.positions.service.PositionNotFoundException;
import java.time.Instant;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.web.ErrorResponse;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

/**
 * Единое тело ошибки с полем `message` для всех кодов. Наследуемся от
 * ResponseEntityExceptionHandler, иначе перехват Exception превратил бы
 * ошибки самого Spring MVC (кривой тип параметра, неподдерживаемый метод) в 500.
 */
@RestControllerAdvice
public class ApiExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger LOG = LoggerFactory.getLogger(ApiExceptionHandler.class);

    @ExceptionHandler(PositionNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleNotFound(PositionNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorBody(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    /**
     * Отказ источника, а не баг сервиса, поэтому 503: по коду фронт отличает
     * «данные временно не отдаются» от «сервис сломан». Сюда же попадает
     * негодный ответ YT — повторить запрос осмысленно и в этом случае.
     */
    @ExceptionHandler(DataSourceUnavailableException.class)
    public ResponseEntity<Map<String, Object>> handleSourceUnavailable(DataSourceUnavailableException ex) {
        // Подробности источника — trace_id, текст QL-запроса, пути таблиц — остаются в логе.
        LOG.error("Источник данных недоступен", ex);
        Map<String, Object> body = errorBody(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Источник данных YTsaurus недоступен, попробуйте повторить запрос позже");
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(body);
    }

    // Источник отклонил наш запрос: повтор не поможет, чинить нужно сервис.
    @ExceptionHandler(DataSourceRejectedException.class)
    public ResponseEntity<Map<String, Object>> handleSourceRejected(DataSourceRejectedException ex) {
        LOG.error("YTsaurus отклонил запрос сервиса", ex);
        Map<String, Object> body = errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Внутренняя ошибка сервиса");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleUnexpected(Exception ex) {
        LOG.error("Необработанная ошибка при обработке запроса", ex);
        Map<String, Object> body = errorBody(HttpStatus.INTERNAL_SERVER_ERROR, "Внутренняя ошибка сервиса");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    @Override
    protected ResponseEntity<Object> handleExceptionInternal(
            Exception ex,
            Object body,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {
        // Штатные обработчики Spring отдают сюда body == null и ждут, что тело
        // соберут из самой ошибки.
        Object resolved = body == null && ex instanceof ErrorResponse springError ? springError.getBody() : body;
        String message = resolved instanceof ProblemDetail problem ? problem.getDetail() : null;
        return new ResponseEntity<>(errorBody(status, message), headers, status);
    }

    private static Map<String, Object> errorBody(HttpStatusCode status, String message) {
        return Map.of(
                "timestamp", Instant.now().toString(),
                "status", status.value(),
                "error", reasonPhrase(status),
                "message", message == null ? "Запрос не выполнен" : message);
    }

    private static String reasonPhrase(HttpStatusCode status) {
        HttpStatus known = HttpStatus.resolve(status.value());
        return known == null ? "Error" : known.getReasonPhrase();
    }
}
