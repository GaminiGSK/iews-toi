# Google Drive Integration Setup

Your application is now configured to store document uploads (MOC, Tax, etc.) on **Google Drive** instead of local disk. This ensures files are accessible from any device (Laptop 1, Laptop 2, etc.).

## 1. Enable Google Drive API
1. Go to [Google Cloud Console](https://console.cloud.google.com/).
2. Select your project (`iews-toi`).
3. Go to **APIs & Services > Library**.
4. Search for "**Google Drive API**" and click **Enable**.

## 2. Configure Authentication (Cloud Run)
Since you are deployed on Cloud Run, the easiest way is to use the **Service Account**.

1. Go to **Cloud Run > Your Service > Security**.
2. Note the **Service Account** email used by the service (often `Default Compute Service Account` or a custom one).
3. Go to **IAM & Admin > IAM**.
4. Find that Service Account.
5. In your **Google Drive** (the actual user account), **Create a Folder** (e.g., "IEWS Documents").
6. **Share** that folder with the Service Account email (give "Editor" access).
7. Copy the **Folder ID** from the URL (the bit after `/folders/...`).

## 3. Set Environment Variable
1. In Cloud Run, click **Edit & Deploy New Revision**.
2. Under **Variables & Secrets**, add a new Environment Variable:
   - Name: `GOOGLE_DRIVE_FOLDER_ID`
   - Value: `[Paste your Folder ID here]`
3. **Deploy**.

## 4. Local Development (Laptop)
To test this locally (on your Windows/Mac laptop):
1. Create a Service Account Key (JSON) in GCP Console.
2. Download it as `service-account.json` into your `server/` folder.
3. Add to `server/.env`:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=service-account.json
   GOOGLE_DRIVE_FOLDER_ID=[Your Folder ID]
   ```
   *(Note: Do not commit `service-account.json` to Git!)*

## How it Works
- When you upload a file, the server tries to upload it to Google Drive.
- If successful, it saves `drive:[FILE_ID]` in the database.
- When viewing, the server streams the file securely from Drive to your browser.
- If Drive fails (no key found), it falls back to Local Storage (visible only on that device).
