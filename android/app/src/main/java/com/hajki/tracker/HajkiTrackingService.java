package com.hajki.tracker;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.Service;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ServiceInfo;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;

import android.Manifest;

import org.json.JSONObject;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Foreground servis beleži GPS tačke i šalje ih na {@code POST /routes/track_point}.
 *
 * Tačke idu u red čekanja (queue) i šalju se preko jednog worker threada. Ako
 * POST padne (slaba mreža, Doze, prekid) tačka OSTAJE u redu i ponovo se
 * pokušava — na sledeću lokaciju i periodično na svakih {@link #RETRY_INTERVAL_MS}.
 * Tako se izgubljene tačke dopošalju čim se veza vrati (nema rupa na ruti).
 */
public class HajkiTrackingService extends Service implements LocationListener {

    private static final String TAG = "HajkiTracker";
    public static final String EXTRA_ROUTE_ID = "route_id";
    public static final String EXTRA_API_BASE = "api_base";
    public static final String EXTRA_AUTH_TOKEN = "auth_token";

    private static final String CHANNEL_ID = "hajki_tracking_channel";
    /** Periodični pokušaj slanja zaostalih tačaka (kad nema nove lokacije, a mreža se vratila). */
    private static final long RETRY_INTERVAL_MS = 15_000L;
    /** Zaštita od neograničenog rasta reda ako je server nedostupan celu turu. */
    private static final int MAX_QUEUE = 50_000;

    private volatile String routeId = "";
    private volatile String apiBase = "";
    private volatile String authToken = "";

    private LocationManager locationManager;
    private boolean started = false;

    /** Neposlate tačke (FIFO). Thread-safe za paralelni add (lokacija) + poll (sender). */
    private final ConcurrentLinkedQueue<JSONObject> pending = new ConcurrentLinkedQueue<>();
    /** Jedan thread serijalizuje slanje — nikad dva POST-a u paraleli. */
    private ExecutorService sender;
    private Handler retryHandler;
    private final Runnable retryRunnable = new Runnable() {
        @Override
        public void run() {
            scheduleFlush();
            if (retryHandler != null) retryHandler.postDelayed(this, RETRY_INTERVAL_MS);
        }
    };

    @Override
    public void onCreate() {
        super.onCreate();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (!hasForegroundLocationPermission()) {
            Log.e(TAG, "Missing location permission; stopping");
            stopSelf();
            return START_NOT_STICKY;
        }
        if (Build.VERSION.SDK_INT >= 33 &&
                ContextCompat.checkSelfPermission(this, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            Log.w(TAG, "POST_NOTIFICATIONS not granted; cannot run foreground service");
            stopSelf();
            return START_NOT_STICKY;
        }

        if (intent != null) {
            String rid = intent.getStringExtra(EXTRA_ROUTE_ID);
            if (rid != null) routeId = rid;
            String base = intent.getStringExtra(EXTRA_API_BASE);
            if (base != null) apiBase = base.trim();
            String tok = intent.getStringExtra(EXTRA_AUTH_TOKEN);
            if (tok != null) authToken = tok;
        }

        if (apiBase == null || apiBase.isEmpty()) {
            Log.e(TAG, "No api_base in intent; stopping");
            stopSelf();
            return START_NOT_STICKY;
        }

        if (!started) {
            started = true;
            createNotificationChannel();
            Notification notification = new NotificationCompat.Builder(this, CHANNEL_ID)
                    .setContentTitle("Hajki praćenje aktivno")
                    .setContentText("Beležimo tvoju rutu u pozadini")
                    .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                    .setOngoing(true)
                    .build();

            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(1, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_LOCATION);
            } else {
                startForeground(1, notification);
            }

            sender = Executors.newSingleThreadExecutor();
            retryHandler = new Handler(Looper.getMainLooper());
            retryHandler.postDelayed(retryRunnable, RETRY_INTERVAL_MS);

            locationManager = (LocationManager) getSystemService(LOCATION_SERVICE);
            try {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER,
                        5000,
                        5f,
                        this
                );
            } catch (SecurityException e) {
                Log.e(TAG, "Location permission", e);
                stopSelf();
                return START_NOT_STICKY;
            }
        }

        return START_STICKY;
    }

    @Override
    public void onLocationChanged(Location location) {
        Log.d(TAG, "Lokacija: " + location.getLatitude() + "," + location.getLongitude());
        HajkiTrackerPlugin.emitLocationUpdate(
                location.getLatitude(),
                location.getLongitude(),
                location.getAccuracy(),
                formatIsoUtc(location.getTime()),
                routeId
        );
        enqueuePoint(location);
        scheduleFlush();
    }

    @Override
    public void onStatusChanged(String provider, int status, Bundle extras) {
    }

    @Override
    public void onProviderEnabled(String provider) {
    }

    @Override
    public void onProviderDisabled(String provider) {
    }

    /** Napravi JSON tačku i stavi je u red. route_id se ubacuje pri slanju (može se
     *  promeniti kad server vrati id za novu rutu). */
    private void enqueuePoint(Location loc) {
        if (pending.size() >= MAX_QUEUE) {
            Log.w(TAG, "Queue pun (" + MAX_QUEUE + "); preskačem tačku");
            return;
        }
        try {
            JSONObject body = new JSONObject();
            body.put("latitude", loc.getLatitude());
            body.put("longitude", loc.getLongitude());
            body.put("accuracy", loc.getAccuracy());
            body.put("timestamp", formatIsoUtc(loc.getTime()));
            // Slučajan ID po tački, generisan JEDNOM ovde. Ostaje isti kroz sve
            // retry-jeve → server odbija duplikat (idempotentno slanje).
            body.put("client_uuid", java.util.UUID.randomUUID().toString());
            pending.add(body);
        } catch (Exception e) {
            Log.e(TAG, "enqueuePoint: " + e.getMessage());
        }
    }

    /** Zakaži pokušaj pražnjenja reda na worker threadu (serijalizovano). */
    private void scheduleFlush() {
        ExecutorService ex = sender;
        if (ex == null || ex.isShutdown()) return;
        try {
            ex.submit(this::flush);
        } catch (Exception ignored) {
            // executor u gašenju
        }
    }

    /** Šalje tačke sa čela reda dok ne padne (tada staje i ostavlja ostatak za sledeći put). */
    private void flush() {
        JSONObject head;
        while ((head = pending.peek()) != null) {
            boolean ok = postPoint(head);
            if (ok) {
                pending.poll(); // uspešno → skini sa reda
            } else {
                break; // neuspeh → ostavi u redu, pokušaj kasnije
            }
        }
    }

    /** Jedan POST. Vraća true ako je tačka prihvaćena (HTTP 2xx). */
    private boolean postPoint(JSONObject point) {
        final String base = apiBase;
        final String token = authToken;
        final String rid = routeId;

        HttpURLConnection conn = null;
        try {
            // route_id se dodaje ovde da uvek koristi najsvežiji (server ga vrati za novu rutu)
            if (rid != null && !rid.isEmpty()) {
                try {
                    point.put("route_id", Integer.parseInt(rid));
                } catch (NumberFormatException e) {
                    point.put("route_id", rid);
                }
            } else {
                point.put("route_id", JSONObject.NULL);
            }

            URL url = new URL(base + "/routes/track_point");
            conn = (HttpURLConnection) url.openConnection();
            conn.setConnectTimeout(10_000);
            conn.setReadTimeout(15_000);
            conn.setRequestMethod("POST");
            conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
            conn.setRequestProperty("Accept", "application/json");
            if (token != null && !token.isEmpty()) {
                conn.setRequestProperty("Authorization", "Bearer " + token);
            }
            conn.setDoOutput(true);

            byte[] bytes = point.toString().getBytes(StandardCharsets.UTF_8);
            OutputStream os = conn.getOutputStream();
            os.write(bytes);
            os.close();

            int code = conn.getResponseCode();
            InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
            String resp = is != null ? readStream(is) : "";

            if (code >= 200 && code < 300) {
                if (resp.length() > 0) {
                    try {
                        JSONObject json = new JSONObject(resp);
                        if (json.has("route_id") && !json.isNull("route_id")) {
                            String newRid = String.valueOf(json.get("route_id"));
                            if (!newRid.equals(routeId)) {
                                routeId = newRid;
                                HajkiTrackerPlugin.emitRouteIdUpdate(routeId);
                            }
                        }
                    } catch (Exception parseEx) {
                        Log.w(TAG, "Parsiranje odgovora: " + parseEx.getMessage());
                    }
                }
                return true;
            }

            // 4xx (osim auth/mreže) — tačka je verovatno trajno neprihvatljiva; ne zaglavljuj red.
            if (code >= 400 && code < 500 && code != 401 && code != 408 && code != 429) {
                Log.w(TAG, "track_point HTTP " + code + " (odbačeno): " + resp);
                return true; // "uspeh" u smislu skidanja sa reda da ne blokira ostale
            }

            Log.w(TAG, "track_point HTTP " + code + " (retry): " + resp);
            return false;
        } catch (Exception e) {
            // mrežna greška → zadrži tačku za ponovni pokušaj
            Log.e(TAG, "Greška track_point (retry): " + e.getMessage());
            return false;
        } finally {
            if (conn != null) conn.disconnect();
        }
    }

    private static String formatIsoUtc(long epochMs) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date(epochMs));
    }

    private static String readStream(InputStream is) throws java.io.IOException {
        BufferedReader br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = br.readLine()) != null) sb.append(line);
        return sb.toString();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel ch = new NotificationChannel(
                    CHANNEL_ID,
                    "Hajki pozadinsko praćenje",
                    NotificationManager.IMPORTANCE_LOW
            );
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) manager.createNotificationChannel(ch);
        }
    }

    private boolean hasForegroundLocationPermission() {
        boolean fine = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        boolean coarse = ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
        return fine || coarse;
    }

    @Override
    public void onDestroy() {
        started = false;
        if (retryHandler != null) {
            retryHandler.removeCallbacks(retryRunnable);
            retryHandler = null;
        }
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (Exception ignored) {
            }
            locationManager = null;
        }
        // Poslednji pokušaj da se zaostale tačke pošalju pre gašenja.
        if (sender != null) {
            try {
                sender.submit(this::flush);
                sender.shutdown();
                sender.awaitTermination(3, TimeUnit.SECONDS);
            } catch (Exception ignored) {
            }
            sender = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
