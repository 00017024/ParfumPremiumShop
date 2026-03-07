ParfumPremiumShop – Backend (EN)

This repository contains the backend for ParfumPremiumShop, an e-commerce application focused on perfume products.

The backend is implemented using Node.js, Express, and MongoDB, following a modular MVC-style architecture.

## Functionality:

User registration and authentication using JWT
Role-based access control (user / admin)
Product management (CRUD, admin-only)
Server-side shopping cart
Order creation with enforced order lifecycle
Request validation using Joi
Centralized error handling
Admin user management (view, block, unblock)

## Tech Stack:

Node.js
Express
MongoDB (Mongoose)
JWT (authentication)
bcrypt (password hashing)
Joi (request validation)

## Project Structure:

backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── validators/
├── utils/
├── config/
├── server.js
└── package.json

## Order Lifecycle:

Orders follow a controlled lifecycle to prevent invalid state transitions:
PENDING → PAID → CONFIRMED → COMPLETED
Orders can only be cancelled at allowed stages
Lifecycle rules are enforced at the model level

## Running Locally:

npm install
npm run dev

The API will be available at `http://localhost:5000` once required environment
variables are configured locally.

## API Overview

## Authentication:

POST /auth/register
POST /auth/login

## Products:

GET /products
GET /products/:id
POST /products (admin)
PUT /products/:id (admin)
DELETE /products/:id (admin)

## Cart

GET /cart
POST /cart/add
DELETE /cart/remove/:productId
DELETE /cart/clear

## Orders

POST /orders
GET /orders/my
GET /orders (admin)
PUT /orders/:id/status (admin)

## Users

GET /users/profile
PUT /users/profile

## Admin

GET /admin/users
PUT /admin/users/:id
POST /admin/users/:id/block
POST /admin/users/:id/unblock

## Notes

Payment integration is not implemented yet.
Authorization is enforced via middleware.
Input validation is handled at the routing layer.

## Configuration Notes

Sensitive configuration such as database credentials and secrets
(environment variables) is intentionally not included in this repository.

The application expects standard environment variables for database
connection and authentication, which are configured locally during development
and deployment.



ParfumPremiumShop – Backend (RU)

Этот репозиторий содержит backend-часть приложения ParfumPremiumShop, интернет-магазина парфюмерии.

Backend реализован с использованием Node.js, Express и MongoDB и построен по модульной архитектуре (MVC).

## Функциональность:

Регистрация и аутентификация пользователей (JWT)
Ролевой доступ (пользователь / администратор)
Управление товарами (CRUD, только для администратора)
Серверная корзина
Создание заказов с контролируемым жизненным циклом
Валидация запросов с помощью Joi
Централизованная обработка ошибок
Администрирование пользователей (просмотр, блокировка)

## Технологии:

Node.js
Express
MongoDB (Mongoose)
JWT (аутентификация)
bcrypt (хеширование паролей)
Joi (валидация запросов)

## Структура проекта

backend/
├── controllers/
├── models/
├── routes/
├── middleware/
├── validators/
├── utils/
├── config/
├── server.js
└── package.json

## Жизненный цикл заказа:

Заказы проходят строго определённые этапы:
PENDING → PAID → CONFIRMED → COMPLETED
Отмена заказа возможна только на допустимых этапах
Правила переходов проверяются на уровне модели
Переменные окружения

## Запуск локально:
npm install
npm run dev

API будет доступен по адресу `http://localhost:5000` после локальной
настройки переменных окружения.

## Примечания:

Платёжная система пока не интегрирована.
Аутентификация и авторизация реализованы через middleware.
Валидация входящих данных выполняется на уровне маршрутов.

## Примечание по конфигурации

Чувствительные данные, такие как учетные данные базы данных и секреты
(переменные окружения), намеренно не включены в данный репозиторий.

Приложение использует стандартные переменные окружения, которые
настраиваются локально во время разработки и развертывания.
