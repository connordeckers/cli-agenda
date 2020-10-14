# cli-agenda
A calendar application for the Linux terminal.

# Prereqs
- NodeJS (tested on `Node v14.13.1`)
- Some form of keychain tool (tested with `gnome-keyring` and `archlinux-keyring`)

# Configuration
You will need to create an API key for each desired platform (Google OAuth and Microsoft Graph), and add those credentials to `src/credentials/{service}.json`.
Ensure that no specific port is provided when using `http://localhost` as the callback url; a random one will be generated each OAuth request, and will be provided to the OAuth2 request.

## Example
```jsonc
/* Google OAuth2 credentials */
{
  "installed": {
    "client_id": "xxxxxxx",
    "project_id": "xxxxxxx",
    "client_secret": "xxxxxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "redirect_uris": [
      "http://localhost",
      "urn:ietf:wg:oauth:2.0:oob"
    ]
  }
}
```