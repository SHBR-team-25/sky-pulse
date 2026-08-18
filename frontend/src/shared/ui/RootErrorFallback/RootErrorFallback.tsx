import { Alert, Button } from '@gravity-ui/uikit';

export function RootErrorFallback() {
    return (
        <Alert
            theme="danger"
            title="Что-то пошло не так"
            message="Попробуйте перезагрузить страницу"
            actions={<Button onClick={() => window.location.reload()}>Перезагрузить</Button>}
        />
    );
}
