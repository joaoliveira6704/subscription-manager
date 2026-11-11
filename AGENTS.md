# Agent rules: Tallyo

Every AI agent working in this repo follows these rules. A feature is not "done" until it meets all of them.

## 1. Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v58.0.0/ before writing any code.

- APIs in this SDK differ from older examples on the web. When the docs and your memory disagree, trust the docs and the type definitions in `node_modules/<package>/build/*.d.ts`.
  - Example: Expo Router layouts use `unstable_settings.anchor`, not `initialRouteName`.
- Install native packages with `bunx expo install <pkg>`, never with plain `bun add`, so versions match the SDK.
- Package manager: **bun**. Do not create `package-lock.json` or `yarn.lock`.

## 2. Definition of done

Before you say a feature is finished, all of these must be true:

1. **Types pass.** `npx tsc --noEmit` reports no *new* errors.
2. **Tests pass.** `bun run test` is green. If the test runner isn't set up yet, set it up first: `jest-expo` with a `test` script in `package.json`.
3. **New logic has tests.** See section 3.
4. **Lint passes.** `bun run lint` passes.
5. **It runs.** The feature works in the iOS simulator or on an Android device or emulator. Check light **and** dark mode.
6. **No leftovers.** No `console.log` debugging, no unused dependencies, no commented-out code, and no TODOs without a reason.

If any step fails or could not be run, say so plainly in your summary. Never claim it passed.

## 3. Testing rules

- **Write tests for every important function.** That covers business logic, data access, validation, money and date math, and auth.
  - Pure logic lives in `src/lib/` and must be unit tested.
  - Example: `src/lib/validation.ts` and `src/lib/auth.ts`.
- **Cover edge cases, not just the happy path.** At minimum:
  - Empty, whitespace-only and very long strings
  - `null` and `undefined` inputs
  - Boundaries: 0, negative numbers, exactly-at-limit values (e.g. a password of exactly `MIN_PASSWORD_LENGTH` characters)
  - Duplicates and case sensitivity (e.g. `User@Mail.com` vs `user@mail.com`)
  - Invalid formats and unexpected types
  - Error paths: DB failures, missing rows, rejected promises
  - Money: rounding, currency precision, and zero or free plans
  - Dates: month ends, leap years, time zones, and renewal on the 29th, 30th or 31st
- **Fix bugs test-first.** When fixing a bug, first write a test that reproduces it, then fix it.
- **Write tests next to the code**, as `*.test.ts(x)`, or in `__tests__/`. Name each test after the behaviour it checks, e.g. `it('rejects passwords shorter than 6 characters')`.
- **Mock native modules** (`expo-sqlite`, `expo-secure-store`, `expo-crypto`) in unit tests. Don't hit real device APIs.
- **Never weaken a test to make it pass.** If a test is wrong, explain why before you change it.

## 4. Architecture

- **Routes** are in `src/app/` (Expo Router):
  - `(auth)/` holds signed-out screens.
  - `(tabs)/` holds signed-in screens.
  - The root layout guards them with `Stack.Protected`.
- **Shared UI** is in `src/components/ui/`. Reuse `Button`, `TextField`, `PasswordField`, `ThemedText` and `ThemedView` before you create new primitives.
- **Logic** that is not React goes in `src/lib/`, so screens stay thin.
- **Data** is local SQLite (`src/lib/db.ts`).
  - Schema changes go in `migrate()` as a new `user_version` step. Never edit an existing migration.
  - Always use parameterized queries (`?`). Never interpolate user input into SQL.
- **App-wide state** goes in `src/context/`, with a `useX()` hook that throws outside its provider.
- **Secrets**: never log passwords, hashes or tokens. Store session data with `expo-secure-store`.

## 5. UI style: modern fintech

The app should look like a polished modern banking app: clean, confident, number-first. Take inspiration from that *style* only. Never copy another company's logo, brand assets or exact screens.

**Visual language**

- Dark mode is first-class and must look as good as light mode.
- Theme colors come from `Colors` in `src/constants/theme.ts`. Never hard-code a hex value in a screen; add a token instead.
- Use one vivid accent color for primary actions and highlights. Everything else stays neutral.
- Surfaces are rounded cards (`borderRadius` ≥ `Spacing.three`) on `backgroundElement`. Avoid borders and heavy shadows.
- Buttons are large, full-width pills, at least 52 pt tall, with one primary action per screen.
- Spacing comes from the `Spacing` scale only. Use generous whitespace.

**Typography and numbers**

- Amounts are the hero element: large, bold and tabular (`fontVariant: ['tabular-nums']`).
- Show currency symbols and decimals smaller than the main figure.
- Format money with `Intl.NumberFormat` and the user's locale. Never concatenate strings to format money.
- Use short, plain-language labels and sentence case.

**Layout patterns**

- A big balance or total header at the top of a screen.
- Round quick-action buttons with an icon and a short label.
- Lists of items: a leading round icon or logo, then name and subtitle, then a trailing amount.
- Group lists by date or category under small section headers.
- Prefer bottom sheets for create and edit flows over full-screen pushes.

**Motion and feel**

- Use subtle `react-native-reanimated` transitions, typically 150–300 ms. Nothing should bounce for no reason.
- Pressed states are required: an opacity or scale change.
- Use haptics (`expo-haptics`) for confirmations and destructive actions.
- Plan skeleton or loading states and empty states for every list. Don't leave a blank screen.

**Accessibility**

- Touch targets are at least 44 pt.
- Every icon-only button has an `accessibilityLabel`.
- Text must pass WCAG AA contrast in both themes.
- Layouts must not break at larger Dynamic Type sizes.

## 6. Git and PRs

- Branch from `main` as `feat/…`, `fix/…` or `chore/…`. Never commit directly to `main`.
- Use Conventional Commits, e.g. `feat(auth): add login screen`.
- Keep each PR focused on one feature.
- Fill in `.github/pull_request_template.md`, including iOS and Android screenshots for UI changes.
