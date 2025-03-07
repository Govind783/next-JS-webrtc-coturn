/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  env: {
    TURN_USER_NAME: process.env.TURN_USER_NAME,
    TURN_PASSWORD: process.env.TURN_PASSWORD,
  },
};

export default nextConfig;
