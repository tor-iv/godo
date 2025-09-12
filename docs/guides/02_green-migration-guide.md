# Green Color Palette Migration Guide

## Overview
This guide outlines how to migrate from the existing purple color scheme to the new medium dark pastel green palette while maintaining design consistency and accessibility.

## Migration Status

### ✅ Completed Updates
- **Primary color tokens**: Updated in `/src/design/tokens.ts`
- **Flat design tokens**: Updated in `/src/design/flatTokens.ts`
- **Green palette definition**: Created in `/src/design/greenPalette.ts`

### 🔄 Component Updates Required

#### High Priority (Core UI)
1. **Button Components**
   - File: `/src/components/base/Button.tsx`
   - Update: Replace any hardcoded purple values with `colors.primary[500]`

2. **FlatButton Component**
   - File: `/src/components/base/FlatButton.tsx`
   - Status: Already using token system ✅

3. **Navigation Components**
   - File: `/src/navigation/TabNavigator.tsx`
   - Update: Verify tab indicator colors use token system

#### Medium Priority (Interactive Elements)
1. **Calendar Components**
   - Update event selection states
   - Verify date picker colors
   - Check hover/active states

2. **Event Cards**
   - File: `/src/components/events/EventCard.tsx`
   - Update: Replace any hardcoded border colors

3. **Profile Components**
   - Check action button colors
   - Verify settings panel colors

#### Low Priority (Semantic Elements)
1. **Success States**: Already updated to match green palette
2. **Form Validation**: Maintain existing error/warning colors
3. **Loading States**: Update if using brand colors

## Color Mapping Reference

### Primary Brand Colors
```typescript
// Old Purple → New Green
'#8B5CF6' → '#4F9A5E' // Primary brand
'#7C3AED' → '#3d8249' // Primary dark  
'#6D28D9' → '#2f6b38' // Darker
'#b887ff' → '#82c794' // Medium/hover
'#e6d7ff' → '#d4eddc' // Light backgrounds
```

### Quick Find & Replace
```bash
# Search for hardcoded purple values
grep -r "#8B5CF6" src/
grep -r "#7C3AED" src/
grep -r "purple" src/ --include="*.tsx" --include="*.ts"

# Common purple hex codes to look for
#8B5CF6, #7C3AED, #6D28D9, #b887ff, #e6d7ff
```

## Component Testing Checklist

### Visual Testing
- [ ] Button states (default, hover, pressed, disabled)
- [ ] Navigation indicators and active states
- [ ] Form focus states and validation
- [ ] Card selection and interaction states
- [ ] Calendar date selection and events

### Accessibility Testing  
- [ ] Text contrast on green backgrounds (minimum 4.5:1)
- [ ] Focus indicators are visible
- [ ] Color is not the only way to convey information
- [ ] Test with color blindness simulators

### Interactive Testing
- [ ] Touch targets meet minimum size requirements
- [ ] Hover states work on web
- [ ] Animation transitions are smooth
- [ ] Loading states are clear

## Usage Examples

### Using the Green Palette in Components
```typescript
import { colors } from '../design/tokens';
import { greenPalette } from '../design/greenPalette';

// Primary button
const primaryButton = {
  backgroundColor: colors.primary[500], // #4F9A5E
  borderColor: colors.primary[500],
};

// Hover state
const hoverButton = {
  backgroundColor: colors.primary[400], // #82c794  
};

// Disabled state
const disabledButton = {
  backgroundColor: colors.primary[200], // #d4eddc
};
```

### Custom Green Usage
```typescript
import { greenPalette } from '../design/greenPalette';

// For special cases requiring specific green tones
const customGreen = greenPalette.states.hover;
const gradientBackground = greenPalette.gradients.subtle;
```

## Validation Steps

### 1. Build Test
```bash
cd godo-app
npm run build
```

### 2. Visual Regression
- Take screenshots of key screens
- Compare before/after for consistency
- Verify no broken layouts

### 3. Accessibility Audit
```bash
# If using accessibility testing tools
npm run test:a11y
```

## Rollback Plan

If issues arise, revert changes by:

1. **Reset tokens.ts**:
   ```bash
   git checkout HEAD~1 -- src/design/tokens.ts
   ```

2. **Reset flatTokens.ts**:
   ```bash  
   git checkout HEAD~1 -- src/design/flatTokens.ts
   ```

3. **Remove new files**:
   ```bash
   rm src/design/greenPalette.ts
   ```

## Quality Assurance

### Color Consistency
- All interactive elements use the same green tones
- Semantic colors (error, warning, info) remain unchanged
- Neutral colors maintain their purpose

### Brand Alignment  
- Green palette conveys growth and productivity
- Professional appearance for business context
- Maintains NYC app's sophisticated aesthetic

### Technical Implementation
- All colors defined in design tokens
- No hardcoded values in components
- Consistent naming conventions

## Next Steps

1. **Component Review**: Systematically check each component file
2. **Screenshot Comparison**: Document visual changes
3. **User Testing**: Gather feedback on new color scheme
4. **Performance Check**: Ensure no rendering issues
5. **Documentation Update**: Update style guide with new colors

---

*Migration completed: Primary tokens updated*
*Next: Component-level validation and testing*