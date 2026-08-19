# Технологический стек проекта

## Описание

### Архитектура

- SPA приложение
- Методология FSD

### Технологический стек

| Категория | Технология |
| --- | --- |
| Язык | TypeScript |
| State-менеджер | Zustand |
| Стили | CSS Modules |
| Роутинг | react-router-dom |
| Работа с API | TanStack Query |
| UI-компоненты | GravityUI |
| Карта | JS API яндекс карт |
| Доставка статики | Yandex Object Storage |

### Тестирование

- Vitest
- React Testing Library
- Playwright

### Инфраструктура и деплой

Статика собирается в CI и заливается в Yandex Object Storage

## Структура проекта

<!-- Блок ниже генерируется автоматически: `npm run docs:tree`.
     Руками не править — описания живут в ai/tree-comments.json. -->
<!-- TREE:START -->

```text
/src
│   main.tsx                                         # точка входа: монтирует App в DOM
│   vite-env.d.ts                                    # типы Vite и переменных окружения (import.meta.env)
│
├───app                                              # слой приложения: композиция провайдеров и layout
│   │   App.module.css                               # стили корневого layout (шапка / карта / подвал)
│   │   App.tsx                                      # корневой компонент: QueryProvider, ThemeProvider, ErrorBoundary и RouterProvider
│   │   index.ts                                     # публичный API слоя app
│   │
│   ├───providers                                    # глобальные провайдеры приложения
│   │       index.ts                                 # реэкспорт провайдеров
│   │       QueryProvider.tsx                        # оборачивает дерево в QueryClientProvider с общим queryClient
│   │
│   ├───router                                       # конфигурация маршрутов приложения
│   │       routes.tsx                               # маршруты с lazy-страницами, ErrorBoundary и prefetch карты по параметрам bounds
│   │
│   └───styles                                       # глобальные стили
│           index.css                                # CSS-переменные, reset, базовая типографика
│
├───entities                                         # слой сущностей предметной области
│   ├───airport                                      # сущность «аэропорт»
│   │   │   index.ts                                 # публичный API сущности
│   │   │
│   │   ├───model
│   │   │       mock-data.ts                         # моки пяти аэропортов и рейсов, клонированных для виртуального списка
│   │   │       types.ts                             # типы аэропортов и рейсов аэропорта, выведенные из OpenAPI-схемы
│   │   │
│   │   └───ui
│   │           AirportTooltip.module.css            # стили всплывающей подсказки аэропорта
│   │           AirportTooltip.tsx                   # подсказка аэропорта сверху с задержкой открытия 50 мс
│   │
│   ├───dashboardData                                # сущность «данные дашборда»
│   │   │   index.ts                                 # публичный API сущности
│   │   │
│   │   ├───lib
│   │   │       formatTrafficTrendData.ts            # ChartData тренда с форматом оси времени для дня или диапазона дат
│   │   │
│   │   ├───model
│   │   │       mock-data.ts                         # моки дашборда: полный, пустой и генератор по диапазону дат
│   │   │       types.ts                             # типы сводки, разбивки по фазам, топа аэропортов и тренда трафика
│   │   │
│   │   └───ui
│   │       ├───AverageDataBadge
│   │       │       AverageDataBadge.module.css      # стили плиток со средними значениями
│   │       │       AverageDataBadge.tsx             # плитки: число аэропортов, средние высота и скорость
│   │       │
│   │       ├───BusiestAirportsBadge
│   │       │       BusiestAirportsBadge.module.css  # стили списка загруженных аэропортов
│   │       │       BusiestAirportsBadge.tsx         # топ аэропортов по числу рейсов, текст-заглушка при пустом списке
│   │       │
│   │       ├───EmergencyBadge
│   │       │       EmergencyBadge.tsx               # счётчик происшествий с русской плюрализацией через Intl.PluralRules
│   │       │
│   │       ├───FlightsBadge
│   │       │       FlightsBadge.module.css          # стили блока рейсов по фазам полёта
│   │       │       FlightsBadge.tsx                 # активные рейсы и их разбивка по фазам полёта
│   │       │
│   │       └───TrafficTrendGraph
│   │               TrafficTrendGraph.module.css     # адаптивные стили контейнера графика тренда трафика
│   │               TrafficTrendGraph.tsx            # линейный Chart тренда с форматом времени для дня или диапазона дат и заглушкой пустых данных
│   │
│   └───flight                                       # сущность «рейс»
│       │   index.ts                                 # публичный API сущности
│       │
│       └───model
│               mock-data.ts                         # моки списка live-бортов и деталей рейса 4242b3
│               types.ts                             # типы live-бортов, трека, позиции и фазы полёта
│
├───features                                         # слой фич: пользовательские сценарии получения данных
│   ├───getAirports                                  # получение списка аэропортов
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useAirports.ts                       # хук и queryOptions GET /airports с дебаунсом параметров
│   │   │
│   │   └───model
│   │           types.ts                             # типы query-параметров и ответа GET /airports
│   │
│   ├───getAirportsFlights                           # получение рейсов конкретного аэропорта
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useAirportsFlights.ts                # хук GET /airports/{icao}/flights с таймаутом 5 с без повторных попыток
│   │   │
│   │   └───model
│   │           types.ts                             # типы query-параметров и ответа GET /airports/{icao}/flights
│   │
│   ├───getDashboardData                             # получение сводной статистики для дашборда
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useDashboardData.ts                  # useSuspenseQuery и queryOptions GET /stats/dashboard с query-ключами
│   │   │
│   │   ├───lib
│   │   │       dashboardRange.ts                    # диапазон дат дашборда из query-параметров from/to в unix-секундах
│   │   │
│   │   └───model
│   │           types.ts                             # типы query-параметров GET /stats/dashboard
│   │
│   ├───getLiveFlights                               # получение бортов в воздухе в реальном времени
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useLiveFlights.ts                    # хук и queryOptions GET /flights/live с поллингом и кэшем 15 с
│   │   │
│   │   └───model
│   │           types.ts                             # типы query-параметров и ответа GET /flights/live
│   │
│   └───getTargetFlight                              # получение деталей выбранного рейса
│       │   index.ts                                 # публичный API фичи
│       │
│       ├───api
│       │       useTargetFlight.ts                   # хук GET /flights/{icao24} с таймаутом 5 с без повторных попыток
│       │
│       └───model
│               types.ts                             # тип ответа GET /flights/{icao24}
│
├───pages                                            # слой страниц
│   ├───dashboard                                    # страница дашборда со статистикой полётов
│   │   │   index.ts                                 # публичный API страницы
│   │   │
│   │   └───ui
│   │           DashboardPage.module.css             # стили контейнера дашборда
│   │           DashboardPage.tsx                    # обёртка main вокруг виджета Dashboard
│   │
│   ├───layout                                       # общий каркас страниц роутера
│   │   │   index.ts                                 # публичный API страницы
│   │   │
│   │   └───ui
│   │           Layout.tsx                           # MapViewProvider, шапка, Outlet под Suspense с PageLoader и подвал
│   │
│   ├───map                                          # страница карты полётов
│   │   │   index.ts                                 # публичный API страницы
│   │   │
│   │   └───ui
│   │           MapPage.module.css                   # стили контейнера карты
│   │           MapPage.tsx                          # карта с bounds в URL и localStorage, debounce 300 мс и состоянием ошибки рейсов
│   │
│   └───notFound                                     # страница 404
│       │   index.ts                                 # публичный API страницы
│       │
│       ├───assets
│       │       404.svg                              # иллюстрация для страницы 404
│       │
│       └───ui
│               NotFoundPage.module.css              # стили страницы 404
│               NotFoundPage.tsx                     # иллюстрация, текст и кнопка возврата на / через useNavigate
│
├───shared                                           # переиспользуемый код без привязки к домену
│   ├───api                                          # транспортный слой
│   │       constants.ts                             # API_BASE_URL и общий интервал поллинга 2 с
│   │       fetchJson.ts                             # обёртка fetch: buildUrl, парсинг JSON, класс ApiError
│   │       generated-types.ts                       # типы, сгенерированные из OpenAPI-спеки (правится только генератором)
│   │       index.ts                                 # публичный API shared/api
│   │       queryClient.ts                           # общий QueryClient: staleTime 60 с, без ретраев на ApiError 4xx, throwOnError только без данных
│   │
│   ├───assets                                       # статические ресурсы
│   │   └───images
│   │           hero.png                             # изображение для промо-блока
│   │           react.svg                            # логотип React
│   │           vite.svg                             # логотип Vite / favicon
│   │
│   ├───config                                       # общие конфигурационные значения интерфейса
│   │       breakpoints.ts                           # брейкпоинты compact mobile, mobile и desktop и их media queries
│   │       index.ts                                 # публичный API конфигурации интерфейса
│   │
│   ├───contexts                                     # React-контексты общего состояния
│   │   ├───map-view                                 # состояние вида карты, bounds в URL и сохранение поисковой строки
│   │   │   │   context.ts                           # контексты текущего представления карты и его обновления
│   │   │   │   index.ts                             # публичный API состояния вида, bounds и синхронизации карты
│   │   │   │   MapViewProvider.tsx                  # провайдер текущих центра и масштаба с защитой от одинаковых обновлений
│   │   │   │   types.ts                             # типы вида и bounds карты, начальные границы и диапазон zoom 3–15
│   │   │   │   useMapView.ts                        # хуки для чтения и обновления представления карты
│   │   │   │
│   │   │   └───lib
│   │   │           mapViewParams.ts                 # разбирает и нормализует bounds и zoom карты для query-параметров
│   │   │           mapViewStorage.ts                # читает и сохраняет поисковую строку карты в localStorage
│   │   │           resolveMapSearch.ts              # восстанавливает валидные параметры карты из localStorage
│   │   │
│   │   └───theme                                    # состояние и переключение цветовой темы приложения
│   │           AppThemeProvider.tsx                 # провайдер светлой и тёмной тем с сохранением выбора и тёмной темой по умолчанию
│   │           context.ts                           # React-контекст активной темы и функции переключения
│   │           index.ts                             # публичный API контекста темы
│   │           types.ts                             # типы темы и значения контекста
│   │           useAppTheme.ts                       # хук доступа к активной теме и её переключению
│   │
│   ├───hooks                                        # переиспользуемые React-хуки
│   │       index.ts                                 # публичный API общих хуков
│   │       useMediaQuery.ts                         # responsive CSS media query hook
│   │       useUtcTime.ts                            # хук текущего UTC-времени с обновлением в начале минуты
│   │
│   ├───lib                                          # общие хуки и утилиты
│   │   │   useDebouncedParams.ts                    # дебаунс объекта query-параметров со стабильной ссылкой
│   │   │   useDebouncedValue.ts                     # базовый дебаунс произвольного значения
│   │   │   ymaps3.ts                                # инициализация JS API Яндекс.Карт, кластеризации и ZoomControl
│   │   │
│   │   └───formatters                               # форматтеры дат, полётов, координат и чисел
│   │           dateTime.ts                          # форматтеры локального времени и UTC-времени
│   │           flight.ts                            # форматирует номер рейса и оставшееся время полёта
│   │           index.ts                             # публичный API форматтеров
│   │           number.ts                            # форматтеры чисел и параметров представления карты
│   │
│   └───ui                                           # общие компоненты загрузки и ошибок
│       │   index.ts                                 # публичный API shared/ui
│       │
│       ├───PageLoader
│       │       PageLoader.module.css                # стили контейнера лоадера страницы
│       │       PageLoader.tsx                       # фолбэк для Suspense: Spin размера l с role=status
│       │
│       ├───RootErrorFallback
│       │       RootErrorFallback.tsx                # фолбэк корневого ErrorBoundary с кнопкой перезагрузки страницы
│       │
│       └───RouterErrorFallback
│               RouterErrorFallback.module.css       # стили блока ошибки маршрута
│               RouterErrorFallback.tsx              # ошибка маршрута из useRouteError: разбор ErrorResponse, ApiError и Error
│
└───widgets                                          # слой самостоятельных блоков интерфейса
    ├───app-footer                                   # подвал приложения
    │   │   index.ts                                 # публичный API виджета
    │   │
    │   ├───model
    │   │       mock-data.ts                         # моковые технические параметры карты и статусы рейсов
    │   │
    │   └───ui
    │           AppFooter.module.css                 # стили подвала
    │           AppFooter.tsx                        # подвал с техническими параметрами и текущим видом карты
    │
    ├───app-header                                   # шапка приложения
    │   │   index.ts                                 # публичный API виджета
    │   │
    │   └───ui
    │           AppHeader.module.css                 # стили шапки
    │           AppHeader.tsx                        # логотип, навигация NavLink на /map и /dashboard, текущее UTC-время
    │
    ├───dashboard                                    # дашборд статистики полётов
    │   │   index.ts                                 # публичный API виджета
    │   │
    │   └───ui
    │           Dashboard.module.css                 # стили сетки дашборда, бейджей и графика
    │           Dashboard.tsx                        # диапазон дат в query-параметрах, моки, бейджи и адаптивный график тренда
    │
    └───flight-map                                   # карта аэропортов и рейсов с маркерами, кластерами и деталями
        │   index.ts                                 # публичный API виджета
        │
        ├───model
        │       useMockAirportFlights.ts             # мок-запрос рейсов аэропорта с задержкой 500 мс и таймаутом 5 с
        │       useMockFlightDetails.ts              # мок-запрос деталей рейса с задержкой 500 мс и таймаутом 5 с
        │
        └───ui
            │   AirportsLayer.module.css             # стили маркеров и подсказок аэропортов
            │   AirportsLayer.tsx                    # слой маркеров аэропортов с кодами, адаптивными деталями мок-рейсов и подсказками
            │   FlightMap.module.css                 # стили контейнера карты рейсов
            │   FlightMap.tsx                        # карта с начальными bounds, zoom 3–15 и передачей границ наружу
            │   FlightsLayer.module.css              # стили интерактивных маркеров рейсов и кластеров
            │   FlightsLayer.tsx                     # слой одиночных рейсов и серверных кластеров с поповерами деталей
            │   MarkerTooltip.module.css             # стили всплывающей подсказки маркера
            │   MarkerTooltip.tsx                    # отключаемая подсказка маркера сверху с задержкой 50 мс
            │
            ├───AirportDetails                       # адаптивные детали аэропорта в поповере или нижнем Sheet
            │       AirportDetails.module.css        # стили деталей аэропорта, поповера и Sheet
            │       AirportDetails.tsx               # переключает детали аэропорта между desktop-поповером и mobile-Sheet
            │       AirportDetailsCard.tsx           # карточка аэропорта с метаданными и секцией рейсов
            │       AirportDetailsContent.tsx        # контент деталей аэропорта со состояниями загрузки и ошибки
            │       AirportDetailsPopover.tsx        # desktop-поповер деталей аэропорта с подсказкой маркера
            │       AirportDetailsSheet.tsx          # mobile-Sheet деталей аэропорта с адаптивными отступами
            │       AirportFlightsList.tsx           # виртуальный список рейсов с постраничной загрузкой по 10 строк
            │       AirportFlightsSection.tsx        # сортирует рейсы и фильтрует их вкладками по направлению
            │       index.ts                         # публичный API деталей аэропорта
            │
            └───FlightDetails                        # адаптивные детали рейса в поповере или нижнем Sheet
                    FlightDetails.module.css         # стили деталей рейса, поповера и Sheet
                    FlightDetails.tsx                # переключает детали рейса между desktop-поповером и mobile-Sheet
                    FlightDetailsCard.tsx            # карточка маршрута, статуса, параметров и ETA с подсказками аэропортов
                    FlightDetailsContent.tsx         # контент деталей рейса со состояниями загрузки и ошибки
                    FlightDetailsPopover.tsx         # desktop-поповер деталей рейса с подсказкой маркера
                    FlightDetailsSheet.tsx           # mobile-Sheet деталей рейса с адаптивными отступами
                    index.ts                         # публичный API деталей рейса
```

<!-- TREE:END -->
