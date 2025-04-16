export default {
  plugins: {
    tailwindcss: {
      // Explicitly set the config path to help language servers
      config: './tailwind.config.ts',
    },
    autoprefixer: {},
  }
}
