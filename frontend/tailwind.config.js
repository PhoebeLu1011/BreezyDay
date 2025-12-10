export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // <--- 這行最重要，少了它 Tailwind 就不會工作
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}