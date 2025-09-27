# Database Schema

## auth_key

| Column          | Type       | Notes       |
| --------------- | ---------- | ----------- |
| id              | integer PK |             |
| user_id         | integer FK | → `user.id` |
| hashed_password | text       |             |
| created_at      | datetime   |             |

## sessions

| Column        | Type       | Notes       |
| ------------- | ---------- | ----------- |
| id            | integer PK |             |
| user_id       | integer FK | → `user.id` |
| session_token | text       |             |
| created_at    | datetime   |             |
| expires_at    | datetime   |             |

## user

| Column          | Type       | Notes                  |
| --------------- | ---------- | ---------------------- |
| id              | integer PK |                        |
| username        | text       |                        |
| email           | text       |                        |
| created_at      | datetime   |                        |
| role            | text       | e.g., user/admin       |
| account_status  | text       | e.g., active/suspended |
| requested_admin | boolean    |                        |

## user_bills

| Column     | Type       | Notes            |
| ---------- | ---------- | ---------------- |
| id         | integer PK |                  |
| user_id    | integer FK | → `user.id`      |
| bill_id    | integer FK | → `bills.id`     |
| adopted_at | datetime   | (timestamp/date) |

## bills

| Column                | Type       | Notes |
| --------------------- | ---------- | ----- |
| id                    | integer PK |       |
| bill_url              | text       |       |
| description           | text       |       |
| current_status_string | text       |       |
| created_at            | datetime   |       |
| updated_at            | datetime   |       |
| committee_assignment  | text       |       |
| bill_title            | text       |       |
| introducer            | text       |       |
| bill_number           | text       |       |
| current_status        | text       |       |
| nickname              | text       |       |
| food_related          | boolean    |       |

## status_updates

| Column     | Type       | Notes        |
| ---------- | ---------- | ------------ |
| id         | integer PK |              |
| bill_id    | integer FK | → `bills.id` |
| chamber    | text       |              |
| date       | datetime   |              |
| statustext | text       |              |

## scraping_stats

| Column           | Type       | Notes |
| ---------------- | ---------- | ----- |
| id               | integer PK |       |
| last_scrape_time | datetime   |       |
| bills_scraped    | integer    |       |
| success          | boolean    |       |
| error_message    | text       |       |
| created_at       | datetime   |       |

## schema_migrations

| Column  | Type    | Notes                             |
| ------- | ------- | --------------------------------- |
| version | integer | PK (typical for migration tables) |
| dirty   | boolean |                                   |

### Foreign Keys Summary

* `auth_key.user_id` → `user.id`
* `sessions.user_id` → `user.id`
* `user_bills.user_id` → `user.id`
* `user_bills.bill_id` → `bills.id`
* `status_updates.bill_id` → `bills.id`
