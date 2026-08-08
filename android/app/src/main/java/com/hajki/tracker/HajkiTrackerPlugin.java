package com.hajki.tracker;

import android.Manifest;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.lang.ref.WeakReference;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(
    name = "HajkiTracker",
    permissions = {
        @Permission(strings = { Manifest.permission.ACCESS_FINE_LOCATION }, alias = "location"),
        @Permission(strings = { Manifest.permission.ACCESS_COARSE_LOCATION }, alias = "coarse"),
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "notifications")
    }
)
public class HajkiTrackerPlugin extends Plugin {

    private static WeakReference<HajkiTrackerPlugin> activePlugin = new WeakReference<>(null);

    @Override
    public void load() {
        activePlugin = new WeakReference<>(this);
    }

    public static void emitLocationUpdate(double latitude, double longitude, float accuracy, String timestamp, String routeId) {
        HajkiTrackerPlugin plugin = activePlugin.get();
        if (plugin == null) return;

        JSObject data = new JSObject();
        data.put("lat", latitude);
        data.put("lng", longitude);
        data.put("accuracy", accuracy);
        data.put("timestamp", timestamp);
        data.put("routeId", routeId != null ? routeId : "");

        plugin.notifyListeners("locationUpdate", data);
    }

    public static void emitRouteIdUpdate(String routeId) {
        HajkiTrackerPlugin plugin = activePlugin.get();
        if (plugin == null || routeId == null || routeId.isEmpty()) return;

        JSObject data = new JSObject();
        data.put("routeId", routeId);

        plugin.notifyListeners("routeIdUpdate", data);
    }

    @PluginMethod
    public void startTracking(PluginCall call) {
        Activity activity = getActivity();
        saveCall(call);

        if (Build.VERSION.SDK_INT >= 33 && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permissionsCallback");
            return;
        }

        boolean fineGranted = getPermissionState("location") == PermissionState.GRANTED;
        boolean coarseGranted = getPermissionState("coarse") == PermissionState.GRANTED;
        if (!fineGranted && !coarseGranted) {
            requestPermissionForAlias("location", call, "permissionsCallback");
            return;
        }

        startServiceAndResolve(call);
    }

    /** Da li je aplikacija već izuzeta iz battery optimizacija (radi neometano u pozadini). */
    @PluginMethod
    public void isIgnoringBatteryOptimizations(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("granted", isIgnoringBatteryOptimizations());
        call.resolve(ret);
    }

    /** Ako nije izuzeta, otvori sistemski dijalog „Dozvoli rad u pozadini bez ograničenja".
     *  Ovo je ključno na uređajima sa battery saverom (MIUI/Xiaomi…) da GPS ne bude gušen. */
    @PluginMethod
    public void requestBatteryOptimizationExemption(PluginCall call) {
        boolean already = isIgnoringBatteryOptimizations();
        JSObject ret = new JSObject();
        if (already) {
            ret.put("granted", true);
            ret.put("requested", false);
            call.resolve(ret);
            return;
        }
        try {
            Activity activity = getActivity();
            Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
            intent.setData(Uri.parse("package:" + getContext().getPackageName()));
            activity.startActivity(intent);
            ret.put("granted", false);
            ret.put("requested", true);
        } catch (Exception e) {
            // Neki uređaji nemaju taj ekran — otvori opšta battery podešavanja kao fallback.
            try {
                getActivity().startActivity(new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS));
                ret.put("requested", true);
            } catch (Exception e2) {
                ret.put("requested", false);
                ret.put("error", e2.getMessage());
            }
            ret.put("granted", false);
        }
        call.resolve(ret);
    }

    private boolean isIgnoringBatteryOptimizations() {
        try {
            PowerManager pm = (PowerManager) getContext().getSystemService(Context.POWER_SERVICE);
            return pm != null && pm.isIgnoringBatteryOptimizations(getContext().getPackageName());
        } catch (Exception e) {
            return false;
        }
    }

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Activity activity = getActivity();
        Intent intent = new Intent(activity, HajkiTrackingService.class);
        activity.stopService(intent);
        call.resolve();
    }

    /**
     * Pošalji zaostale (offline) tačke i finalizuj rute koje čekaju. Poziva se pri
     * otvaranju app-a sa SVEŽIM tokenom iz localStorage-a (da radi i ako je stari
     * token istekao dok si bila offline). Bezbedno pozvati bilo kad — ako nema
     * ničega zaostalog, samo brzo vrati nule.
     */
    @PluginMethod
    public void syncPending(PluginCall call) {
        String apiBase = call.getString("apiBaseUrl", "");
        if (apiBase == null || apiBase.isEmpty()) {
            call.reject("apiBaseUrl je obavezan");
            return;
        }
        final String base = apiBase.replaceAll("/+$", "");
        final String token = call.getString("authToken", "");
        new Thread(() -> {
            try {
                PointSync.Result r = PointSync.syncAll(getContext(), base, token != null ? token : "");
                JSObject ret = new JSObject();
                ret.put("uploaded", r.uploaded);
                ret.put("remaining", r.remaining);
                ret.put("finalized", r.finalized);
                call.resolve(ret);
            } catch (Exception e) {
                call.reject("sync failed: " + e.getMessage());
            }
        }).start();
    }

    /**
     * Pročitaj pending stanje iz lokalne baze BEZ mreže — za UI oznaku „ruta čeka
     * sinhronizaciju". Ne šalje ništa; samo prebroji šta je zaostalo na disku.
     * Vraća { totalPoints, routeIds: [...], finalizeIds: [...] } (route_id-jevi kao stringovi).
     */
    @PluginMethod
    public void getPendingStatus(PluginCall call) {
        try {
            PointStore store = PointStore.get(getContext());
            Set<String> finalizes = store.pendingFinalizes();
            Set<String> all = new HashSet<>(store.routeIdsWithPendingPoints());
            all.addAll(finalizes);

            JSArray routeIds = new JSArray();
            for (String s : all) routeIds.put(s);
            JSArray finalizeIds = new JSArray();
            for (String s : finalizes) finalizeIds.put(s);

            JSObject ret = new JSObject();
            ret.put("totalPoints", store.totalCount());
            ret.put("routeIds", routeIds);
            ret.put("finalizeIds", finalizeIds);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("getPendingStatus failed: " + e.getMessage());
        }
    }

    @PermissionCallback
    private void permissionsCallback(PluginCall call) {
        PluginCall saved = getSavedCall();
        if (saved == null) {
            return;
        }
        // Re-check chain and proceed when granted
        startTracking(saved);
    }

    private void startServiceAndResolve(PluginCall call) {
        Activity activity = getActivity();
        String routeId = call.getString("routeId", "");
        String apiBase = call.getString("apiBaseUrl", "");
        if (apiBase == null || apiBase.isEmpty()) {
            call.reject("apiBaseUrl je obavezan za pozadinsko praćenje");
            return;
        }
        String authToken = call.getString("authToken", "");

        Intent intent = new Intent(activity, HajkiTrackingService.class);
        intent.putExtra(HajkiTrackingService.EXTRA_ROUTE_ID, routeId != null ? routeId : "");
        intent.putExtra(HajkiTrackingService.EXTRA_API_BASE, apiBase.replaceAll("/+$", ""));
        intent.putExtra(HajkiTrackingService.EXTRA_AUTH_TOKEN, authToken != null ? authToken : "");

        ContextCompat.startForegroundService(activity, intent);
        call.resolve();
    }
}
