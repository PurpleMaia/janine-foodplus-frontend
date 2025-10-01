# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

# [Unreleased]

## [1.1.4] - 2025-9-05
### Added (Tracker)
- Admin View of accounts (Accept/Reject a user account creation request)

### Changed (Tracker)
- Optimal singleton instance of Kysely

## [1.2.0] - 2025-9-04
### Added (Tracker)
- User Registration Process (when registering, sends a request to admin to let them have an account)

### Changed (Tracker)
- Kysely Type-Safe user auth table queries
- Better Query for all user-adopted bills
- Bill rerendering on two separate containers would clog up memory, implemented user-adopted bills only in bills context

### Fixed (Tracker)
- User feedback after adopting/removing a bill


## [1.1.1] - 2025-8-26
### Added (Tracker)
- Public & Private View based on login
- User-based bills, ability to follow a certain bill based on URL
- 

## [1.1.0] - 2025-8-19
### Added (Tracker)
- Authentication system set up for user logins

## [1.0.0] - 2025-07-28
### Added (Tracker)
- Applied LLM classification to an individual bill
- UX/UI bill population for the LLM classifier
- Accept/Reject UX/UI

## [0.3.0] - 2025-07-21
### Added (Tracker)
- API call to Scraper side for the individual bill web page URL
- LLM tests with VLLM or LLM for bill status classification
- Button to travel to another column instantly instead of scrolling (UX)

## [0.2.1] – 2025-07-03
### Added (Tracker)
- Database integrations for all drag/drop updates, on-start population of bills

### Changed (Tracker)
- Refactor to Kysely query calls

## [0.2.0] - 2025-06-24
### Added (Scraper)
- Ability to scrape individual bill's Web Page on scraper side

## [0.1.1] - 2025-06-16
### Changed (Scraper)
- Implemented server-based framework (Express & Node.js)
- Implemented `axios` changes to scrape `data.capitol.hawaii` website instead of `www.capitol.hawaii`
- Calls server localhost through a proxy instead of using Supabase edge functions

## [0.1.0] – 2025-05-05
### Added
- Vibe-coded Bill Tracker scaffolding & UI
- Vibe-coded Bill Scraper scaffolding & functionality

