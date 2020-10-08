import express from 'express';
import request from 'superagent';
import keytar from 'keytar';
import open from 'open';
import { AddressInfo } from 'net';
import { KeytarName } from './lib/Config';

interface OAuth2Credentials {
  /** The name of the OAuth2 service. */
  ServiceID: string;
  /** The client ID of the OAuth2 application. */
  ClientID: string;
  /** The client secret from the OAuth2 application. */
  ClientSecret: string;
  /** The authentication scope. */
  Scope: string | string[];
  /** The authentication URL to navigate the user to. */
  AuthURL: string;
  /** The url to `POST` the auth code to, for retreiving the access token data. */
  TokenURL: string;
  /** Any additional query-string paramaters to send to the Auth URL location. */
  AdditionalParams?: Record<string, string>;
  /** Send the token POST request as JSON or `x-www-form-url-encoded */
  SendAsJSON?: boolean;
  /** The platform key being targeted. */
  Platform: string;
}

export interface OAuth2Token {
  /** The token to transmit. */
  access_token: string;
  /** The expiry time in seconds. */
  expires_in: number;
  /** The refresh token to submit. */
  refresh_token: string;
  /** The scope of the authentication. */
  scope: string;
  /** The authorization token type. */
  token_type: 'Bearer';
  /** The timestamp of when the token will expire. */
  expiry: number;
  /** The platform this key is for */
  platform: string;
}

export class OAuth2 {
  private token: OAuth2Token | null = null;
  private port: number = 0;
  constructor(private props: OAuth2Credentials) {
    this.props = { SendAsJSON: true, ...props };
  }

  private get RedirectURI() {
    return `http://localhost:${this.port}/auth`;
  }

  private get Scopes() {
    return Array.isArray(this.props.Scope)
      ? this.props.Scope.join(' ')
      : this.props.Scope;
  }

  private get AuthURL() {
    const { AuthURL, ClientID } = this.props;
    return `${AuthURL}?client_id=${ClientID}&scope=${
      this.Scopes
    }&response_type=code&redirect_uri=${this.RedirectURI}${
      this.props.AdditionalParams
        ? `&${Object.entries(this.props.AdditionalParams)
            .map(([key, val]) => `${key}=${val}`)
            .join('&')}`
        : ''
    }`;
  }

  public async GetAccessToken() {
    const store = await keytar.getPassword(KeytarName, this.props.ServiceID);

    if (store != null) {
      try {
        const history = JSON.parse(store);
        this.token = history as OAuth2Token;
        if (!this.TokenExpired) {
          return this.token;
        } else {
          return this.RefreshToken(history as OAuth2Token);
        }
      } catch (e) {
        console.error(e);
        return null;
      }
    } else {
      return this.GetAuthToken();
    }
  }

  public get TokenExpired(): boolean {
    return true;

    // Check that the token doesn't expire within 10 minutes.
    // return (
    //   this.token != null && this.token.expiry < Date.now() - 10 * 60 * 1000
    // );
  }

  private GetAuthToken(): Promise<OAuth2Token | null> {
    return new Promise(async (r) => {
      try {
        const app = express();
        app.get('/auth', (req, res) => {
          res.send(`
          <html>
            <head>
              <style>
                html, body {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 0;
                }
    
                div {
                  width: 100%;
                  height: 100%;
                  margin: 0;
                  padding: 40px 0 0 0;
                  text-align: center;
                  background-color: #ccc;
                  font-size: 20px;
                }
              </style>
            </head>
            <body>
              <div>Success! You can close this tab now.</div>
            </body>
          </html>
          `);
          onSuccess(req.query.code as string);
        });

        const server = app.listen();
        this.port = (server.address() as AddressInfo).port;

        await open(this.AuthURL);
        console.log(
          `Please check your browser to provide the necessary authorization. If it didn't open, please copy the below link into your browser:`
        );
        console.log('');
        console.log(`\t${this.AuthURL}`);
        console.log('');

        const onSuccess = async (code: string) => {
          server.close();
          const { TokenURL, ClientID, ClientSecret } = this.props;
          const body = {
            code,
            client_id: ClientID,
            client_secret: ClientSecret,
            grant_type: 'authorization_code',
            redirect_uri: this.RedirectURI,
            scope: this.Scopes,
          };

          try {
            const response = await request
              .post(TokenURL)
              .type(this.props.SendAsJSON ? 'json' : 'form')
              .send(body);

            this.token = {
              ...response.body,
              expiry: Date.now() + response.body.expires_in * 1000,
              platform: this.props.Platform,
            };

            await keytar.setPassword(
              KeytarName,
              this.props.ServiceID,
              JSON.stringify(this.token)
            );

            r(this.token);
          } catch (e) {
            console.error('Something went wrong.');
            console.error(e);
            console.error('');
            console.error('Sent the following body:');
            console.error(body);
            r(null);
          }
        };
      } catch (e) {
        console.error(e);
      }
    });
  }

  private async RefreshToken(token: OAuth2Token) {
    const { TokenURL, ClientID, ClientSecret } = this.props;
    const body = {
      client_id: ClientID,
      client_secret: ClientSecret,
      grant_type: 'refresh_token',
      refresh_token: token.refresh_token,
    };

    try {
      const response = await request
        .post(TokenURL)
        .type(this.props.SendAsJSON ? 'json' : 'form')
        .send(body);

      const store = await keytar.getPassword(KeytarName, this.props.ServiceID);
      const history = JSON.parse(store!);

      const { refresh_token, access_token, expires_in } = response.body;

      this.token = {
        ...history,
        refresh_token: refresh_token ?? history.refresh_token,
        access_token,
        expiry: Date.now() + expires_in * 1000,
      };

      await keytar.setPassword(
        KeytarName,
        this.props.ServiceID,
        JSON.stringify(this.token)
      );

      return this.token;
    } catch (e) {
      console.error('Something went wrong.');
      console.error(e);
      console.error('');
      console.error('Sent the following body:');
      console.error(body);
      return null;
    }
  }

  /** Test if the user is logged in (has credentials already stored in the keychain). */
  public async LoggedIn() {
    const d = await keytar.getPassword(KeytarName, this.props.ServiceID);
    return d != null;
  }

  /** Log out from the API, and delete the locally stored key. */
  public Logout() {
    this.token = null;
    return keytar.deletePassword(KeytarName, this.props.ServiceID);
  }
}
