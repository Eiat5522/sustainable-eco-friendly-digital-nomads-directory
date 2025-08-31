module.exports = {
  groq: (strings, ...values) => {
    let result = '';
    strings.forEach((str, i) => {
      result += str + (values[i] ?? '');
    });
    return result;
  },
};
