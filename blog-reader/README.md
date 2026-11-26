# Blog reader

Minimal personal blog aggregator. One Python file, no dependencies (Python 3.9+).

```
python3 reader.py          # open http://localhost:8000
```

- Paste any blog URL (homepage or feed). The RSS/Atom feed is detected automatically.
- All posts are merged into one list, newest first. Click a site name to filter.
- Sites are saved in `feeds.json` (plain JSON, easy to edit or back up).
- Feeds are re-fetched at most every 15 minutes, or on "Refresh now".
