/* eslint-disable */
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-font-magician'),
    require('postcss-nested-import'),
    require('cssnano')({
      preset: 'default'
    }),
  ],
};