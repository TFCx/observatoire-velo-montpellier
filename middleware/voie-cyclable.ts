const { getLineIdRegex } = useUrl();
export default defineNuxtRouteMiddleware(to => {
  const voieCyclableRegex = getLineIdRegex();
  const isVoieCyclableValid = voieCyclableRegex.test(to.fullPath);
  if (!isVoieCyclableValid) {
    return navigateTo('/404');
  }
});
