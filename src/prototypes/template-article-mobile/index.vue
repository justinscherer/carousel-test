<script setup lang="ts">
definePage({
  meta: {
    title: 'Template: Article (mobile, read mode)',
    description: 'Article read-mode template using the Minerva (mobile) skin.',
  },
})

import { onMounted, ref } from 'vue'
import { CdxProgressBar } from '@wikimedia/codex'

import ArticleLive from '@/components/article/ArticleLive.vue'
import { fetchRandomArticleWithGallery } from '@/components/article/shared/randomArticle'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import MobileWrapper from '@/components/MobileWrapper.vue'

const articleHost = ref('')
const articleTitle = ref('')
const loadingRandomArticle = ref(false)

async function loadRandomArticle() {
  if (loadingRandomArticle.value) return
  loadingRandomArticle.value = true
  try {
    const random = await fetchRandomArticleWithGallery()
    articleHost.value = random.host
    articleTitle.value = random.title
  } catch (err) {
    console.error('[ProtoWiki] random article fetch failed', err)
  } finally {
    loadingRandomArticle.value = false
  }
}

function handleLogoClick(event: MouseEvent) {
  // Tapping the wordmark loads a random article in a random language instead
  // of navigating home — skip the RouterLink's default "/" navigation.
  event.preventDefault()
  void loadRandomArticle()
}

// Same random-article-with-gallery gate runs on first load, not just on
// logo taps — there's no hardcoded starting article anymore.
onMounted(() => {
  void loadRandomArticle()
})
</script>

<template>
  <MobileWrapper>
    <ChromeWrapper skin="mobile" @logo-click="handleLogoClick">
      <CdxProgressBar
        v-if="loadingRandomArticle"
        inline
        aria-label="Finding a random article with enough images for the gallery"
      />
      <main v-if="articleTitle">
        <ArticleLive :article="articleTitle" :host="articleHost" skin="mobile" />
      </main>
    </ChromeWrapper>
  </MobileWrapper>
</template>

<style scoped>
main {
  padding: 0 var(--spacing-100);
}
</style>
