package com.hajki.tracker;

import android.content.ContentValues;
import android.content.Context;
import android.database.Cursor;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Lokalno skladište GPS tačaka i "ruta čeka finalize" — SQLite na telefonu.
 *
 * Tačke se upisuju ODMAH pri hvatanju (nezavisno od mreže). Slanje na server ih
 * briše tek na potvrđen 200. Tako tačke preživljavaju gašenje app-a, restart
 * telefona i offline periode — ništa se ne gubi dok se ne otpremi.
 *
 * Singleton + synchronized pristup (mali volumen, ~1 tačka / 5s).
 */
public class PointStore extends SQLiteOpenHelper {

    private static final String DB_NAME = "hajki_tracking.db";
    private static final int DB_VERSION = 1;

    private static final String T_POINTS = "pending_points";
    private static final String T_FINAL = "pending_finalize";

    private static PointStore instance;

    public static synchronized PointStore get(Context ctx) {
        if (instance == null) {
            instance = new PointStore(ctx.getApplicationContext());
        }
        return instance;
    }

    private PointStore(Context ctx) {
        super(ctx, DB_NAME, null, DB_VERSION);
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        db.execSQL(
            "CREATE TABLE " + T_POINTS + " (" +
            "id INTEGER PRIMARY KEY AUTOINCREMENT, " +
            "route_id TEXT, lat REAL, lng REAL, accuracy REAL, ts TEXT, uuid TEXT)"
        );
        db.execSQL("CREATE INDEX idx_points_route ON " + T_POINTS + "(route_id)");
        db.execSQL("CREATE TABLE " + T_FINAL + " (route_id TEXT PRIMARY KEY)");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldV, int newV) {
        // Prva verzija — nema migracija još.
    }

    /** Jedna neposlata tačka (sa svojim id-jem u bazi). */
    public static class Row {
        public final long id;
        public final String routeId, ts, uuid;
        public final double lat, lng, accuracy;
        Row(long id, String routeId, double lat, double lng, double accuracy, String ts, String uuid) {
            this.id = id; this.routeId = routeId; this.lat = lat; this.lng = lng;
            this.accuracy = accuracy; this.ts = ts; this.uuid = uuid;
        }
    }

    public synchronized void insertPoint(String routeId, double lat, double lng,
                                         double accuracy, String ts, String uuid) {
        ContentValues cv = new ContentValues();
        cv.put("route_id", routeId);
        cv.put("lat", lat);
        cv.put("lng", lng);
        cv.put("accuracy", accuracy);
        cv.put("ts", ts);
        cv.put("uuid", uuid);
        getWritableDatabase().insert(T_POINTS, null, cv);
    }

    /** Najstarije neposlate tačke (FIFO), do `limit`. */
    public synchronized List<Row> oldest(int limit) {
        List<Row> out = new ArrayList<>();
        Cursor c = getReadableDatabase().query(
            T_POINTS,
            new String[]{"id", "route_id", "lat", "lng", "accuracy", "ts", "uuid"},
            null, null, null, null, "id ASC", String.valueOf(limit)
        );
        try {
            while (c.moveToNext()) {
                out.add(new Row(
                    c.getLong(0), c.getString(1), c.getDouble(2), c.getDouble(3),
                    c.getDouble(4), c.getString(5), c.getString(6)
                ));
            }
        } finally {
            c.close();
        }
        return out;
    }

    public synchronized void deletePoint(long id) {
        getWritableDatabase().delete(T_POINTS, "id = ?", new String[]{String.valueOf(id)});
    }

    public synchronized int totalCount() {
        Cursor c = getReadableDatabase().rawQuery("SELECT COUNT(*) FROM " + T_POINTS, null);
        try { return c.moveToFirst() ? c.getInt(0) : 0; } finally { c.close(); }
    }

    public synchronized int countForRoute(String routeId) {
        Cursor c = getReadableDatabase().rawQuery(
            "SELECT COUNT(*) FROM " + T_POINTS + " WHERE route_id = ?", new String[]{routeId});
        try { return c.moveToFirst() ? c.getInt(0) : 0; } finally { c.close(); }
    }

    /** Svi route_id-jevi koji imaju bar jednu neposlatu tačku (distinct). Za UI oznaku. */
    public synchronized Set<String> routeIdsWithPendingPoints() {
        Set<String> out = new HashSet<>();
        Cursor c = getReadableDatabase().rawQuery("SELECT DISTINCT route_id FROM " + T_POINTS, null);
        try {
            while (c.moveToNext()) out.add(c.getString(0));
        } finally {
            c.close();
        }
        return out;
    }

    // --- Rute koje čekaju finalize (stop je pritisnut, ali upload/finalize još nije prošao) ---

    public synchronized void markFinalize(String routeId) {
        if (routeId == null || routeId.isEmpty()) return;
        ContentValues cv = new ContentValues();
        cv.put("route_id", routeId);
        getWritableDatabase().insertWithOnConflict(T_FINAL, null, cv, SQLiteDatabase.CONFLICT_IGNORE);
    }

    public synchronized void clearFinalize(String routeId) {
        getWritableDatabase().delete(T_FINAL, "route_id = ?", new String[]{routeId});
    }

    public synchronized Set<String> pendingFinalizes() {
        Set<String> out = new HashSet<>();
        Cursor c = getReadableDatabase().query(T_FINAL, new String[]{"route_id"}, null, null, null, null, null);
        try {
            while (c.moveToNext()) out.add(c.getString(0));
        } finally {
            c.close();
        }
        return out;
    }
}
