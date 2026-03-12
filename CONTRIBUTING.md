# Contributing to OurGlass

We're excited that you're interested in contributing! OurGlass is a project built to help couples manage their finances better through AI and modern design.

## Development Setup

1. **Fork the repo** and clone it locally.
2. **Setup environment variables**: Copy `env/example.env` to `.env.local` and add your keys.
3. **Database**: Use the provided `database/schema.sql` to initialize your local or staging Supabase instance.
4. **Install**: Run `npm install`.
5. **Dev Mode**: Run `npm run dev`.

## Coding Standards

- **TypeScript**: All new code must be written in TypeScript.
- **Styling**: Use Tailwind CSS. Stick to the project's existing color palette (modern, vibrant, glassmorphism).
- **Hebrew Support**: All user-facing strings must be in Hebrew. Use the `CURRENCY_SYMBOL` and `LOCALE` constants from `@/lib/constants`.
- **Logic**: Do not modify the core `netWorthEngine` or AI prompts without discussing in an issue first.

## Commit Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for UI/CSS changes
- `refactor:` for code restructuring

## Pull Request Process

1. Create a new branch: `git checkout -b feature/your-feature-name`.
2. Make your changes and ensure they are linted: `npm run lint`.
3. Run tests: `npm run test`.
4. Push to your fork and submit a Pull Request.
5. Provide a clear description of the changes and screenshots for UI updates.

## Questions?

If you have questions, feel free to open an issue or reach out to the maintainers.

---

Thank you for helping us make OurGlass better! 💎
