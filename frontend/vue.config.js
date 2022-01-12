module.exports = {
  "transpileDependencies": [
    "vuetify"
  ],
  devServer: {
    disableHostCheck: true
  },
  pwa: {
    workboxPluginMode: "InjectManifest",
    workboxOptions: {
      swSrc: "src/service-worker.js",
    },
    iconPaths: {
      favicon32: 'favicon.ico',
      favicon16: null,
      appleTouchIcon: null,
      maskIcon: null,
      msTileImage: null
    },
    manifestOptions: {
      name:"stsui",
      short_name:"stsui",
      theme_color:"#4DBA87",
      icons: [       
      ]
    }
  }
}