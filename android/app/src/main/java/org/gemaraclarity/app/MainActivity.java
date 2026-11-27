package org.gemaraclarity.app;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.webkit.WebViewAssetLoader;
import java.io.IOException;
import java.io.InputStream;

/** Gemara Clarity as a standalone app: the site's own files and every lesson are inside the app (assets/site) and are shown in
 *  the app's own view, not in a browser. Requests for https://gemaraclarity.org/... are answered from those files; only what
 *  is not in the app (Sefaria's text, Rashi and Tosfos) goes to the network. */
public class MainActivity extends Activity {
    private static final String HOST = "gemaraclarity.org";
    private static final String HOME = "https://" + HOST + "/";
    private WebView web;

    private static String mime(String p) {
        String e = p.substring(p.lastIndexOf('.') + 1).toLowerCase();
        switch (e) {
            case "html": return "text/html";
            case "js": case "mjs": return "text/javascript";
            case "css": return "text/css";
            case "json": return "application/json";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "webp": return "image/webp";
            case "woff2": return "font/woff2";
            case "xml": return "application/xml";
            case "txt": return "text/plain";
            default: return "application/octet-stream";
        }
    }

    @Override protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " GemaraClarityApp/1.1");

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder().setDomain(HOST).addPathHandler("/", path -> {
            String p = path;
            if (p.isEmpty() || p.endsWith("/")) p += "index.html";
            try {
                InputStream in = getAssets().open("site/" + p);
                String m = mime(p);
                boolean text = m.startsWith("text/") || m.equals("application/json") || m.equals("image/svg+xml");
                return new WebResourceResponse(m, text ? "utf-8" : null, in);
            } catch (IOException e) { return null; } // not in the app: the network answers
        }).build();

        web.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView v, WebResourceRequest r) {
                if (!"GET".equals(r.getMethod())) return null;
                return loader.shouldInterceptRequest(r.getUrl());
            }
            @Override public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { /* nothing on this device opens it */ }
                return true;
            }
        });
        if (saved != null) web.restoreState(saved); else web.loadUrl(HOME);
    }

    @Override protected void onSaveInstanceState(Bundle out) { super.onSaveInstanceState(out); web.saveState(out); }

    @Override public void onBackPressed() { if (web.canGoBack()) web.goBack(); else super.onBackPressed(); }
}
