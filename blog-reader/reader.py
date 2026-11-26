#!/usr/bin/env python3
"""Minimal blog aggregator. Standard library only.

Run:  python3 reader.py            -> http://localhost:8000
      python3 reader.py --port 9000

Paste any blog URL (homepage or feed). The app finds the RSS/Atom feed,
stores it in feeds.json and shows all posts merged, newest first.
"""
import argparse
import html
import json
import re
import threading
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from concurrent.futures import ThreadPoolExecutor
from email.utils import parsedate_to_datetime
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STORE = Path(__file__).with_name("feeds.json")
CACHE_SECONDS = 15 * 60
MAX_POSTS = 200
UA = "Mozilla/5.0 (compatible; SimpleBlogReader/1.0)"

_lock = threading.Lock()
_cache = {"time": 0.0, "posts": [], "errors": {}}


# ---------- storage ----------
def load_feeds():
    if STORE.exists():
        return json.loads(STORE.read_text(encoding="utf-8"))
    return []


def save_feeds(feeds):
    STORE.write_text(json.dumps(feeds, indent=2, ensure_ascii=False), encoding="utf-8")


# ---------- fetching / parsing ----------
def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.read(), r.headers.get("Content-Type", ""), r.geturl()


def looks_like_feed(data):
    head = data[:2000].lower()
    return b"<rss" in head or b"<feed" in head or b"<rdf:rdf" in head


def discover_feed(url):
    """Return (feed_url, title) for a homepage or feed URL."""
    if not re.match(r"^https?://", url):
        url = "https://" + url
    data, _, final = fetch(url)
    if looks_like_feed(data):
        return final, parse_feed(data, final)[0]
    page = data.decode("utf-8", "replace")
    for tag in re.findall(r"<link\b[^>]*>", page, re.I):
        if re.search(r"application/(rss|atom)\+xml", tag, re.I):
            m = re.search(r'href=["\']([^"\']+)', tag, re.I)
            if m:
                feed_url = urllib.parse.urljoin(final, html.unescape(m.group(1)))
                fdata, _, ffinal = fetch(feed_url)
                return ffinal, parse_feed(fdata, ffinal)[0]
    # common fallbacks
    for path in ("feed", "rss", "rss.xml", "atom.xml", "feed.xml", "index.xml"):
        try:
            feed_url = urllib.parse.urljoin(final.rstrip("/") + "/", path)
            fdata, _, ffinal = fetch(feed_url)
            if looks_like_feed(fdata):
                return ffinal, parse_feed(fdata, ffinal)[0]
        except Exception:
            pass
    raise ValueError("No RSS/Atom feed found on that page")


def _local(tag):
    return tag.rsplit("}", 1)[-1].lower()


def _child(el, *names):
    for c in el:
        if _local(c.tag) in names:
            return c
    return None


def _text(el, *names):
    c = _child(el, *names)
    return (c.text or "").strip() if c is not None and c.text else ""


def _date(s):
    if not s:
        return None
    try:
        d = parsedate_to_datetime(s)
    except Exception:
        try:
            d = datetime.fromisoformat(s.strip().replace("Z", "+00:00"))
        except Exception:
            return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def _summary(raw, n=280):
    txt = html.unescape(re.sub(r"<[^>]+>", " ", raw or ""))
    txt = re.sub(r"\s+", " ", txt).strip()
    return txt[:n] + ("…" if len(txt) > n else "")


def parse_feed(data, base):
    """Return (feed_title, [posts])."""
    root = ET.fromstring(data)
    posts = []
    if _local(root.tag) == "feed":  # Atom
        title = _text(root, "title")
        for e in root:
            if _local(e.tag) != "entry":
                continue
            link = ""
            for l in e:
                if _local(l.tag) == "link" and l.get("rel", "alternate") == "alternate":
                    link = l.get("href", "")
                    break
            posts.append({
                "title": _text(e, "title"),
                "link": urllib.parse.urljoin(base, link),
                "date": _date(_text(e, "published", "updated")),
                "summary": _summary(_text(e, "summary", "content")),
            })
    else:  # RSS 2.0 / RSS 1.0 (RDF)
        channel = _child(root, "channel")
        if channel is None:
            channel = root
        title = _text(channel, "title")
        items = [i for i in channel if _local(i.tag) == "item"] or \
                [i for i in root if _local(i.tag) == "item"]
        for i in items:
            posts.append({
                "title": _text(i, "title"),
                "link": _text(i, "link"),
                "date": _date(_text(i, "pubdate", "date", "published")),
                "summary": _summary(_text(i, "description", "encoded")),
            })
    return title or base, posts


def refresh(force=False):
    with _lock:
        if not force and time.time() - _cache["time"] < CACHE_SECONDS:
            return
    feeds = load_feeds()

    def one(f):
        try:
            data, _, final = fetch(f["feed"])
            _, posts = parse_feed(data, final)
            for p in posts:
                p["source"] = f["title"]
            return posts, None
        except Exception as e:
            return [], f"{type(e).__name__}: {e}"

    all_posts, errors = [], {}
    with ThreadPoolExecutor(max_workers=8) as ex:
        for f, (posts, err) in zip(feeds, ex.map(one, feeds)):
            all_posts += posts
            if err:
                errors[f["title"]] = err
    epoch = datetime.min.replace(tzinfo=timezone.utc)
    all_posts.sort(key=lambda p: p["date"] or epoch, reverse=True)
    with _lock:
        _cache.update(time=time.time(), posts=all_posts[:MAX_POSTS], errors=errors)


# ---------- web UI ----------
CSS = """
body{font:16px/1.5 system-ui,sans-serif;max-width:760px;margin:2rem auto;padding:0 1rem;color:#222}
h1{font-size:1.4rem}a{color:#0b5cad;text-decoration:none}a:hover{text-decoration:underline}
form.add{display:flex;gap:.5rem;margin:1rem 0}form.add input{flex:1;padding:.5rem}
button{padding:.4rem .8rem;cursor:pointer}
.post{border-bottom:1px solid #eee;padding:.8rem 0}.meta{color:#777;font-size:.85rem}
.sum{color:#444;font-size:.95rem;margin:.2rem 0 0}
details{margin:1rem 0;color:#555}.feeds li{margin:.2rem 0}
.feeds form{display:inline}.feeds button{font-size:.75rem;padding:.1rem .4rem}
.err{color:#b00020;font-size:.85rem}.msg{background:#fff3cd;padding:.5rem}
"""


def page(msg="", source=None):
    feeds = load_feeds()
    posts = _cache["posts"]
    if source:
        posts = [p for p in posts if p["source"] == source]
    e = html.escape
    out = [f"<!doctype html><meta charset=utf-8><meta name=viewport content='width=device-width'>"
           f"<title>Blog reader</title><style>{CSS}</style><h1><a href='/'>Blog reader</a></h1>"]
    if msg:
        out.append(f"<p class=msg>{e(msg)}</p>")
    out.append("<form class=add method=post action=/add><input name=url "
               "placeholder='Paste a blog URL (homepage or feed)' required>"
               "<button>Add</button></form>")
    out.append(f"<details><summary>{len(feeds)} sites · "
               "<form method=post action=/refresh style=display:inline>"
               "<button>Refresh now</button></form></summary><ul class=feeds>")
    for f in feeds:
        err = _cache["errors"].get(f["title"])
        out.append(f"<li><a href='/?source={urllib.parse.quote(f['title'])}'>{e(f['title'])}</a> "
                   f"<form method=post action=/remove><input type=hidden name=feed value='{e(f['feed'])}'>"
                   f"<button>remove</button></form>"
                   + (f" <span class=err>{e(err)}</span>" if err else "") + "</li>")
    out.append("</ul></details>")
    if source:
        out.append(f"<p>Showing <b>{e(source)}</b> · <a href='/'>all</a></p>")
    if not posts:
        out.append("<p>No posts yet. Add some sites above.</p>")
    for p in posts:
        d = p["date"].strftime("%Y-%m-%d") if p["date"] else ""
        out.append(f"<div class=post><a href='{e(p['link'])}' target=_blank rel=noopener>"
                   f"{e(p['title'] or '(untitled)')}</a>"
                   f"<div class=meta>{e(p['source'])} · {d}</div>"
                   + (f"<p class=sum>{e(p['summary'])}</p>" if p["summary"] else "") + "</div>")
    return "".join(out)


class Handler(BaseHTTPRequestHandler):
    def _send(self, body, code=200):
        b = body.encode()
        self.send_response(code)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(b)))
        self.end_headers()
        self.wfile.write(b)

    def _redirect(self, msg=""):
        self.send_response(303)
        self.send_header("Location", "/" + (f"?msg={urllib.parse.quote(msg)}" if msg else ""))
        self.end_headers()

    def do_GET(self):
        q = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        if urllib.parse.urlparse(self.path).path != "/":
            return self._send("Not found", 404)
        refresh()
        self._send(page(q.get("msg", [""])[0], q.get("source", [None])[0]))

    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0))
        form = urllib.parse.parse_qs(self.rfile.read(n).decode())
        path = self.path
        feeds = load_feeds()
        if path == "/add":
            url = form.get("url", [""])[0].strip()
            try:
                feed_url, title = discover_feed(url)
                if any(f["feed"] == feed_url for f in feeds):
                    return self._redirect(f"Already added: {title}")
                feeds.append({"title": title, "feed": feed_url, "site": url})
                save_feeds(feeds)
                refresh(force=True)
                return self._redirect(f"Added: {title}")
            except Exception as e:
                return self._redirect(f"Could not add {url}: {e}")
        if path == "/remove":
            feed = form.get("feed", [""])[0]
            save_feeds([f for f in feeds if f["feed"] != feed])
            refresh(force=True)
            return self._redirect("Removed")
        if path == "/refresh":
            refresh(force=True)
            return self._redirect("Refreshed")
        self._send("Not found", 404)

    def log_message(self, *a):
        pass


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    a = ap.parse_args()
    print(f"Blog reader on http://{a.host}:{a.port}  (feeds stored in {STORE})")
    ThreadingHTTPServer((a.host, a.port), Handler).serve_forever()
