# Brevo HTTPS 寄信





重設密碼可選擇 Brevo HTTPS API 或原有 Gmail SMTP。Render Free 封鎖 SMTP 連接埠，因此部署到該方案時使用 Brevo。





## Brevo 帳號設定





1. 在 **Settings → Senders, Domains, IPs → Senders** 建立寄件者，From name 使用 `STAY`，From email 使用你能收信並驗證的地址，完成驗證。


2. 在 **Settings → SMTP & API → API Keys & MCP** 建立一把 API Key。Access 選 Restricted，將 Transactional email 設成 All，其他資源保持 None；這個資源目前沒有 Read/write 等級，Read 無法寄信。使用標準 API Key。


3. 若帳戶顯示尚未啟用 Transactional email、寄件者未驗證或其他審核提示，先按 Brevo 的提示完成。API Key 正確不代表帳戶已允許寄信。





使用 Gmail 等免費寄件地址時，Brevo 可能以合規地址代換 From；正式展示若有自己的網域，應依 Brevo 指引認證網域與寄件者。先以自己的收件地址測試實際送達與垃圾郵件夾。





## 本機設定（後端）





編輯後端 **`.env.brevo.local`**，不是 `brevo.env.example`：





```properties


STAY_MAIL_PROVIDER=brevo


BREVO_API_KEY=你的APIKey


BREVO_SENDER_EMAIL=已驗證的寄件信箱


BREVO_SENDER_NAME=STAY


```





不加引號，不要貼到聊天，不要填在 React 的 `.env`。本機 properties 檔的反斜線要依 Java properties 語法跳脫。





`local` profile 依序載入 `.env.local`、`.env.cloudinary.local`、`.env.brevo.local`。三份本機檔都被 Git／Docker 忽略，`prod` 不載入它們。未設定時 `STAY_MAIL_PROVIDER` 預設 `smtp`，保留既有 Gmail 本機流程；選 `brevo` 後只使用 HTTPS，不會因 API 出錯而偷偷改走 SMTP。





如果選 Brevo 但缺少 Key 或合法寄件信箱，忘記密碼 API 回傳通用的設定未完成訊息（503），與帳戶是否存在無關。provider 拼錯時後端會拒絕啟動。





`APP_FRONTEND_URL` 仍從原有設定讀取，本機一般是 `http://localhost:3000`；正式主機必須設成實際 HTTPS 前端 origin，否則信裡的連結會指向錯誤網站。改好設定後重啟平常的 Spring Boot。





## 程式行為





- 固定向 `https://api.brevo.com/v3/smtp/email` 發送 JSON，API Key 只存在後端 header。


- 使用單一收件者、純文字內容，維持原來的 `/reset-password#token=...` 連結。


- HTTP 連線逾時 5 秒、整體請求 15 秒、回應上限 64 KB，不跟隨 redirect。


- 只有 `201` 且回傳 `messageId` 才確認 API 接受。API 接受不等於已送進收件匣，須確認 Brevo Transactional logs 和實際郵件。


- 不自動重試，避免逾時但已接受的請求造成重複寄送。使用者可以等原有 60 秒 cooldown 後再次申請。


- 保留 15 分鐘有效、一次性、只存 token hash、CSRF、密碼更新後舊 session／remember-me 失效等既有規則。


- 供應商錯誤只記錄通用訊息及 HTTP 狀態，不記錄 Key、收件地址、reset token、簽名連結或完整供應商回應；公開回應維持一致，避免透露帳戶是否存在。


- 沒有新增對外的任意寄信 API，不需資料庫 schema 變更。





## 正式主機





在後端 Secrets/Environment 設 `STAY_MAIL_PROVIDER=brevo`、`BREVO_API_KEY`、`BREVO_SENDER_EMAIL`、`BREVO_SENDER_NAME`，並確認 `APP_FRONTEND_URL` 正確。不要把秘密放進 `REACT_APP_*` 或 Docker build arguments。





如果啟用了 Brevo API IP 限制，新主機的出口 IP 可能被擋，請依帳戶的安全提示處理。一般錯誤方向：`401/403` 檢查 API Key、權限、帳戶和 IP 限制；`400` 檢查 Sender／帳戶允許的參數；`429` 檢查額度與速率。





## 驗證順序





1. 隔離測試使用本機假 API／H2，不寄真信；驗證 payload、設定切換、失敗隱私、逾時、無重試、無 redirect、回應大小及一次性 token 行為。


2. 填好設定後，先明確指定自己的收件地址，寄一封不含真實 reset token 的連線測試信。此步只驗證 API 與寄件者，不改任何帳戶密碼。


   也可從後端根目錄手動寄一封測試信，請把地址換成自己的信箱：





   ```powershell


   powershell -ExecutionPolicy Bypass -File tools/send-brevo-test.ps1 -To your-address@example.com


   ```





   需要 Java 21+ 與 Maven wrapper。這個指令沒有讀寫資料庫，不會產生真實 reset token；只確認 Brevo 接受後，再自行檢查是否收到。





3. 收到測試信後，在網頁用自己的現有帳戶執行 Forgot password，確認收到連結、更新密碼、舊連結失效及新密碼登入。不要用他人的地址做測試。


4. 上線後再從正式網址重測，確認寄信連結使用正式 HTTPS origin。





官方文件：[寄信 API](https://developers.brevo.com/reference/send-transac-email)、[建立寄件者](https://help.brevo.com/hc/en-us/articles/208836149-Create-a-new-sender-From-name-and-From-email)、[API Keys](https://help.brevo.com/hc/en-us/articles/209467485-Create-and-manage-your-API-keys)、[免費寄件地址限制](https://help.brevo.com/hc/en-us/articles/14925263522578-Comply-with-Gmail-Yahoo-and-Microsoft-s-requirements-for-email-senders)。




## 本次程式驗證



後端完整回歸 181 項通過，另已重新執行 API Key header 防護與 Brevo HTTP 測試；實際後端打包、Java 測試寄信工具編譯及 PowerShell 語法驗證均通過。



隔離測試使用本機假 Brevo API 與 H2。2026-11-16 已使用真實帳號，向使用者明確指定的測試信箱發送一封不含 reset token 的連線測試信，Brevo 回傳 HTTP 201 接受。使用者已確認收到測試信；測試未修改帳戶密碼或資料庫。平常的 Spring Boot 需重啟後才會載入新的 Brevo 設定。

