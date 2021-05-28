module.exports = {
  'env': {
    'browser': true,
    'es2021': true,
  },
  'extends': [
    'google',
  ],
  'parserOptions': {
    'ecmaVersion': 12,
  },
  'plugins': [
    'html',
  ],
  'rules': {
    'max-len': [2, 80, 4, {
      'ignoreTrailingComments': true,
      'ignoreUrls': true,
    }],
  },
};
