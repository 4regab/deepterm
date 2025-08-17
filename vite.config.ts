import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate chunk for heavy utilities
          'file-processing': ['@/utils/fileProcessing', '@/utils/docxProcessor'],
          // Separate chunk for AI services
          'ai-services': ['@/services/geminiService', '@/services/quizGenerator'],
          // Separate chunk for UI components
          'ui-components': ['lucide-react'],
          // Separate vendor chunks
          'vendor-utils': ['uuid', 'dompurify'],
          'vendor-charts': ['html2canvas'],
        },
      },
    },
    // Performance optimizations
    minify: 'esbuild',
    sourcemap: false,
    reportCompressedSize: false,
  },
}));
