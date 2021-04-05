import sourcemaps from 'rollup-plugin-sourcemaps';

const config = {
  input: 'dist/index.js',
  plugins: [sourcemaps()],
  output: {
    file: 'dist/index.cjs',
    format: 'cjs',
    sourcemap: true,
  },
};

export default config;
