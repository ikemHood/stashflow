# Contributing to StashFlow

First of all, thank you for considering contributing to StashFlow! It's people like you that make StashFlow such a great tool. We welcome contributions from everyone, whether you're fixing a typo, improving documentation, reporting a bug, or implementing a new feature.

This document provides guidelines and instructions for contributing to the StashFlow codebase. Following these guidelines helps us make the contribution process easy and effective for everyone involved.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
  - [Setting Up Your Development Environment](#setting-up-your-development-environment)
  - [Finding Issues to Work On](#finding-issues-to-work-on)
- [Development Process](#development-process)
  - [Branching Strategy](#branching-strategy)
  - [Commit Messages](#commit-messages)
  - [Pull Requests](#pull-requests)
  - [Code Reviews](#code-reviews)
- [Coding Standards](#coding-standards)
  - [JavaScript/TypeScript](#javascripttypescript)
  - [Smart Contracts](#smart-contracts)
  - [Documentation](#documentation)
  - [Testing](#testing)
- [Design and UI Contributions](#design-and-ui-contributions)
- [Reporting Bugs](#reporting-bugs)
- [Feature Requests](#feature-requests)
- [Community and Communication](#community-and-communication)
- [Legal Stuff](#legal-stuff)

## Code of Conduct

By participating in this project, you agree to abide by our [Code of Conduct](CODE_OF_CONDUCT.md). Please read it before engaging with our community.

## Getting Started

### Setting Up Your Development Environment

1. **Fork the Repository**: Click the "Fork" button at the top right of the [StashFlow repository](https://github.com/ikemHood/stashflow).

2. **Clone Your Fork**:
   ```bash
   git clone https://github.com/ikemHood/stashflow.git
   cd stashflow
   ```

3. **Add the Original Repository as a Remote**:
   ```bash
   git remote add upstream https://github.com/ikemHood/stashflow.git
   ```

4. **Install Dependencies**:
   ```bash
   npm install
   # or
   yarn install
   ```

5. **Set Up the Environment Variables**:
   ```bash
   cp .env.example .env
   ```
   Fill in the necessary environment variables in the `.env` file.

6. **Set Up the Database**:
   ```bash
   npm run migrate
   # or
   yarn migrate
   ```

7. **Start the Development Server**:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Finding Issues to Work On

- Check our [Issues](https://github.com/ikemHood/stashflow/issues) page for tasks labeled `good first issue` or `help wanted`.
- If you're interested in working on an issue, comment on it to let others know.
- If you have an idea for a new feature or improvement, please open an issue to discuss it before starting work.

## Development Process

### Branching Strategy

We follow a simplified Git flow approach:

- `main` branch contains the latest stable release
- `develop` branch contains the latest development changes
- Feature branches should be created from `develop` and named according to the convention `feature/your-feature-name`
- Bug fix branches should be named `fix/bug-description`

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types include:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

Example:
```
feat(savings): implement flexible savings withdrawal functionality

Add the ability for users to withdraw from their flexible savings account
at any time without penalties.

Closes #42
```

### Pull Requests

1. **Create a New Branch** from `develop`:
   ```bash
   git checkout develop
   git pull upstream develop
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes** and commit them using the guidelines above.

3. **Push Your Branch** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** from your branch to the `develop` branch of the main repository.

5. **Fill Out the Pull Request Template** thoroughly, explaining your changes.

### Code Reviews

All submissions require review. We use GitHub pull requests for this purpose:

- Be respectful and considerate in your communication
- Be open to feedback and willing to make changes
- Reviewers will provide actionable feedback
- Address all review comments before requesting a re-review

## Coding Standards

### JavaScript/TypeScript

- We use [ESLint](https://eslint.org/) and [Prettier](https://prettier.io/) for code formatting
- Run `npm run lint` before submitting your PR
- Use TypeScript for type safety wherever possible
- Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

### Smart Contracts

- Follow [Solidity style guide](https://docs.soliditylang.org/en/latest/style-guide.html)
- All contracts must be thoroughly tested
- Consider gas optimization in your implementations
- Include detailed NatSpec comments

### Documentation

- Update relevant documentation when changing code
- Use JSDoc comments for functions and components
- Include code examples where appropriate
- Keep README and other docs up to date

### Testing

- All new features must include tests
- All bug fixes must include tests that verify the fix
- Maintain or improve test coverage
- Run `npm test` before submitting your PR

## Design and UI Contributions

- Follow our design system and UI guidelines
- Use Tailwind CSS utility classes consistently
- Maintain responsive design principles
- Ensure accessibility compliance

## Reporting Bugs

When reporting bugs, please include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Screenshots if applicable
- Environment information (browser, OS, device)
- Any additional context

## Feature Requests

For feature requests, please:

- Clearly describe the problem your feature would solve
- Outline the solution you'd like to see
- Discuss alternatives you've considered
- Provide context on who would benefit
- Note if you're willing to help implement the feature

## Community and Communication

- Join our [Discord server](https://discord.gg/stashflow) for real-time discussions
- Follow us on [Twitter](https://twitter.com/StashFlowHQ) for announcements
- Subscribe to our newsletter for updates

## Legal Stuff

- By contributing, you agree that your contributions will be licensed under the project's [MIT License](LICENSE)
- Please ensure you have the right to submit any code you contribute
- If you include any third-party code or assets, ensure they are compatible with our license

---

Thank you for contributing to StashFlow! Your efforts help make decentralized savings accessible to everyone. If you have any questions, feel free to reach out to the maintainers or the community.