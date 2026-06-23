# checkin-celebration Specification

## Purpose
TBD - created by archiving change daily-quote-and-checkin-celebration. Update Purpose after archive.
## Requirements
### Requirement: CheckInCelebration Component
The system SHALL provide a `<CheckInCelebration>` component that wraps the existing `Modal` to display an encouragement message.

#### Scenario: Renders encouragement text
- **WHEN** the component receives an `encouragement: string` prop and `open: boolean` is `true`
- **THEN** it displays the encouragement text in a centered, prominent style

#### Scenario: Component hides when closed
- **WHEN** `open` is `false`
- **THEN** the component renders nothing in the DOM

