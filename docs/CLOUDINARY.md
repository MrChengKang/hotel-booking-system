# Cloudinary 圖片儲存

酒店、房型照片和 Avatar 共用這個儲存層。React 仍使用原有 API，不需要 Cloudinary SDK、unsigned upload preset 或任何 API Secret。

## 本機設定

後端 `local` profile 會依序載入 `.env.local` 與 `.env.cloudinary.local`。後者只放 Cloudinary 設定，已被 Git 與 Docker 忽略。不要把設定加到 React 的 `.env`。

在 Cloudinary Console 的 **Settings → API Keys** 找到 Cloud name、API Key、API Secret，填入後端 `.env.cloudinary.local`：

```properties
STAY_MEDIA_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=你的cloud_name
CLOUDINARY_API_KEY=你的api_key
CLOUDINARY_API_SECRET=你的api_secret
STAY_CLOUDINARY_PREFIX=stay
```

請填入實際值，不加引號。這是 Java properties 檔；若值包含反斜線，須使用 properties 跳脫規則。範本是 `cloudinary.env.example`。啟用 cloudinary 但缺少 credentials 時，後端會明確拒絕啟動。未啟用時，本機仍使用 local 儲存。

填好後重啟後端，新上傳的照片與 Avatar 就會存入 Cloudinary。已存雲端的圖片會依自己的 storage key 讀取，不會在雲端故障時偷偷改存本機。`Cloud name` 與 prefix 決定資產位置，上傳後不要任意更換；不同專案可使用不同 prefix。

## 權限與檔案限制

- 由後端驗證登入、Host 擁有權、CSRF，以及每個 hotel/room 的 20 張限制，再上傳。
- 維持 JPG／PNG、原始檔 5 MB、最大 6000 × 6000／25 megapixels，解碼並重新編碼，移除夾帶內容與原始 metadata。
- Cloudinary 使用 `authenticated` delivery type。後端以短效簽章下載原圖，完成原有權限檢查後回傳 bytes。API Secret 與簽名下載 URL 都不會回傳給 React。
- 未發布酒店的照片仍只讓擁有者／Admin 讀取；Avatar 保留原有的本人讀取規則。更換、刪除或交易失敗時，沿用原有的儲存清理流程。
- 每次網路請求有 60 秒逾時、回應大小上限及固定 Cloudinary endpoint；錯誤回傳通用訊息，不包含供應商回應或密鑰。
- DB 儲存的 `cld-<uuid>.jpg/png` 小於現有 50 字元欄位上限，**不需 schema migration**。

這個版本優先維持原有權限，所以圖片流量經過後端，不是瀏覽器直接讀公共 CDN；展示流量可以先使用。之後若要減少後端流量，可另做公開酒店照片的 CDN delivery，Avatar／草稿仍須保留存取控制。

## 搬移現有照片（部署前完成）

設定完成不會自動搬移舊檔案。舊 storage key 仍從 `uploads/hotel-images` 讀取。免費主機的暫存磁碟不能保存這些舊檔，**上線前須完成下面的搬移**。

1. 保留 SQL 與 uploads 的備份。
2. 停止平常開發用的 Spring Boot，搬移期間不要操作上傳、更換、刪除照片。搬移工具會自行啟動一個臨時本機服務，完成即結束，使用既有 `.env.local` 的資料庫設定，停用排程、付款與 Admin bootstrap，只驗證 schema。
3. 從後端根目錄，先預覽數量（不修改資料庫或 Cloudinary）：

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/migrate-cloudinary.ps1
   ```

4. 確認 `.env.cloudinary.local` 的設定與備份後，執行：

   ```powershell
   powershell -ExecutionPolicy Bypass -File tools/migrate-cloudinary.ps1 -Apply
   ```

   需要 Java 21+ 和 Maven wrapper 可正常使用；第一次執行可能下載 Maven／plugin。

5. 工具每張先上傳 `authenticated` 資產、讀回並比對完整 bytes，才在同一筆 DB transaction 更新酒店／Avatar storage key。使用固定 public ID 與 `overwrite=false`；可重跑，已更新的雲端參照會略過。某張失敗保留原 DB 參照及本機檔案，結果會顯示 `failed`，修好後重試。
6. **不會刪除本機原檔**；完成後啟動平常後端，確認搜尋封面、詳情、Host 照片、Avatar 都正常。酒店圖片網址與 Avatar token 保持相同。確認 `legacy=0` 後，才將免費主機的檔案磁碟視為可丟棄。

上傳成功但 DB 更新失敗可能留下未被使用的雲端資產，重跑會使用同一 public ID 並重新驗證。刪除清理若遇到網路錯誤會記錄不含密鑰的警告，需日後在 Cloudinary Media Library 對照 DB 清理；不要整個 prefix 批次刪除。

## 正式主機環境變數

使用相同的 `STAY_MEDIA_PROVIDER=cloudinary`、`CLOUDINARY_CLOUD_NAME`、`CLOUDINARY_API_KEY`、`CLOUDINARY_API_SECRET`、`STAY_CLOUDINARY_PREFIX`，填在 **後端服務的 Secrets/Environment**，不可填入 `REACT_APP_*`、Docker build arguments 或 GitHub。

Cloudinary 模式不需要持久磁碟；`prod` 不會載入本機 `.env` 檔。原有 Compose 的 local disk 設定仍保留給本機／付費磁碟方案，切換 cloudinary 後不依賴它保存新圖片。

## 驗證

隔離測試涵蓋簽章上傳／讀取／刪除、失敗與回應大小限制、Cloudinary 模式的酒店與 Avatar HTTP API 權限、搬移的 byte verification 和 DB rollback。測試使用本機假 Cloudinary 與 H2，**不使用帳戶密鑰或修改真實 Aiven**。真實帳號仍需填入密鑰後做上傳、讀取、刪除驗證。

官方資料：[Upload API](https://cloudinary.com/documentation/image_upload_api_reference)、[認證簽章](https://cloudinary.com/documentation/authentication_signatures)。

## 本次接入驗證（2026-11-15）

- 完整後端回歸 167 項通過；另外新增 4 MB 大圖讀回測試，並重新驗證 Cloudinary 與搬移測試。
- 真實帳號已完成臨時 PNG 的上傳、完整內容讀回與刪除。
- 原有 85 張圖片（83 張酒店／房型照片、2 張 Avatar）已上傳並逐張比對原始 bytes，再更新 DB 參照；所有本機原檔保留。
- 較大的 PNG 曾碰到暫時讀回失敗，安全搬移保留原參照並重試完成；圖片請求的總逾時調整為 60 秒。

本機 credentials 放在被忽略的 `.env.cloudinary.local`，公開範本保持空白。之後直接啟動／重啟平常使用的 Spring Boot，即可載入新的 Cloudinary 設定。
