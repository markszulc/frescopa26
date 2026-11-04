"""Prepare offline experiment artifacts. No network access or backend writes."""

import argparse
import hashlib
import json
import re
from copy import deepcopy
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit


FORMATS = ("delivered-main", "plain-sections", "da-source")
RESOURCE = {"org": "markszulc", "repo": "frescopa26", "path": "/index.html"}


def _url(value):
    if not isinstance(value, str) or re.search(r"[\s<>\"'\\\x00-\x1f\x7f]", value):
        raise ValueError("Provide a complete URL without credentials or whitespace.")
    parts = urlsplit(value)
    if not parts.hostname or parts.username is not None or parts.password is not None:
        raise ValueError("Provide a complete URL without credentials.")
    if parts.scheme != "https" and not (
        parts.scheme == "http" and parts.hostname in ("localhost", "127.0.0.1", "::1")
    ):
        raise ValueError("Use HTTPS, or HTTP on localhost for an offline fixture.")
    port = parts.port
    origin = (
        parts.scheme,
        parts.hostname.lower(),
        port if port is not None else (443 if parts.scheme == "https" else 80),
    )
    return parts, origin


def _identity(value):
    if not isinstance(value, str) or not re.fullmatch(r"[a-z0-9]+(?:-[a-z0-9]+)*", value):
        raise ValueError("Use the actual lowercase, hyphen-separated experiment ID.")


def prepare_section_metadata(page_url, experiment_id, challenger_url):
    page, origin = _url(page_url)
    challenger, challenger_origin = _url(challenger_url)
    _identity(experiment_id)
    if origin != challenger_origin:
        raise ValueError("The challenger must resolve on the same demo delivery origin.")
    if challenger.query or challenger.fragment:
        raise ValueError("A challenger reference cannot depend on a query or fragment.")
    if (page.path or "/") == (challenger.path or "/"):
        raise ValueError("The challenger must be different from the control page.")
    return {
        "status": "draft",
        "backend_written": False,
        "metadata": {
            "Experiment": experiment_id,
            "Experiment Variants": challenger_url,
            "Experiment Split": "50",
            "Experiment Status": "Inactive",
        },
        "allocation": {"control": 50, "challenger-1": 50},
    }


def plan_section_metadata(sections, target, page_url, experiment_id, challenger_url):
    if not isinstance(sections, dict) or target not in sections:
        raise ValueError("The exact target must exist in the supplied section snapshot.")
    if any(not isinstance(value, dict) for value in sections.values()):
        raise ValueError("Each section snapshot must be a metadata object.")
    if any(re.match(r"^experiment(?:$|[- ])", str(key), re.I) for key in sections[target]):
        raise ValueError("The selected section already has experiment metadata.")
    if any(
        str(key).casefold() == "experiment" and value == experiment_id
        for metadata in sections.values()
        for key, value in metadata.items()
    ):
        raise ValueError("Experiment identities must be distinct across sections.")
    result = prepare_section_metadata(page_url, experiment_id, challenger_url)
    planned_sections = deepcopy(sections)
    planned_sections[target].update(result["metadata"])
    result["sections"] = planned_sections
    result["target"] = target
    return result


def build_preview_url(page_url, assignments, *, paired_compatible=False):
    page, _ = _url(page_url)
    if not assignments or len(assignments) > 2:
        raise ValueError("Provide one or two explicit demo assignments.")
    if len(assignments) > 1 and not paired_compatible:
        raise ValueError("Paired overrides require independently checked compatibility.")
    identities = set()
    for experiment_id, variant in assignments:
        _identity(experiment_id)
        if variant not in ("control", "challenger-1"):
            raise ValueError("This demo supports control and challenger-1 only.")
        if experiment_id in identities:
            raise ValueError("An experiment cannot have conflicting assignments.")
        identities.add(experiment_id)
    safe_parameters = {
        "lang", "locale", "utm_source", "utm_medium", "utm_campaign",
        "utm_content", "utm_term",
    }
    parameters = []
    seen_rum = False
    for name, value in parse_qsl(page.query, keep_blank_values=True):
        if name in ("experiment", "experiment-variant"):
            continue
        if name not in safe_parameters and not (
            name == "rum" and value == "off"
            and page.hostname in ("localhost", "127.0.0.1", "::1")
        ):
            raise ValueError("An unreviewed URL parameter prevents safe preview sharing.")
        if name == "rum":
            if seen_rum:
                raise ValueError("Use exactly one rum=off on a verified loopback fixture.")
            seen_rum = True
        elif not re.fullmatch(r"[a-zA-Z0-9 ._~-]*", value):
            raise ValueError("Language/UTM values must be simple labels, not capability URLs.")
        parameters.append((name, value))
    if page.fragment and not re.fullmatch(r"[a-zA-Z0-9_-]+", page.fragment):
        raise ValueError("Only a simple, non-secret section fragment is supported.")
    parameters.extend(
        ("experiment", f"{experiment_id}/{variant}")
        for experiment_id, variant in assignments
    )
    return urlunsplit((
        page.scheme, page.netloc, page.path, urlencode(parameters, safe="/"), page.fragment,
    ))


class _Element:
    def __init__(self, tag, attributes=()):
        self.tag = tag
        self.attributes = dict(attributes)
        self.children = []

    def elements(self):
        return [child for child in self.children if isinstance(child, _Element)]

    def descendants(self):
        yield self
        for child in self.elements():
            yield from child.descendants()

    def text(self):
        if self.tag == "br":
            return " "
        return "".join(
            child.text() if isinstance(child, _Element) else child
            for child in self.children
        )

    def classes(self):
        return (self.attributes.get("class") or "").split()


class _RawHTML(HTMLParser):
    VOID = {
        "area", "base", "br", "col", "embed", "hr", "img", "input",
        "link", "meta", "param", "source", "track", "wbr",
    }

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.root = _Element("document")
        self.stack = [self.root]

    def handle_starttag(self, tag, attrs):
        if len({key for key, _ in attrs}) != len(attrs):
            raise ValueError("Duplicate HTML attributes make extraction ambiguous.")
        node = _Element(tag, attrs)
        self.stack[-1].children.append(node)
        if tag not in self.VOID:
            self.stack.append(node)

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)
        if tag not in self.VOID:
            self.handle_endtag(tag)

    def handle_endtag(self, tag):
        if tag in self.VOID:
            return
        if len(self.stack) == 1 or self.stack[-1].tag != tag:
            raise ValueError("Use well-formed exported HTML for structural validation.")
        self.stack.pop()

    def handle_data(self, data):
        self.stack[-1].children.append(data)


def _sections(html, input_format):
    if input_format not in FORMATS:
        raise ValueError("Choose an explicit supported HTML input format.")
    parser = _RawHTML()
    parser.feed(html)
    parser.close()
    if len(parser.stack) != 1:
        raise ValueError("The supplied HTML has unclosed elements.")
    nodes = list(parser.root.descendants())
    mains = [node for node in nodes if node.tag == "main"]
    ignored_head = set()
    if input_format == "delivered-main":
        if len(mains) != 1:
            raise ValueError("Delivered HTML must contain exactly one explicit main.")
        container = mains[0]
        heads = [node for node in nodes if node.tag == "head"]
        bodies = [node for node in nodes if node.tag == "body"]
        if len(heads) > 1 or len(bodies) > 1:
            raise ValueError("Delivered HTML has an ambiguous head/body envelope.")
        parent = bodies[0] if bodies else parser.root
        if container not in parent.elements():
            raise ValueError("Delivered main must be a direct child of body or a raw fragment.")
        for head in heads:
            ignored_head.update(head.descendants())
    elif input_format == "plain-sections":
        if any(node.tag in ("html", "body", "main") for node in nodes):
            raise ValueError("Plain sections must not contain a document envelope.")
        container = parser.root
    else:
        bodies = [node for node in nodes if node.tag == "body"]
        if len(bodies) > 1 or len(mains) > 1:
            raise ValueError("DA source has an ambiguous body/main envelope.")
        container = bodies[0] if bodies else parser.root
        if mains:
            if mains[0] not in container.elements():
                raise ValueError("DA main must be a direct child of the source body.")
            if any(
                node is not mains[0] and (
                    node.tag not in ("header", "footer") or node.elements() or node.text().strip()
                )
                for node in container.elements()
            ):
                raise ValueError("Unsupported content outside the DA source main.")
            container = mains[0]
    inside = set(container.descendants())
    prohibited = {"script", "iframe", "style", "table", "link"}
    checked = inside if input_format == "delivered-main" else nodes
    if any(node.tag in prohibited for node in checked):
        raise ValueError("Use raw block-div content, not active content or source tables.")
    for node in nodes:
        if node in inside or node in ignored_head:
            continue
        if node.tag not in ("document", "html", "body", "head", "title", "meta", "header", "footer"):
            raise ValueError("Unsupported content outside the selected source/main envelope.")
        if node.tag in ("header", "footer") and (node.elements() or node.text().strip()):
            raise ValueError("Use undecorated content without a rendered header/footer.")
        if node.tag in ("document", "html", "body") and any(
            isinstance(child, str) and child.strip() for child in node.children
        ):
            raise ValueError("Unexpected text outside the selected source/main envelope.")
    sections = container.elements()
    if not sections or any(node.tag != "div" for node in sections) or any(
        isinstance(child, str) and child.strip() for child in container.children
    ):
        raise ValueError("Expected explicit raw section divs in the selected input format.")
    return parser.root, sections


def _text(node):
    return " ".join(node.text().split())


def _experiment_key(value):
    return bool(re.match(r"^experiment(?:$|[- ])", value.strip(), re.I))


def _structural_children(node):
    if any(isinstance(child, str) and child.strip() for child in node.children):
        raise ValueError("Unexpected text outside an authored content field.")
    return node.elements()


def _image_cell(cell):
    if [node.tag for node in _structural_children(cell)] != ["picture"]:
        raise ValueError("Each image cell must retain its raw picture.")
    picture = cell.elements()[0]
    children = _structural_children(picture)
    if (
        not children or children[-1].tag != "img"
        or not children[-1].attributes.get("src")
        or any(node.tag != "source" for node in children[:-1])
    ):
        raise ValueError("The picture must retain one image and any original sources.")


def _metadata(section):
    metadata = [node for node in section.elements() if "section-metadata" in node.classes()]
    if len(metadata) > 1:
        raise ValueError("Multiple section metadata blocks are ambiguous.")
    for block in metadata:
        keys = set()
        for row in _structural_children(block):
            cells = _structural_children(row)
            if row.tag != "div" or len(cells) != 2 or any(c.tag != "div" for c in cells):
                raise ValueError("Unsupported section metadata row.")
            key = _text(cells[0]).casefold()
            if not key or key in keys:
                raise ValueError("Empty or duplicate section metadata key.")
            keys.add(key)
    return metadata


def _copy_fields(section, block_name):
    blocks = [
        node for node in section.descendants()
        if node.tag == "div" and block_name in node.classes()
    ]
    if len(blocks) != 1:
        raise ValueError("The selected section must contain exactly one intended raw block.")
    block = blocks[0]
    if block.classes()[0] != block_name:
        raise ValueError("The target's first class must identify the intended AEM block.")
    metadata = _metadata(section)
    content = [node for node in _structural_children(section) if node not in metadata]
    expected = ["div"] if block_name == "hero" else ["p", "h2", "p", "div"]
    if [node.tag for node in content] != expected or content[-1] is not block:
        raise ValueError("Unsupported section content alongside the selected block.")
    if block_name == "cards-product" and _text(content[1]) != "New favourites, found for you.":
        raise ValueError("The complete product section heading must be retained.")
    rows = _structural_children(block)
    if len(rows) != (2 if block_name == "hero" else 3) or any(
        row.tag != "div" or any(cell.tag != "div" for cell in _structural_children(row))
        for row in rows
    ):
        raise ValueError("Retain the two hero rows or all three two-column product rows.")
    if block_name == "hero":
        if any(len(row.elements()) != 1 for row in rows):
            raise ValueError("The hero requires one image row and one rich-text row.")
        image, body = (row.elements()[0] for row in rows)
        _image_cell(image)
        fields = _structural_children(body)
        if [node.tag for node in fields] != ["p", "h1", "p", "p"]:
            raise ValueError("The hero requires eyebrow, h1, body, and CTA.")
        return (fields[1],)
    first_fields = None
    for row in rows:
        if len(row.elements()) != 2:
            raise ValueError("All three product rows require image and content cells.")
        image, body = row.elements()
        _image_cell(image)
        fields = _structural_children(body)
        if (
            len(fields) not in (4, 5)
            or [node.tag for node in fields[:3]] != ["p", "h3", "p"]
            or any(node.tag != "p" for node in fields[3:])
        ):
            raise ValueError("Each product requires category, h3, description, and footer.")
        footer = fields[3:]
        if len(footer) == 2 and not re.fullmatch(r"\D*[0-9][0-9.,]*", _text(footer[0])):
            raise ValueError("The separate footer must begin with a price paragraph.")
        if len(footer) == 2:
            price, cta = (node.text().strip() for node in footer)
        else:
            match = re.fullmatch(r"(\D*[0-9][0-9.,]*)(.*)", footer[0].text().strip())
            price, cta = (part.strip() for part in match.groups()) if match else ("", "")
        if not price or not cta:
            raise ValueError("The footer must retain both price and CTA text.")
        if any(node.attributes != footer[0].attributes for node in footer):
            raise ValueError("Footer paragraph attributes cannot change during reserialization.")
        normalized = _Element("preserved-footer", footer[0].attributes.items())
        normalized.children = [child for node in footer for child in node.children]
        if all(isinstance(child, str) for child in normalized.children):
            # Compare the decorator's price/CTA pair across paragraph boundaries.
            normalized.children = [f"{len(price)}:{price}{cta}"]
        body.children = fields[:3] + [normalized]
        if first_fields is None:
            first_fields = fields
    return first_fields[1], first_fields[2]


def _signature(node):
    children = []
    for child in node.children:
        if isinstance(child, _Element):
            children.append(_signature(child))
        elif child.strip():
            text = re.sub(r"\s+", " ", child)
            if children and isinstance(children[-1], str):
                children[-1] += text
            else:
                children.append(text)
    return node.tag, tuple(sorted(node.attributes.items())), tuple(children)


def _mask_copy(fields):
    for field in fields:
        if not _text(field):
            raise ValueError("Heading and description copy must not be empty.")
        if any(
            node is not field and (
                node.tag not in ("br", "em", "strong") or node.attributes
            )
            for node in field.descendants()
        ):
            raise ValueError("Copy edits support text, line breaks, and simple emphasis only.")
        field.children = ["approved-copy"]


def validate_challenger_html(
    html, block_name, *, baseline_html, baseline_format, input_format,
):
    if block_name not in ("hero", "cards-product"):
        raise ValueError("Only Frescopa hero and cards-product challengers are supported.")
    _, baseline_sections = _sections(baseline_html, baseline_format)
    root, sections = _sections(html, input_format)
    if len(sections) != 1:
        raise ValueError("The first section must be the only challenger section.")
    matches = [
        (index, section) for index, section in enumerate(baseline_sections)
        if any(block_name in node.classes() for node in section.elements())
        and (block_name != "hero" or index == 0)
    ]
    if len(matches) != 1:
        raise ValueError("The baseline target is missing or ambiguous.")
    index, baseline_section = matches[0]
    baseline_section = deepcopy(baseline_section)
    section = sections[0]
    for node in root.descendants():
        if node.tag == "meta" and (node.attributes.get("name") or "").lower().startswith("experiment"):
            raise ValueError("A challenger must not inherit page-level experiment metadata.")
        if "section-metadata" in node.classes():
            for row in node.elements():
                cells = row.elements()
                if cells and _experiment_key(cells[0].text()):
                    raise ValueError("A challenger must not contain nested experiment metadata.")
    for metadata in _metadata(baseline_section):
        metadata.children = [
            row for row in metadata.elements()
            if not _experiment_key(row.elements()[0].text())
        ]
        if not metadata.elements():
            baseline_section.children.remove(metadata)
    baseline_fields = _copy_fields(baseline_section, block_name)
    fields = _copy_fields(section, block_name)
    if block_name == "hero" and _text(baseline_fields[0]) != "Every morning, perfected.":
        raise ValueError("The baseline must identify the first Atelier hero, not the cafe hero.")
    if block_name == "cards-product":
        block = next(node for node in baseline_section.elements() if block_name in node.classes())
        first_body = block.elements()[0].elements()[1]
        if _text(baseline_fields[0]) != "The house pour" or _text(first_body.elements()[0]) != "Coffee":
            raise ValueError("The baseline must identify the first Coffee product card.")
    _mask_copy(baseline_fields)
    _mask_copy(fields)
    if _signature(baseline_section) != _signature(section):
        raise ValueError("Content or attributes outside the approved heading/body changed.")
    return {
        "status": "draft",
        "validation": "baseline-preservation",
        "resource": dict(RESOURCE),
        "resource_verified": False,
        "baseline_sha256": hashlib.sha256(baseline_html.encode("utf-8")).hexdigest(),
        "candidate_sha256": hashlib.sha256(html.encode("utf-8")).hexdigest(),
        "baseline_section_index": index,
        "input_format": input_format,
        "baseline_format": baseline_format,
        "delivery_readback_required": True,
        "sections": 1,
        "block": block_name,
        "runtime_verified": False,
        "backend_written": False,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    metadata = commands.add_parser("metadata", help="Prepare proposed section metadata.")
    metadata.add_argument("--page-url", required=True)
    metadata.add_argument("--experiment-id", required=True)
    metadata.add_argument("--challenger-url", required=True)
    metadata.add_argument("--sections", type=Path, help="Local section-metadata JSON snapshot.")
    metadata.add_argument("--target", help="Exact key in the supplied section snapshot.")
    preview = commands.add_parser("preview", help="Prepare a candidate forced-preview URL.")
    preview.add_argument("--page-url", required=True)
    preview.add_argument("--assignment", action="append", required=True, metavar="ID/VARIANT")
    preview.add_argument(
        "--paired-compatible", action="store_true",
        help="Caller attests paired overrides were independently checked; not proof itself.",
    )
    validate = commands.add_parser(
        "validate-challenger", help="Compare supported challenger copy with a local baseline.",
    )
    validate.add_argument("html", type=Path)
    validate.add_argument("--block", required=True, choices=("hero", "cards-product"))
    validate.add_argument("--baseline", required=True, type=Path)
    validate.add_argument("--baseline-format", required=True, choices=FORMATS)
    validate.add_argument("--input-format", required=True, choices=FORMATS)
    args = parser.parse_args()
    try:
        if args.command == "metadata":
            values = (args.page_url, args.experiment_id, args.challenger_url)
            if bool(args.sections) != bool(args.target):
                raise ValueError("--sections and --target must be supplied together.")
            if args.sections:
                sections = json.loads(args.sections.read_text(encoding="utf-8"))
                result = plan_section_metadata(sections, args.target, *values)
            else:
                result = prepare_section_metadata(*values)
        elif args.command == "preview":
            assignments = []
            for assignment in args.assignment:
                identity, separator, variant = assignment.partition("/")
                if not separator:
                    raise ValueError("An assignment must have the form ID/VARIANT.")
                assignments.append((identity, variant))
            result = {
                "status": "draft",
                "backend_written": False,
                "runtime_verified": False,
                "paired_compatibility": (
                    "caller-attested" if args.paired_compatible else "not-attested"
                ),
                "candidate_url": build_preview_url(
                    args.page_url, assignments, paired_compatible=args.paired_compatible,
                ),
            }
        else:
            result = validate_challenger_html(
                args.html.read_text(encoding="utf-8"), args.block,
                baseline_html=args.baseline.read_text(encoding="utf-8"),
                baseline_format=args.baseline_format, input_format=args.input_format,
            )
    except (ValueError, OSError) as error:
        parser.exit(2, f"error: {error}\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
