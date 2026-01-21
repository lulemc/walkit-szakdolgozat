module.exports = function (api) {
  api.cache(true);

  return {
    presets: [["babel-preset-expo"]],

    plugins: [
      ["react-native-paper/babel"],
      require.resolve("expo-router/babel"),
      [
        "module-resolver",
        {
          root: ["./"],

          alias: {
            "@": "./",
            "tailwind.config": "./tailwind.config.js",
          },
        },
      ],
    ],
  };
};
