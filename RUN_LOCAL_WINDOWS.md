# Windows quick start

### 1. Put the project here

`C:\101dunyasi.com`

Avoid OneDrive for runtime data while testing.

### 2. Install

```powershell
npm.cmd install
```

### 3. First run

```powershell
npm.cmd run dev
```

Open:

`http://localhost:3000/setup`

Create your own Webmaster login.

### 4. If the browser says setup is already complete on a disposable local copy

Stop the server and run:

```powershell
npm.cmd run reset:local
npm.cmd run dev
```

Then open:

`http://localhost:3000/setup`

### 5. First radio test

Log in as Webmaster or assign a DJ role to a user. Open the DJ Studio, allow microphone access, and press **Yayını Başlat**.

Listeners can press **Dinlemeyi Başlat** in the radio player. The source card in the chat shows whether audio comes from the live DJ or automatic radio.
