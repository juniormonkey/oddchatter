/* eslint-disable */
module.exports = {
  plugins: [
    require('autoprefixer'),
    require('postcss-font-magician'),
    require('postcss-nested-import'),
    require('postcss-custom-properties'),
    require('cssnano')({
      preset: 'default'
    }),
  ],
};
