const prod = {
  url: {
    API_URL: "https://alris-bmkl.onrender.com",
  },
};

const dev = {
  url: {
    API_URL: "http://localhost:8000",
  },
};

const config = process.env.NODE_ENV === "production" ? prod : dev;

export const API_URL = config.url.API_URL;
