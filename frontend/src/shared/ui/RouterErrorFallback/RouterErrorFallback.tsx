import { Alert, Button } from '@gravity-ui/uikit';
import { isRouteErrorResponse, useRouteError } from 'react-router';
import { ApiError } from '@shared/api';
import styles from './RouterErrorFallback.module.css';

function describeError(error: unknown): { title: string; message: string } {
    if (isRouteErrorResponse(error)) {
        return {
            title: `Что-то пошло не так: ${error.status}`,
            message: `${error.statusText || 'Ошибка запроса'}\nПопробуйте перезагрузить страницу`,
        };
    }

    if (error instanceof ApiError) {
        return {
            title: `Что-то пошло не так: ${error.status}`,
            message: `${error.message}\nПопробуйте перезагрузить страницу`,
        };
    }

    if (error instanceof Error) {
        return {
            title: `Что-то пошло не так: ${error.name}`,
            message: `${error.message}\nПопробуйте перезагрузить страницу`,
        };
    }

    return {
        title: 'Что-то пошло не так: Неизвестная ошибка',
        message: 'Попробуйте перезагрузить страницу',
    };
}

export function RouterErrorFallback() {
    const { title, message } = describeError(useRouteError());

    return (
        <div className={styles.fallback}>
            <Alert
                theme="danger"
                title={title}
                message={message}
                actions={<Button onClick={() => window.location.reload()}>Перезагрузить</Button>}
            />
        </div>
    );
}
