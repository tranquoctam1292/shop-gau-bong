import { redirect } from 'next/navigation';

/**
 * Account page - redirects to profile
 * Since account has sub-routes (profile, addresses), we redirect to profile
 */
export default function AccountPage() {
  redirect('/account/profile');
}

