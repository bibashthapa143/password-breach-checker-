# Password Checker

Simple Next.js app that checks:
1. Password strength (length, upper/lowercase, numbers, symbols)
2. Whether the password has appeared in a known data breach (using the free haveibeenpwned.com API)

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000

## How the breach check works (safely)

Your real password is never sent anywhere. The app:
1. Hashes your password with SHA-1 in the browser
2. Sends only the first 5 characters of that hash to the API
3. The API sends back all hashes that start with those 5 characters
4. The app checks locally if your full hash is in that list

This is called "k-anonymity" and it's the same method password managers like 1Password use.

## Files

- `app/page.js` — all the logic (strength check + breach check)
- `app/layout.js` — basic page wrapper
- `package.json` — dependencies
