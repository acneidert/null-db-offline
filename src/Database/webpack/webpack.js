const clientWebpack = (client) => {
  return function clientWP(...args) {
    const config = client(...args);
    config.resolve.fallback = {
      util: false,    crypto: false,
      timers: false,  process: false,
      stream: false,  zlib: false,
      url: false,     buffer: false,
      net: false,     tls: false,
    };
    return config;
  }
} 

module.exports =  clientWebpack
