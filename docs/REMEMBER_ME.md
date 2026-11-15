# Remember me

The login form offers an unchecked-by-default **Remember me** choice, with a fixed
30-day lifetime. Registration and older API clients remain session-only. The login
request accepts an optional JSON boolean `rememberMe`; no password, session token
or remember-me value is stored in browser localStorage/sessionStorage.

The backend uses Spring Security's SHA-256 `TokenBasedRememberMeServices`. Its
`STAY_REMEMBER_ME` cookie is HttpOnly, host-only, SameSite=Lax, and Secure on secure
requests (or when the existing `SESSION_COOKIE_SECURE=true` setting forces it).
It contains a signed account identifier/expiry, not the password or password hash.
Its expiry is fixed from login, not extended on each request.

When the ordinary session cookie disappears or its in-memory session expires, a
valid remember cookie reloads the account and its current roles from the database.
A fresh session ID, password-version marker and CSRF state are created before
saving authentication. This preserves the normal session-fixation and password
reset protections. All mutations still require a valid CSRF token.

Signing configuration belongs only in the **backend** `.env.local`:

```dotenv
STAY_REMEMBER_ME_KEY=<at-least-32-random-characters>
```

A random stable key has been prepared for the local backend. Keep it private and
use the same value across restarts/instances in a deployment. Generate a different
value for an independent environment. If absent, development can start with a
random per-boot key; remembered logins then expire on server restart. Replacing a
configured key invalidates existing remember cookies. No database migration is
needed for this signed-cookie approach.

Logout clears both the current browser's remember cookie and its session. Logging
in with the checkbox unchecked, or registering a different account, also removes
any previous remember cookie. Resetting an account's password invalidates its old
signed cookies and password-version-protected sessions.

This uses signed bearer cookies, not a server-side per-device token registry:
logging out does not revoke a separately copied cookie on another device. Password
changes or key rotation invalidate those tokens. Per-device session management can
be added separately if the platform needs it.

Integration tests use isolated H2 accounts to check all three roles, session-cookie
loss, subsequent restored requests, logout/CSRF, opt-out, omitted flags, tampering,
signed expiry, signing-key mismatch, HTTPS cookie attributes and password reset.
See [Spring Security's remember-me documentation](https://docs.spring.io/spring-security/reference/servlet/authentication/rememberme.html).
