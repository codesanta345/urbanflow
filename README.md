# UrbanFlow

Static HTML, CSS, and JavaScript traffic-management dashboard.

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New Project** and import the repository.
3. Set **Root Directory** to `urbanflow` if the repository contains the parent `software` folder.
4. Use these project settings:
	- **Framework Preset:** Other
	- **Build Command:** leave empty
	- **Output Directory:** `.`
	- **Install Command:** leave empty
5. Click **Deploy**.

The site entry point is `index.html`. The included `vercel.json` enables clean URLs for the static pages.

### Deploy with Vercel CLI

From the `urbanflow` directory, run:

```powershell
npx vercel
```

Follow the prompts to log in, link or create a project, and deploy. For a production deployment, run:

```powershell
npx vercel --prod
```