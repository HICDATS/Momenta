# Daily Quote Specification

## ADDED Requirements

### Requirement: Daily Quote Display on Home Page
The system SHALL display one inspirational quote at the top of the home page (hero area, below the date eyebrow and above the StreakDisplay).

#### Scenario: First visit on a given day
- **WHEN** the user opens the App and lands on the home page for the first time on a calendar day
- **THEN** the system displays exactly one quote from the built-in `DAILY_QUOTES` pool
- **AND** the quote is selected deterministically based on the current date

#### Scenario: Repeat visit on the same day
- **WHEN** the user closes and reopens the App multiple times on the same calendar day
- **THEN** the system displays the same quote for all visits on that day

#### Scenario: Visit after midnight
- **WHEN** the user opens the App on a new calendar day
- **THEN** the system displays a different quote than the previous day (or the same if the hash collides, but generally different)

### Requirement: Date-Based Deterministic Selection
The system SHALL select a quote from the `DAILY_QUOTES` pool using a deterministic hash of the current local date (`YYYY-MM-DD` format).

#### Scenario: Hash produces a valid index
- **WHEN** the selector receives a date string
- **THEN** it computes a non-negative integer index within `[0, DAILY_QUOTES.length)`
- **AND** the same date string always produces the same index

#### Scenario: Different dates may produce different indices
- **WHEN** the selector receives two different date strings
- **THEN** the indices may differ (collisions acceptable for small pools)

### Requirement: Built-in Quote Pool
The system SHALL provide a built-in `DAILY_QUOTES` constant in `src/constants/quotes.ts` containing at least 10 Chinese inspirational quotes related to sports, exercise, and habit building.

#### Scenario: Pool has minimum size
- **WHEN** the application starts
- **THEN** `DAILY_QUOTES.length >= 10`
- **AND** every entry is a non-empty string

### Requirement: No Network Dependency
The system SHALL display the daily quote without making any network requests.

#### Scenario: Offline display
- **WHEN** the user opens the App while offline
- **THEN** the daily quote is still displayed correctly

## ADDED Requirements

### Requirement: DailyQuote Component
The system SHALL provide a `<DailyQuote>` component that renders a single quote in a styled card with left-side color accent.

#### Scenario: Renders quote text
- **WHEN** the component receives a `quote: string` prop
- **THEN** it renders the quote text in a readable card

#### Scenario: Aria label for accessibility
- **WHEN** the component renders
- **THEN** it includes an appropriate `aria-label` or `role` for screen readers (e.g., `aria-label="每日励志名言"`)

#### Scenario: Component is pure
- **WHEN** the component is rendered with the same prop
- **THEN** it produces stable, side-effect-free output
