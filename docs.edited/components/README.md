# Components Documentation

## Overview
This directory contains documentation for major reusable React components used throughout the application.

---

## Available Components

### Product Components

#### [AddToCartButton](./AddToCartButton.md)
Client-side button component for adding products to cart with quantity selection.

**Features:**
- Quantity increment/decrement
- Stock validation
- Loading states
- Success/error feedback
- API integration

**Usage:**
```tsx
<AddToCartButton
  productId="prod_123"
  stockQuantity={50}
/>
```

**File:** `src/components/product/AddToCartButton.tsx`

---

## Component Architecture

### UI Components (`src/components/ui/`)
Base UI components built with Radix UI and Tailwind CSS:
- Button
- Input
- Select
- Dialog
- Card
- Badge
- And more...

### Feature Components (`src/components/`)
- **Admin** - Admin panel specific components
  - SupplierEditForm
  - CustomerGroupForm
- **Product** - Product display and interaction
  - AddToCartButton
  - ProductCard
  - ProductGrid
- **Cart** - Shopping cart components
- **Wishlist** - Wishlist components
- **Search** - Search and filter components

---

## Component Standards

### 1. File Organization
```
src/components/
├── ui/                  # Base UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
├── product/             # Product-related
│   ├── AddToCartButton.tsx
│   └── ProductCard.tsx
├── admin/               # Admin components
│   ├── SupplierEditForm.tsx
│   └── CustomerGroupForm.tsx
└── layout/              # Layout components
    ├── Header.tsx
    └── Footer.tsx
```

### 2. Naming Conventions
- PascalCase for component names
- Descriptive, action-oriented names
- Suffix with type (Button, Form, Card, etc.)

### 3. TypeScript
- All components are fully typed
- Props interfaces exported
- Generic types where applicable

### 4. Client vs Server
- `'use client'` directive for interactive components
- Server components by default
- Clearly documented in each file

---

## Common Patterns

### 1. Form Components
```tsx
interface FormProps {
  onSubmit: (data: FormData) => Promise<void>;
  initialData?: FormData;
  isLoading?: boolean;
}

export function MyForm({ onSubmit, initialData, isLoading }: FormProps) {
  // Form implementation
}
```

### 2. Data Display Components
```tsx
interface DisplayProps {
  data: DataType;
  variant?: 'default' | 'compact' | 'detailed';
}

export function MyDisplay({ data, variant = 'default' }: DisplayProps) {
  // Display implementation
}
```

### 3. Interactive Components
```tsx
'use client';

interface InteractiveProps {
  onAction: () => void;
  disabled?: boolean;
}

export function MyInteractive({ onAction, disabled }: InteractiveProps) {
  const [state, setState] = useState();
  // Interactive implementation
}
```

---

## Component Development Guidelines

### 1. Accessibility
- Use semantic HTML
- Include ARIA attributes
- Support keyboard navigation
- Provide descriptive labels

### 2. Performance
- Use React.memo for expensive renders
- Implement proper loading states
- Optimize re-renders
- Lazy load when appropriate

### 3. Error Handling
- Graceful error displays
- User-friendly messages
- Fallback UI for errors
- Console logging for debugging

### 4. Styling
- Tailwind CSS utility classes
- Consistent spacing (4px grid)
- Responsive design
- Dark mode support (future)

---

## Testing Components

### Unit Tests
```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent prop="value" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('handles user interaction', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });
});
```

### Integration Tests
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent Integration', () => {
  it('fetches and displays data', async () => {
    render(<MyComponent />);
    await waitFor(() => {
      expect(screen.getByText('Loaded Data')).toBeInTheDocument();
    });
  });
});
```

---

## Contributing New Components

### 1. Create Component File
```bash
# Create component file
touch src/components/category/MyNewComponent.tsx

# Create test file
touch src/components/category/MyNewComponent.test.tsx
```

### 2. Component Template
```tsx
import React from 'react';

interface MyNewComponentProps {
  // Define props
}

export function MyNewComponent({ /* props */ }: MyNewComponentProps) {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
}
```

### 3. Add Documentation
Create `docs.edited/components/MyNewComponent.md` with:
- Overview
- Props interface
- Usage examples
- API integration (if any)
- Accessibility notes
- Related components

### 4. Export Component
```tsx
// src/components/index.ts
export { MyNewComponent } from './category/MyNewComponent';
```

---

## Component Dependencies

### Core Dependencies
```json
{
  "react": "^18.0.0",
  "next": "^14.0.0",
  "@radix-ui/react-*": "UI primitives",
  "lucide-react": "Icons",
  "tailwindcss": "Styling"
}
```

### Utility Libraries
```json
{
  "clsx": "Conditional classnames",
  "date-fns": "Date formatting",
  "zod": "Schema validation"
}
```

---

## Related Documentation

- [API Documentation](../api/) - Backend API endpoints
- [Pages Documentation](../pages/) - Page implementations
- [Quick Start Guide](../../QUICK_START.md) - Getting started
- [Deployment Guide](../../DEPLOYMENT.md) - Production deployment

---

Last Updated: 2025-11-23
