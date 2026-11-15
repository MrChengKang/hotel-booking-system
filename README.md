# STAY hotel booking website

React frontend with Spring Boot session authentication and live hotel/booking APIs backed by Aiven MySQL. Backend source: [MrChengKang/hotel-booking](https://github.com/MrChengKang/hotel-booking). Clone the two repositories into sibling directories for the included Compose setup.

Guest pages support English, Japanese, Traditional Chinese, Malay, Korean and French through the language menu. See [translation scope and maintenance](docs/LOCALIZATION.md). Hotel/user content stays in its original language; live payments keep the hotel's currency.

The [Admin Dashboard](docs/ADMIN.md) provides platform counts, hotel approval, a read-only account directory, reservation search and payment/refund tracking. Hosts submit drafts for review; new listings go public only after approval. Administrator creation is an opt-in backend configuration step with no default credentials.

## Deployment

Dockerfiles, a same-origin Nginx `/api` proxy, persistent-media Compose configuration, production environment templates and CI checks are ready. See [the deployment guide](docs/DEPLOYMENT.md). No cloud resources or public deployment are created automatically.

## Start

1. Start Spring Boot on port 8080 from the backend folder after configuring its private local environment files. See the backend README for MySQL setup, [Cloudinary](docs/CLOUDINARY.md) for images and [Brevo](docs/BREVO.md) for HTTPS email.
2. Run `npm ci`, then `npm run dev` here (React port 3000).
3. The API defaults to `http://localhost:8080/api`. Override `REACT_APP_API_URL` in frontend `.env.local` using `.env.example`, then restart React. Never put database or SMTP credentials in the frontend.
4. Use the same hostname (localhost or 127.0.0.1) for frontend/backend. Set explicit backend CORS origins for deployments. HTTPS with a same-origin `/api` proxy is recommended.

`npm test -- --watchAll=false` runs frontend tests; `npm run build` creates `build/`. Backend tests use H2 and mocked mail, not live Aiven orders.

## Real booking flow

- Homepage and `/hotels?city=Kuala%20Lumpur` read published hotels from `GET /api/hotels`; dated searches filter available rooms in the database before counting and pagination. Price/currency, guest capacity, beds, amenities and sorting are supported; see [hotel search](docs/HOTEL_SEARCH.md). Empty/error states never fall back to demo room IDs.
- `/hotel/<database-id>` loads the real hotel and active room types. Dates, room count and total guests trigger a live availability quote. Missing dates, closures or insufficient rooms disable Reserve.
- Anonymous users are sent to login with a validated local return path. Switching between login/register retains the intended hotel, room type, dates and party size. Logging in never creates a booking automatically.
- Reserve opens a confirmation dialog. Explicit confirmation sends the real room type ID, server quote as `expectedTotal`, and a UUID `requestKey` to `POST /api/bookings`. A changed price or stock conflict requires a new quote and another confirmation.
- Pending request IDs survive reload in tab session storage, scoped by account and booking intent. Network retries retain the same key; successful requests clear it. No passwords or auth tokens are stored there.
- `/bookings` reads only the signed-in User's orders. It shows the reference, dates, room/guest counts, real currency and CONFIRMED/CANCELLED status. Details use stored nightly price snapshots. Cancellation requires explicit confirmation and then refreshes the list; eligibility is decided by the backend hotel's local date.
- Host/Admin accounts may browse, but User-only booking actions are disabled. Session expiry clears local account state and requires sign-in again.

New reservations temporarily occupy rooms as **PENDING_PAYMENT / UNPAID** and are confirmed after Stripe sandbox payment. Unpaid holds expire only after checkout is safely closed. Historical unpaid reservations retain their prior state. Eligible paid bookings support full sandbox refunds before the hotel's local check-in date; stock is released only after verified success. Booking email is not implemented. Totals use the hotel currency and actual nightly prices; frontend demo FX factors, cleaning fees, service fees and estimated taxes are not applied to live bookings. See [refund policy and workflow](docs/REFUNDS.md).

## Hotel data is required

A published hotel, active room type, and daily inventory for every night are required. Existing demo cards are not database records and their IDs must not be used for real bookings. Use the Host Dashboard to create a hotel and room type, add photos and initialize its date range, then submit it for Admin review. Approval publishes the hotel. No accounts, hotels or orders are automatically seeded. See backend `docs/HOTEL_BOOKING_API.md` for requests and examples.

Hotel photos, descriptions, capacities, prices and statuses come from the API. The homepage destination section groups published hotels by city, shows actual counts and uploaded covers, and adapts to zero, one or multiple cities. It loads up to 12 cities through `GET /api/hotels/destinations`; these are published-listing counts, not availability for specific dates. The search suggestions share that destination response. Room collections apply real occupancy/bed filters, saved-stay planning opens the actual shortlist, and recent guest reviews use `GET /api/hotels/review-highlights`. Empty review data hides the section. Static duplicate destinations, newsletter previews and illustrative guest quotes have been removed. See [homepage data](docs/HOME_DATA.md). Host image management, real guest reviews, database favorites and the Admin review workspace are connected. Hotel Hosts manage their hotels at `/host`; Admins review submissions at `/admin`.

## Source structure

- `components/host/`: role-protected Host Dashboard, hotel/room forms, daily stock management and hotel booking lists.
- `components/admin/`: Admin overview, listing approval, account directory, booking details and refund tracking.
- `services/adminApi.js`: authorized admin queries and CSRF-protected hotel review decisions.
- `services/hostApi.js`: credentialed Host API operations with CSRF protection.
- `components/live/`: LiveHotelList, LiveHotelDetail, LiveReservation, MyBookings, request states and responsive/theme-aware styles.
- `services/apiClient.js`: shared credentialed JSON requests, CSRF-protected POSTs and session-expiry events.
- `services/hotelApi.js`: hotel, availability, reservation and booking-history requests.
- `services/authApi.js`, `context/AuthContext.jsx`: login/register/logout, session bootstrap and password reset.
- `hooks/useResource.js`: abortable loading with stale-response protection and retry.
- `hooks/useDestinationRoute.js`: pathname/query routing and browser history.
- `utils/liveBooking.js`: hotel time zones, native-currency formatting, safe login return paths and pending booking IDs.
- `components/home/`, `layout/`, `common/`: homepage, shared calendar/guest controls, navigation, modal, brand and theme.

Legacy `components/hotels/`, `components/destinations/`, `components/stays/` and demo inventory data are retained as isolated earlier UI examples/tests; App no longer routes live bookings through those components. `components/live/` is the active booking UI.

## Authentication and hosting

Registration supports User and Hotel Host. Public Admin registration is unavailable. Server sessions use HttpOnly cookies and CSRF tokens. Account data is stored in `stay_users`, separate from any older `users` table. Forgot-password email supports [Brevo HTTPS](docs/BREVO.md) or the original [Gmail SMTP](docs/GMAIL_PASSWORD_RESET.md) option.

SPA hosting must serve `index.html` for `/login`, `/register`, `/forgot-password`, `/reset-password`, `/hotels`, `/hotels/*`, `/hotel/*`, `/bookings`, `/host`, `/host/*`, `/admin` and `/admin/*`. Do not rewrite `/api` requests to the frontend. The selected language controls interface translations and date/number formatting; live prices always retain the hotel's currency.


## Hotel Host Dashboard

Host login/register defaults to `/host` and the profile menu includes Host Dashboard. Manage hotel drafts/publication/archive, room types, nightly stock and read-only orders. Overview statistics come from `GET /api/host/overview` and never label unpaid bookings as revenue. See [the Host guide](docs/HOST_DASHBOARD.md). Restart the backend for the new overview endpoint. User/Admin access is denied by the page guard and the existing backend role rules.


Login routing is role-aware: ordinary User login returns to `/`, ordinary Host login to `/host`. Stale User/Host booking-history return paths are ignored. Valid hotel reservation dates/room selections are restored for User accounts; valid Host management pages may be restored for Host accounts. Logout navigates to a clean `/login` URL without retaining the previous private page.
## 酒店圖片管理

Host 登入後到 **Host Dashboard → Photos**，選擇酒店照片或房型照片。
支援上傳 JPG／PNG、設定封面、調整順序、編輯圖片描述和確認刪除；每組最多 20 張，每張最多 5 MB。
第一張照片就是封面，前台酒店卡片與詳情相簿會使用上傳的照片。

圖片資料存於 Aiven MySQL 的 `stay_hotel_images`，檔案存於後端的 `uploads/hotel-images`。
可透過 `STAY_MEDIA_DIRECTORY` 設定固定的儲存路徑；正式部署請使用持久磁碟並備份圖片目錄。
草稿酒店與未啟用房型的照片僅擁有該酒店的 Host 能讀取。

## 個人資料與酒店收藏

登入後從帳號選單的 **My Account** 開啟 `/account`，可修改姓名、電話、城市與自我介紹。
Email 與帳號角色為唯讀；個人資料只提供給該帳號本人。

酒店卡片與詳情頁的愛心會將收藏存入 Aiven MySQL，重新整理或再次登入都會保留。
**Wishlist** 或 **Saved hotels** 會開啟 `/wishlist`，每個帳號最多收藏 200 間酒店。
已下架酒店會標示無法瀏覽，仍可移除；登出或切換帳號會立即清除畫面中的上一個帳號收藏。
後端新增的建表檔為 `004_account_favorites.sql`，API 說明請參考 Spring Boot 專案 README。

## 上傳個人頭像

到 **My Account → Profile photo** 選擇 JPG／PNG（最多 5 MB），確認預覽後按 **Upload photo**。
個人資料頁、右上角帳號按鈕及帳號選單會同步更新；**Remove photo** 可移除並恢復姓名首字母。
頭像會在重新登入後保留，僅該帳號本人能讀取。
檔案沿用後端的持久圖片目錄，資料表建置檔為 `005_account_avatars.sql`。

## 酒店評價與站內通知

住客到 **My Bookings → 訂單詳情 → Your hotel review** 留下 1–5 星與文字評價。
資格依酒店當地日期判定：未取消、且已到退房日期的本人預訂才可評價，每筆預訂一則，之後可修改。
酒店詳情頁會顯示實際平均分、評價數與 Host 回覆；Host 到 **Dashboard → Reviews** 管理回覆。

右上角鈴鐺與 `/notifications` 會顯示新預訂、取消、新評價及首次回覆的站內通知，可逐筆或全部標記已讀。
已讀狀態存於資料庫；未讀數會在操作後、頁面恢復焦點及前景每 60 秒更新。
本功能為站內通知。資料表建置檔為 `006_reviews_notifications.sql`，不會補建示例或歷史通知。

## Stripe 測試付款

已加入待付款房間保留、Stripe Hosted Checkout、Webhook 簽章驗證、付款狀態同步與逾期庫存釋放。
完整設定、狀態流程與作品集展示方式請看 [付款設定說明](docs/PAYMENTS.md)。

建立 Stripe Sandbox 後，在 **後端** `.env.local` 填入測試 Secret Key 與 Webhook Secret，再啟動 Stripe CLI listener 並重啟 Spring Boot。
尚未設定金鑰時，畫面會清楚顯示付款未設定；不會把模擬結果當成 Stripe 已完成付款。
既有未付款訂單保留原狀。已付款預訂可依取消政策申請全額 Stripe 測試退款，成功後才取消並恢復庫存；不包含 Host 分帳或真實金流。詳見 [取消與退款](docs/REFUNDS.md)。


## Optional portfolio demo catalogue

A manual, idempotent [demo importer](docs/DEMO_DATA.md) can add 16 fictional hotels in eight cities, two room types per hotel, 90 days of inventory and locally stored stock photos. All demo listings are explicitly labelled. One Demo Host owns the catalogue; its initial login details stay in the ignored backend `.env.demo-host.local` file. Normal application startup never seeds this data.


## Remember me

Login offers an optional 30-day remembered login through an HttpOnly signed cookie. Session-only login remains the default. A stable backend-only `STAY_REMEMBER_ME_KEY` has been prepared locally. See [behavior, configuration and security scope](docs/REMEMBER_ME.md).
