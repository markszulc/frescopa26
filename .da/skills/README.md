# Reusable AEM content and experimentation skills

These three self-contained Markdown skills cover content variants,
configuration and read-only preview across sites and block types. Site
identity, block structure, editable fields, project policy and runtime
capabilities are inputs. Registering them does not grant tool access.

The repository layout is:

```text
.da/skills/aem-content-variants/skill.md
.da/skills/aem-experimentation-configure/skill.md
.da/skills/aem-experimentation-preview/skill.md
```

The lowercase `skill.md` filenames and `.da/skills/` location follow the
proposed DA discovery convention being tested. Their presence does not
establish that the active DA assistant has loaded them.

| Skill | Reusable scope |
|---|---|
| [aem-content-variants](aem-content-variants/skill.md) | Regular page copies, any supported block/section, reusable fragments and full-page or selector-based experiences |
| [aem-experimentation-configure](aem-experimentation-configure/skill.md) | Version-aware experiment, audience and campaign configuration across page, section and fragment scopes |
| [aem-experimentation-preview](aem-experimentation-preview/skill.md) | Standalone read-only content/experience preview, arbitrary actual variant keys and relevant multi-experiment interactions |

No skill depends on a shell, Python helper, fixtures or sibling reference
files. They do not impose a brand, hero/card template, one challenger,
50/50 allocation or section-only scope.

## Configuration coverage

The configuration workflow discovers the installed engine and project
options before applying a field. Its catalogue includes:

- Content and code-only variants, multiple challengers, custom/decimal
  splits, derived control allocation and variant display labels.
- Status, start/end dates, audience eligibility, consent requirements,
  resolution/redirects, optimization settings and conversion integration.
- Page/section metadata and selector manifests, plus audience and campaign
  mappings, targeting and custom metadata/query namespaces.
- Project integration prerequisites such as audience predicates,
  redecoration, production-host handling, persistence where implemented
  and simulation UI selection.

Coverage does not mean every option works at every scope in every release.
The skills check documentation against implementation and saved/runtime
readback, including known naming/parser differences in the public v2
reference. Unsupported combinations are reported rather than silently
discarded. Code prerequisites remain separate reviewed changes.

Exact approval, fresh source, preservation outside the requested diff,
independent saved-state/real-rendered readback and unknown-outcome stops
apply across all sites. New experiment proposals are inactive where that
state is supported. Audience/campaign mappings must not invent an inactive
state that their engine does not have.

The existing Frescopa26 offline helper and fixtures are site-specific
evidence in the separate runtime integration. They are not a generic
validator or an installation dependency for these skills.

## Test repository discovery

1. Confirm which GitHub repository and ref the intended site/assistant
   actually reads. Verify that ref contains these three files and record
   its commit. A file on this fork's PR branch is not proof that the
   upstream site's assistant can see it. Do not change site settings or
   assume a merge/branch switch is authorized.
2. Start a fresh DA assistant conversation. Before pasting or attaching
   any skill content, inspect the available skill list/slash menu or use
   the host's supported discovery mechanism for these exact names.
3. Begin with `aem-experimentation-preview`. Ask for a no-write
   description of the loaded skill's scope and its source/version where
   observable. Repeating the requested skill name in ordinary chat does
   not establish that the repository file was loaded.
4. Prepare a no-write proposal. Confirm `draft`,
   `backend_written: false`, the discovered site/source identity,
   requested block/scope, available settings and explicit blocked
   features. Verify that an unrelated block type or multi-variant split
   does not trigger a demo-only restriction.
5. Record the actual discovery result, repository/ref evidence and
   limits. If no skill appears, report repository discovery as
   unverified or unavailable. Do not move the source files elsewhere to
   conceal a failed discovery check.

No automatic discovery has been verified by this PR. Repository discovery,
manual skill registration, connector access and successful authoring are
separate checks.

## Manual registration fallback

The [official Experience Workspace assistant documentation](https://www.aem.live/docs/ew/authoring/assistant)
links **Manage Coworker** from the assistant's plus menu.
Adobe's [skill creation guide](https://experienceleague.adobe.com/en/docs/coworker/content/customizations/skills/create-your-first-skill)
describes creating a reusable skill, reviewing it and publishing it for
future use.

The public DA client
[`fetchSkills()` implementation](https://github.com/adobe/da-nx/blob/7444db0c09543f81a056a54c72d70a9dd6ac43f4/nx2/blocks/chat-ao/utils/skills.js)
requests skills for the
[resolved Coworker manifest](https://github.com/adobe/da-nx/blob/7444db0c09543f81a056a54c72d70a9dd6ac43f4/nx2/blocks/chat-ao/utils/manifest.js).
This establishes client-side registered-skill discovery. It does not by
itself establish automatic loading of these repository files.

Some [feature onboarding documentation](https://www.aem.live/docs/ew/administering/agentic-plugins)
also refers to `https://da.live/apps/skills#/<org>/<site>` and config-write
access. Confirm the flow and permissions available in the actual host.
The schema editor is not the documented Skills Editor.

1. In the intended DA/Experience Workspace organization, open the
   assistant's plus menu and **Manage Coworker**. Confirm the
   administrator-approved registration scope.
2. Supply one complete `skill.md` through the supported creation flow,
   preserving its name. Paste or attach only if that flow supports it.
   Do not assume ZIP import, a storage API or GitHub synchronization.
3. Review the saved draft against the complete source. Preserve the
   generic capability discovery, project-policy inputs, approval gates
   and readback requirements. Check actual tool availability.
4. Approve only that skill's registration after its name, scope,
   instructions and effects are shown. Skill publication is separate
   from publishing site content or activating experiences.
5. Start a fresh conversation. Check the skill list/slash menu or supported
   invocation and confirm the registered instructions are loaded.
   Repeating a skill name in ordinary chat is insufficient evidence.
6. Ask for a no-write proposal for the intended site/block and configuration.
   Confirm `draft`, `backend_written: false`, discovered source identity,
   requested scope, full supported settings and explicit blocked features.
   Verify that an unrelated block type or a multi-variant split does not
   trigger a demo-only restriction.

Stop if approved scope, registration receipt or fresh-session discovery
cannot be verified. No registration has been performed by this PR.
Do not treat merging these files alone as proof of installation.

## Example registration prompt

For the manual fallback, attach or paste one complete `skill.md`, then use:

> Prepare a reusable skill from these instructions. Preserve its exact
> name and safety gates. Keep site identity, block structure, allowed
> changes and engine capabilities as inputs. Show the registration scope,
> complete instructions, required available tools and unsupported
> capabilities before saving. Do not edit site content, publish pages,
> activate an experience or change permissions. Wait for my approval
> of this skill's registration.

The three skills can be invoked independently. A verified content result
can feed configuration; saved configuration can feed read-only preview.
No runtime, connector, host UI, code deployment or native operation is
provided by this package.
