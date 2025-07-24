# Deployment Guide

This guide covers how to deploy DeepTerm to various hosting platforms.

## Prerequisites

Before deploying, ensure you have:
- Node.js 18+ installed
- Your Google Gemini API key
- Access to your chosen hosting platform

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Required: Google Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# Optional: Analytics and Ads (replace with your own IDs)
VITE_GA_TRACKING_ID=your_ga_tracking_id
VITE_ADSENSE_CLIENT_ID=ca-pub-your-adsense-id

# Optional: App Configuration
VITE_APP_NAME=DeepTerm
VITE_APP_URL=https://yourdomain.com
```

## Vercel Deployment (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/deepterm)

### Manual Vercel Deployment

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Set Environment Variables**
   In your Vercel dashboard:
   - Go to Project Settings → Environment Variables
   - Add `VITE_GEMINI_API_KEY` with your API key
   - Add any other optional environment variables

## Netlify Deployment

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/YOUR_USERNAME/deepterm)

### Manual Netlify Deployment

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

3. **Deploy**
   ```bash
   netlify deploy --prod --dir=dist
   ```

4. **Set Environment Variables**
   In your Netlify dashboard:
   - Go to Site Settings → Environment Variables
   - Add your environment variables

## GitHub Pages Deployment

1. **Install gh-pages**
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Add deployment script to package.json**
   ```json
   {
     "scripts": {
       "deploy": "gh-pages -d dist"
     }
   }
   ```

3. **Build and deploy**
   ```bash
   npm run build
   npm run deploy
   ```

4. **Configure GitHub Pages**
   - Go to repository Settings → Pages
   - Select source as "Deploy from a branch"
   - Select "gh-pages" branch

**Note**: GitHub Pages doesn't support environment variables. You'll need to handle API keys client-side or use GitHub Actions.

## Firebase Hosting

1. **Install Firebase CLI**
   ```bash
   npm install -g firebase-tools
   ```

2. **Initialize Firebase**
   ```bash
   firebase login
   firebase init hosting
   ```

3. **Build and deploy**
   ```bash
   npm run build
   firebase deploy
   ```

## Docker Deployment

1. **Create Dockerfile**
   ```dockerfile
   FROM node:18-alpine as builder
   
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   
   COPY . .
   RUN npm run build
   
   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   
   EXPOSE 80
   CMD ["nginx", "-g", "daemon off;"]
   ```

2. **Create nginx.conf**
   ```nginx
   events {}
   
   http {
     include /etc/nginx/mime.types;
     
     server {
       listen 80;
       root /usr/share/nginx/html;
       index index.html;
       
       location / {
         try_files $uri $uri/ /index.html;
       }
     }
   }
   ```

3. **Build and run**
   ```bash
   docker build -t deepterm .
   docker run -p 80:80 deepterm
   ```

## Environment-Specific Configurations

### Production Optimizations

1. **Enable production builds**
   ```bash
   npm run build
   ```

2. **Configure CSP headers** (if using a reverse proxy)
   ```
   Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://pagead2.googlesyndication.com https://www.googletagmanager.com; connect-src 'self' https://generativelanguage.googleapis.com;
   ```

3. **Set up monitoring** (optional)
   - Error tracking (Sentry, Bugsnag)
   - Analytics (Google Analytics)
   - Performance monitoring

### Development vs Production

- **Development**: Uses `npm run dev` with hot reloading
- **Production**: Uses built static files with optimizations

## Troubleshooting

### Common Issues

1. **API Key not working**
   - Ensure the environment variable name is exactly `VITE_GEMINI_API_KEY`
   - Verify the API key is valid and has proper permissions
   - Check browser developer tools for CORS errors

2. **Build failures**
   - Clear node_modules and reinstall: `rm -rf node_modules package-lock.json && npm install`
   - Check Node.js version compatibility

3. **Routing issues on deployment**
   - Ensure your hosting platform supports SPA routing
   - Configure redirect rules for client-side routing

### Support

For deployment issues:
1. Check the [Issues](https://github.com/YOUR_USERNAME/deepterm/issues) page
2. Create a new issue with deployment details
3. Include error logs and platform information

---

**Note**: Replace `YOUR_USERNAME` and `yourdomain.com` with your actual GitHub username and domain throughout this guide.
