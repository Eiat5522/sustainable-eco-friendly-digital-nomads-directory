# 🖼️ Component Library Documentation - Next.js Application

This document provides an overview of the component library used in the **app-next-directory** (Next.js frontend) workspace. It covers the structure, usage guidelines, and key components.

## 🎨 Component Philosophy

Our component strategy emphasizes:

1.  **Reusability**: Creating components that can be used in multiple parts of the application.
2.  **Composability**: Building complex UIs by combining smaller, focused components.
3.  **Accessibility (A11y)**: Ensuring components are accessible to all users, following WAI-ARIA guidelines.
4.  **Consistency**: Maintaining a consistent look and feel across the application.
5.  **Developer Experience**: Making components easy to understand, use, and extend.

## 🛠️ Core Technologies & Libraries

*   **React**: The fundamental library for building user interfaces.
*   **Tailwind CSS**: A utility-first CSS framework for styling components. We use it for rapid UI development and maintainable styling.
*   **Radix UI**: A library of unstyled, accessible, and customizable UI primitives. We use Radix UI as a base for many of our custom components to ensure accessibility and functionality out-of-the-box.
    *   Examples: Dropdown Menus, Dialogs, Tooltips, Tabs.
*   **clsx** or **classnames**: Utility for conditionally joining class names.
*   **Lucide Icons**: For a consistent and customizable icon set.
*   **Storybook** (Planned): For developing, documenting, and testing UI components in isolation.

## 📂 Component Structure

Components are primarily located in the `app-next-directory/src/components/` directory, organized as follows:

```
src/components/
├── ui/                     # General-purpose UI components (often built on Radix)
│   ├── button.tsx
│   ├── dialog.tsx
│   ├── dropdown-menu.tsx
│   ├── input.tsx
│   ├── label.tsx
│   ├── card.tsx
│   └── ... (other Radix-based or custom UI primitives)
├── layout/                 # Components for structuring page layouts
│   ├── header.tsx
│   ├── footer.tsx
│   ├── sidebar.tsx
│   └── page-wrapper.tsx
├── domain/                 # Components specific to application domains/features
│   ├── listings/
│   │   ├── listing-card.tsx
│   │   ├── listing-filter.tsx
│   │   └── listing-map.tsx
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── registration-form.tsx
│   └── user/
│       └── profile-avatar.tsx
├── common/                 # Shared components that don't fit ui/ or layout/
│   ├── icon.tsx
│   ├── logo.tsx
│   └── theme-toggle.tsx
└── providers/              # Context providers or higher-order components
    └── theme-provider.tsx
```

### **Naming Conventions**

*   Use PascalCase for component file names and component names (e.g., `UserProfile.tsx`, `function UserProfile() {}`).
*   Keep component files focused. If a component becomes too complex, consider breaking it into smaller sub-components.

## 🚀 Using Components

### **Importing Components**

```typescript
import { Button } from "@/components/ui/button";
import { ListingCard } from "@/components/domain/listings/listing-card";
import { Header } from "@/components/layout/header";
```

We use path aliases (`@/components/...`) configured in `tsconfig.json` for cleaner import paths.

### **Props and Typing**

*   All components should have clearly defined props using TypeScript interfaces or types.
*   Use descriptive prop names.
*   Provide default props where sensible.

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ ...props }) => {
  // ...implementation
});
```

## ✨ Key UI Components (`src/components/ui/`)

This section highlights some of the core UI components, many of which are styled versions of Radix UI primitives.

*   **`Button`**: Standard button component with various styles (primary, secondary, outline, destructive, link, ghost) and sizes.
*   **`Input`**: Styled input field for forms.
*   **`Label`**: Accessible label for form inputs.
*   **`Card`**: Container component for displaying content in a card format.
*   **`Dialog`**: Modal dialogs, built upon Radix UI Dialog for accessibility.
*   **`DropdownMenu`**: Dropdown menus, built upon Radix UI DropdownMenu.
*   **`Tooltip`**: Tooltips, built upon Radix UI Tooltip.
*   **`Tabs`**: Tabbed navigation, built upon Radix UI Tabs.
*   **`Sheet`**: Side panel / sheet component, often used for mobile navigation or forms.
*   **`Avatar`**: User avatar display.
*   **`Badge`**: Small status descriptors.
*   **`Checkbox`**: Styled checkbox.
*   **`Select`**: Styled select dropdown.

For detailed usage and props, refer to the source code of each component and the Radix UI documentation for the underlying primitives.

## 🗺️ Layout Components (`src/components/layout/`)

*   **`Header`**: Site-wide header, including navigation and branding.
*   **`Footer`**: Site-wide footer.
*   **`Sidebar`**: Sidebar navigation or content area (if applicable).
*   **`PageWrapper` / `Container`**: Wrappers to enforce consistent page padding, max-width, etc.

## 🎯 Domain-Specific Components (`src/components/domain/`)

These components are tailored to specific features of the application:

*   **`ListingCard`**: Displays a summary of a listing (venue, accommodation).
*   **`ListingFilter`**: UI for filtering listings.
*   **`LoginForm`**: Handles user login.
*   **`RegistrationForm`**: Handles new user registration.

These components often combine multiple UI primitives and handle feature-specific logic.

## 🎨 Styling

*   **Tailwind CSS**: Primarily used for styling. Utility classes are applied directly in the JSX.
*   **`cva` (Class Variance Authority)**: Used within UI components (like `Button`) to manage different style variants and props.
*   **Global Styles**: Minimal global styles are defined in `src/app/globals.css`.
*   **Theming**: If theming (e.g., light/dark mode) is implemented, it's typically managed via a `ThemeProvider` and CSS variables.

## ✅ Accessibility (A11y)

*   Leverage Radix UI primitives, which are designed with accessibility in mind (keyboard navigation, ARIA attributes).
*   Ensure custom components follow A11y best practices:
    *   Semantic HTML.
    *   Proper ARIA roles and attributes where necessary.
    *   Keyboard navigability.
    *   Focus management.
    *   Sufficient color contrast.
*   Regularly test with screen readers and keyboard-only navigation.

## 🧪 Testing Components

*   **Storybook** (Planned): For visual testing and isolated development.
*   **React Testing Library & Jest** (Planned): For unit and integration testing of component logic and rendering.
*   **Playwright**: For E2E testing that includes component interactions as part of user flows.

## 🤝 Contribution Guidelines

1.  **Check for Existing Components**: Before creating a new component, check if a similar one already exists in `ui/` or `common/`.
2.  **Follow Naming Conventions**: Adhere to the established naming and directory structure.
3.  **Prioritize Reusability**: Design components to be as generic and reusable as possible, especially for the `ui/` directory.
4.  **Ensure Accessibility**: Build with accessibility in mind from the start.
5.  **Write Clear Props**: Use TypeScript for prop definitions and provide JSDoc comments for complex props.
6.  **Consider Edge Cases**: Think about different states (loading, error, empty) and user interactions.
7.  **Add Documentation**: For complex or widely used components, add JSDoc comments explaining its purpose, props, and usage examples. (Storybook will eventually be the primary source for this).

---

🔗 **Related Documentation**:
- [Next.js Frontend README (`README.md`)](README.md)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Radix UI Documentation](https://www.radix-ui.com/primitives/docs/overview/introduction)
