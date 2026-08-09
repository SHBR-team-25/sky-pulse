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
│   main.tsx                                     # точка входа: монтирует App в DOM
│   vite-env.d.ts                                # типы Vite и переменных окружения (import.meta.env)
│
├───app                                          # слой приложения: композиция провайдеров и layout
│   │   App.module.css                           # стили корневого layout (шапка / карта / подвал)
│   │   App.tsx                                  # корневой компонент: QueryProvider, ThemeProvider, MapViewProvider и виджеты
│   │   index.ts                                 # публичный API слоя app
│   │
│   ├───providers                                # глобальные провайдеры приложения
│   │       index.ts                             # реэкспорт провайдеров
│   │       QueryProvider.tsx                    # QueryClient TanStack Query: staleTime, политика retry по ApiError
│   │
│   └───styles                                   # глобальные стили
│           index.css                            # CSS-переменные, reset, базовая типографика
│
├───entities                                     # слой сущностей предметной области
│   ├───airport                                  # сущность «аэропорт»
│   │   │   index.ts                             # публичный API сущности
│   │   │
│   │   ├───model
│   │   │       mock-data.ts                     # моковый ответ GET /airports с пятью аэропортами Московского региона
│   │   │       types.ts                         # типы аэропортов и рейсов аэропорта, выведенные из OpenAPI-схемы
│   │   │
│   │   └───ui
│   │           AirportTooltip.module.css        # стили всплывающей подсказки аэропорта
│   │           AirportTooltip.tsx               # подсказка аэропорта сверху с задержкой открытия 50 мс
│   │
│   └───flight                                   # сущность «рейс»
│       │   index.ts                             # публичный API сущности
│       │
│       └───model
│               mock-data.ts                     # моки списка live-бортов и деталей рейса 4242b3
│               types.ts                         # типы live-бортов, трека, позиции и фазы полёта
│
├───features                                     # слой фич: пользовательские сценарии получения данных
│   ├───getAirports                              # получение списка аэропортов
│   │   │   index.ts                             # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useAirports.ts                   # хук GET /airports с дебаунсом параметров и query-ключами
│   │   │
│   │   └───model
│   │           types.ts                         # типы query-параметров и ответа GET /airports
│   │
│   ├───getAirportsFlights                       # получение рейсов конкретного аэропорта
│   │   │   index.ts                             # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useAirportsFlights.ts            # хук GET /airports/{icao}/flights, запрос только при заданном icao
│   │   │
│   │   └───model
│   │           types.ts                         # типы query-параметров и ответа GET /airports/{icao}/flights
│   │
│   ├───getLiveFlights                           # получение бортов в воздухе в реальном времени
│   │   │   index.ts                             # публичный API фичи
│   │   │
│   │   ├───api
│   │   │       useLiveFlights.ts                # хук GET /flights/live с поллингом раз в 3 с
│   │   │
│   │   └───model
│   │           types.ts                         # типы query-параметров и ответа GET /flights/live
│   │
│   └───getTargetFlight                          # получение деталей выбранного рейса
│       │   index.ts                             # публичный API фичи
│       │
│       ├───api
│       │       useTargetFlight.ts               # хук GET /flights/{icao24}: детали и трек борта
│       │
│       └───model
│               types.ts                         # тип ответа GET /flights/{icao24}
│
├───pages                                        # слой страниц
│   └───map                                      # страница карты полётов
│       │   index.ts                             # публичный API страницы
│       │
│       └───ui
│               MapPage.module.css               # стили контейнера карты
│               MapPage.tsx                      # YMap со схемой и слоем фич, тема light/dark
│
├───shared                                       # переиспользуемый код без привязки к домену
│   ├───api                                      # транспортный слой
│   │       constants.ts                         # API_BASE_URL из переменных окружения
│   │       fetchJson.ts                         # обёртка fetch: buildUrl, парсинг JSON, класс ApiError
│   │       generated-types.ts                   # типы, сгенерированные из OpenAPI-спеки (правится только генератором)
│   │       index.ts                             # публичный API shared/api
│   │
│   ├───assets                                   # статические ресурсы
│   │   └───images
│   │           hero.png                         # изображение для промо-блока
│   │           react.svg                        # логотип React
│   │           vite.svg                         # логотип Vite / favicon
│   │
│   ├───contexts                                 # React-контексты общего состояния
│   │   └───map-view                             # состояние центра и масштаба карты
│   │           context.ts                       # контексты текущего представления карты и его обновления
│   │           index.ts                         # публичный API контекста представления карты
│   │           MapViewProvider.tsx              # провайдер центра и масштаба карты с защитой от дублей
│   │           types.ts                         # тип MapView и начальные центр [34, 57.8] и zoom 5
│   │           useMapView.ts                    # хуки для чтения и обновления представления карты
│   │
│   ├───hooks                                    # переиспользуемые React-хуки
│   │       index.ts                             # публичный API общих хуков
│   │       useUtcTime.ts                        # хук текущего UTC-времени с обновлением в начале минуты
│   │
│   └───lib                                      # общие хуки и утилиты
│       │   useDebouncedParams.ts                # дебаунс объекта query-параметров со стабильной ссылкой
│       │   useDebouncedValue.ts                 # базовый дебаунс произвольного значения
│       │   ymaps3.ts                            # инициализация JS API Яндекс.Карт, кластеризации и ZoomControl
│       │
│       └───formatters                           # форматтеры дат, полётов, координат и чисел
│               dateTime.ts                      # форматтеры локального времени и UTC-времени
│               flight.ts                        # форматирует номер рейса и оставшееся время полёта
│               index.ts                         # публичный API форматтеров
│               number.ts                        # форматтеры чисел и параметров представления карты
│
└───widgets                                      # слой самостоятельных блоков интерфейса
    ├───app-footer                               # подвал приложения
    │   │   index.ts                             # публичный API виджета
    │   │
    │   ├───model
    │   │       mock-data.ts                     # моковые технические параметры карты и статусы рейсов
    │   │
    │   └───ui
    │           AppFooter.module.css             # стили подвала
    │           AppFooter.tsx                    # подвал с техническими параметрами и текущим видом карты
    │
    ├───app-header                               # шапка приложения
    │   │   index.ts                             # публичный API виджета
    │   │
    │   ├───model
    │   │       mock-data.ts                     # моковые навигация, поиск, LIVE-счётчик и профиль
    │   │
    │   └───ui
    │           AppHeader.module.css             # стили шапки
    │           AppHeader.tsx                    # логотип, навигация, поиск и текущее UTC-время
    │
    └───flight-map                               # карта аэропортов и рейсов с маркерами, кластерами и деталями
        │   index.ts                             # публичный API виджета
        │
        └───ui
                AirportsLayer.module.css         # стили маркеров и подсказок аэропортов
                AirportsLayer.tsx                # слой маркеров аэропортов с кодами и подсказками
                FlightDetailsCard.tsx            # карточка маршрута, статуса, параметров и ETA с подсказками аэропортов
                FlightDetailsPopover.module.css  # стили поповера и карточки деталей рейса
                FlightDetailsPopover.tsx         # поповер деталей рейса с мок-запросом и задержкой 500 мс
                FlightMap.module.css             # стили контейнера карты рейсов
                FlightMap.tsx                    # карта с zoom 3–15, слоями и синхронизацией вида в контексте
                FlightsLayer.module.css          # стили маркеров рейсов и кластеров
                FlightsLayer.tsx                 # слой одиночных рейсов и серверных кластеров с поповерами деталей
                MarkerTooltip.module.css         # стили всплывающей подсказки маркера
                MarkerTooltip.tsx                # отключаемая подсказка маркера сверху с задержкой 50 мс
```

<!-- TREE:END -->
