package com.hajki.portal.tracker;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.os.Build;

import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.lang.ref.WeakReference;

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

    @PluginMethod
    public void stopTracking(PluginCall call) {
        Activity activity = getActivity();
        Intent intent = new Intent(activity, HajkiTrackingService.class);
        activity.stopService(intent);
        call.resolve();
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
