# 📚 Test Cases Catalogue

> Tổng hợp toàn bộ bộ test hiện có trong codebase (`src/**/__tests__`). Mục đích: tra cứu nhanh phạm vi kiểm thử, edge-cases và nơi bổ sung test khi mở rộng.

## Mục lục

| #   | File                                                          | Đối tượng kiểm thử                                     | Các nhánh/Trường hợp chính                                                                                                                                              |
| --- | ------------------------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `core/helpers/__tests__/http-response.constructor.spec.js`    | `HttpResponse` – constructor, `toObject()`, `toJSON()` | • Tạo instance success/error<br/>• Snapshot `toObject()`<br/>• `toJSON` giữ nguyên nội dung                                                                             |
| 2   | `core/helpers/__tests__/http-response.factories.spec.js`      | `HttpResponse.success/error/paginated` factories       | • Giá trị trả về & `success` flag<br/>• Metadata paginated                                                                                                              |
| 3   | `core/helpers/__tests__/http-response.send.spec.js`           | `HttpResponse.send()`                                  | • Forward status<br/>• Ảnh hưởng config `USE_STATUS_CODE_IN_RESPONSE` & `SET_DEFAULT_HTTP_STATUS_CODE`<br/>• Throw khi `res` invalid                                    |
| 4   | `core/helpers/__tests__/wrap-controller.spec.js`              | `wrapController()`                                     | • Plain object → 200<br/>• Return `HttpResponse` → gửi as-is<br/>• Throw `HttpResponse`/`BaseException` → forward `next(err)`<br/>• Throw `Error` → `next(err)`<br/>• STRICT_CONTROLLER_RETURN → `next(BaseException)`<br/>• Chặn/cho phép `res.send()` |
| 5   | `core/middlewares/__tests__/error-handler.middleware.spec.js` | `globalErrorHandler` middleware                        | • Nhận `HttpResponse` (gửi trực tiếp)<br/>• Nhận `BaseException` (chuyển thành `HttpResponse.error`)<br/>• 500 unknown error<br/>• headersSent |

## Cấu trúc thư mục test - core

```
src/
  core/
    helpers/test-core.helper.js   ← Test utilities chung
    helpers/__tests__/...
    middlewares/__tests__/...
```

## Sử dụng test utilities

```js
import {
  createMockNext,
  createMockRes,
  resetHttpOptions,
} from 'src/core/helpers/test-core.helper.js';
```

## Quy ước Snapshot (❗ đọc kỹ)

Snapshot (`__snapshots__/*.snap`) lưu giá trị **tĩnh** để đảm bảo refactor không thay đổi output:

1. Chỉ snapshot object đã **ổn định** cấu trúc (DTO, shape output) – tránh snapshot dữ liệu có timestamp, id ngẫu nhiên …
2. Khi test thất bại do snapshot khác, **đừng vội update**. Kiểm tra xem thay đổi có chủ đích hay bug.
3. Nếu thay đổi có chủ đích, chạy `pnpm test -u` để Jest ghi đè snapshot mới.
4. Tránh lạm dụng: snapshot lớn/khó đọc sẽ che giấu lỗi. Ưu tiên matcher tường minh (`toEqual`, `toMatchObject`) khi có thể.

## Thêm / cập nhật test

1. Đặt file `.spec.js` trong thư mục `__tests__` cùng module.
2. Luôn `jest.clearAllMocks()` & `resetHttpOptions()` trong `afterEach` nếu test tác động config.
3. Cập nhật import util nếu di chuyển file.

---

Test chạy: `pnpm test` | Coverage: `pnpm test -- --coverage`
