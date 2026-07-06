<script setup lang="ts">
definePage({
  meta: {
    title: 'Template: Article (mobile, read mode)',
    description: 'Article read-mode template using the Minerva (mobile) skin.',
  },
})

import { ref } from 'vue'

import ArticleLive from '@/components/article/ArticleLive.vue'
import { fetchRandomArticle } from '@/components/article/shared/randomArticle'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import MobileWrapper from '@/components/MobileWrapper.vue'

const articleHost = ref('en.wikipedia.org')
const articleTitle = ref('Wet Leg')
const loadingRandomArticle = ref(false)

async function handleLogoClick(event: MouseEvent) {
  // Tapping the wordmark loads a random article in a random language instead
  // of navigating home — skip the RouterLink's default "/" navigation.
  event.preventDefault()
  if (loadingRandomArticle.value) return
  loadingRandomArticle.value = true
  try {
    const random = await fetchRandomArticle()
    articleHost.value = random.host
    articleTitle.value = random.title
  } catch (err) {
    console.error('[ProtoWiki] random article fetch failed', err)
  } finally {
    loadingRandomArticle.value = false
  }
}
</script>

<template>
  <MobileWrapper>
    <ChromeWrapper skin="mobile" @logo-click="handleLogoClick">
      <main>
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
