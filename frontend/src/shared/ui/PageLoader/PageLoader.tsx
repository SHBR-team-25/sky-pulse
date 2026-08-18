import { Loader } from '@gravity-ui/uikit';
import styles from './PageLoader.module.css';

export function PageLoader() {
    return (
        <div className={styles.loader} role="status" aria-label="Загрузка страницы">
            <Loader size="l" />
        </div>
    );
}
