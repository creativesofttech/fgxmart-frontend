<template>
  <MotionConfig reduced-motion="user">
    <main class="customer-auth" data-theme="fgx">
      <div class="auth-container">
        <section class="auth-intro" aria-labelledby="welcome-title">
          <NuxtLink to="/" class="auth-logo" aria-label="FGX MART home"><img src="/images/logo/fgx-logo-dark.png" alt="FGX MART" width="230" height="65" /></NuxtLink>
          <div class="welcome-copy">
            <p class="auth-eyebrow">A LITTLE OF EVERYTHING, FOR EVERYONE</p>
            <h1 id="welcome-title">{{ isRegister ? 'Hello, new friend!' : 'Welcome back!' }}</h1>
            <p class="welcome-description">{{ isRegister ? 'Create your FGX MART account and make everyday shopping a little simpler.' : 'Log in to your FGX MART account and continue your shopping journey.' }}</p>
          </div>
          <ul class="auth-benefits"><li><span><PackageCheck :size="24" aria-hidden="true" /></span>All your<br />orders</li><li><span><Heart :size="24" aria-hidden="true" /></span>Saved<br />favourites</li><li><span><MessageCircle :size="24" aria-hidden="true" /></span>Easy<br />enquiries</li></ul>
          <figure class="auth-art"><img src="/assets/images/auth/login-cart.webp" alt="Shopping cart filled with groceries alongside clothing, electronics and cookware" width="1400" height="788" fetchpriority="high" /></figure>
        </section>
        <section class="tw:card auth-card" aria-labelledby="auth-title">
          <header class="auth-heading"><h2 id="auth-title">{{ isRegister ? 'Create your account' : 'Login to your account' }}</h2><p>{{ isRegister ? 'Your everyday favourites, all in one place.' : 'Your orders, wishlist and next great finds await.' }}</p></header>
          <form class="auth-form" :aria-busy="loading" @submit.prevent="submit">
            <div v-if="errorMessage" class="tw:alert tw:alert-error auth-error" role="alert">{{ errorMessage }}</div>
            <label v-if="isRegister" class="auth-label" for="customer-name">Full name<span class="input-wrap"><UserRound :size="19" aria-hidden="true" /><input id="customer-name" v-model="form.name" class="tw:input" autocomplete="name" placeholder="Enter your full name" maxlength="255" required :disabled="loading" /></span></label>
            <label class="auth-label" for="customer-email">Email address<span class="input-wrap"><Mail :size="19" aria-hidden="true" /><input id="customer-email" v-model="form.email" class="tw:input" type="email" autocomplete="username" placeholder="Enter your email address" required :disabled="loading" /></span></label>
            <label class="auth-label" for="customer-password">Password<span class="input-wrap"><LockKeyhole :size="19" aria-hidden="true" /><input id="customer-password" v-model="form.password" class="tw:input" :type="showPassword ? 'text' : 'password'" :autocomplete="isRegister ? 'new-password' : 'current-password'" :minlength="isRegister ? 8 : undefined" :placeholder="isRegister ? 'Create a password (8+ characters)' : 'Enter your password'" required :disabled="loading" /><button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><Eye v-if="showPassword" :size="19" aria-hidden="true" /><EyeOff v-else :size="19" aria-hidden="true" /></button></span></label>
            <label v-if="isRegister" class="auth-label" for="customer-confirm-password">Confirm password<span class="input-wrap"><LockKeyhole :size="19" aria-hidden="true" /><input id="customer-confirm-password" v-model="form.password_confirmation" class="tw:input" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Enter your password again" minlength="8" required :disabled="loading" /></span></label>
            <div v-if="!isRegister" class="forgot-row"><button type="button" class="auth-text-button" @click="openPasswordHelp">Forgot password?</button></div>
            <motion.div :while-hover="loading ? {} : { y: -2 }" :while-press="{ scale: 0.985 }"><button class="tw:btn tw:btn-secondary auth-submit" type="submit" :disabled="loading"><span v-if="loading" class="tw:loading tw:loading-spinner tw:loading-sm" aria-hidden="true" />{{ loading ? (isRegister ? 'Creating account…' : 'Logging in…') : isRegister ? 'Create account' : 'Login' }}<ArrowRight v-if="!loading" :size="21" aria-hidden="true" /></button></motion.div>
          </form>
          <div class="auth-divider" aria-hidden="true"><span />or<span /></div>
          <p class="auth-switch">{{ isRegister ? 'Already have an account?' : 'Don’t have an account?' }} <button type="button" class="auth-text-button" :disabled="loading" @click="switchMode">{{ isRegister ? 'Login' : 'Create account' }}</button></p>
          <NuxtLink class="back-to-shop" to="/"><ArrowLeft :size="14" aria-hidden="true" /> Back to shopping</NuxtLink>
        </section>
      </div>
      <dialog ref="helpDialog" class="tw:modal password-help" aria-labelledby="password-help-title" @click="closeHelpOnBackdrop">
        <div class="tw:modal-box help-box"><button class="help-close" type="button" aria-label="Close password help" @click="helpDialog.close()"><X :size="20" /></button><span class="help-symbol"><MessageCircle :size="27" aria-hidden="true" /></span><h2 id="password-help-title">Need help signing in?</h2><p>Contact our team for help accessing your account.</p><a v-if="company?.contact_email" :href="`mailto:${company.contact_email}`" class="help-contact">{{ company.contact_email }}</a><a v-if="company?.phone_number" :href="`tel:${company.phone_number.replace(/[^+\d]/g, '')}`" class="help-contact">{{ company.phone_number }}</a><NuxtLink to="/faqs" class="auth-text-button help-faq">Visit our help centre <ArrowRight :size="15" aria-hidden="true" /></NuxtLink></div>
      </dialog>
    </main>
  </MotionConfig>
</template>
<script setup>
import { motion } from 'motion-v'
import { ArrowLeft, ArrowRight, Eye, EyeOff, Heart, LockKeyhole, Mail, MessageCircle, PackageCheck, UserRound, X } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'
definePageMeta({ layout: false })
const route = useRoute()
const config = useRuntimeConfig()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()
const isRegister = ref(route.query.mode === 'register')
const loading = ref(false)
const showPassword = ref(false)
const errorMessage = ref('')
const form = reactive({ name: '', email: '', password: '', password_confirmation: '' })
const helpDialog = ref(null)
const company = ref(null)
useHead({ title: () => `${isRegister.value ? 'Create Account' : 'Login'} — FGX MART`, meta: [{ name: 'description', content: 'Log in to your FGX MART account to access your orders, wishlist and shopping enquiries.' }] })
const switchMode = () => { isRegister.value = !isRegister.value; errorMessage.value = ''; showPassword.value = false; form.password = ''; form.password_confirmation = '' }
const openPasswordHelp = async () => {
  helpDialog.value?.showModal()
  if (company.value) return
  try { const response = await $fetch(`${config.public.apiBase}/company-info`); company.value = response.data?.company || {} } catch { company.value = {} }
}
const closeHelpOnBackdrop = event => { if (event.target === helpDialog.value) helpDialog.value.close() }
const destination = () => {
  const candidate = route.query.redirect
  if (typeof candidate !== 'string' || !candidate.startsWith('/') || candidate.startsWith('//')) return '/'
  const url = new URL(candidate, window.location.origin)
  if (url.origin !== window.location.origin || /^\/(admin(?:-access|\/|$)|login(?:\/|$))/i.test(url.pathname)) return '/'
  return url.pathname + url.search + url.hash
}
const submit = async () => {
  if (loading.value) return
  errorMessage.value = ''
  if (isRegister.value && form.password !== form.password_confirmation) { errorMessage.value = 'Your passwords do not match.'; document.getElementById('customer-confirm-password')?.focus(); return }
  loading.value = true
  try {
    const body = { email: form.email.trim(), password: form.password, ...(isRegister.value ? { name: form.name.trim(), password_confirmation: form.password_confirmation } : {}) }
    const response = await $fetch(`${config.public.apiBase}/${isRegister.value ? 'register' : 'login'}`, { method: 'POST', body })
    if (!response.access_token || !response.user) throw new Error('Invalid authentication response')
    auth.setToken(response.access_token); auth.setUser(response.user)
    await Promise.all([cart.syncCart(), wishlist.syncWishlist()])
    form.password = ''; form.password_confirmation = ''
    await navigateTo(destination())
  } catch (error) { errorMessage.value = Object.values(error.data?.errors || {}).flat().join(' ') || error.data?.message || (isRegister.value ? 'We couldn’t create your account. Please try again.' : 'We couldn’t log you in. Please check your details and try again.') }
  finally { loading.value = false }
}
</script>
<style scoped>
.customer-auth { position: relative; isolation: isolate; min-height: 100dvh; overflow: hidden; color: #2b1551; background: radial-gradient(ellipse at 12% 95%, #e7d7fc, transparent 50%), #f8f5fe; }
.customer-auth::before { content: ''; position: absolute; z-index: -1; top: -35%; right: -24%; width: 65%; height: 175%; background: linear-gradient(145deg, #a27bd8, #6034a5 55%, #48218b); border-radius: 42% 0 0 42%; transform: rotate(22deg); }
.customer-auth::after { content: ''; position: absolute; z-index: -1; top: -47%; left: 38%; width: 52%; height: 75%; border-radius: 50%; background: linear-gradient(135deg, #e6d8fc, #f5efff); transform: rotate(-28deg); }
.auth-container { width: min(1360px, 100%); min-height: 100dvh; margin: 0 auto; padding: 52px 44px; display: grid; grid-template-columns: 1.15fr 1fr; gap: 64px; align-items: center; }
.auth-intro { min-width: 0; }
.auth-logo { display: inline-block; margin-bottom: 35px; }
.auth-logo img { display: block; width: 215px; height: auto; }
.auth-eyebrow { margin: 0 0 12px; color: #a18caf; font-size: 9px; font-weight: 650; letter-spacing: 1.5px; }
.welcome-copy h1 { position: relative; display: inline-block; font-size: clamp(38px, 4.1vw, 57px); line-height: 1.1; font-weight: 800; letter-spacing: -2px; margin: 0 0 28px; }
.welcome-copy h1::after { content: ''; position: absolute; bottom: -10px; left: 0; width: 73%; height: 6px; border-radius: 50%; background: #82bc28; transform: rotate(-1deg); }
.welcome-description { font-size: 18px; line-height: 1.55; max-width: 470px; margin: 0; color: #4e376f; }
.auth-benefits { display: flex; align-items: center; gap: 32px; margin: 28px 0 16px; padding: 0; list-style: none; }
.auth-benefits li { display: flex; align-items: center; gap: 10px; font-size: 12px; line-height: 1.3; font-weight: 650; }
.auth-benefits li > span { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 13px; background: #ece2fb; color: #68409b; }
.auth-art { position: relative; margin: 15px -30px -12px; }
.auth-art::before { content: ''; position: absolute; bottom: -6px; left: 2%; width: 96%; height: 20%; border-radius: 50%; background: #e2d0f8; box-shadow: 0 20px 28px #8963ba21; }
.auth-art img { position: relative; display: block; width: 100%; height: auto; filter: drop-shadow(0 10px 8px #4a267e12); }
.auth-card { position: relative; min-width: 0; padding: 46px 42px 30px; background: rgb(255 255 255 / 97%); border: 1px solid #fff; border-radius: 28px; box-shadow: 0 24px 65px #42226c20; }
.auth-heading { text-align: center; margin-bottom: 32px; }
.auth-heading h2 { font-size: clamp(25px, 2.5vw, 33px); font-weight: 750; line-height: 1.25; letter-spacing: -1px; margin: 0 0 11px; }
.auth-heading p { margin: 0; color: #806c95; font-size: 12px; line-height: 1.6; }
.auth-form { display: flex; flex-direction: column; gap: 20px; }
.auth-label { display: flex; flex-direction: column; gap: 8px; font-size: 13px; font-weight: 650; }
.input-wrap { display: flex; align-items: center; gap: 11px; height: 49px; padding: 0 15px; border: 1px solid #dcd0ec; border-radius: 12px; background: #fff; transition: box-shadow .2s, border-color .2s; }
.input-wrap:focus-within { border-color: #9769c5; box-shadow: 0 0 0 3px #7a42b50c; }
.input-wrap > svg { flex-shrink: 0; color: #79608f; }
.input-wrap .tw\:input { display: block; flex: 1; width: 0; min-width: 0; height: 100%; min-height: 0; padding: 0; border: 0; outline: 0; box-shadow: none; background: transparent; color: #35204c; font-size: 12px; font-weight: 400; }
.input-wrap .tw\:input:is(:autofill, :-webkit-autofill) { background-color: #fff; color: #35204c; -webkit-text-fill-color: #35204c; caret-color: #35204c; box-shadow: 0 0 0 1000px #fff inset; }
.input-wrap input::placeholder { color: #a191b2; opacity: 1; }
.password-toggle { display: grid; place-items: center; background: transparent; border: 0; color: #806493; padding: 5px; border-radius: 6px; cursor: pointer; }
.forgot-row { margin: -4px 0 3px; text-align: right; }
.auth-text-button { padding: 0; border: 0; background: transparent; color: #7434b2; cursor: pointer; font-size: 12px; font-weight: 650; }
.auth-text-button:hover { color: #4d207d; text-decoration: underline; }
.auth-submit { display: flex; align-items: center; justify-content: center; width: 100%; min-height: 49px; height: auto; padding: 12px 20px; gap: 13px; border: 0; border-radius: 99px; background: linear-gradient(110deg, #659e16, #317c21); color: #fff; font-size: 16px; font-weight: 700; cursor: pointer; }
.auth-submit:hover { background: #3c8120; }
.auth-submit:disabled { opacity: .65; cursor: wait; }
.auth-error { padding: 11px 13px; border: 1px solid #f0d4db; border-radius: 9px; background: #fff2f5; color: #a73750; font-size: 12px; line-height: 1.6; }
.auth-divider { display: flex; align-items: center; gap: 15px; margin: 27px 0 20px; color: #a58eb6; font-size: 11px; }
.auth-divider span { height: 1px; flex: 1; background: #e9dff3; }
.auth-switch { margin: 0; text-align: center; color: #7b668e; font-size: 12px; line-height: 1.8; }
.auth-switch button { margin-left: 5px; }
.back-to-shop { display: flex; align-items: center; justify-content: center; gap: 6px; width: fit-content; margin: 25px auto 0; font-size: 10px; color: #a08bac; }
.customer-auth :is(button, a):focus-visible { outline: 2px solid #8754b9; outline-offset: 4px; }
.help-box { position: relative; background: #fff; padding: 30px; border-radius: 20px; width: min(440px, 90vw); color: #34204c; }
.help-close { position: absolute; right: 15px; top: 15px; padding: 5px; color: #806493; cursor: pointer; }
.help-symbol { display: grid; place-items: center; width: 50px; height: 50px; border-radius: 15px; background: #efe5fb; color: #7943b0; margin-bottom: 20px; }
.help-box h2 { margin: 0 0 12px; font-size: 23px; font-weight: 700; }
.help-box p { margin: 0 0 18px; color: #8c7a99; font-size: 13px; line-height: 1.7; }
.help-contact { display: block; margin-top: 10px; color: #7434b2; font-size: 13px; overflow-wrap: anywhere; }
.help-faq { display: flex; gap: 9px; align-items: center; margin-top: 22px; }
@media (min-width: 1700px) { .auth-container { width: min(1490px, 100%); gap: 95px; } .auth-logo img { width: 240px; } .auth-card { padding: 55px 50px 35px; } .auth-heading h2 { font-size: 36px; } .auth-heading p { font-size: 14px; } .welcome-copy h1 { font-size: 63px; } .welcome-description { font-size: 20px; } .input-wrap { height: 53px; } .auth-label { font-size: 14px; } .input-wrap .tw\:input { font-size: 14px; } .auth-benefits { gap: 40px; } }
@media (max-width: 1100px) { .auth-container { padding: 40px 28px; gap: 35px; grid-template-columns: 1fr 1fr; } .auth-card { padding: 35px 27px 27px; } .welcome-copy h1 { font-size: 41px; } .welcome-description { font-size: 15px; } .auth-benefits { gap: 18px; } .auth-benefits li { font-size: 10px; gap: 7px; } .auth-benefits li > span { width: 35px; height: 35px; } .auth-art { margin-inline: -15px; } }
@media (max-width: 760px) { .auth-container { max-width: 560px; min-height: 100dvh; grid-template-columns: 1fr; gap: 24px; padding: 27px 20px 38px; align-content: center; } .customer-auth::before { width: 125%; right: -65%; top: 5%; height: 125%; } .customer-auth::after { width: 120%; height: 50%; left: -20%; top: -25%; } .auth-logo { margin-bottom: 24px; } .auth-logo img { width: 175px; } .auth-eyebrow { font-size: 8px; } .welcome-copy h1 { font-size: 36px; margin-bottom: 23px; letter-spacing: -1.2px; } .welcome-description { font-size: 13px; max-width: 390px; } .auth-art, .auth-benefits { display: none; } .auth-card { padding: 30px 24px 24px; border-radius: 23px; } .auth-heading { margin-bottom: 25px; } .auth-heading h2 { font-size: 26px; } }
@media (max-width: 360px) { .auth-container { padding-inline: 14px; } .auth-card { padding: 25px 19px 22px; } .auth-heading h2 { font-size: 23px; } .welcome-copy h1 { font-size: 32px; } }
</style>
