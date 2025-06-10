# TASM_mobile
Natural language search app for scientific information
Here's a summary of the manual steps I'll take before writing the code:

Initialize React Native Project:

I will run npx react-native init ScholarChatMobile.
Then, I will navigate into the newly created directory with cd ScholarChatMobile.
Install Dependencies:

I will install the necessary packages using npm: npm install @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context react-native-keychain @react-native-firebase/app @react-native-firebase/auth @react-native-google-signin/google-signin lucide-react-native react-native-gesture-handler.
For iOS, I will navigate into the ios directory, run pod install, and then return to the project root with cd ios && pod install && cd ...
Manual Android Firebase Setup Required:

Add google-services.json: You will need to download your project's google-services.json file from the Firebase console and place it in ScholarChatMobile/android/app/.
Configure android/build.gradle (project-level): You'll need to ensure the Google services classpath is added:
buildscript { /* ... */ dependencies { /* ... */ classpath 'com.google.gms:google-services:4.4.1' /* Or latest */ } }
Configure android/app/build.gradle (app-level): You'll need to apply the Google services plugin:
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services' // Add this
SHA-1 Fingerprints: You will need to add your SHA-1 fingerprints to the Firebase Android app settings.
Web Client ID: You should note your Web Client ID from google-services.json or the Google Cloud Console.
