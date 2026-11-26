# Blog reader

Minimal personal blog aggregator. One Python file, no dependencies (Python 3.9+).

```
python3 reader.py          # open http://localhost:8000
```

- Paste any blog URL (homepage or feed). The RSS/Atom feed is detected automatically.
- All posts are merged into one list, newest first. Click a site name to filter.
- Sites are saved in `feeds.json` (plain JSON, easy to edit or back up).
- Feeds are re-fetched at most every 15 minutes, or on "Refresh now".

## Android app

`android/` is a native Android app (Android 8+) with the same features. Sites are stored on the phone.
You can also add a blog by opening it in Chrome and choosing **Share → Blog Reader**.

Build (needs the Android SDK): `cd android && gradle assembleDebug`
→ `app/build/outputs/apk/debug/app-debug.apk`
