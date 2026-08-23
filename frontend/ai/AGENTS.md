# Технологический стек проекта

## Описание

### Архитектура

- SPA приложение
- Методология FSD

### Технологический стек

| Категория        | Технология            |
| ---------------- | --------------------- |
| Язык             | TypeScript            |
| State-менеджер   | Zustand               |
| Стили            | CSS Modules           |
| Роутинг          | react-router-dom      |
| Работа с API     | TanStack Query        |
| UI-компоненты    | GravityUI             |
| Карта            | JS API яндекс карт    |
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
│   │       routes.tsx                               # createBrowserRouter: редирект на /map, /map и /dashboard через route.lazy, prefetch бортов и аэропортов в loader карты и сводки в loader дашборда, HydrateFallback, catch-all 404, ErrorBoundary на маршрутах
│   │
│   └───styles                                       # глобальные стили
│           index.css                                # CSS-переменные, reset, базовая типографика
│
├───entities                                         # слой сущностей предметной области
│   ├───airport                                      # сущность «аэропорт»
│   │   │   index.ts                                 # публичный API сущности
│   │   │
│   │   ├───model
│   │   │       mock-data.ts                         # мок списка из пяти московских аэропортов
│   │   │       types.ts                             # типы аэропорта, лога рейсов и сортировки из OpenAPI
│   │   │
│   │   └───ui
│   │       │   AirportTooltip.module.css            # стили всплывающей подсказки аэропорта
│   │       │   AirportTooltip.tsx                   # подсказка аэропорта сверху с задержкой открытия 50 мс
│   │       │
│   │       ├───AirportClusterMarker
│   │       │       AirportClusterMarker.tsx         # значок кластера аэропортов: MapClusterMarker в жёлтом варианте
│   │       │
│   │       └───AirportMarker
│   │               AirportMarker.module.css         # стили круглой метки аэропорта: выбранное состояние, кольцо фокуса, тач-размер
│   │               AirportMarker.tsx                # метка аэропорта с MapPin; прокидывает атрибуты и ref поповера на кнопку
│   │
│   ├───dashboardData                                # сущность «данные дашборда»
│   │   │   index.ts                                 # публичный API сущности
│   │   │
│   │   ├───lib
│   │   │       formatTrafficTrendData.ts            # тренд трафика в ChartData: линия по времени в мс и активным рейсам
│   │   │       isSingleDayTrend.ts                  # укладывается ли тренд в одни сутки — выбор формата оси времени
│   │   │       toBusiestAirports.ts                 # выдача /stats/airports к форме dashboard_top_airports, топ-10 по сумме рейсов
│   │   │
│   │   ├───model
│   │   │       mock-data.ts                         # моки дашборда: полный, пустой и генератор по диапазону дат
│   │   │       types.ts                             # типы сводки, фаз, топа аэропортов и тренда, выведенные из схем DashboardResponse
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
│       ├───lib
│       │       flightIconRotation.ts                # поворот иконки самолёта по trueTrack с поправкой на наклон 45°
│       │
│       ├───model
│       │       types.ts                             # типы Flight и TrackPoint, выведенные из OpenAPI-схемы
│       │
│       └───ui
│           ├───FlightClusterMarker
│           │       FlightClusterMarker.tsx          # значок кластера бортов: MapClusterMarker в синем варианте
│           │
│           └───FlightMarker
│                   FlightMarker.module.css          # стили метки борта: подсветка открытого поповера через aria-expanded, тач-размер
│                   FlightMarker.tsx                 # метка борта с PlaneFill, повёрнутая по курсу; decorative даёт значок без кнопки
│
├───features                                         # слой фич: пользовательские сценарии получения данных
│   ├───getAirports                                  # получение списка аэропортов
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useAirports.ts                       # хук GET /airports с query-ключами
│   │   │
│   │   ├───lib
│   │   │       airportsMapQuery.ts                  # сборка query карты для /airports с общим лимитом 200 записей
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
│   │           types.ts                             # query и ответ GET /airports/{icao}/flights из OpenAPI
│   │
│   ├───getDashboardData                             # получение сводной статистики для дашборда
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useDashboardData.ts                  # useSuspenseQuery и queryOptions GET /stats/dashboard — ручка без параметров
│   │   │
│   │   └───lib
│   │           dashboardRange.ts                    # заготовка диапазона дат from/to в unix-секундах — ручка окно не принимает
│   │
│   ├───getLiveFlights                               # получение бортов в воздухе в реальном времени
│   │   │   index.ts                                 # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useLiveFlights.ts                    # хук GET /flights/live с поллингом раз в 5 с, placeholderData оставляет прошлые точки
│   │   │
│   │   └───model
│   │           types.ts                             # типы query-параметров и ответа GET /flights/live
│   │
│   └───getTargetFlight                              # получение деталей выбранного рейса
│       │   index.ts                                 # публичный API фичи
│       │
│       ├───api
│       │       useTargetFlight.ts                   # хук GET /flights/{icao24} и /track параллельно, таймаут 5 с, без ретраев
│       │
│       └───model
│               types.ts                             # тип TargetFlight: борт плюс точки трека
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
│   │           MapPage.tsx                          # карта: восстановление вида из URL и localStorage, борта и аэропорты по bbox, алерты об ошибках
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
│   ├───config                                       # общие конфигурационные значения интерфейса
│   │       breakpoints.css                          # переиспользуемые custom media брейкпоинты адаптивных CSS-стилей
│   │       breakpoints.ts                           # брейкпоинты compact mobile, mobile и desktop и их media queries
│   │       index.ts                                 # публичный API конфигурации интерфейса
│   │
│   ├───contexts                                     # React-контексты общего состояния
│   │   ├───map-view                                 # состояние вида карты, bounds в URL и сохранение поисковой строки
│   │   │   │   context.ts                           # контексты текущего представления карты и его обновления
│   │   │   │   index.ts                             # публичный API контекста представления карты
│   │   │   │   MapViewProvider.tsx                  # провайдер центра и масштаба карты с защитой от дублей
│   │   │   │   types.ts                             # тип MapView и начальные центр [34, 57.8] и zoom 5
│   │   │   │   useMapView.ts                        # хуки для чтения и обновления представления карты
│   │   │   │
│   │   │   └───lib
│   │   │           mapViewParams.ts                 # разбор и сборка bbox и zoom в URL с квантованием до сотых
│   │   │           mapViewStorage.ts                # чтение и запись последнего вида карты в localStorage
│   │   │           resolveMapSearch.ts              # подстановка сохранённого вида карты, если в URL его нет
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
│   │   │   useDebouncedCallback.ts                  # trailing-дебаунс колбэка на ref, не вызывает ре-рендеров
│   │   │   ymaps3.ts                                # инициализация JS API Яндекс.Карт, кластеризации и ZoomControl
│   │   │
│   │   ├───formatters                               # форматтеры дат, полётов, координат и чисел
│   │   │       dateTime.ts                          # форматтеры локального времени и UTC-времени
│   │   │       flight.ts                            # форматирует номер рейса и путевую скорость из м/с в км/ч
│   │   │       index.ts                             # публичный API форматтеров
│   │   │       number.ts                            # форматтеры чисел и параметров представления карты
│   │   │
│   │   └───metrika                                  # интеграция просмотра страниц с Яндекс Метрикой
│   │           index.ts                             # публичный API трекера страниц Метрики
│   │           MetrikaPageTracker.tsx               # отправляет hit в Яндекс Метрику при смене маршрута кроме корневого редиректа
│   │
│   └───ui                                           # общие компоненты загрузки, ошибок и значка кластера на карте
│       │   index.ts                                 # публичный API shared/ui
│       │
│       ├───MapClusterMarker
│       │       MapClusterMarker.module.css          # стили круглого значка кластера: варианты accent и warning, светлая тема, тач-размер
│       │       MapClusterMarker.tsx                 # значок кластера с числом объектов; decorative убирает role=img и фокус
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
    │   └───ui
    │           AppFooter.module.css                 # стили подвала
    │           AppFooter.tsx                        # подвал с техническими параметрами и текущим видом карты
    │
    ├───app-header                                   # шапка приложения
    │   │   index.ts                                 # публичный API виджета
    │   │
    │   ├───assets
    │   │       yt_logo.png                          # логотип SkyPulse, PNG-фолбэк
    │   │       yt_logo.webp                         # логотип SkyPulse, основной формат
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
        │       useFlightDetails.ts                  # выбор борта на карте поверх useTargetFlight: позиция плюс трек
        │       useSelectedAirportFlights.ts         # выбранный кликом аэропорт и его лог рейсов через useAirportsFlights
        │
        └───ui
            │   AirportsClusterLayer.tsx             # кластеризация аэропортов по сетке 64 px до zoom 8
            │   AirportsLayer.module.css             # стили содержимого подсказки аэропорта: код и название в две строки
            │   FlightMap.module.css                 # стили контейнера карты рейсов
            │   FlightMap.tsx                        # карта по initialBounds, zoom 3–15, кластеры аэропортов и бортов, отдаёт вид и bbox
            │   FlightsClusterLayer.tsx              # кластеризация бортов по сетке 64 px до zoom 8 и трек выбранного борта
            │   MarkerTooltip.module.css             # стили всплывающей подсказки маркера
            │   MarkerTooltip.tsx                    # отключаемая подсказка маркера сверху с задержкой 50 мс
            │
            ├───AirportDetails                       # адаптивные детали аэропорта в поповере или нижнем Sheet
            │       AirportDetails.module.css        # стили деталей аэропорта, поповера и Sheet
            │       AirportDetails.tsx               # переключает детали аэропорта между desktop-поповером и mobile-Sheet
            │       AirportDetailsCard.tsx           # карточка аэропорта с метаданными и секцией рейсов
            │       AirportDetailsContent.tsx        # контент деталей аэропорта: загрузка, ошибка с кнопкой «Повторить» и список рейсов
            │       AirportDetailsPopover.tsx        # desktop-поповер деталей аэропорта с подсказкой маркера
            │       AirportDetailsSheet.tsx          # mobile-Sheet деталей аэропорта с адаптивными отступами
            │       AirportFlightsList.tsx           # виртуальный список рейсов с постраничной загрузкой по 10 строк
            │       AirportFlightsSection.tsx        # сортирует рейсы и фильтрует их вкладками по направлению
            │       index.ts                         # публичный API деталей аэропорта
            │
            ├───FlightDetails                        # адаптивные детали рейса в поповере или нижнем Sheet
            │       FlightDetails.module.css         # стили деталей рейса, поповера и Sheet
            │       FlightDetails.tsx                # переключает детали рейса между desktop-поповером и mobile-Sheet
            │       FlightDetailsCard.tsx            # карточка борта: рейс, тип, страна, координаты, скорость, высота и курс
            │       FlightDetailsContent.tsx         # контент деталей рейса: загрузка, отсутствие данных и карточка борта
            │       FlightDetailsPopover.tsx         # desktop-поповер деталей рейса с подсказкой маркера
            │       FlightDetailsSheet.tsx           # mobile-Sheet деталей рейса с адаптивными отступами
            │       index.ts                         # публичный API деталей рейса
            │
            └───MapLegend                            # легенда карты в HelpMark
                    MapLegend.module.css             # стили строк легенды и гашение центрирующего сдвига маркеров
                    MapLegend.tsx                    # поповер-легенда: декоративные маркеры рейса, аэропорта и их кластеров с подписями
```

<!-- TREE:END -->
