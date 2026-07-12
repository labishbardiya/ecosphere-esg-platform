```markdown
# ecosphere-esg-platform Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns and conventions used in the `ecosphere-esg-platform` repository, a TypeScript project built with Next.js. It covers file naming, import/export styles, commit conventions, and testing patterns, providing clear examples and suggested commands for efficient collaboration.

## Coding Conventions

### File Naming
- Use **camelCase** for file and folder names.
  - Example: `userProfile.ts`, `dashboardHeader.tsx`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { fetchData } from '@/utils/api';
    ```

### Export Style
- Mixed usage of **default** and **named exports**.
  - Example (default export):
    ```typescript
    export default function Dashboard() { ... }
    ```
  - Example (named export):
    ```typescript
    export const getUser = () => { ... };
    ```

### Commit Message Conventions
- Use **Conventional Commits** with the `feat` prefix for features.
- Average commit message length: 73 characters.
  - Example:
    ```
    feat: add ESG score calculation to company overview page
    ```

## Workflows

### Feature Development
**Trigger:** When adding a new feature or page  
**Command:** `/feature-development`

1. Create a new branch:  
   `git checkout -b feat/short-description`
2. Implement the feature using camelCase file naming and alias imports.
3. Export components/functions as default or named exports as appropriate.
4. Write or update relevant tests in `*.test.*` files.
5. Commit changes using the `feat:` prefix and a descriptive message.
6. Push your branch and open a pull request.

### Testing
**Trigger:** When verifying code correctness  
**Command:** `/run-tests`

1. Locate or create test files matching the `*.test.*` pattern.
2. Run the test suite using your project's test runner (framework unknown; typically `npm test` or `yarn test`).
3. Ensure all tests pass before merging changes.

## Testing Patterns

- Test files follow the `*.test.*` naming pattern (e.g., `userProfile.test.ts`).
- Testing framework is not specified; use the project's configured runner.
- Place tests alongside the code they verify or in a dedicated `__tests__` directory.

  ```typescript
  // userProfile.test.ts
  import { render } from '@testing-library/react';
  import UserProfile from '@/components/userProfile';

  test('renders user profile', () => {
    const { getByText } = render(<UserProfile />);
    expect(getByText('User Profile')).toBeInTheDocument();
  });
  ```

## Commands
| Command               | Purpose                                 |
|-----------------------|-----------------------------------------|
| /feature-development  | Guide for adding a new feature          |
| /run-tests            | Steps to run the test suite             |
```
