# Contributing to Daily Task Planner

Thank you for your interest in contributing to the Daily Task Planner! This document provides guidelines and instructions for setting up the project and submitting contributions.

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Bun](https://bun.sh/) (v1.1 or higher) - Preferred for speed and built-in SQLite support

### Setup
1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/todo-trae-main.git
    cd todo-trae-main
    ```

2.  **Install dependencies**:
    ```bash
    bun install
    # or
    npm install
    ```

3.  **Run the development server**:
    ```bash
    bun dev
    # or
    npm run dev
    ```

4.  **Open the application**:
    Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛠️ Development Workflow

### Branching Strategy
- `main`: Production-ready code.
- `develop`: Ongoing integration (if applicable).
- `feature/*`: New features or improvements.
- `bugfix/*`: Critical bug fixes.

### Coding Standards
- **TypeScript**: Use strict typing. Avoid `any` unless absolutely necessary.
- **Components**: Follow the atomic design principles. Keep components small and focused.
- **Styling**: Use Tailwind CSS utility classes. Prefer CSS variables for theme-specific colors.
- **State**: Use Zustand for global state. Use React `useState` for local component state.
- **Naming**: 
  - Components: `PascalCase`
  - Functions/Variables: `camelCase`
  - Files: `kebab-case` (except for Next.js convention files like `page.tsx`).

### Testing
- **Unit Tests**: Run `bun test` or `npm test`.
- **E2E Tests**: Run `npx playwright test`.
- Always add tests for new features or bug fixes.

---

## 📝 Pull Request Process

1.  **Create a branch** from `main`.
2.  **Make your changes**.
3.  **Run linting and tests**:
    ```bash
    bun lint
    bun test
    ```
4.  **Commit your changes** using descriptive messages (follow [Conventional Commits](https://www.conventionalcommits.org/)):
    - `feat: add AI prioritization logic`
    - `fix: resolve hydration error in Sidebar`
    - `docs: update architecture guide`
5.  **Push your branch** and open a Pull Request.
6.  **Request a review** and address any feedback.

---

## 🐞 Reporting Issues

If you find a bug or have a feature request, please open an [Issue](https://github.com/your-username/todo-trae-main/issues) with:
- A clear title and description.
- Steps to reproduce the bug.
- Expected vs actual behavior.
- Screenshots or recordings if applicable.

---

## 📜 License
This project is licensed under the MIT License.
