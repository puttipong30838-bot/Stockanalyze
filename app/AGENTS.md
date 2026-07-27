# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

Pinned to SDK 54 (not 56 or 57) because the actual Expo Go app installed from
the App Store on the test device was version 54.0.2 — Expo Go's installed
version caps at whatever the device's iOS version last allowed the App Store
to offer, so "no update available" does not mean "on the latest SDK". Before
bumping the SDK, confirm the target device's Expo Go version first (Settings
app -> Expo Go -> Version), since Expo Go only opens projects on its own
exact SDK.
