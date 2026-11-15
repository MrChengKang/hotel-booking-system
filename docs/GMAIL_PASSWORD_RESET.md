# Gmail 忘記密碼設定

1. 在 Google 帳號開啟兩步驟驗證，再建立應用程式密碼：[Google 官方說明](https://support.google.com/accounts/answer/185833)。部分學校／公司帳號可能不提供這項功能。
2. 開啟後端 `C:\Users\cheng\hotel-booking\.env.local`，保留既有 Aiven 設定，在最下面加入：

   ```properties
   SPRING_MAIL_USERNAME=你的完整Gmail地址
   SPRING_MAIL_PASSWORD=你的Google應用程式密碼
   APP_FRONTEND_URL=http://localhost:3000
   ```

   使用 Google 顯示的應用程式密碼並移除顯示用的空格；不要使用日常登入 Gmail 的密碼，也不要把密碼貼到聊天或提交 Git。

3. 重新啟動 Spring Boot，開啟 React 登入頁，點選 **Forgot password?**。
4. 輸入已在 STAY 註冊的 Email，到收件匣／垃圾郵件開啟重設連結。連結有效 15 分鐘，成功使用一次後即失效。若要重寄，請至少等一分鐘。
5. 重設後使用新密碼重新登入，舊的登入狀態會在下一次受保護的請求時失效。

程式預設使用 `smtp.gmail.com:587`、STARTTLS 和寄信逾時限制。設定缺少時會顯示尚未設定寄信的訊息。Email 有無註冊都會得到相同的正常提示；如果一直收不到信，請檢查 Gmail 設定和後端 SMTP 錯誤記錄。

重設流程只操作 `stay_users` 與 `stay_password_reset_tokens`，不使用 Aiven 舊專案的 `users` 表。自動測試使用 H2 與模擬郵件，未寄出真實 Gmail 郵件。正式網站請將 `APP_FRONTEND_URL` 改成 HTTPS 網址，並更新 CORS、Cookie 和反向代理設定。
