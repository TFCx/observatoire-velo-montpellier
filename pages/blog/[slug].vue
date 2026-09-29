<template>
  <ContentFrame
    v-if="article"
    header="Article"
    :title="article.title"
    :description="article.description"
    :image-url="article.imageUrl"
  >
    <ContentRenderer :value="article" />
  </ContentFrame>
</template>

<script setup>
const { path } = useRoute();
const { withoutTrailingSlash } = useUrl();

const { data: article } = await useAsyncData(`article-${path}`, () => {
  return queryCollection('blog').path(withoutTrailingSlash(path)).first();
});

if (!article.value) {
  const router = useRouter();
  router.push({ path: '/404' });
}

useShareImage(article.value.imageUrl);
useHead({
  title: article.value.title,
  meta: [
    // description
    { name: 'description', content: article.value.description },
    { property: 'og:description', content: article.value.description },
    { name: 'twitter:description', content: article.value.description },
  ],
});
</script>
