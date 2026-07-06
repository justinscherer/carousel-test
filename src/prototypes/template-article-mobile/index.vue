<script setup lang="ts">
definePage({
  meta: {
    title: 'Template: Article (mobile, read mode)',
    description: 'Article read-mode template using the Minerva (mobile) skin.',
  },
})

import ArticleLive from '@/components/article/ArticleLive.vue'
import ChromeWrapper from '@/components/chrome/ChromeWrapper.vue'
import MobileWrapper from '@/components/MobileWrapper.vue'
</script>

<template>
  <MobileWrapper>
    <ChromeWrapper skin="mobile">
      <main>
        <ArticleLive article="Wet Leg" skin="mobile" />
      </main>
    </ChromeWrapper>
  </MobileWrapper>
</template>

<style scoped>
main {
  padding: 0 var(--spacing-100);
}
</style>
