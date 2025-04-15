export const isDesktop = (): boolean => {
  if (typeof window === "undefined") return true;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];

  const isLargeScreen = window.innerWidth >= 1024;

  const isNotMobile = !mobileKeywords.some((keyword) =>
    userAgent.includes(keyword)
  );

  const isNotTablet = !(
    userAgent.includes("ipad") ||
    (userAgent.includes("android") && !userAgent.includes("mobile"))
  );

  return isLargeScreen && isNotMobile && isNotTablet;
};

export const redirectToHome = () => {
  window.location.href = "/";
};
