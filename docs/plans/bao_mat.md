BÁO CÁO ĐÁNH GIÁ BẢO MẬT DỰ ÁN NEXT.JS (DEPLOY PRODUCTION)

1. Tổng quan tình trạng

Dựa trên cấu trúc dự án (sử dụng Next.js App Router, dữ liệu địa lý hardcode lớn, cấu hình eslint cơ bản), dự án đang ở mức bảo mật Trung bình. Cần bổ sung các lớp bảo vệ HTTP Header và quản lý dữ liệu chặt chẽ hơn trước khi deploy.

2. Ma trận phân tích rủi ro & Khuyến nghị

Hạng mục

Mức độ nghiêm trọng

Vấn đề phát hiện/Tiềm ẩn

Giải pháp khắc phục

HTTP Headers

Cao

Thiếu cấu hình Security Headers trong next.config.js. Dễ bị tấn công XSS, Clickjacking.

Thêm headers() vào next.config.js (X-DNS-Prefetch-Control, X-Frame-Options, X-Content-Type-Options).

Dữ liệu (Data)

Trung bình

Các file dữ liệu địa lý (Xã/Phường) rất lớn được import trực tiếp. Gây lộ thông tin cấu trúc và tăng dung lượng bundle, dễ bị DoS do tải chậm.

Chuyển dữ liệu hành chính sang Database hoặc file JSON tĩnh tải qua API (Lazy load). Không import trực tiếp vào Client Component.

Input Validation

Cao

Cần kiểm tra kỹ các API route xử lý form.

Sử dụng thư viện Zod hoặc Yup để validate dữ liệu đầu vào tại Server Action/API Route.

XSS (Blog)

Cao

Phần Blog (app/(blog)/posts) nếu có render HTML từ Markdown/CMS.

Sử dụng dompurify hoặc sanitize-html nếu dùng dangerouslySetInnerHTML.

Metadata

Thấp

File metadata.ts đang cấu hình tốt cho SEO, nhưng cần cẩn thận lộ API Key nếu import sai biến môi trường.

Đảm bảo SITE_CONFIG không chứa secret keys. Chỉ dùng biến NEXT_PUBLIC_ cho client.

3. Phân tích chi tiết & Mã nguồn khắc phục

3.1. Cấu hình HTTP Security Headers

Hiện tại file cấu hình mặc định chưa có các headers bảo mật. Bạn cần cập nhật file next.config.js (hoặc .mjs):

// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options', // Chống Clickjacking
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options', // Chống MIME Sniffing
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig;


3.2. Quản lý dữ liệu lớn (Dữ liệu Xã/Phường)

Trong full_code_context.txt, tôi thấy các object JSON khổng lồ chứa dữ liệu phường xã (ví dụ: districtId: "972").

Rủi ro: Nếu import file này vào Client Component, kích thước JS bundle sẽ tăng vọt, làm chậm trang web và dễ bị bot khai thác làm quá tải băng thông.

Khắc phục: Tạo một API endpoint để lấy dữ liệu này thay vì import cứng.

Ví dụ Code tối ưu (Server Side Only):

// app/api/locations/wards/route.ts
import { NextResponse } from 'next/server';
// Giả sử data được tách ra file JSON riêng trong folder server
import wardsData from '@/data/wards.json'; 

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const districtId = searchParams.get('districtId');

  if (!districtId) return NextResponse.json([]);

  const filtered = wardsData.filter(w => w.districtId === districtId);
  return NextResponse.json(filtered);
}


3.3. Bảo vệ Biến môi trường (.env)

Kiểm tra file .env trên server production.

Nguyên tắc: Không bao giờ commit .env lên git.

Phân tách:

NEXT_PUBLIC_API_URL: Được phép lộ ở client.

DB_PASSWORD, SECRET_KEY: Tuyệt đối không có tiền tố NEXT_PUBLIC_.

3.4. Content Security Policy (CSP)

Đây là lớp bảo vệ mạnh nhất chống lại XSS. Thêm vào next.config.js hoặc Middleware.

Cấu hình tối thiểu (Middleware):

// middleware.ts
import { NextResponse } from 'next/server';

export function middleware(request) {
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    block-all-mixed-content;
    upgrade-insecure-requests;
`;

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('Content-Security-Policy', cspHeader.replace(/\s{2,}/g, ' ').trim());

  return NextResponse.next({
    headers: requestHeaders,
    request: {
      headers: requestHeaders,
    },
  });
}


4. Checklist trước khi Deploy Production

[ ] Audit Dependencies: Chạy lệnh npm audit để tìm các lỗ hổng trong thư viện bên thứ 3.

[ ] Tắt Source Maps: Trong next.config.js, đặt productionBrowserSourceMaps: false để người dùng không xem được code gốc.

[ ] Rate Limiting: Nếu sử dụng Vercel, cấu hình file vercel.json để giới hạn request/giây cho các API route, tránh DDoS.

[ ] Error Handling: Đảm bảo trang error.tsx hoặc global-error.tsx không hiển thị stack trace chi tiết ra giao diện người dùng (chỉ log ở server).