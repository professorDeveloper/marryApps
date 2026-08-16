# Safe Refactor Structure

Refactor a feature into a clean modular structure without changing app behavior.

## Main goal

* Do not change what the UI does.
* Do not change business logic.
* Only improve file structure, code organization, and readability.

## What to improve

* Split mixed files into separate files for components, hooks, types, constants, and utils.
* Keep feature-specific code inside the same feature folder.
* Move reusable code to `common/` only when it is truly shared across multiple features.
* Keep feature-specific code out of `common/`.
* Reduce messy files that contain too many things in one place.
* Check for repeated API requests, duplicate renders, bad state flow, or unnecessary state.
* Improve state management and data flow only when it does not change behavior.

## File rules

* One component per file.
* One hook per file.
* One utility per file.
* `types.ts` can contain multiple related types and interfaces.
* `constants.ts` can contain multiple related constants.
* Do not keep multiple unrelated components, hooks, or utils in the same file.
* Interfaces are types too, so keep them in `types.ts`.
* Components must live only inside the `components/` folder of the feature.
* Do not place feature components anywhere else.
* If a component is reused from outside, import it through the feature folder `index.ts`, not from the specific file.

## Important rules

* Preserve existing behavior exactly.
* Do not rewrite working logic unless it is needed for structure or to remove duplication.
* Do not add new features.
* Do not remove existing features.
* Keep component names, props, and public behavior the same unless a rename is needed for structure.
* Update imports and exports after moving files.
* Keep the code easy to read and easy to maintain.
* Do not move code to `common/` unless it is actually reusable in more than one place.
* Use `index.ts` as the main entry point for exports from the feature folder.

## Folder style

* `components/` for UI pieces
* `hooks/` for custom hooks
* `types.ts` for types and interfaces
* `constants.ts` for constants
* `utils/` for small helper functions
* `index.ts` for clean exports
* `common/` for shared reusable code used by multiple features

## Example

If this is the invoice feature, all invoice edit form, invoice list form, invoice rows, invoice helpers, and invoice-specific hooks should stay inside the invoice structure, not mixed with unrelated code.

If a component like a shared button, shared modal, or shared helper is used by multiple features, move it to `common/`.

## Before changing anything

1. Inspect the folder.
2. Identify what can be split.
3. Identify what is feature-specific.
4. Identify what is shared.
5. Identify duplicate API calls or state problems.

## Security & Quality

* If you find any security issue, vulnerability, or risky code, do not fix it silently.
* Create an `MD` file inside the same feature structure folder or main folder.
* Put the finding there clearly so the user can review it and decide what to do next.

Then refactor carefully and keep the final result clean, modular, and simple.
