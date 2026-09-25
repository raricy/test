# Модуль Users

Для реализации используется [Nest](https://github.com/nestjs/nest)

[Описание архитектурных решений](ARCHITECTURE.md)

## Установка и запуск

### 1. Установить NVM

https://github.com/nvm-sh/nvm#installing-and-updating

### 2. Установить docker и docker-compose

https://docs.docker.com/engine/install

### 3. Создать env файл

```bash
cp .env.example .env
```

### 4. Установить пакеты

```bash
npm install
```

### 5. Запустить необходимые сервисы

```bash
docker compose -f 'docker-compose.yml' up -d --build 
```

## CLI команды

```bash
# Заполнение БД тестовыми данными
npm run schema:seed

# Запуск приложения в дев режиме
npm run start:dev

# Запуск миграции
npm run migration:run

# Откат примененной миграции
npm run migration:revert

# Создание пустой миграции с названием ${NAME}
npm run migration:create ${NAME}
```
