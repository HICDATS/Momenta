# Check-in Celebration Specification

## ADDED Requirements

### Requirement: Celebration Modal After Successful Check-in
The system SHALL display a centered modal containing an encouragement message when a check-in is successfully confirmed.

#### Scenario: Modal appears on success
- **WHEN** the user confirms a check-in and the check-in is saved successfully
- **THEN** the system displays a modal in the center of the screen
- **AND** the modal contains one encouragement message selected from the built-in `ENCOURAGEMENTS` pool

#### Scenario: Modal does not appear on failure
- **WHEN** the user attempts a check-in but the save fails (e.g., validation error, storage error)
- **THEN** the celebration modal MUST NOT be displayed
- **AND** the existing error feedback (Toast) is still shown

### Requirement: Random Encouragement Selection
The system SHALL select an encouragement from the `ENCOURAGEMENTS` pool using a uniform random distribution.

#### Scenario: Each check-in shows a different encouragement
- **WHEN** the user performs multiple check-ins in succession
- **THEN** each successful check-in may display a different encouragement (random per event)
- **AND** the distribution across many check-ins is approximately uniform

#### Scenario: Pool is non-empty
- **WHEN** the selector is called
- **THEN** `ENCOURAGEMENTS.length >= 1`
- **AND** the returned index is within `[0, ENCOURAGEMENTS.length)`

### Requirement: Built-in Encouragement Pool
The system SHALL provide a built-in `ENCOURAGEMENTS` constant in `src/constants/quotes.ts` containing at least 10 Chinese encouragement messages.

#### Scenario: Pool has minimum size
- **WHEN** the application starts
- **THEN** `ENCOURAGEMENTS.length >= 10`
- **AND** every entry is a non-empty string

### Requirement: Auto-close After 3 Seconds
The system SHALL automatically close the celebration modal 3 seconds after it opens.

#### Scenario: Timer triggers close
- **WHEN** the modal becomes visible
- **THEN** after 3 seconds, the system invokes the `onClose` callback
- **AND** the modal disappears from the DOM

#### Scenario: Timer is cleaned up on manual close
- **WHEN** the user manually closes the modal (click or Escape) before 3 seconds elapse
- **THEN** the auto-close timer is cancelled
- **AND** no further `onClose` invocations occur after manual close

### Requirement: User-Initiated Close
The system SHALL allow the user to close the celebration modal by clicking the modal backdrop or pressing the Escape key.

#### Scenario: Click backdrop to close
- **WHEN** the user clicks the modal backdrop (outside the modal content)
- **THEN** the modal closes immediately

#### Scenario: Press Escape to close
- **WHEN** the modal is open and the user presses the Escape key
- **THEN** the modal closes immediately

### Requirement: Modal Does Not Block Subsequent Check-ins
The system SHALL allow the user to perform another check-in after the celebration modal closes.

#### Scenario: Form is reset after close
- **WHEN** the celebration modal closes
- **THEN** the underlying check-in form has been reset (no selected sport, no note)
- **AND** the user can select another sport and check in again

#### Scenario: Independent of Toast
- **WHEN** both the celebration modal and the success Toast are visible
- **THEN** they do not visually overlap (Toast at top, Modal in center)
- **AND** closing one does not affect the other

## ADDED Requirements

### Requirement: CheckInCelebration Component
The system SHALL provide a `<CheckInCelebration>` component that wraps the existing `Modal` to display an encouragement message.

#### Scenario: Renders encouragement text
- **WHEN** the component receives an `encouragement: string` prop and `open: boolean` is `true`
- **THEN** it displays the encouragement text in a centered, prominent style

#### Scenario: Component hides when closed
- **WHEN** `open` is `false`
- **THEN** the component renders nothing in the DOM
