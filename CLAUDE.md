# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
- `pnpm dev` - Start development server with Vite
- `pnpm build` - Build production bundle (runs TypeScript check first)
- `pnpm preview` - Preview production build

### Code Quality
- `pnpm typeCheck` - Run TypeScript type checking (no emit)
- `pnpm lint` - Run ESLint on codebase
- `pnpm pretty` - Format staged files with Prettier

### Testing
- `pnpm test` - Run Vitest tests
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Run tests with coverage report

### Git Hooks
- `pnpm hook:precommit` - Pre-commit hook: typecheck, lint, and format
- `pnpm hook:prepush` - Pre-push hook: run tests

## Project Architecture

This is a React + TypeScript application built with Vite, following Clean Architecture principles with a modular structure.

### Module Organization

The `src/modules/` directory contains:

- **`app/`** - Application bootstrapping and initialization
  - `main.ts` - Main App class that sets up dependencies and Redux store
  - `react/` - React-specific app components (AppWrapper, Layout, etc.)

- **`global/`** - Cross-cutting concerns and infrastructure
  - `core/` - Abstract interfaces (gateways, providers)
  - `gateways-impl/` - Concrete gateway implementations
  - `providers-impl/` - Concrete provider implementations  
  - `react/` - Global React components and App component

- **`shared/`** - Reusable utilities and components
  - `helpers/` - Pure utility functions
  - `react/components/` - Reusable React components
  - `react/hooks/` - Custom React hooks
  - `utils/` - General utility functions

- **`store/`** - Redux store configuration
  - `store.ts` - Store setup with thunk middleware
  - `dependencies.ts` - Dependency injection types
  - `app-state.ts` - Root state type definition

- **`testing/`** - Testing utilities
  - `tests-environment.ts` - Test store and state creation helpers

### Key Architectural Patterns

1. **Dependency Injection**: Dependencies are injected via Redux thunk's `extraArgument`
2. **Interface Segregation**: Core interfaces in `core/` with implementations in `*-impl/` folders
3. **Clean Architecture**: Business logic separated from framework concerns
4. **Modular Structure**: Each module has clear boundaries and responsibilities

### Important Files

- `src/main.tsx` - Application entry point
- `src/modules/app/main.ts` - Main application class with dependency setup
- `src/modules/store/store.ts` - Redux store configuration
- `src/modules/testing/tests-environment.ts` - Test utilities for store/state creation

### Path Aliases

- `@root/*` and `@/*` both resolve to `src/*`

### Testing Strategy

- Uses Vitest for unit testing
- Testing utilities provide `createTestStore()` and `createTestState()` helpers
- Stub implementations available for external dependencies
- Tests should use the testing environment utilities for consistent setup

### Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **State Management**: Redux Toolkit with thunk middleware
- **Testing**: Vitest + React Testing Library
- **Styling**: Tailwind CSS + shadcn/ui components
- **Code Quality**: ESLint + Prettier + Husky hooks
- **External**: Airwallex Components SDK for payment functionality