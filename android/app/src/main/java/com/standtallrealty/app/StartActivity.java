package com.standtallrealty.app;

import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsetsController;
import android.widget.FrameLayout;
import android.widget.ImageView;

import com.google.androidbrowserhelper.trusted.LauncherActivity;

/**
 * Opens the app: shows the Stand Tall Realty logo for about a second, then the website full screen.
 * The logo shows on every phone, whichever browser it uses. Links (for example from WhatsApp)
 * and shortcuts skip the wait and open straight away.
 *
 * The website is told this app's version and where it was installed from (app_v, app_src), so it
 * can offer "Update the app" when a newer version is on the website. Apps installed from Google
 * Play are updated by Play, and the website shows them no update message.
 */
public class StartActivity extends LauncherActivity {
    private static final long LOGO_MILLIS = 1000;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Runnable openWebsite = this::launchTwa;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (isFinishing()) return;          // the app was already open, or it is closing
        if (getIntent().getData() != null) {
            launchTwa();
            return;
        }
        ImageView logo = new ImageView(this);
        logo.setImageResource(R.drawable.splash);
        logo.setScaleType(ImageView.ScaleType.CENTER);
        logo.setContentDescription(getString(R.string.app_name));
        FrameLayout screen = new FrameLayout(this);
        screen.setBackgroundColor(getResources().getColor(R.color.navy, getTheme()));
        screen.addView(logo, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.MATCH_PARENT));
        setContentView(screen);
        lightIconsOnNavy();
        handler.postDelayed(openWebsite, LOGO_MILLIS);
    }

    @Override
    protected Uri getLaunchingUrl() {
        Uri url = super.getLaunchingUrl();
        String host = url.getHost();
        if (!"https".equalsIgnoreCase(url.getScheme()) || host == null
                || !(host.equalsIgnoreCase("www.standtallrealty.com") || host.equalsIgnoreCase("standtallrealty.com"))) {
            return url;
        }
        return url.buildUpon()
                .appendQueryParameter("app_v", String.valueOf(BuildConfig.VERSION_CODE))
                .appendQueryParameter("app_src", installedFromPlay() ? "play" : "web")
                .build();
    }

    @SuppressWarnings("deprecation")
    private boolean installedFromPlay() {
        try {
            PackageManager pm = getPackageManager();
            String installer = Build.VERSION.SDK_INT >= 30
                    ? pm.getInstallSourceInfo(getPackageName()).getInstallingPackageName()
                    : pm.getInstallerPackageName(getPackageName());
            return "com.android.vending".equals(installer);
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    protected boolean shouldLaunchImmediately() {
        return false;
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(openWebsite);
        super.onDestroy();
    }

    /** White status bar and navigation icons, so they show on the navy logo screen. */
    private void lightIconsOnNavy() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController bars = getWindow().getInsetsController();
            if (bars != null) {
                bars.setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS
                        | WindowInsetsController.APPEARANCE_LIGHT_NAVIGATION_BARS);
            }
        } else {
            View decor = getWindow().getDecorView();
            decor.setSystemUiVisibility(decor.getSystemUiVisibility()
                    & ~(View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR));
        }
    }
}
