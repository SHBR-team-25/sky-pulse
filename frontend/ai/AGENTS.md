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
│   │   App.tsx                                      # корневой компонент: QueryProvider, ThemeProvider, ErrorBoundary, MapViewProvider и RouterProvider
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
│   │           AirportTooltip.module.css            # стили всплывающей подсказки аэропорта
│   │           AirportTooltip.tsx                   # подсказка аэропорта сверху с задержкой открытия 50 мс
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
│   │               TrafficTrendGraph.module.css     # стили контейнера графика тренда трафика
│   │               TrafficTrendGraph.tsx            # линейный Chart тренда трафика, заглушка при пустых данных
│   │
│   └───flight                                       # сущность «рейс»
│       │   index.ts                                 # публичный API сущности
│       │
│       └───model
│               types.ts                             # типы Flight и TrackPoint, выведенные из OpenAPI-схемы
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
│   │   │       useLiveFlights.ts                    # хук GET /flights/live с поллингом раз в 15 с
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
│   │           Layout.tsx                           # шапка, Outlet под Suspense с PageLoader и подвал
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
│   │       constants.ts                             # API_BASE_URL из переменных окружения
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
│   ├───contexts                                     # React-контексты общего состояния
│   │   └───map-view                                 # состояние центра и масштаба карты
│   │       │   context.ts                           # контексты текущего представления карты и его обновления
│   │       │   index.ts                             # публичный API контекста представления карты
│   │       │   MapViewProvider.tsx                  # провайдер центра и масштаба карты с защитой от дублей
│   │       │   types.ts                             # тип MapView и начальные центр [34, 57.8] и zoom 5
│   │       │   useMapView.ts                        # хуки для чтения и обновления представления карты
│   │       │
│   │       └───lib
│   │               mapViewParams.ts                 # разбор и сборка bbox и zoom в URL с квантованием до сотых
│   │               mapViewStorage.ts                # чтение и запись последнего вида карты в localStorage
│   │               resolveMapSearch.ts              # подстановка сохранённого вида карты, если в URL его нет
│   │
│   ├───hooks                                        # переиспользуемые React-хуки
│   │       index.ts                                 # публичный API общих хуков
│   │       useUtcTime.ts                            # хук текущего UTC-времени с обновлением в начале минуты
│   │
│   ├───lib                                          # общие хуки и утилиты
│   │   │   useDebouncedCallback.ts                  # trailing-дебаунс колбэка на ref, не вызывает ре-рендеров
│   │   │   useDebouncedParams.ts                    # дебаунс объекта query-параметров со стабильной ссылкой, сейчас не используется
│   │   │   useDebouncedValue.ts                     # базовый дебаунс произвольного значения, сейчас не используется
│   │   │   ymaps3.ts                                # инициализация JS API Яндекс.Карт, кластеризации и ZoomControl
│   │   │
│   │   └───formatters                               # форматтеры дат, полётов, координат и чисел
│   │           dateTime.ts                          # форматтеры локального времени и UTC-времени
│   │           flight.ts                            # форматирует номер рейса и путевую скорость из м/с в км/ч
│   │           index.ts                             # публичный API форматтеров
│   │           number.ts                            # форматтеры чисел и параметров представления карты
│   │
│   └───ui                                           # общие компоненты загрузки и ошибок
│       │   index.ts                                 # публичный API shared/ui
│       │
│       ├───PageLoader
│       │       PageLoader.module.css                # стили контейнера лоадера страницы
│       │       PageLoader.tsx                       # фолбэк для Suspense: Loader размера l с role=status
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
    │           Dashboard.tsx                        # диапазон дат в query-параметрах, бейджи и график тренда (пока на моках)
    │
    └───flight-map                                   # карта аэропортов и рейсов с маркерами, кластерами и деталями
        │   index.ts                                 # публичный API виджета
        │
        ├───model
        │       flightIconRotation.ts                # поворот иконки самолёта по trueTrack с поправкой на наклон 45°
        │       useFlightDetails.ts                  # выбор борта на карте поверх useTargetFlight: позиция плюс трек
        │       useSelectedAirportFlights.ts         # выбранный кликом аэропорт и его лог рейсов через useAirportsFlights
        │
        └───ui
                AirportDetailsCard.tsx               # карточка аэропорта с метаданными и секцией рейсов
                AirportDetailsPopover.module.css     # стили поповера, карточки и виртуального списка рейсов аэропорта
                AirportDetailsPopover.tsx            # поповер деталей аэропорта с загрузкой, ошибкой и кнопкой закрытия
                AirportFlightsList.tsx               # виртуальный список рейсов с загрузкой по 10 строк
                AirportFlightsSection.tsx            # сортирует рейсы, фильтрует по направлению и выводит вкладки со счётчиками
                AirportsClusterLayer.tsx             # кластеризация аэропортов по сетке 64 px до zoom 8
                AirportsLayer.module.css             # стили маркеров, кластеров и подсказок аэропортов
                AirportsLayer.tsx                    # некластерный слой маркеров аэропортов с кодами, сейчас не подключён
                FlightDetailsCard.tsx                # карточка борта: рейс, тип, страна, координаты, скорость, высота и курс
                FlightDetailsPopover.module.css      # стили поповера, карточки и сообщений деталей рейса
                FlightDetailsPopover.tsx             # поповер деталей рейса с состояниями загрузки и отсутствия данных
                FlightMap.module.css                 # стили контейнера карты рейсов
                FlightMap.tsx                        # карта по initialBounds, zoom 3–15, кластеры аэропортов и бортов, отдаёт вид и bbox
                FlightsClusterLayer.tsx              # кластеризация бортов по сетке 64 px до zoom 8 и трек выбранного борта
                FlightsLayer.module.css              # стили интерактивных маркеров рейсов и кластеров
                FlightsLayer.tsx                     # некластерный слой бортов с поповерами и треком, сейчас не подключён
                MarkerTooltip.module.css             # стили всплывающей подсказки маркера
                MarkerTooltip.tsx                    # отключаемая подсказка маркера сверху с задержкой 50 мс
```

<!-- TREE:END -->
