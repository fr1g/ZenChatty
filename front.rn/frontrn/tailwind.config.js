/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{tsx, ts, jsx, js}", "./App.tsx", "./index.ts", "./components/**/*.{js,jsx,ts,tsx}", "./pages/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset"), require('./nativecn-preset')],
  theme: {
    extend: {},
  },
  plugins: [],
}

