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

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import java.util.TimeZone;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

/**
 * Foreground servis beleži GPS tačke. Svaka tačka se ODMAH upisuje u lokalni
 * SQLite ({@link PointStore}) — nezavisno od mreže. Slanje na server
 * ({@link PointSync}) ih briše tek na potvrđen 200.
 *
 * Zato ništa nije izgubljeno ni kad nema signala celu turu: tačke ostaju na
 * disku, a otpremaju se čim se mreža vrati (live tokom snimanja, ili preko
 * sync-a pri otvaranju app-a). Na stop se ruta označi "čeka finalize", pa se
 * finalizuje tek kad su sve njene tačke otpremljene.
 */
public class HajkiTrackingService extends Service implements LocationListener {

    private static final String TAG = "HajkiTracker";
    public static final String EXTRA_ROUTE_ID = "route_id";
    public static final String EXTRA_API_BASE = "api_base";
    public static final String EXTRA_AUTH_TOKEN = "auth_token";

    private static final String CHANNEL_ID = "hajki_tracking_channel";
    /** Periodični pokušaj slanja zaostalih tačaka (kad se mreža vratila, a nema nove lokacije). */
    private static final long RETRY_INTERVAL_MS = 15_000L;

    private volatile String routeId = "";
    private volatile String apiBase = "";
    private volatile String authToken = "";

    private LocationManager locationManager;
    private boolean started = false;

    /** Jedan thread serijalizuje slanje — nikad dva POST-a u paraleli. */
    private ExecutorService sender;
    private Handler retryHandler;
    private final Runnable retryRunnable = new Runnable() {
        @Override
        public void run() {
            scheduleUpload();
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
        String ts = formatIsoUtc(location.getTime());

        HajkiTrackerPlugin.emitLocationUpdate(
                location.getLatitude(),
                location.getLongitude(),
                location.getAccuracy(),
                ts,
                routeId
        );

        // Upiši na disk ODMAH (client_uuid stabilan za idempotentno slanje),
        // pa pokušaj da otpremiš. Tačka je bezbedna i bez mreže.
        try {
            PointStore.get(this).insertPoint(
                    routeId,
                    location.getLatitude(),
                    location.getLongitude(),
                    location.getAccuracy(),
                    ts,
                    UUID.randomUUID().toString()
            );
        } catch (Exception e) {
            Log.e(TAG, "insertPoint: " + e.getMessage());
        }
        scheduleUpload();
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

    /** Zakaži slanje zaostalih tačaka na worker threadu (serijalizovano). */
    private void scheduleUpload() {
        final ExecutorService ex = sender;
        if (ex == null || ex.isShutdown()) return;
        final String base = apiBase;
        final String token = authToken;
        try {
            ex.submit(() -> PointSync.uploadPending(getApplicationContext(), base, token));
        } catch (Exception ignored) {
            // executor u gašenju
        }
    }

    private static String formatIsoUtc(long epochMs) {
        SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US);
        sdf.setTimeZone(TimeZone.getTimeZone("UTC"));
        return sdf.format(new Date(epochMs));
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

        // Stop pritisnut: označi rutu "čeka finalize" i pokušaj pun sync (upload +
        // finalize). Ako nema mreže — ništa se ne gubi: tačke i "finalize" flag su
        // na disku, a sync pri sledećem otvaranju app-a to dovrši.
        final String base = apiBase;
        final String token = authToken;
        final String rid = routeId;
        try {
            PointStore.get(this).markFinalize(rid);
        } catch (Exception e) {
            Log.e(TAG, "markFinalize: " + e.getMessage());
        }
        if (sender != null) {
            try {
                sender.submit(() -> PointSync.syncAll(getApplicationContext(), base, token));
                sender.shutdown();
                sender.awaitTermination(4, TimeUnit.SECONDS);
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
