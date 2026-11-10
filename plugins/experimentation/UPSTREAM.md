# Vendored experimentation runtime

This directory contains the unmodified `src/` and `LICENSE.md` files from
[adobe/aem-experimentation v2.0.0](https://github.com/adobe/aem-experimentation/tree/1079f967fb2e5c54a7471de957ea6b880bb574d0),
commit `1079f967fb2e5c54a7471de957ea6b880bb574d0`.

The files were copied from that immutable public release archive. This is a bulk
vendor import instead of `git subtree`, which would create extra commits. Adobe's
copyright headers and Apache 2.0 license are preserved.

`src/index.js` has one project compatibility patch: direct `main > div` section
exports with `data-<namespace>*` metadata are processed before legacy
`.section-metadata` blocks. When both forms exist on a section, exported data
attributes take precedence so the same modification is not registered twice.
Project-specific loading and environment checks live in `scripts/experiment-loader.js`.

For an update, compare and replace these four upstream files together, record the
new immutable commit here, and rerun the runtime tests. The vendor source is
excluded from project linting so automatic fixes do not modify upstream code.
