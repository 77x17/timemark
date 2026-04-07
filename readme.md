# Project Timemark
## Mobile applications

Ở đây tôi dùng **Expo** để phát triển ứng dụng chụp ảnh và đính kèm gồm địa điểm và thời gian thực tế khi bức ảnh được chụp.
Qua đó, các bức ảnh sẽ được chèn thêm các overlay bao gồm:
* Branding
* Footer: Icon, Personal Information
* QR
* Watermark

Chạy mobile debug: **npx expo start**

## Web applications

Ở đây tôi sẽ phát triển fullstack một hệ thống giúp ghi nhận các ảnh được chụp từ nhiều địa điểm khác nhau, qua đó tracking lại thời gian và vị trí mà người đó đã di chuyển.
Dùng database để lưu trữ lại các bức ảnh và thông tin.
Thể hiện thông tin lên một bản đồ để quản lý.

### Frontend
* React
npx create-react-app web/frontend -> npm install -> npm start

* Leaflet / react-leaflet
npm install leaflet react-leaflet

06-04-26: Khởi động đã gặp bug giữa các phiên bản, bị version conflict, dependency, environment bug
npm install react@18.2.0 react-dom@18.2.0
npm install react-leaflet@4.2.1 leaflet@1.9.4

07-04-26: Refactor code

Chạy frontend: **npm start**

### Backend
* Node.js
* Express.js
* jsQR fail -> ZXing vì éo decode được.
* Multer (upload file)
* Sharp (convert image)
* cors: Cross-Origin-Resource Sharing: Chia sẻ tài nguyên đa nguồn gốc
npm init -y --> npm install express multer ~~jsqr~~ @zxing/library sharp cors
* nodemon: Tự động restart server khi sửa code.

Chạy backend: **npm run dev**

npm install -D nodemon

Thêm Authentication (Xác thực - Login/Register) để Authorization (Ủy quyền - Xác định quyền truy cập)

### Database
* MongoDB

### Kiến trúc hệ thống
Frontend (React) - upload image -> Backend (Express) - decode QR, parse JSON, save MongoDB, return data -> Frontend - render map + marker -

