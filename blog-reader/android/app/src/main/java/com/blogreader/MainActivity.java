package com.blogreader;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.util.Base64;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.net.HttpURLConnection;
import java.net.URL;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Thin native shell: the UI lives in assets/index.html. Java only does
 * HTTP fetches (native code is not subject to browser CORS rules, which is
 * what lets us read any blog's feed) and opens post links in the browser.
 */
public class MainActivity extends Activity {
    private WebView web;
    private final ExecutorService pool = Executors.newFixedThreadPool(6);
    private String pendingShare;
    private String pendingExport;
    private static final int REQ_EXPORT = 1, REQ_IMPORT = 2;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        web = new WebView(this);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);           // localStorage keeps your sites
        web.addJavascriptInterface(new Bridge(), "Native");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                String scheme = r.getUrl().getScheme();
                if ("http".equals(scheme) || "https".equals(scheme)) {
                    startActivity(new Intent(Intent.ACTION_VIEW, r.getUrl()));
                    return true;
                }
                return false;
            }

            @Override
            public void onPageFinished(WebView v, String url) {
                if (pendingShare != null) { deliverShare(pendingShare); pendingShare = null; }
            }
        });
        pendingShare = sharedText(getIntent());
        if (state != null) web.restoreState(state);
        else web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        String t = sharedText(intent);
        if (t != null) deliverShare(t);
    }

    private static String sharedText(Intent i) {
        if (i != null && Intent.ACTION_SEND.equals(i.getAction()))
            return i.getStringExtra(Intent.EXTRA_TEXT);
        return null;
    }

    private void deliverShare(String text) {
        web.evaluateJavascript("window.onShared(" + JSONObject.quote(text) + ")", null);
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    @Override
    public void onBackPressed() {
        web.evaluateJavascript("window.onBack()", r -> {
            if (!"true".equals(r)) MainActivity.super.onBackPressed();
        });
    }

    @Override
    protected void onDestroy() {
        pool.shutdownNow();
        super.onDestroy();
    }

    @Override
    protected void onActivityResult(int req, int result, Intent data) {
        super.onActivityResult(req, result, data);
        Uri uri = (result == RESULT_OK && data != null) ? data.getData() : null;
        if (req == REQ_EXPORT) {
            String text = pendingExport;
            pendingExport = null;
            if (uri == null) { js("window.onFileDone(false,'Backup cancelled')"); return; }
            try (OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                out.write(text.getBytes(StandardCharsets.UTF_8));
                js("window.onFileDone(true,'Backup saved')");
            } catch (Exception e) {
                js("window.onFileDone(false," + JSONObject.quote("Backup failed: " + e) + ")");
            }
        } else if (req == REQ_IMPORT) {
            if (uri == null) return;
            try (InputStream in = getContentResolver().openInputStream(uri)) {
                String text = new String(readAll(in), StandardCharsets.UTF_8);
                js("window.onImported(" + JSONObject.quote(text) + ")");
            } catch (Exception e) {
                js("window.onFileDone(false," + JSONObject.quote("Could not read file: " + e) + ")");
            }
        }
    }

    private void js(String code) { web.evaluateJavascript(code, null); }

    class Bridge {
        /** Opens Android's "Save as" picker; writes the text to the chosen file. */
        @JavascriptInterface
        public void exportFile(final String fileName, final String text) {
            runOnUiThread(() -> {
                pendingExport = text;
                Intent i = new Intent(Intent.ACTION_CREATE_DOCUMENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType("application/json")
                        .putExtra(Intent.EXTRA_TITLE, fileName);
                startActivityForResult(i, REQ_EXPORT);
            });
        }

        /** Opens Android's file picker; the file's text arrives in JS via window.onImported(text). */
        @JavascriptInterface
        public void importFile() {
            runOnUiThread(() -> {
                Intent i = new Intent(Intent.ACTION_OPEN_DOCUMENT)
                        .addCategory(Intent.CATEGORY_OPENABLE)
                        .setType("*/*");
                startActivityForResult(i, REQ_IMPORT);
            });
        }

        /** Async GET. Result arrives in JS as window.__done(id, ok, finalUrl, base64Body|error). */
        @JavascriptInterface
        public void fetch(final int id, final String url) {
            pool.execute(() -> {
                String js;
                try {
                    HttpURLConnection c = open(url);
                    String finalUrl = c.getURL().toString();
                    byte[] body;
                    try (InputStream in = c.getInputStream()) { body = readAll(in); }
                    js = "window.__done(" + id + ",true," + JSONObject.quote(finalUrl) + ","
                            + JSONObject.quote(Base64.encodeToString(body, Base64.NO_WRAP)) + ")";
                } catch (Exception e) {
                    js = "window.__done(" + id + ",false,''," + JSONObject.quote(e.toString()) + ")";
                }
                final String call = js;
                runOnUiThread(() -> web.evaluateJavascript(call, null));
            });
        }
    }

    /** Follows redirects, including http<->https hops that HttpURLConnection won't follow itself. */
    private static HttpURLConnection open(String url) throws Exception {
        for (int i = 0; i < 6; i++) {
            HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
            c.setConnectTimeout(15000);
            c.setReadTimeout(20000);
            c.setInstanceFollowRedirects(false);
            c.setRequestProperty("User-Agent", "Mozilla/5.0 (Android; SimpleBlogReader/1.0)");
            int code = c.getResponseCode();
            if (code >= 300 && code < 400 && c.getHeaderField("Location") != null) {
                url = new URL(new URL(url), c.getHeaderField("Location")).toString();
                c.disconnect();
                continue;
            }
            if (code >= 400) throw new Exception("HTTP " + code);
            return c;
        }
        throw new Exception("Too many redirects");
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
    }
}
