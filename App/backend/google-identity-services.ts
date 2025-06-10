
// Declare the google.accounts namespace globally
declare global {
  namespace google {
    namespace accounts {
      namespace id {
        function initialize(config: { client_id: string; callback: (response: any) => void; auto_select?: boolean; cancel_on_tap_outside?: boolean; prompt_parent_id?: string; ux_mode?: string; }) : void;
        function renderButton(parentElement: HTMLElement, config: { theme?: string; size?: string; text?: string; shape?: string; type?: string; locale?: string; width?: string; logo_alignment?: string; });
        function prompt(): void;
      }
      namespace oauth2 {
          function initCodeClient(config: { client_id: string; scope: string; redirect_uri: string; callback: (response: any) => void; prompt?: string; });
          function initTokenClient(config: { client_id: string; scope: string; callback: (response: any) => void; prompt?: string; });
          function hasGrantedAllScopes(tokenResponse: any, ...scopes: string[]): boolean;
          function hasGrantedAnyScope(tokenResponse: any, ...scopes: string[]): boolean;
      }
    }
  }
}


let gisInitialized = false;
const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID; // Get your Google Client ID from environment variables

// Function to initialize GIS
export const initializeGIS = (callback: (response: any) => void) => {
  if (!googleClientId) {
    console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
    return;
  }

  if (!gisInitialized && typeof window !== 'undefined') {
    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: callback, // The callback function to handle the ID token response
      // Add other initialization options as needed
      // auto_select: false,
      // cancel_on_tap_outside: true,
    });
    gisInitialized = true;
    console.log("Google Identity Services initialized.");
  }
};

// Function to render the Google Sign-In button
export const renderGoogleSignInButton = (parentElementId: string, callback: (response: any) => void) => {
    if (!googleClientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
        return;
    }
     if (typeof window === 'undefined') {
         return; // Ensure this runs only on the client side
     }

    const parentElement = document.getElementById(parentElementId);
    if (!parentElement) {
        console.error(`Parent element with ID '${parentElementId}' not found.`);
        return;
    }

    google.accounts.id.renderButton(
        parentElement,
        {
            theme: "outline", // Customize the button appearance
            size: "large",
            text: "signin_with",
            shape: "rectangular",
            // Add other button configuration options
        }
    );
     google.accounts.id.initialize({
        client_id: googleClientId,
        callback: callback, // The callback function to handle the ID token response
    });
};


// Function to initiate Google Sheets OAuth 2.0 flow (Authorization Code flow recommended for backend)
export const requestSheetsAuthorization = (callback: (response: any) => void) => {
    if (!googleClientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
        return;
    }
     if (typeof window === 'undefined') {
         return; // Ensure this runs only on the client side
     }

    const sheetsScope = 'https://www.googleapis.com/auth/spreadsheets';

    // Use initCodeClient for Authorization Code flow
    const client = google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: sheetsScope,
        redirect_uri: `${window.location.origin}/api/google-sheets-oauth-callback`, // Your backend API route to handle the callback
        callback: callback, // Callback on the frontend after user interaction (less critical for code flow)
         prompt: 'consent', // Ensure the consent screen is shown
    });

    // Trigger the consent flow
    client. requestCode();
};

// Function to initiate NotebookLM OAuth 2.0 flow (Authorization Code flow)
export const requestNotebookLMAuthorization = (callback: (response: any) => void) => {
     if (!googleClientId) {
        console.error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set.");
        return;
    }
     if (typeof window === 'undefined') {
         return; // Ensure this runs only on the client side
     }

    // Replace with the correct NotebookLM API scope(s)
    const notebookLMScope = 'YOUR_NOTEBOOKLM_API_SCOPE'; // <-- Find the correct scope

    const client = google.accounts.oauth2.initCodeClient({
        client_id: googleClientId,
        scope: notebookLMScope,
        redirect_uri: `${window.location.origin}/api/notebooklm-oauth-callback`, // Your backend API route
        callback: callback, // Frontend callback
         prompt: 'consent',
    });

    client. requestCode();
};
