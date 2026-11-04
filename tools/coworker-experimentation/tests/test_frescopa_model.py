import hashlib
import re
import unittest
from pathlib import Path

from scripts.experimentation import validate_challenger_html


FIXTURES = Path(__file__).parent.parent / "fixtures"
BASELINE = (FIXTURES / "index.plain.html").read_text(encoding="utf-8")


def product_section():
    return '<div class="feed">' + BASELINE.split('<div class="feed">', 1)[1].split(
        '<div class="sustain">', 1
    )[0]


def hero_section():
    return BASELINE.split('<div class="intro">', 1)[0]


def challenger(block="cards-product"):
    if block == "hero":
        section = hero_section().replace(
            "Every<br>morning,<br>perfected.", "Your morning, made yours."
        )
    else:
        section = product_section().replace(
            "The house pour</h3>", "Your next everyday favourite</h3>"
        ).replace(
            "Our everyday blend, coaxed a little rounder for the season. "
            "The one you'll reach for on autopilot.",
            "A round, balanced blend for the cup you look forward to each morning.",
        )
    return f"<main>{section}</main>"


def validate(html, block="cards-product", baseline=BASELINE, **formats):
    return validate_challenger_html(
        html, block, baseline_html=baseline,
        baseline_format=formats.get("baseline_format", "plain-sections"),
        input_format=formats.get("input_format", "delivered-main"),
    )


class FrescopaModelTests(unittest.TestCase):
    def test_hero_headline_only_preserves_the_complete_original_body(self):
        candidate = challenger("hero")
        for old, new in (
            ("The first Fréscopa machine", "A different machine"),
            ("Barista craft, kept warm", "<strong>Barista craft</strong>, kept warm"),
        ):
            with self.subTest(change=new), self.assertRaises(ValueError):
                validate(candidate.replace(old, new), "hero")
        self.assertEqual(validate(candidate, "hero")["validation"], "baseline-preservation")

    def test_delivered_main_ignores_real_site_head_but_not_unsafe_authored_content(self):
        head = (Path(__file__).resolve().parents[3] / "head.html").read_text(
            encoding="utf-8"
        )
        head += "<style>body { color: red; }</style>"

        def served(content):
            return (
                "<!doctype html><html><head>" + head + "</head><body>"
                "<header></header>" + content + "<footer></footer></body></html>"
            )

        baseline = served(f"<main>{BASELINE}</main>")
        candidate = served(challenger())
        self.assertEqual(
            validate(candidate, baseline=baseline, baseline_format="delivered-main")[
                "validation"
            ],
            "baseline-preservation",
        )
        for active in (
            "<script>throw new Error('section script')</script>",
            "<style>p { display:none; }</style>",
            '<iframe src="https://example.test/"></iframe>',
            '<link rel="stylesheet" href="/unexpected.css">',
            "<table><tr><td>Unsupported source table</td></tr></table>",
        ):
            with self.subTest(active=active), self.assertRaises(ValueError):
                validate(
                    candidate.replace("<p>Coffee</p>", active + "<p>Coffee</p>"),
                    baseline=baseline, baseline_format="delivered-main",
                )
        for ambiguous in (
            candidate.replace("</body>", "<main><div></div></main></body>"),
            candidate.replace("</head>", "<main><div></div></main></head>"),
            candidate.replace("</body>", "<div>Hidden outside main</div></body>"),
        ):
            with self.subTest(ambiguous=ambiguous[-100:]), self.assertRaises(ValueError):
                validate(ambiguous, baseline=baseline, baseline_format="delivered-main")
        with self.assertRaises(ValueError):
            validate(candidate, baseline=baseline, baseline_format="da-source")

    def test_official_da_body_envelope_is_supported_without_native_qualification(self):
        source = f"<body><header></header><main>{BASELINE}</main><footer></footer></body>"
        candidate = f"<body><header></header>{challenger()}<footer></footer></body>"
        result = validate(
            candidate, baseline=source, baseline_format="da-source", input_format="da-source"
        )
        self.assertFalse(result["resource_verified"])
        self.assertTrue(result["delivery_readback_required"])

    def test_real_three_product_section_preserves_heading_intro_and_other_cards(self):
        result = validate(challenger())
        self.assertEqual(result["status"], "draft")
        self.assertEqual(result["validation"], "baseline-preservation")
        self.assertEqual(result["baseline_section_index"], 4)
        self.assertEqual(result["resource"], {
            "org": "markszulc", "repo": "frescopa26", "path": "/index.html",
        })
        self.assertEqual(
            result["baseline_sha256"], hashlib.sha256(BASELINE.encode()).hexdigest()
        )
        self.assertEqual(result["sections"], 1)
        self.assertFalse(result["backend_written"])
        self.assertFalse(result["runtime_verified"])

    def test_only_first_hero_copy_changes_and_cafe_is_not_a_valid_target(self):
        result = validate(challenger("hero"), "hero")
        self.assertEqual(result["baseline_section_index"], 0)
        for html in (
            challenger("hero").replace("Meet the Atelier", "Another category"),
            challenger("hero").replace("/machines/atelier", "/another-machine"),
            challenger("hero").replace('loading="lazy"', 'loading="eager"'),
            "<main>" + BASELINE.split('<div class="voices">', 1)[1] + "</main>",
        ):
            with self.subTest(html=html[:100]), self.assertRaises(ValueError):
                validate(html, "hero")
        with self.assertRaises(ValueError):
            validate(
                challenger("hero"), "hero",
                baseline=BASELINE.replace("Every<br>morning,<br>perfected.", "Cafe hero"),
            )

    def test_product_preservation_checks_text_attributes_footer_and_all_three_rows(self):
        candidate = challenger()
        for old, new in (
            ("This week, for you", "New eyebrow"),
            ("New favourites, found for you.", "Other heading"),
            ("A short list worth trying", "A different list"),
            ("Coffee</p>", "Tea</p>"),
            ('width="1408"', 'width="1200"'),
            ('alt=""', 'alt="Changed image"'),
            ("media_132718180b6190179a138b13595a42c32f51665ed", "other-image"),
            ("$14Add to cart", "$10Add to cart"),
            ("$14Add to cart", "$14Buy now"),
            ("$14Add to cart", '$14<a href="/checkout">Add to cart</a>'),
            ("Honeybush", "Changed tea"),
            ("Three oranges", "Changed juice"),
            ('<div class="cards-product">', '<div class="cards-product"><p>Extra</p>'),
            ("<p>Coffee</p>", "Hidden extra text<p>Coffee</p>"),
            ('<div class="cards-product">', '<div class="cards-product block">'),
            ('</main>', '<div class="another-block"></div></main>'),
            ('</main>', '<p>Extra default content</p></main>'),
        ):
            with self.subTest(change=new), self.assertRaises(ValueError):
                validate(candidate.replace(old, new))
        second = candidate.index("    <div>\n      <div>\n        <picture>", candidate.index("$14"))
        with self.assertRaises(ValueError):
            validate(candidate[:second] + "</div></div></main>")

    def test_native_footer_reserialization_preserves_markup_and_decorator_meaning(self):
        candidate = challenger()
        for price in ("14", "12", "8"):
            candidate = candidate.replace(
                f"${price}Add to cart →</p>", f"${price}</p><p>Add to cart →</p>"
            )
        self.assertEqual(validate(candidate)["validation"], "baseline-preservation")
        spaced = candidate.replace("$14</p><p>Add", "$14 </p><p> Add")
        self.assertEqual(validate(spaced)["validation"], "baseline-preservation")
        for changed in (
            candidate.replace("$14</p>", "$15</p>"),
            candidate.replace("$14</p>", '$14</p><p class="changed">'),
            candidate.replace("Add to cart →", '<a href="#">Add to cart →</a>', 1),
        ):
            with self.subTest(html=changed[:100]), self.assertRaises(ValueError):
                validate(changed)

    def test_format_must_distinguish_da_body_plain_sections_and_delivered_main(self):
        candidate = challenger()
        section = candidate.removeprefix("<main>").removesuffix("</main>")
        for source in (section, f"<body>{section}</body>", f"<body>{candidate}</body>"):
            with self.subTest(source=source[:60]):
                result = validate(source, input_format="da-source")
                self.assertEqual(result["input_format"], "da-source")
                self.assertTrue(result["delivery_readback_required"])
        for source in (BASELINE, f"<body>{BASELINE}</body>", f"<body><main>{BASELINE}</main></body>"):
            self.assertEqual(
                validate(candidate, baseline=source, baseline_format="da-source")[
                    "baseline_section_index"
                ],
                4,
            )
        for html, kind in (
            (section, "delivered-main"),
            (f"<body>{section}</body>", "delivered-main"),
            (candidate, "plain-sections"),
            (section, "unknown"),
            (candidate + "<div>Hidden content outside main</div>", "delivered-main"),
            ("<body><table><tr><td>Cards product</td></tr></table></body>", "da-source"),
            (f"<body>{section}</body><div>Hidden source content</div>", "da-source"),
        ):
            with self.subTest(kind=kind, html=html[:60]), self.assertRaises(ValueError):
                validate(html, input_format=kind)

    def test_missing_ambiguous_unsupported_or_changed_baselines_are_rejected(self):
        for baseline in (
            "",
            BASELINE.replace('class="cards-product"', 'class="cards"'),
            BASELINE + product_section(),
            BASELINE.replace("The house pour</h3>", "A different product</h3>"),
            BASELINE.replace("Coffee</p>", "Different category</p>", 1),
            BASELINE.replace('class="cards-product"', 'class="other cards-product"'),
            BASELINE.replace(
                '<div class="cards-product">',
                '<div class="unsupported"></div><div class="cards-product">',
            ),
        ):
            with self.subTest(baseline=baseline[:80]), self.assertRaises(ValueError):
                validate(challenger(), baseline=baseline)
        with self.assertRaises(TypeError):
            validate_challenger_html(challenger(), "cards-product")

    def test_experiments_stay_on_control_while_other_section_metadata_survives(self):
        config = (
            '<div class="section-metadata">'
            '<div><div>Style</div><div>feed</div></div>'
            '<div><div>Experiment</div><div>house-pour-copy</div></div>'
            '<div><div>Experiment Variants</div><div>/proposed-variant</div></div>'
            '<div><div>Experiment Split</div><div>50</div></div></div>'
        )
        baseline = BASELINE.replace(
            '<div class="sustain">', config + '<div class="sustain">', 1
        )
        # Insert into the product section, not as a separate page-level block.
        baseline = baseline.replace("</div>\n" + config, config + "</div>\n", 1)
        style = (
            '<div class="section-metadata">'
            '<div><div>Style</div><div>feed</div></div></div>'
        )
        candidate = challenger().removesuffix("</div>\n</main>") + style + "</div>\n</main>"
        self.assertEqual(validate(candidate, baseline=baseline)["status"], "draft")
        for html in (
            candidate.replace(style, config),
            candidate.replace(style, ""),
            candidate.replace(">feed<", ">different<"),
            candidate.replace("<main>", '<meta name="experiment" content="inherited"><main>'),
        ):
            with self.subTest(html=html[-200:]), self.assertRaises(ValueError):
                validate(html, baseline=baseline)

    def test_copy_cannot_add_links_scripts_empty_fields_or_change_field_attributes(self):
        for replacement in (
            "",
            '<a href="/new-destination">New link</a>',
            '<script>alert(1)</script>',
            '<em class="new-style">New emphasis</em>',
        ):
            with self.subTest(copy=replacement), self.assertRaises(ValueError):
                validate(challenger().replace("Your next everyday favourite", replacement))
        with self.assertRaises(ValueError):
            validate(challenger().replace('id="the-house-pour"', 'id="another-anchor"'))

    def test_baseline_and_candidate_cannot_both_hide_missing_images_or_extra_body_text(self):
        baseline = BASELINE.replace("<p>Coffee</p>", "Untracked text<p>Coffee</p>")
        candidate = challenger().replace("<p>Coffee</p>", "Untracked text<p>Coffee</p>")
        with self.assertRaises(ValueError):
            validate(candidate, baseline=baseline)
        with self.assertRaises(ValueError):
            validate(
                challenger().replace("$14Add to cart →", "$14"),
                baseline=BASELINE.replace("$14Add to cart →", "$14"),
            )
        baseline = re.sub(r"<img[^>]*>", "", BASELINE, count=2)
        candidate = re.sub(r"<img[^>]*>", "", challenger(), count=1)
        with self.assertRaises(ValueError):
            validate(candidate, baseline=baseline)


if __name__ == "__main__":
    unittest.main()
