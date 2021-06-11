/* eslint-disable */
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-font-magician'),
    require('postcss-nested-import'),
    require('postcss-css-variables'),
    require('cssnano')({
      preset: 'default'
    }),
  ],
};
