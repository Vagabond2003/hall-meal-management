export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/dashboard/:path*', '/student/:path*', '/profile/:path*', '/admin/:path*'],
};
