import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/firebase-admin'; // Your Firebase Admin SDK initialization
import { google } from 'googleapis';
import { requestSheetsAuthorization } from '@/lib/google-sheets-auth'; 

export async function POST(req: NextRequest) {
    try {
      // 1. Verify User Authentication using Firebase ID Token
      const authHeader = req.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
      const idToken = authHeader.split(' ')[1];
      const uid = decodedToken.uid;
      const userEmail = decodedToken.email;
      
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(idToken);
      } catch (error) {
        console.error("Error verifying ID token:", error);
        return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
      }
  
      const uid = decodedToken.uid;
      const userEmail = decodedToken.email; // Access user info from the token

          // 2. Get Data from Request Body
    const { overallSummary, articles, query } = await req.json();

    if (!overallSummary) {
       return NextResponse.json({ success: false, error: 'No data provided for export' }, { status: 400 });
    }

    // 3. Get Google Sheets Auth Client for the User
    // This function needs to retrieve the user's stored Google Sheets credentials (access/refresh tokens)
    const authClient = await getGoogleSheetsAuthClient(uid); // Implement getGoogleSheetsAuthClient

    if (!authClient) {
      return NextResponse.json({ success: false, error: 'Google Sheets authorization not found for user. Please authorize.' }, { status: 400 });
    }

    // 4. Initialize Google Sheets API client with the user's credentials
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    // 5. Prepare data for Google Sheets
    const dataToWrite: any[][] = [];
    dataToWrite.push(['Query', query || 'N/A']);
    dataToWrite.push(['Overall Summary', overallSummary]);
    dataToWrite.push([]); // Empty row
    dataToWrite.push(['Articles', '']); // Header

    articles.forEach((article: any) => {
      dataToWrite.push(['', `Title: ${article.title}`]);
      dataToWrite.push(['', `Link: ${article.link}`]);
      dataToWrite.push(['', `Summary: ${article.summary || "Not available."}`]);
      dataToWrite.push([]); // Empty row for separation
    });
    let spreadsheetId;
    // Option A: Create a new spreadsheet for each export (simpler for demo)
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Scholar Data Export - ${new Date().toISOString().split('T')[0]}`,
        },
      },
    });
    spreadsheetId = spreadsheet.data.spreadsheetId!;
    const sheetName = 'Results'; // Default sheet name for a new sheet
       // 7. Write the data to the sheet
       await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${sheetName}!A1`, // Start at A1
        valueInputOption: 'USER_ENTERED', // Or 'RAW'
        requestBody: {
          values: dataToWrite,
        },
      });
  
      const sheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}`;
      console.log(`Data successfully written to sheet: ${sheetName} in spreadsheet: ${spreadsheetId}`);

    // 8. Send Success Response
    return NextResponse.json({ success: true, message: 'Data exported to Google Sheets successfully!', spreadsheetId, sheetUrl });

  } catch (error: any) {
    console.error("Error in export-to-sheets API route:", error);
    // Handle different error types more specifically if needed
    if (error.message.includes('Unauthorized')) {
       return NextResponse.json({ success: false, error: 'Authentication failed.' }, { status: 401 });
    }
    if (error.message.includes('Google Sheets authorization not found')) {
        return NextResponse.json({ success: false, error: error.message }, { status: 400 }); // Use 400 for client-side issue
    }
    return NextResponse.json({ success: false, error: error.message || 'An internal server error occurred.' }, { status: 500 });
  }
}

// You do NOT need the default export handler function for App Router
// export default async function handler(req: NextApiRequest, res: NextApiResponse) { ... }
