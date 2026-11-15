<template>
  <MotionConfig reduced-motion="user">
    <main class="admin-shell admin-access" data-theme="fgx">
      <div class="access-background" aria-hidden="true" />
      <img class="access-art" src="/assets/images/auth/admin-desk.webp" alt="Laptop displaying a store dashboard beside a plant, notebook and FGX MART mug" width="1400" height="911" fetchpriority="high" />
      <div class="access-container">
        <section ref="hero" class="access-intro" aria-labelledby="admin-panel-title">
          <NuxtLink to="/" class="access-logo" aria-label="FGX MART home"><img src="/images/logo/fgx-logo-light.png" alt="FGX MART" width="225" height="65" /></NuxtLink>
          <p class="access-eyebrow">YOUR STORE. ONE SIMPLE WORKSPACE.</p>
          <h1 id="admin-panel-title">Admin <span>Panel</span></h1>
          <p class="access-description">Manage your products, orders and catalogue. <br />Keep everything moving, all in one place.</p>
          <ul class="access-features" aria-label="Admin workspace features">
            <li v-for="feature in features" :key="feature.title" class="feature-float"><motion.div class="tw:card feature-card" :while-hover="{ scale: 1.035 }"><component :is="feature.icon" :size="27" :stroke-width="1.7" aria-hidden="true" /><span>{{ feature.title }}<br />{{ feature.subtitle }}</span></motion.div></li>
          </ul>
        </section>
        <section class="tw:card access-card" aria-labelledby="admin-login-title">
          <div class="access-card-heading"><span class="access-lock"><ShieldCheck :size="47" :stroke-width="1.6" aria-hidden="true" /></span><h2 id="admin-login-title">Admin Login</h2><p>Sign in to access the FGX MART admin portal.</p></div>
          <form class="access-form" :aria-busy="loading" @submit.prevent="login">
            <p v-if="error" class="tw:alert tw:alert-error login-error" role="alert">{{ error }}</p>
            <label for="admin-email">Email address<span class="access-input"><Mail :size="19" aria-hidden="true" /><input id="admin-email" v-model="email" class="tw:input" type="email" autocomplete="username" placeholder="Enter your admin email" :disabled="loading" required /></span></label>
            <label for="admin-password">Password<span class="access-input"><LockKeyhole :size="19" aria-hidden="true" /><input id="admin-password" v-model="password" class="tw:input" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" :disabled="loading" required /><button type="button" class="access-eye" :aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><Eye v-if="showPassword" :size="19" aria-hidden="true" /><EyeOff v-else :size="19" aria-hidden="true" /></button></span></label>
            <div class="access-options"><label class="remember-label"><input v-model="rememberEmail" type="checkbox" class="tw:checkbox tw:checkbox-sm tw:checkbox-primary" :disabled="loading" />Remember email</label><button type="button" class="password-help-link" @click="helpDialog.showModal()">Forgot password?</button></div>
            <motion.div :while-hover="loading ? {} : { y: -2 }" :while-press="{ scale: 0.985 }"><button type="submit" class="tw:btn tw:btn-secondary access-submit" :disabled="loading"><span v-if="loading" class="tw:loading tw:loading-spinner tw:loading-sm" aria-hidden="true" />{{ loading ? 'Signing in…' : 'Login to dashboard' }}<ArrowRight v-if="!loading" :size="22" aria-hidden="true" /></button></motion.div>
          </form>
          <p class="access-note"><LockKeyhole :size="12" aria-hidden="true" /> Authorised access only</p>
        </section>
      </div>
      <dialog ref="helpDialog" class="tw:modal" aria-labelledby="admin-password-help-title" @click="closeHelpOnBackdrop"><div class="tw:modal-box admin-help-box"><button type="button" class="tw:btn tw:btn-ghost tw:btn-sm tw:btn-square help-close" aria-label="Close password help" @click="helpDialog.close()"><X :size="19" /></button><ShieldCheck :size="35" class="help-shield" aria-hidden="true" /><h2 id="admin-password-help-title">Need access help?</h2><p>Contact the administrator who manages your account to arrange password or access assistance.</p><button type="button" class="tw:btn tw:btn-primary" @click="helpDialog.close()">Got it</button></div></dialog>
    </main>
  </MotionConfig>
</template>
<script setup>
import { motion } from 'motion-v'
import { animate, createScope, stagger } from 'animejs'
import { ArrowRight, ChartNoAxesCombined, Eye, EyeOff, Layers3, LockKeyhole, Mail, Package, ShieldCheck, ShoppingCart, X } from 'lucide-vue-next'
definePageMeta({ layout: false })
useHead({ title: 'Admin Access — FGXMART', meta: [{ name: 'robots', content: 'noindex, nofollow' }] })
const route = useRoute()
const email = ref(''), password = ref(''), error = ref('')
const loading = ref(false), showPassword = ref(false), rememberEmail = ref(false)
const hero = ref(null), helpDialog = ref(null)
const features = [
  { title: 'Products', subtitle: 'Management', icon: Package },
  { title: 'Order', subtitle: 'Management', icon: ShoppingCart },
  { title: 'Catalogue', subtitle: 'Settings', icon: Layers3 },
  { title: 'Reports &', subtitle: 'Analytics', icon: ChartNoAxesCombined },
]
let scope, motionPreference
const setMotion = () => {
  scope?.revert(); scope = undefined
  if (!motionPreference?.matches && hero.value) scope = createScope({ root: hero.value }).add(() => {
    animate('.feature-float', { translateY: [0, -8, 0], duration: 3700, delay: stagger(250), loop: true, ease: 'inOutSine' })
  })
}
onMounted(() => {
  try { const saved = localStorage.getItem('fgx_admin_remembered_email'); if (saved) { email.value = saved; rememberEmail.value = true } } catch {}
  motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)'); motionPreference.addEventListener('change', setMotion); setMotion()
})
onUnmounted(() => { scope?.revert(); motionPreference?.removeEventListener('change', setMotion) })
const closeHelpOnBackdrop = event => { if (event.target === helpDialog.value) helpDialog.value.close() }
const login = async () => {
  if (loading.value) return
  loading.value = true; error.value = ''
  try {
    await $fetch('/api/admin/login', { method: 'POST', headers: { 'X-FGX-Admin': '1' }, body: { email: email.value.trim(), password: password.value } })
    password.value = ''
    try { if (rememberEmail.value) localStorage.setItem('fgx_admin_remembered_email', email.value.trim()); else localStorage.removeItem('fgx_admin_remembered_email') } catch {}
    const candidate = typeof route.query.redirect === 'string' ? route.query.redirect : ''
    const url = candidate.startsWith('/') && !candidate.startsWith('//') ? new URL(candidate, window.location.origin) : null
    const redirect = url?.origin === window.location.origin && (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) ? url.pathname + url.search + url.hash : '/admin/dashboard'
    await navigateTo(redirect)
  } catch (err) { error.value = err.data?.message || 'Unable to sign in. Please try again.' }
  finally { loading.value = false }
}
</script>
<style scoped>
.admin-access { position: relative; isolation: isolate; min-height: 100dvh; overflow: hidden; background: radial-gradient(ellipse at 92% 10%, #fff, transparent 55%), linear-gradient(135deg, #d7d3ee, #f2effb 60%, #d6d0ed); }
.access-background { position: absolute; inset: 0; z-index: -1; background: radial-gradient(ellipse at 24% 72%, #665485, transparent 60%), linear-gradient(145deg, #2c2548, #382754); clip-path: polygon(10% 0, 72% 0, 44% 100%, 0 100%, 0 20%); }
.admin-access::before { content: ''; position: absolute; inset: 0; z-index: -1; background: linear-gradient(180deg, #8cc833, #9add24); clip-path: polygon(71% 0, 73% 0, 46% 100%, 44% 100%); }
.admin-access::after { content: ''; position: absolute; z-index: -2; right: -7%; top: 3%; width: 45%; height: 95%; background: repeating-linear-gradient(90deg, #d1cbe357 0 4px, transparent 4px 27%), repeating-linear-gradient(0deg, #d1cbe342 0 4px, transparent 4px 33%); filter: blur(6px); transform: perspective(800px) rotateY(-15deg); }
.access-art { position: absolute; z-index: 0; bottom: 0; left: 0; display: block; width: min(62vw, 1050px); height: auto; pointer-events: none; }
.access-container { position: relative; z-index: 1; width: min(1330px, 100%); min-height: 100dvh; margin: 0 auto; padding: 66px 44px; display: grid; grid-template-columns: 1.05fr 1fr; gap: 88px; align-items: center; }
.access-intro { align-self: start; margin-top: 24px; color: #fff; min-width: 0; padding-bottom: 300px; }
.access-logo { display: inline-block; margin-bottom: 34px; }
.access-logo img { display: block; width: 218px; height: auto; }
.access-eyebrow { font-size: 8px; letter-spacing: 1.7px; color: #c0afda; font-weight: 650; margin: 0 0 13px; }
.access-intro h1 { font-size: clamp(43px, 4.4vw, 64px); line-height: 1.1; letter-spacing: -1.7px; font-weight: 800; margin: 0 0 15px; }
.access-intro h1 span { color: #a5e42a; }
.access-description { font-size: 17px; line-height: 1.6; margin: 0; color: #f0eaf9; }
.access-features { list-style: none; padding: 0; margin: 29px 0 0; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 13px; }
.feature-float { min-width: 0; }
.feature-card { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 11px; min-height: 104px; padding: 14px 7px; border: 1px solid #c1a5e333; border-radius: 15px; background: #ffffff08; box-shadow: inset 0 1px 0 #ffffff0d; backdrop-filter: blur(8px); text-align: center; }
.feature-card svg { color: #b2e95c; flex-shrink: 0; }
.feature-card span { font-size: 10px; line-height: 1.4; color: #f8f3ff; font-weight: 550; }
.access-card { position: relative; overflow: hidden; padding: 40px 40px 24px; border: 1px solid #fff; border-radius: 30px; background: #fffffffa; box-shadow: 0 27px 60px #37245330; }
.access-card::before { content: ''; position: absolute; top: 0; right: 0; height: 6px; width: 115px; background: #92cf24; border-radius: 0 0 0 8px; }
.access-card-heading { text-align: center; margin-bottom: 33px; }
.access-lock { display: grid; place-items: center; width: 60px; height: 60px; color: #62a921; margin: 0 auto 16px; }
.access-card-heading h2 { margin: 0 0 11px; font-size: 33px; font-weight: 750; line-height: 1.2; letter-spacing: -.9px; color: #281640; }
.access-card-heading p { margin: 0; color: #8b7a9a; font-size: 12px; line-height: 1.6; }
.access-form { display: flex; flex-direction: column; gap: 20px; }
.access-form > label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; color: #39264d; font-weight: 650; }
.access-input { display: flex; align-items: center; gap: 11px; padding: 0 14px; height: 49px; border: 1px solid #dbd2e8; border-radius: 11px; background: #fff; }
.access-input:focus-within { border-color: #996bc5; box-shadow: 0 0 0 3px #7a42b50c; }
.access-input > svg { color: #897693; flex-shrink: 0; }
.access-input .tw\:input { width: 0; min-width: 0; height: 100%; min-height: 0; flex: 1; padding: 0; border: 0; border-radius: 0; outline: 0; background: transparent; box-shadow: none; font-size: 12px; color: #39264d; }
.access-input input::placeholder { color: #a194ad; opacity: 1; }
.access-input .tw\:input:is(:autofill, :-webkit-autofill) { -webkit-text-fill-color: #39264d; caret-color: #39264d; box-shadow: 0 0 0 1000px #fff inset; }
.access-eye { display: grid; place-items: center; padding: 5px; color: #8b749e; border-radius: 5px; cursor: pointer; }
.access-options { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin: 0 0 7px; }
.remember-label { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #8a7998; }
.password-help-link { background: transparent; border: 0; color: #7b3ab3; font-size: 11px; font-weight: 600; cursor: pointer; }
.password-help-link:hover { text-decoration: underline; }
.access-form .access-submit { display: flex; align-items: center; justify-content: center; gap: 15px; width: 100%; height: auto; min-height: 49px; border: 0; border-radius: 99px; padding: 12px 20px; color: #fff; background: linear-gradient(110deg, #66a30c, #2f7b0b); font-size: 15px; font-weight: 650; }
.access-form .access-submit:hover { background: #3b850e; }
.access-note { display: flex; align-items: center; justify-content: center; gap: 6px; margin: 24px 0 0; font-size: 9px; color: #b0a3bc; }
.login-error { margin: 0; padding: 11px 13px; background: #fff2f5; color: #ab3852; border: 1px solid #f0d4db; border-radius: 9px; font-size: 12px; line-height: 1.6; }
.admin-help-box { position: relative; width: min(440px, 90vw); padding: 30px; background: #fff; color: #39264d; }
.help-close { position: absolute; right: 12px; top: 12px; }
.help-shield { color: #65a627; margin-bottom: 15px; }
.admin-help-box h2 { font-size: 23px; font-weight: 700; margin: 0 0 12px; }
.admin-help-box p { font-size: 13px; line-height: 1.7; color: #8b7a9a; margin: 0 0 22px; }
@media(min-width: 1700px) { .access-container { width: min(1460px, 100%); gap: 95px; padding-block: 80px; } .access-intro { margin-top: 20px; padding-bottom: 340px; } .access-logo img { width: 240px; } .access-intro h1 { font-size: 70px; } .access-description { font-size: 20px; } .feature-card { min-height: 117px; } .feature-card span { font-size: 12px; } .access-card { padding: 45px 46px 30px; } .access-card-heading h2 { font-size: 38px; } .access-card-heading p { font-size: 14px; } .access-input { height: 53px; } .access-input .tw\:input { font-size: 14px; } }
@media(max-width: 1100px) { .access-container { gap: 35px; padding: 45px 28px; } .access-intro { margin-top: 12px; padding-bottom: 260px; } .access-logo img { width: 190px; } .access-intro h1 { font-size: 45px; } .access-description { font-size: 14px; } .access-features { gap: 8px; } .feature-card { padding-inline: 5px; min-height: 94px; } .feature-card span { font-size: 9px; } .access-card { padding: 30px 26px 23px; } .access-card-heading h2 { font-size: 29px; } }
@media(max-width: 760px) { .admin-access { background: linear-gradient(155deg, #37294f, #28213d); } .access-background, .admin-access::before, .admin-access::after, .access-art { display: none; } .access-container { max-width: 550px; grid-template-columns: 1fr; gap: 29px; padding: 30px 20px 36px; align-content: center; } .access-intro { margin: 0; padding: 0; } .access-logo { margin-bottom: 24px; } .access-logo img { width: 175px; } .access-eyebrow { font-size: 7px; } .access-intro h1 { font-size: 40px; } .access-description { font-size: 13px; } .access-description br { display: none; } .access-features { margin-top: 22px; gap: 8px; } .feature-card { min-height: 85px; gap: 8px; border-radius: 11px; } .feature-card svg { width: 23px; height: 23px; } .feature-card span { font-size: 9px; } .access-card { padding: 29px 24px 22px; border-radius: 24px; } .access-card-heading { margin-bottom: 26px; } .access-lock { height: 45px; margin-bottom: 14px; } .access-lock svg { width: 40px; height: 40px; } .access-card-heading h2 { font-size: 28px; } }
@media(max-width: 360px) { .access-container { padding-inline: 14px; } .access-card { padding-inline: 20px; } .access-features { gap: 6px; } .feature-card span { font-size: 8px; } .access-intro h1 { font-size: 36px; } }
</style>
