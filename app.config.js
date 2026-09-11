import 'dotenv/config';

export default {
    expo: {
        name: "ureboque-client",
        slug: "ureboque-client",
        scheme: "ureboque-client",
        version: "1.0.0",
        newArchEnabled: true,
        assetBundlePatterns: [
            "**/*"
        ],
        plugins: [
            [
                "expo-image-picker",
                {
                    "photosPermission": "The app accesses your photos to let you share them with your friends."
                }
            ],
            [
                "expo-location",
                {
                    "locationAlwaysAndWhenInUsePermission": "This app uses your location during an active roadside assistance service, including when the screen is locked."
                }
            ],
            "expo-asset",
            "expo-font",
            "expo-splash-screen",
            "expo-status-bar",
            "./plugins/withAndroidGoogleMapsEnv",
            [
                "@sentry/react-native",
                {
                    "organization": "ureboque",
                    "project": "client"
                }
            ]
        ],
        android: {
            permissions: [
                "android.permission.RECORD_AUDIO",
                "android.permission.ACCESS_FINE_LOCATION",
                "android.permission.ACCESS_COARSE_LOCATION",
                "android.permission.ACCESS_BACKGROUND_LOCATION"
            ],
            package: "com.ureboque.client"
        },
        ios: {
            bundleIdentifier: "com.ureboque.client",
            buildNumber: "1.0.0",
            supportsTablet: false,
            config: {
                googleMapsApiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
            },
            infoPlist: {
                NSLocationWhenInUseUsageDescription: "This app uses location to find nearby towing services and track your current location.",
                NSLocationAlwaysAndWhenInUseUsageDescription: "This app uses location to find nearby towing services and track your current location."
            }
        },
        extra: {
            eas: {
                projectId: "cc5066c3-fb2c-4e58-a5bc-f080a0b08b69"
            }
        },
        owner: "joseazevedojsm"
    }
};
