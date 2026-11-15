# Render + Vercel 部署

這個方案使用 Vercel Hobby 前端、Render Free 後端，沿用 Aiven MySQL、Cloudinary 與 Brevo。付款維持 Stripe Sandbox。Render 閒置後會休眠，第一次請求可能需要較長時間；免費方案限制以平台當時顯示為準。

## 網址與登入

瀏覽器只呼叫前端的 `/api`。`vercel.ts` 在部署時讀取 `STAY_BACKEND_ORIGIN`，將 `/api/*` 代理到 Render 的 `/api/*`，並替登入、酒店與管理頁面設定深層網址路由。登入 Cookie 保持同源、Secure、HttpOnly、SameSite=Lax。

| 平台 | 環境變數 | 值 |
| --- | --- | --- |
| Vercel | `REACT_APP_API_URL` | `/api` |
| Vercel | `STAY_BACKEND_ORIGIN` | Render 的 HTTPS origin，不含 `/api` 或結尾斜線 |
| Vercel | `GENERATE_SOURCEMAP` | `false` |
| Render | `APP_FRONTEND_URL` | Vercel 正式站的 HTTPS origin，不含結尾斜線 |

Vercel 使用 Node 24、`npm ci --no-audit --no-fund`、`npm run build`、輸出目錄 `build`。修改環境變數後需要重新部署。不要把後端密鑰放在 Vercel 或任何 `REACT_APP_*` 變數中。

## Render Blueprint

後端 repository 的 `render.yaml` 建立一個 Singapore 的 Free Docker web service，健康檢查為 `/api/health`，採用 production profile、3 條資料庫連線、Cloudinary 圖片與 Brevo HTTPS 郵件。沒有附加付費磁碟或資料庫。

1. 先推送前後端設定至 GitHub，確認 CI 通過。
2. 在既有 workspace 建立獨立 Blueprint，選擇後端 repository、`main`、`render.yaml`。
3. 檢查建立預覽，再核准套用。不要選擇接管其他專案的服務。
4. 只在 Render 的環境設定中填入下列值；不要提交到 Git：

   - `APP_FRONTEND_URL`
   - `SPRING_DATASOURCE_URL`、`SPRING_DATASOURCE_USERNAME`、`SPRING_DATASOURCE_PASSWORD`
   - `CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`
   - `BREVO_API_KEY`、`BREVO_SENDER_EMAIL`

JDBC URL 必須使用 TLS，例如 `sslMode=REQUIRED`。若採用 `VERIFY_CA` 或 `VERIFY_IDENTITY`，也要配置對應 truststore。使用目前已有資料的 schema；production 的 `ddl-auto=validate` 不會建立資料表。不要直接複製 Java properties 的跳脫字元作為平台環境值。

Blueprint 會產生穩定的 remember-me key。Admin bootstrap 預設關閉；沿用既有資料庫帳號。圖片須已搬到 Cloudinary，不依賴 Render 的暫存磁碟。

## 啟用 Sandbox 付款

目前 Blueprint 已啟用 Sandbox 付款，需要兩個 Stripe secrets。若第一次部署尚未設定公開 webhook，先把 `render.yaml` 的 `STAY_PAYMENTS_ENABLED` 改成 `false`，驗證服務與公開網址後，再設定付款：

1. 在 Stripe Sandbox 建立公開 webhook，URL 為 `https://實際Render網址/api/payments/webhook`。
2. 選擇 `checkout.session.completed`、`checkout.session.expired`、`checkout.session.async_payment_succeeded`、`checkout.session.async_payment_failed`、`refund.created`、`refund.updated`、`refund.failed`。
3. 在 Render 填入 `STRIPE_SECRET_KEY` 和該公開 endpoint 的 `STRIPE_WEBHOOK_SECRET`。本機 `stripe listen` 的 signing secret 不適用。
4. 確認後端 repository 的 `render.yaml` 中 `STAY_PAYMENTS_ENABLED` 為 `true`，推送並同步 Blueprint。這個設定由 Blueprint 管理，不能只改 Dashboard 而保留 YAML 的 `false`。
5. 用測試卡完成一筆預訂，確認 webhook、訂單狀態與符合期限的退款流程。只使用測試金鑰。

## 上線驗證

先等待 Render 的 `/api/health` 回應 `200 {"status":"UP"}`，再從前端專案執行：

```powershell
npm run check:hosting
npm run check:deployment -- https://實際Vercel正式網址
```

Render 休眠時，可先開啟健康檢查網址等待喚醒，再執行 HTTP 檢查。還要從正式 HTTPS 網址驗證登入、Remember me、搜尋、照片、Host/Admin 權限、忘記密碼信與 Sandbox 付款。密碼重設與付款返回連結都應指向正式前端網址。

公開作品集需要讓訪客能開啟正式站；Vercel 的 Deployment Protection 設定需由帳號擁有者確認。Preview 若使用另一個 origin，並不會自動加入後端的 CORS 白名單。

## 參考

- [Render Blueprint 設定](https://render.com/docs/blueprint-spec)
- [Vercel 程式化設定](https://vercel.com/docs/project-configuration/vercel-ts)
- [Vercel 環境變數](https://vercel.com/docs/environment-variables)
- [Docker／自有主機部署](DEPLOYMENT.md)
