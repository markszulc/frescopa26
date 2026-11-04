# Register the Frescopa26 skills

These three self-contained Markdown files are ready for review in Coworker's
skill creation flow. They contain the safety and content rules they need.
They do not require the offline helper, a shell, or other repository files.
Committing them does not install or activate them.

| Skill | Registration source |
|---|---|
| Prepare a content challenger | [aem-content-variants/SKILL.md](aem-content-variants/SKILL.md) |
| Propose inactive section metadata | [aem-experimentation-configure/SKILL.md](aem-experimentation-configure/SKILL.md) |
| Inspect saved variants, read-only | [aem-experimentation-preview/SKILL.md](aem-experimentation-preview/SKILL.md) |

These are registration copies of the workflow prepared for Frescopa26.
The host is **DA/Experience Workspace**. It is not AEM Author or Universal
Editor. The content namespace is `markszulc/frescopa26`, regardless of the
GitHub fork owner. Native connector access, authoring, and host UI
compatibility have not been qualified by this package.

## What discovery evidence establishes

The [official assistant documentation](https://www.aem.live/docs/ew/authoring/assistant)
links **Manage Coworker** from the assistant's plus menu.
Adobe's [skill creation guide](https://experienceleague.adobe.com/en/docs/coworker/content/customizations/skills/create-your-first-skill)
describes creating a reusable skill, reviewing it, and publishing it for
future use.

The public DA client
[`fetchSkills()` implementation](https://github.com/adobe/da-nx/blob/7444db0c09543f81a056a54c72d70a9dd6ac43f4/nx2/blocks/chat-ao/utils/skills.js)
requests a skill list for the
[resolved Coworker manifest](https://github.com/adobe/da-nx/blob/7444db0c09543f81a056a54c72d70a9dd6ac43f4/nx2/blocks/chat-ao/utils/manifest.js).
That establishes client-side discovery of registered skills. It does not
establish automatic discovery of `.da/skills/<id>/skill.md` from this
GitHub repository.

Some [feature onboarding documentation](https://www.aem.live/docs/ew/administering/agentic-plugins)
also refers to `https://da.live/apps/skills#/<org>/<site>` and requires
config-write access for site connectors and skills. The schema editor is
not the documented Skills Editor. Confirm which management flow is
available in the entitled environment; do not infer permission from a
readable page.

## Registration procedure

1. In the intended DA/Experience Workspace account and organization, open
   the assistant's plus menu and **Manage Coworker**. Confirm the
   administrator-approved scope before creating a skill. Do not register
   it in a different organization to work around missing access.
2. Select one registration source above. In the supported skill creation
   flow, supply its complete Markdown and ask to prepare a reusable skill
   with the exact frontmatter name. This may be pasted or attached only
   if that flow supports it. This package does not assume ZIP import,
   automatic GitHub synchronization, or a particular storage API.
3. Review the saved draft instructions against the source. Keep every
   scope restriction, confirmation boundary, freshness check, readback
   requirement, and stop condition. Check that the selected tools are
   actually available; instructions cannot add connector capabilities.
4. Approve only that skill's registration when the actual name, scope,
   instructions, and effects are shown. Skill publication is separate
   from publishing site content or activating an experiment. Register
   the other skills separately.
5. Start a fresh DA assistant conversation. Check the slash menu for the
   registered skill, or use the supported skill invocation and confirm
   which instructions were loaded. Do not count ordinary chat that
   repeats a skill name as proof of registration.
6. Ask the registered skill to describe its scope and prepare a no-write
   proposal. Confirm `draft` and `backend_written: false`, the DA
   namespace, Hero headline-only scope, complete three-product
   preservation, inactive 50/50 metadata, and read-only preview.
   Record the actual discovery result and unresolved tools.

If the creation flow, approved scope, registration receipt, or fresh-session
discovery cannot be verified, stop and report that limit. Do not claim the
skills are installed because a file was merged or an assistant offered to
save it. No registration has been performed by this PR.

## Registration prompt

Attach or paste one complete `SKILL.md`, then use:

> Prepare a reusable skill from these instructions. Preserve its exact
> name and all safety gates. Show the registration scope, complete
> instructions, required available tools, and any unsupported capability
> before saving. Do not edit DA content, publish site pages, activate an
> experiment, or change permissions. Wait for my approval of this skill's
> registration.

The three skills can be invoked independently. A verified authoring result
can feed configuration; saved configuration can feed read-only preview.
This PR does not add the v2 runtime, enable a connector, provide a DA UI,
or demonstrate that any authoring operation succeeds. The existing
[runtime integration PR](https://github.com/markszulc/frescopa26/pull/42)
is a separate change.
