/**
 * Contact Widget Settings Page
 * 
 * Phase 2: CMS Admin UI
 * - Configure Floating Contact Widget (Hotline, Zalo, Messenger)
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ContactWidgetForm } from './components/ContactWidgetForm';

export default function ContactWidgetSettingsPage() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt Nút Liên hệ Nổi</h1>
        <p className="text-gray-600 mt-2">
          Cấu hình nút liên hệ cố định (Hotline, Zalo, Messenger) hiển thị trên website
        </p>
      </div>

      {/* Contact Widget Form */}
      <ContactWidgetForm />
    </div>
  );
}

