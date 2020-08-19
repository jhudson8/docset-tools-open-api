const plugin = require("../dist/index");

module.exports = {
  docsetIdentifier: "test",
  plugins: [
    {
      plugin,
      options: {
        json: require("./petstore.json"),
      },
    },
  ],
};
