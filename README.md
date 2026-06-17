# Лайково: контроль финансов

Публичный Next.js-проект для ведения расходов по ремонту/обустройству квартиры в Лайково. Приложение читает исторический лист `Ремонт` из Google Sheets, а новые записи сохраняет в нормализованный лист `Операции`.

## Возможности

- Google OAuth через Auth.js / NextAuth.
- Доступ только для email из `AUTHORIZED_EMAILS`.
- Чтение исторических расходов из текущей таблицы.
- Автоматическое создание листа `Операции` для новых записей.
- Адаптивный дашборд для телефона, планшета и десктопа.
- Быстрый ввод расхода с категорией, комнатой, подрядчиком и статусом.

## Настройка

1. Создайте OAuth Client в Google Cloud Console.
2. Добавьте redirect URI:

```text
http://localhost:3000/api/auth/callback/google
https://your-domain.com/api/auth/callback/google
```

3. Скопируйте `.env.example` в `.env.local` и заполните значения.
4. Убедитесь, что Google OAuth consent screen включает scope `https://www.googleapis.com/auth/spreadsheets`.
5. Дайте вашей Google-почте доступ к таблице.

Для публичного GitHub-репозитория не коммитьте `.env.local`. На Vercel или другом хостинге добавьте те же переменные окружения в настройках проекта.

## Переменные

| Переменная | Назначение |
| --- | --- |
| `AUTH_SECRET` | Секрет Auth.js. |
| `AUTH_URL` | URL приложения локально или в продакшене. |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID. |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret. |
| `AUTHORIZED_EMAILS` | Разрешенные email через запятую. |
| `GOOGLE_SHEET_ID` | ID Google Sheets-документа. |
| `GOOGLE_SHEET_LEGACY_NAME` | Исторический лист, сейчас `Ремонт`. |
| `GOOGLE_SHEET_OPERATIONS_NAME` | Новый лист для записей из приложения. |

Если `AUTHORIZED_EMAILS` пустой, вход будет запрещен.

## Запуск

```bash
npm install
npm run dev
```

Откройте `http://localhost:3000`.
