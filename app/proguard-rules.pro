# ProGuard optimization rules
-dontwarn android.webkit.**
-keepattributes *Annotation*
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
