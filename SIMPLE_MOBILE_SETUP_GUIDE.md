# Simple Mobile Setup Guide for DocClear

Follow these 4 simple steps to run your app publicly and install it on your phone:

---

## Step 1: Download & Open Ngrok

* **Download link:** [https://ngrok.com/download](https://ngrok.com/download) *(Click "Download for Windows")*
* Unzip the downloaded file and double-click **`ngrok.exe`** to open the ngrok black terminal window.
  *(Note: `ngrok.exe` is already downloaded and ready in your `Downloads` folder and project folder!)*

---

## Step 2: Run the Commands

You need **two terminal windows**:

### 1. In your first terminal (start DocClear):
```powershell
cd docclear
npm run dev
```
*(Your app is now running on port 3000)*

### 2. In your Ngrok terminal (make it public):
Type this command and press Enter:
```powershell
ngrok http 3000
```

---

## Step 3: Open on Your Phone

1. In the ngrok window, find the line that says **`Forwarding`**:
   `https://xxxx-xx-xx.ngrok-free.app -> http://localhost:3000`
2. Copy that **`https://...`** URL.
3. Send this link to your phone (via WhatsApp, email, or type it in).
4. Open the link in **Chrome** (Android) or **Safari** (iPhone).
5. If a blue ngrok page appears, tap the blue button: **"Visit Site"**.

Your DocClear app will now load live on your phone!

---

## Step 4: Install as an App on Your Phone (PWA)

You can turn DocClear into a real app on your phone's home screen:

### On Android (Chrome):
1. Tap the **three dots menu (⋮)** in the top right corner of Chrome.
2. Tap **"Install app"** (or **"Add to Home screen"**).
3. Tap **Install**.

### On iPhone (Safari):
1. Tap the **Share button** (the square with an arrow pointing up) at the bottom.
2. Scroll down and tap **"Add to Home Screen"**.
3. Tap **Add**.

---

### That's it!
* The **DocClear app icon** will appear on your phone's home screen.
* Tap the icon anytime to open DocClear in full screen without the browser address bar!
* Camera scanning, OCR, speech, and sensors will work directly on your phone.
