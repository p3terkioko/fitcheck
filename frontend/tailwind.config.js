/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  safelist: [
    // Verdict colors — dynamic classes must be safelisted to survive purge
    'text-[#00C4A1]', 'bg-[#00C4A1]/10', 'border-[#00C4A1]', 'border-[#00C4A1]/30',
    'text-[#F59E0B]', 'bg-[#F59E0B]/10', 'border-[#F59E0B]', 'border-[#F59E0B]/30',
    'text-[#F04E4E]', 'bg-[#F04E4E]/10', 'border-[#F04E4E]', 'border-[#F04E4E]/30',
    'text-[#8B5CF6]', 'bg-[#8B5CF6]/10', 'border-[#8B5CF6]', 'border-[#8B5CF6]/30',
    'border-l-[#00C4A1]', 'border-l-[#F04E4E]',
  ],
  theme: {
    extend: {
      colors: {
        bg:       '#0F1117',
        card:     '#1A1D27',
        elevated: '#21263A',
        border:   '#2D3350',
        accent:   '#00C4A1',
        'text-primary':   '#F0F2F5',
        'text-secondary': '#8B92A5',
        verdict: {
          backed:      '#00C4A1',
          partly:      '#F59E0B',
          unsupported: '#F04E4E',
          unclear:     '#8B5CF6',
        },
      },
      fontFamily: {
        heading: ['Satoshi', 'system-ui', 'sans-serif'],
        body:    ['Satoshi', 'system-ui', 'sans-serif'],
        mono:    ['Satoshi', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '8px',
        xl: '12px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
}
