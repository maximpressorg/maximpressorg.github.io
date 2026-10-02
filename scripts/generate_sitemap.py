#!/usr/bin/env python3
from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urljoin
import re, subprocess, html

ROOT = Path(__file__).resolve().parents[1]
BASE = "https://maximpressorg.github.io/"

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots = ""
        self.refresh = False
        self.images = []
        self.video_sources = []
        self.video_poster = ""
    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "meta":
            name = d.get("name","").lower()
            if name == "robots":
                self.robots = d.get("content","").lower()
            if d.get("http-equiv","").lower() == "refresh":
                self.refresh = True
        elif tag == "img":
            src = d.get("src","")
            if src and not src.startswith(("http://","https://","data:")):
                self.images.append(src)
        elif tag == "video":
            self.video_poster = d.get("poster","") or self.video_poster
            src = d.get("src","")
            if src: self.video_sources.append(src)
        elif tag == "source":
            src = d.get("src","")
            if src: self.video_sources.append(src)

def git_lastmod(path):
    try:
        rel = str(path.relative_to(ROOT))
        value = subprocess.check_output(
            ["git","-C",str(ROOT),"log","-1","--format=%cI","--",rel],
            text=True, stderr=subprocess.DEVNULL
        ).strip()
        return value or None
    except Exception:
        return None

def esc(s):
    return html.escape(s, quote=True)

pages = []
for path in sorted(ROOT.glob("*.html")):
    if path.name.startswith("google") and path.name.endswith(".html"):
        continue
    parser = PageParser()
    parser.feed(path.read_text(encoding="utf-8", errors="ignore"))
    if "noindex" in parser.robots or parser.refresh:
        continue
    url = BASE if path.name == "index.html" else BASE + path.name
    pages.append((path, url, parser))

# Portfolio client avatars are rendered by JavaScript on reviews.html.
avatar_paths = []
data_file = ROOT / "client-testimonials-data.js"
if data_file.exists():
    txt = data_file.read_text(encoding="utf-8", errors="ignore")
    avatar_paths = sorted(set(re.findall(r'["\']photo["\']\s*:\s*["\']([^"\']+client-avatars/[^"\']+)["\']', txt)))

lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
    '        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">'
]

for path, url, parser in pages:
    lines.append("  <url>")
    lines.append(f"    <loc>{esc(url)}</loc>")
    lm = git_lastmod(path)
    if lm:
        lines.append(f"    <lastmod>{esc(lm)}</lastmod>")

    # Add discoverable, page-specific local images. Avoid repeating the shared logo on every URL.
    imgs = []
    for src in parser.images:
        if src.endswith("images/maximpress-logo.png"):
            continue
        if src not in imgs:
            imgs.append(src)
    if path.name == "reviews.html":
        if "images/portfolio-client-network-poster.jpg" not in imgs:
            imgs.append("images/portfolio-client-network-poster.jpg")
        for av in avatar_paths:
            if av not in imgs:
                imgs.append(av)
    for src in imgs:
        lines.append("    <image:image>")
        lines.append(f"      <image:loc>{esc(urljoin(BASE, src))}</image:loc>")
        lines.append("    </image:image>")

    # The portfolio page contains the site's principal embedded video.
    if path.name == "reviews.html":
        lines.extend([
            "    <video:video>",
            f"      <video:thumbnail_loc>{esc(BASE + 'images/portfolio-client-network-poster.jpg')}</video:thumbnail_loc>",
            "      <video:title>MaxImpress Professional Connections and Client Portfolio</video:title>",
            "      <video:description>A visual overview of selected professional account connections and the MaxImpress X Delegation client network shown on the portfolio page.</video:description>",
            f"      <video:content_loc>{esc(BASE + 'videos/portfolio-client-network.mp4')}</video:content_loc>",
            "      <video:duration>48</video:duration>",
            "    </video:video>"
        ])

    lines.append("  </url>")

lines.append("</urlset>")
(ROOT / "sitemap.xml").write_text("\n".join(lines) + "\n", encoding="utf-8")
print(f"Wrote sitemap.xml with {len(pages)} indexable page URLs.")
