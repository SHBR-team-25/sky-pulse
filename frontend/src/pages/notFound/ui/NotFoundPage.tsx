import { useNavigate } from 'react-router';
import styles from './NotFoundPage.module.css';
import illustrationUrl from '../assets/404.svg';
import { Button } from '@gravity-ui/uikit';

export function NotFoundPage() {
    const navigate = useNavigate();

    return (
        <>
            <div className={styles.app}>
                <div className={styles.content}>
                    <img src={illustrationUrl} />
                    <div className={styles.description}>
                        <h2>Страница не найдена</h2>
                        <p>Запрашиваемая страница не найдена или была удалена</p>
                        <Button className={styles.button} onClick={() => navigate('/')}>
                            Вернуться на главную
                        </Button>
                    </div>
                </div>
            </div>
        </>
    );
}
