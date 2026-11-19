import unittest
import json
import subprocess
import sys
from copy import deepcopy
from pathlib import Path
from urllib.parse import parse_qsl, urlsplit

from scripts.experimentation import (
    build_preview_url,
    plan_section_metadata,
    prepare_section_metadata,
    validate_challenger_html,
)


class MetadataTests(unittest.TestCase):
    def test_one_challenger_serializes_only_its_fifty_percent_share(self):
        result = prepare_section_metadata(
            "https://demo.example/index",
            "frescopa-demo-cards",
            "https://demo.example/experiments/cards/challenger-1",
        )
        self.assertEqual(result["status"], "draft")
        self.assertEqual(
            result["metadata"],
            {
                "Experiment": "frescopa-demo-cards",
                "Experiment Variants": (
                    "https://demo.example/experiments/cards/challenger-1"
                ),
                "Experiment Split": "50",
                # v2 defaults to active; offline proposals must not imply activation.
                "Experiment Status": "Inactive",
            },
        )
        self.assertEqual(result["allocation"], {"control": 50, "challenger-1": 50})
        self.assertFalse(result["backend_written"])

    def test_invalid_or_non_demo_references_are_rejected(self):
        baseline = (
            "https://demo.example/index",
            "frescopa-demo-cards",
            "https://demo.example/experiments/cards/challenger-1",
        )
        for field, value in (
            (0, "/index"),
            (0, "http://demo.example/index"),
            (0, "https://user:secret@demo.example/index"),
            (0, "https://demo.example/index\n"),
            (0, "https://demo.example:invalid/index"),
            (1, "cards/challenger-1"),
            (1, "<ACTUAL_ID>"),
            (1, "UPPERCASE-ID"),
            (2, "https://another.example/variant"),
            (2, "https://demo.example/index"),
            (2, "https://demo.example/variant?token=private"),
            (2, "https://demo.example/variant#cards"),
        ):
            arguments = list(baseline)
            arguments[field] = value
            with self.subTest(field=field, value=value):
                with self.assertRaises(ValueError):
                    prepare_section_metadata(*arguments)

    def test_scoped_plan_preserves_other_section_and_never_mutates_input(self):
        baseline = {
            "hero": {
                "Experiment": "frescopa-demo-hero",
                "Experiment Variants": "https://demo.example/hero-variant",
                "Experiment Split": "50",
            },
            "cards": {"style": "home"},
        }
        original = deepcopy(baseline)
        result = plan_section_metadata(
            baseline,
            "cards",
            "https://demo.example/index",
            "frescopa-demo-cards",
            "https://demo.example/cards-variant",
        )
        self.assertEqual(baseline, original)
        self.assertEqual(result["sections"]["hero"], original["hero"])
        self.assertEqual(result["sections"]["cards"]["style"], "home")
        self.assertEqual(result["sections"]["cards"]["Experiment Split"], "50")
        for target, identity in (
            ("missing", "frescopa-demo-cards"),
            ("hero", "another-experiment"),
            ("cards", "frescopa-demo-hero"),
        ):
            with self.subTest(target=target, identity=identity):
                with self.assertRaises(ValueError):
                    plan_section_metadata(
                        baseline,
                        target,
                        "https://demo.example/index",
                        identity,
                        "https://demo.example/cards-variant",
                    )


class PreviewTests(unittest.TestCase):
    def test_preview_rejects_editor_controls_duplicate_rum_and_capability_values(self):
        for query in (
            "consent=disabled",
            "quick-edit=true",
            "controller=editor",
            "rum=off&rum=off",
            "utm_source=https%3A%2F%2Fexample.test%2F%3Ftoken%3Dplaceholder",
            "lang=en%0Acontroller%3Deditor",
        ):
            with self.subTest(query=query), self.assertRaises(ValueError):
                build_preview_url(
                    f"http://127.0.0.1:3000/index?{query}",
                    [("house-pour-copy", "challenger-1")],
                )

    def test_local_fixture_rum_opt_out_is_preserved_without_widening_parameters(self):
        assignments = [("frescopa-demo-cards", "challenger-1")]
        for scheme in ("http", "https"):
            for host in ("localhost", "127.0.0.1", "[::1]"):
                page = (
                    f"{scheme}://{host}:3000/index?rum=off&lang=en"
                    "&experiment=old/control#cards"
                )
                with self.subTest(page=page):
                    candidate = urlsplit(build_preview_url(page, assignments))
                    self.assertEqual(candidate.scheme, scheme)
                    self.assertEqual(candidate.netloc, f"{host}:3000")
                    self.assertEqual(candidate.fragment, "cards")
                    self.assertEqual(
                        parse_qsl(candidate.query),
                        [
                            ("rum", "off"),
                            ("lang", "en"),
                            ("experiment", "frescopa-demo-cards/challenger-1"),
                        ],
                    )
        for page in (
            "http://localhost:3000/index?rum=on",
            "http://localhost:3000/index?rum=OFF",
            "http://localhost:3000/index?rum=",
            "http://localhost:3000/index?rum",
            "http://localhost:3000/index?rum=off&rum=on",
            "http://localhost:3000/index?RUM=off",
            "http://localhost:3000/index?rum=off&unknown=unreviewed",
            "http://localhost:3000/index?rum=off&token=private",
            "https://demo.example/index?rum=off",
            "https://localhost.example/index?rum=off",
            "https://127.0.0.2/index?rum=off",
            "https://[::ffff:127.0.0.1]/index?rum=off",
        ):
            with self.subTest(page=page):
                with self.assertRaises(ValueError):
                    build_preview_url(page, assignments)

    def test_preview_replaces_stale_overrides_and_requires_paired_compatibility(self):
        page = (
            "https://demo.example/index?lang=en&lang=fr"
            "&experiment=old/control&experiment-variant=old#cards"
        )
        assignments = [
            ("frescopa-demo-hero", "control"),
            ("frescopa-demo-cards", "challenger-1"),
        ]
        with self.assertRaises(ValueError):
            build_preview_url(page, assignments)
        candidate = build_preview_url(page, assignments, paired_compatible=True)
        parts = urlsplit(candidate)
        self.assertEqual(parts.fragment, "cards")
        self.assertEqual(
            parse_qsl(parts.query),
            [
                ("lang", "en"),
                ("lang", "fr"),
                ("experiment", "frescopa-demo-hero/control"),
                ("experiment", "frescopa-demo-cards/challenger-1"),
            ],
        )
        for unsafe in (
            "https://user:secret@demo.example/index",
            "https://demo.example/index?token=private",
            "https://demo.example/index?unknown=unreviewed",
            "https://demo.example/index#access_token=private",
        ):
            with self.subTest(page=unsafe):
                with self.assertRaises(ValueError):
                    build_preview_url(unsafe, [assignments[0]])
        for invalid in (
            [],
            [("hero", "challenger-2")],
            [("hero", "control"), ("hero", "challenger-1")],
            [("INVALID-ID", "control")],
        ):
            with self.subTest(assignments=invalid):
                with self.assertRaises(ValueError):
                    build_preview_url(
                        "https://demo.example/index", invalid, paired_compatible=True
                    )


class ChallengerTests(unittest.TestCase):
    def validate(self, html, block="cards-product"):
        root = Path(__file__).parent.parent
        return validate_challenger_html(
            html, block,
            baseline_html=(root / "fixtures" / "index.plain.html").read_text(),
            baseline_format="plain-sections", input_format="delivered-main",
        )

    def test_only_one_actual_raw_section_without_inherited_experiments_is_accepted(self):
        fixture = (
            Path(__file__).parent.parent / "fixtures" / "cards-challenger.html"
        ).read_text()
        result = self.validate(fixture)
        self.assertEqual(result["status"], "draft")
        self.assertEqual(result["sections"], 1)
        self.assertFalse(result["runtime_verified"])
        invalid = (
            fixture.replace("<main>", "<main><div><h1>Wrong first section</h1></div>"),
            fixture.replace("<main>", "<main><div></div>"),
            fixture.replace("<main>", "<section>").replace("</main>", "</section>"),
            fixture.replace(
                "</head>", '<meta name="experiment" content="inherited"></head>'
            ),
            fixture.replace(
                '<div class="cards-product">',
                '<div class="section-metadata"><div><div>Experiment</div>'
                '<div>inherited</div></div></div><div class="cards-product">',
            ),
            fixture.replace('class="cards-product"', 'class="hero"'),
        )
        for html in invalid:
            with self.subTest(html=html[:80]):
                with self.assertRaises(ValueError):
                    self.validate(html)

    def test_target_must_be_the_actual_block_and_not_hide_extra_content(self):
        fixture = (
            Path(__file__).parent.parent / "fixtures" / "cards-challenger.html"
        ).read_text()
        for invalid in (
            fixture.replace('class="cards-product"', 'class="hero cards-product"'),
            fixture.replace(
                '<div class="cards-product">',
                '<div class="reward">Unrelated block</div><div class="cards-product">',
            ),
        ):
            with self.subTest(html=invalid[:80]):
                with self.assertRaises(ValueError):
                    self.validate(invalid)

    def test_product_challenger_cannot_drop_the_second_or_third_card(self):
        # The real content has three products, replacing the old two-card fixture.
        incomplete = (
            '<main><div><div class="cards-product"><div>'
            '<div><img src="/fixture.png"></div>'
            '<div><h4>Only one card</h4><a href="/coffee">Coffee</a></div>'
            '</div></div></div></main>'
        )
        with self.assertRaises(ValueError):
            self.validate(incomplete)


class CommandTests(unittest.TestCase):
    def test_commands_emit_drafts_and_errors_never_look_like_success(self):
        root = Path(__file__).parent.parent
        command = [sys.executable, str(root / "scripts" / "experimentation.py")]
        for arguments in (
            [
                "metadata", "--page-url", "https://demo.example/index",
                "--experiment-id", "demo-cards",
                "--challenger-url", "https://demo.example/cards-variant",
            ],
            [
                "validate-challenger", str(root / "fixtures" / "cards-challenger.html"),
                "--block", "cards-product",
                "--baseline", str(root / "fixtures" / "index.plain.html"),
                "--baseline-format", "plain-sections",
                "--input-format", "delivered-main",
            ],
            [
                "preview", "--page-url", "https://demo.example/index",
                "--assignment", "demo-cards/control",
            ],
        ):
            result = subprocess.run(command + arguments, capture_output=True, text=True)
            self.assertEqual(result.returncode, 0, result.stderr)
            document = json.loads(result.stdout)
            self.assertEqual(document["status"], "draft")
            self.assertFalse(document["backend_written"])
        result = subprocess.run(
            command + [
                "preview", "--page-url", "https://demo.example/index?token=private",
                "--assignment", "demo-cards/control",
            ],
            capture_output=True,
            text=True,
        )
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(result.stdout, "")
        self.assertIn("error:", result.stderr)
        self.assertNotIn("token=private", result.stderr)


if __name__ == "__main__":
    unittest.main()
