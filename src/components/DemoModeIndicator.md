# Demo Mode UI Indicators

This component provides visual indicators to show when the user is in demo mode, ensuring users can clearly distinguish demo mode from normal operation.

## Component: DemoModeIndicator

### Purpose
- Shows visual indicators when `isDemoLoaded` is true in the AuthProvider
- Provides different variants for different UI locations
- Uses consistent yellow/amber color scheme to indicate demo mode

### Variants

#### Banner (`variant="banner"`)
- Large prominent banner with icon and descriptive text
- Used in drawer sidebar for maximum visibility
- Text: "Demo Mode - Exploring with sample data"

#### Badge (`variant="badge"`)
- Small compact badge with icon and "DEMO" text
- Used in header areas where space is limited
- Minimal footprint while still being noticeable

#### Header (`variant="header"`)
- Medium-sized indicator for header sections
- Text: "Demo Mode"
- Balanced between visibility and space usage

### Usage Locations

1. **Drawer Sidebar** - Banner variant at the top
2. **Header Right** - Badge variant next to theme toggle
3. **Footer Area** - Informational text about demo data cleanup

### Implementation Details

- Only renders when `isDemoLoaded` is true from AuthProvider
- Uses Beaker icon to represent experimental/demo nature
- Consistent yellow/amber color scheme (#fbbf24 / #f59e0b)
- Responsive to dark mode with appropriate color adjustments
- Accessible with proper contrast ratios

### Integration Points

- `src/app/(drawer)/_layout.tsx` - Main integration point
- Uses `useAuth()` hook to check demo mode status
- Automatically shows/hides based on authentication state

### Requirements Satisfied

- **Requirement 2.4**: Visual indicators to show demo mode status
- Clear distinction between demo and normal operation
- Multiple UI locations for comprehensive coverage
- Consistent visual design language