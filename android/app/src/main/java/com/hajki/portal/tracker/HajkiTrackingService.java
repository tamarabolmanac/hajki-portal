package com.hajki.portal.tracker;

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
import android.os.IBinder;
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

/**
 * Foreground servis šalje tačke na isti endpoint kao web ({@code POST /routes/track_point}) sa Bearer tokenom.
 */
public class HajkiTrackingService extends Service implements LocationListener {

    private static final String TAG = "HajkiTracker";
    public static final String EXTRA_ROUTE_ID = "route_id";
    public static final String EXTRA_API_BASE = "api_base";
    public static final String EXTRA_AUTH_TOKEN = "auth_token";

    private static final String CHANNEL_ID = "hajki_tracking_channel";

    private volatile String routeId = "";
    private volatile String apiBase = "";
    private volatile String authToken = "";

    private LocationManager locationManager;
    private boolean started = false;

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
        sendTrackPoint(location);
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

    private void sendTrackPoint(Location loc) {
        final String base = apiBase;
        final String token = authToken;
        final String rid = routeId;

        new Thread(() -> {
            HttpURLConnection conn = null;
            try {
                URL url = new URL(base + "/routes/track_point");
                conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; charset=UTF-8");
                conn.setRequestProperty("Accept", "application/json");
                if (token != null && !token.isEmpty()) {
                    conn.setRequestProperty("Authorization", "Bearer " + token);
                }
                conn.setDoOutput(true);

                JSONObject body = new JSONObject();
                if (rid != null && !rid.isEmpty()) {
                    try {
                        body.put("route_id", Integer.parseInt(rid));
                    } catch (NumberFormatException e) {
                        body.put("route_id", rid);
                    }
                } else {
                    body.put("route_id", JSONObject.NULL);
                }
                body.put("latitude", loc.getLatitude());
                body.put("longitude", loc.getLongitude());
                body.put("accuracy", loc.getAccuracy());
                body.put("timestamp", formatIsoUtc(loc.getTime()));

                byte[] bytes = body.toString().getBytes(StandardCharsets.UTF_8);
                OutputStream os = conn.getOutputStream();
                os.write(bytes);
                os.close();

                int code = conn.getResponseCode();
                InputStream is = code >= 400 ? conn.getErrorStream() : conn.getInputStream();
                String resp = is != null ? readStream(is) : "";

                if (code >= 200 && code < 300 && resp.length() > 0) {
                    try {
                        JSONObject json = new JSONObject(resp);
                        if (json.has("route_id") && !json.isNull("route_id")) {
                            routeId = String.valueOf(json.get("route_id"));
                            HajkiTrackerPlugin.emitRouteIdUpdate(routeId);
                        }
                    } catch (Exception parseEx) {
                        Log.w(TAG, "Parsiranje odgovora: " + parseEx.getMessage());
                    }
                } else {
                    Log.w(TAG, "track_point HTTP " + code + " " + resp);
                }
            } catch (Exception e) {
                Log.e(TAG, "Greška track_point: " + e.getMessage());
            } finally {
                if (conn != null) conn.disconnect();
            }
        }).start();
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
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (Exception ignored) {
            }
            locationManager = null;
        }
        super.onDestroy();
    }

    @Nullable
    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
