package com.hajki.tracker;

import android.content.Context;
import android.util.Log;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;

/**
 * Slanje zaostalih tačaka iz {@link PointStore} na server i finalizacija ruta.
 *
 * Koristi se sa dva mesta:
 *  - servis tokom snimanja → {@link #uploadPending} (samo šalje tačke, live)
 *  - sync pri otvaranju app-a → {@link #syncAll} (pošalje tačke PA finalizuje rute)
 *
 * Idempotentno: svaka tačka nosi client_uuid, server odbija duplikate; finalize
 * je bezbedan više puta. Tačka se briše sa diska tek na potvrđen 200.
 */
public final class PointSync {

    private static final String TAG = "HajkiTracker";
    private static final int BATCH = 100;

    private PointSync() {}

    public static class Result {
        public int uploaded = 0;
        public int remaining = 0;
        public int finalized = 0;
    }

    /**
     * Pošalji zaostale tačke (najstarije prve). Briše svaku na 200. Staje na
     * prvom mrežnom neuspehu (ostatak čeka sledeći put). Vraća broj poslatih.
     */
    public static synchronized int uploadPending(Context ctx, String apiBase, String token) {
        PointStore store = PointStore.get(ctx);
        int sent = 0;
        while (true) {
            List<PointStore.Row> batch = store.oldest(BATCH);
            if (batch.isEmpty()) break;

            boolean progressed = false;
            for (PointStore.Row r : batch) {
                int outcome = postPoint(apiBase, token, r);
                if (outcome == OK) {
                    store.deletePoint(r.id);
                    sent++;
                    progressed = true;
                } else if (outcome == DROP) {
                    // Trajno neprihvatljiva tačka (npr. 4xx) — skloni je da ne blokira red.
                    store.deletePoint(r.id);
                    progressed = true;
                } else {
                    // RETRY (mreža) — prekini, ostavi ostatak za kasnije.
                    return sent;
                }
            }
            if (!progressed) break;
        }
        return sent;
    }

    /**
     * Pun sync (pri otvaranju app-a / posle stop-a): pošalji sve zaostale tačke,
     * pa finalizuj rute kojima su sve tačke otpremljene.
     */
    public static synchronized Result syncAll(Context ctx, String apiBase, String token) {
        PointStore store = PointStore.get(ctx);
        Result res = new Result();

        res.uploaded = uploadPending(ctx, apiBase, token);
        res.remaining = store.totalCount();

        // Finalizuj samo rute kojima više nema neposlatih tačaka.
        Set<String> toFinalize = store.pendingFinalizes();
        for (String rid : toFinalize) {
            if (rid == null || rid.isEmpty()) { store.clearFinalize(rid); continue; }
            if (store.countForRoute(rid) > 0) continue; // još ima neposlatih → ne finalizuj
            if (finalizeRoute(apiBase, token, rid)) {
                store.clearFinalize(rid);
                res.finalized++;
            }
        }
        return res;
    }

    // --- HTTP ---

    private static final int OK = 0;      // sačuvano (ili duplikat) → obriši sa diska
    private static final int RETRY = 1;   // mrežna greška → zadrži, pokušaj kasnije
    private static final int DROP = 2;    // trajno odbijeno (4xx) → obriši da ne blokira

    private static int postPoint(String apiBase, String token, PointStore.Row r) {
        HttpURLConnection conn = null;
        try {
            JSONObject body = new JSONObject();
            try {
                body.put("route_id", Integer.parseInt(r.routeId));
            } catch (NumberFormatException e) {
                body.put("route_id", r.routeId);
            }
            body.put("latitude", r.lat);
            body.put("longitude", r.lng);
            body.put("accuracy", r.accuracy);
            body.put("timestamp", r.ts);
            body.put("client_uuid", r.uuid);

            conn = open(apiBase + "/routes/track_point", token);
            writeBody(conn, body.toString());

            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) return OK;
            // 401/408/429/5xx → mrežno/prolazno → retry; ostalo 4xx → drop
            if (code == 401 || code == 408 || code == 429 || code >= 500) return RETRY;
            if (code >= 400) {
                Log.w(TAG, "track_point HTTP " + code + " → drop point");
                return DROP;
            }
            return RETRY;
        } catch (Exception e) {
            Log.e(TAG, "postPoint (retry): " + e.getMessage());
            return RETRY;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static boolean finalizeRoute(String apiBase, String token, String routeId) {
        HttpURLConnection conn = null;
        try {
            conn = open(apiBase + "/routes/" + routeId + "/finalize", token);
            writeBody(conn, "{}");
            int code = conn.getResponseCode();
            if (code >= 200 && code < 300) {
                Log.d(TAG, "Route " + routeId + " finalized");
                return true;
            }
            // 404 = ruta obrisana/ne postoji → nema smisla ponavljati, tretiraj kao gotovo
            if (code == 404) {
                Log.w(TAG, "finalize " + routeId + " HTTP 404 → clearing");
                return true;
            }
            Log.w(TAG, "finalize " + routeId + " HTTP " + code + " → retry later");
            return false;
        } catch (Exception e) {
            Log.e(TAG, "finalizeRoute (retry): " + e.getMessage());
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static HttpURLConnection open(String urlStr, String token) throws Exception {
        URL url = new URL(urlStr);
        HttpURLConnection conn = (HttpURLConnection) url.openConnection();
        conn.setConnectTimeout(10_000);
        conn.setReadTimeout(15_000);
        conn.setRequestMethod("POST");
        conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
        conn.setRequestProperty("Accept", "application/json");
        if (token != null && !token.isEmpty()) {
            conn.setRequestProperty("Authorization", "Bearer " + token);
        }
        conn.setDoOutput(true);
        return conn;
    }

    private static void writeBody(HttpURLConnection conn, String json) throws Exception {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        OutputStream os = conn.getOutputStream();
        os.write(bytes);
        os.close();
    }

    @SuppressWarnings("unused")
    private static String readStream(InputStream is) throws java.io.IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }
}
