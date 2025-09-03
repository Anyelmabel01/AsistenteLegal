/** @type {import('next').NextConfig} */
const nextConfig = {
  // SOLUCIÓN DEFINITIVA: Deshabilitar SSR completamente
  // output: 'export', // Disabled - incompatible with API routes
  trailingSlash: true,
  
  // Optimize for production
  experimental: {
    optimizePackageImports: ['@ant-design/icons'],
  },
  
  // Enable webpack optimization
  webpack: (config, { dev, isServer }) => {
    // Ignore ONNX Runtime binaries for webpack
    config.resolve.alias = {
      ...config.resolve.alias,
      'onnxruntime-node': false,
      'onnxruntime-web': false,
    };

    // Ignore binary files that can't be processed by webpack
    config.module.rules.push({
      test: /\.node$/,
      use: 'ignore-loader',
    });

    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }
    
    return config;
  },
  
  // Performance optimizations
  compress: true,
  
  // Skip linting during build (temporary fix)
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Headers for caching - disabled for static export
  // async headers() {
  //   return [
  //     {
  //       source: '/(.*)',
  //       headers: [
  //         {
  //           key: 'Cache-Control',
  //           value: 'public, max-age=31536000, stale-while-revalidate',
  //         },
  //       ],
  //     },
  //   ];
  // },
};

module.exports = nextConfig;