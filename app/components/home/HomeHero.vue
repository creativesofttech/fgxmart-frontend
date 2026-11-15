<template>
  <section ref="hero" class="home-hero" aria-labelledby="hero-title">
    <div class="hero-art">
      <img
        src="/assets/images/home/hero-banner.webp"
        alt="A selection of packed food, clothing, electronics and kitchen essentials"
        width="2170" height="725" fetchpriority="high" decoding="async"
      />
    </div>
    <div class="hero-blend" aria-hidden="true" />
    <div class="hero-container">
    <div class="hero-copy">
      <p class="hero-eyebrow" data-hero-reveal><span /> WELCOME TO FGX MART</p>
      <h1 id="hero-title" data-hero-reveal>Your everyday<br />shopping destination<span class="title-dot">.</span></h1>
      <p class="hero-description" data-hero-reveal>From pantry staples to lifestyle favourites.<br class="desktop-break" /> Find a little of everything, all in one place.</p>
      <div class="hero-categories" data-hero-reveal>
        <span>Packed food</span><span>Clothing</span><span>Electronics</span><span>Kitchen essentials</span>
      </div>
      <div class="hero-action" data-hero-reveal>
        <motion.div :while-hover="{ y: -3 }" :while-press="{ scale: 0.98 }">
          <NuxtLink class="tw:btn tw:btn-secondary hero-cta" to="/products">
            Explore the catalogue <ArrowRight :size="18" aria-hidden="true" />
          </NuxtLink>
        </motion.div>
      </div>
      <p class="hero-note" data-hero-reveal><FileDown :size="15" aria-hidden="true" /> Pick your products. Download your list. Enquire.</p>
    </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { motion } from 'motion-v'
import { animate, createScope, stagger, type Scope } from 'animejs'
import { ArrowRight, FileDown } from 'lucide-vue-next'

const hero = useTemplateRef<HTMLElement>('hero')
let scope: Scope | undefined

onMounted(() => {
  if (!hero.value) return
  scope = createScope({ root: hero.value, mediaQueries: { reducedMotion: '(prefers-reduced-motion: reduce)' } }).add((self) => {
    if (self.matches.reducedMotion) return
    animate('[data-hero-reveal]', { opacity: [0, 1], y: [18, 0], duration: 650, delay: stagger(75), ease: 'outCubic' })
    animate('.hero-art img', { scale: [1.025, 1], duration: 1100, ease: 'outCubic' })
  })
})

onUnmounted(() => scope?.revert())
</script>

<style scoped>
.home-hero { position: relative; isolation: isolate; width: 100%; overflow: hidden; background: #f1f0f7; }
.hero-container { display: grid; grid-template-columns: 1fr 1.1fr; width: min(var(--storefront-container-width), 100%); min-height: 450px; margin-inline: auto; padding-inline: 40px; }
.hero-art { position: absolute; inset: 0 0 0 22%; z-index: -2; }
.hero-art img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: right center; }
.hero-blend { position: absolute; inset: 0; z-index: -1; background: linear-gradient(90deg, #f2f1f8 0%, rgb(242 241 248 / 98%) 27%, rgb(242 241 248 / 91%) 36%, rgb(242 241 248 / 38%) 48%, transparent 61%); }
.hero-copy { padding: 54px 0 46px; width: min(570px, 110%); align-self: center; }
.hero-eyebrow { display: flex; align-items: center; gap: 9px; font-size: 10px; letter-spacing: 2.8px; font-weight: 750; color: #574375; margin-bottom: 19px; }
.hero-eyebrow span { width: 7px; height: 7px; background: #639c15; border-radius: 50%; }
h1 { margin: 0; font-size: clamp(36px, 3.45vw, 52px); line-height: 1.12; letter-spacing: -1.7px; font-weight: 760; color: #3e2372; }
.title-dot { color: #5b9510; }
.hero-description { color: #645b70; font-size: 15px; line-height: 1.7; margin: 20px 0 17px; }
.hero-categories { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 0; font-size: 11px; font-weight: 550; color: #3f354d; }
.hero-categories span + span::before { content: ''; display: inline-block; height: 10px; border-left: 1px solid #b8aec8; margin: 0 10px; vertical-align: -1px; }
.hero-action { display: inline-block; margin-top: 26px; }
.hero-cta { min-height: 45px; padding: 0 22px; border-radius: 30px; font-size: 13px; letter-spacing: 0; gap: 21px; background: linear-gradient(115deg, #59980c, #407b05); border: 0; color: white; box-shadow: 0 5px 16px rgb(71 127 10 / 15%); }
.hero-note { display: flex; align-items: center; gap: 7px; margin-top: 22px; font-size: 11px; color: #7b7188; }
@media (min-width: 1600px) { .hero-container { min-height: 490px; } }
@media (max-width: 1100px) { .hero-container { min-height: 405px; padding-inline: 24px; } h1 { font-size: 39px; } .hero-description { font-size: 13px; } .hero-categories { max-width: 340px; } }
@media (max-width: 760px) {
  .home-hero { display: flex; flex-direction: column; }
  .hero-container { display: block; min-height: auto; padding-inline: 16px; order: 0; }
  .hero-copy { width: 100%; padding: 35px 0 20px; order: 0; }
  .hero-eyebrow { font-size: 9px; margin-bottom: 16px; letter-spacing: 2px; }
  h1 { font-size: clamp(33px, 7.5vw, 45px); letter-spacing: -1.25px; }
  .hero-description { margin-top: 16px; font-size: 13px; }
  .hero-categories { font-size: 10px; max-width: none; }
  .hero-categories span + span::before { margin-inline: 7px; }
  .hero-action { margin-top: 21px; }
  .hero-note { font-size: 9px; margin-top: 17px; }
  .hero-art { position: relative; inset: auto; z-index: -2; width: 100%; height: auto; aspect-ratio: 2.65; order: 1; }
  .hero-art img { object-fit: cover; mask-image: linear-gradient(180deg, transparent, #000 20%); }
  .hero-blend { background: linear-gradient(180deg, #f2f1f8 0%, #f2f1f8 59%, rgb(242 241 248 / 75%) 70%, transparent 85%); }
}
</style>
