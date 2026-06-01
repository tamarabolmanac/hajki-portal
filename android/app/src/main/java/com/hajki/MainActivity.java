package com.hajki;

import android.os.Bundle;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.os.Build;

import com.getcapacitor.BridgeActivity;
import com.hajki.tracker.HajkiTrackerPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HajkiTrackerPlugin.class);
        super.onCreate(savedInstanceState);
        createTrackingNotificationChannel();
    }

    private void createTrackingNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            String channelId = "hajki_tracking_channel";
            String channelName = "Hajki Pozadinsko Praćenje";
            String channelDescription = "Kanal za foreground tracking servis";

            NotificationChannel serviceChannel = new NotificationChannel(
                channelId,
                channelName,
                NotificationManager.IMPORTANCE_LOW
            );
            serviceChannel.setDescription(channelDescription);

            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager != null) {
                manager.createNotificationChannel(serviceChannel);
            }
        }
    }
}
