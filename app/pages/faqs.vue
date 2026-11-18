<template>
  <div class="faq-page" data-theme="fgx">
    <div class="faq-container">
      <nav class="faq-breadcrumb" aria-label="Breadcrumb"><NuxtLink to="/"><House :size="14" aria-hidden="true" /> Home</NuxtLink><ChevronRight :size="13" aria-hidden="true" /><span aria-current="page">Help centre</span></nav>
      <section class="faq-hero" aria-labelledby="faq-title">
        <div class="hero-copy"><span class="eyebrow">A LITTLE HELP FOR YOUR EVERYDAY</span><h1 id="faq-title">Good questions.<br /><span>Clear answers.</span></h1><p>From your first browse to sharing your product list, find the little details that make shopping with FGX MART simple.</p>
          <div class="faq-search"><Search :size="20" aria-hidden="true" /><label class="sr-only" for="faq-search">Search FAQs</label><input id="faq-search" v-model="search" type="search" placeholder="Search a question or keyword..." /><button v-if="search" type="button" aria-label="Clear FAQ search" @click="search = ''"><X :size="17" aria-hidden="true" /></button></div>
          <div class="popular-topics"><span>Popular:</span><button v-for="topic in topics" :key="topic.query" class="tw:badge" type="button" :aria-pressed="search.trim().toLowerCase() === topic.query" @click="search = topic.query">{{ topic.label }}</button></div>
        </div>
        <div class="hero-visual" aria-hidden="true"><div class="help-orbit"><MessagesSquare :size="56" :stroke-width="1.3" /></div><div class="visual-card visual-browse"><span><ShoppingBag :size="22" /></span><div><small>01 / DISCOVER</small><strong>Find your favourites</strong></div><Check :size="16" /></div><div class="visual-card visual-pdf"><span><FileDown :size="22" /></span><div><small>02 / DOWNLOAD</small><strong>Your list, in one PDF</strong></div></div><div class="visual-card visual-chat"><span><MessageCircle :size="22" /></span><div><small>03 / CONNECT</small><strong>Let’s talk on WhatsApp</strong></div></div><span class="visual-spark spark-one">+</span><span class="visual-spark spark-two">+</span></div>
      </section>
      <div class="faq-layout">
        <aside class="faq-sidebar"><div class="guide-card tw:card"><span class="guide-icon"><Sparkles :size="22" aria-hidden="true" /></span><h2>A simpler way to shop</h2><p>Pick what you love. We’ll help with the rest.</p><ol><li><span>1</span><div><strong>Explore the catalogue</strong><p>Discover everyday essentials and more.</p></div></li><li><span>2</span><div><strong>Build your product list</strong><p>Choose your products, options and quantities.</p></div></li><li><span>3</span><div><strong>Start a conversation</strong><p>Download your PDF and share it with our team.</p></div></li></ol><NuxtLink to="/products">Explore our products <ArrowUpRight :size="17" aria-hidden="true" /></NuxtLink></div><NuxtLink to="/my-account?tab=order" class="order-help"><PackageCheck :size="22" aria-hidden="true" /><span><strong>Already placed an order?</strong><small>View your order details</small></span><ArrowRight :size="16" aria-hidden="true" /></NuxtLink></aside>
        <section class="faq-answers" aria-labelledby="answers-title"><div class="answers-heading"><div><span class="eyebrow">HERE TO HELP</span><h2 id="answers-title">Frequently asked questions</h2></div><p v-if="!pending && !error && activeFaqs.length" role="status" aria-live="polite">{{ filteredFaqs.length }} {{ filteredFaqs.length === 1 ? 'answer' : 'answers' }}{{ search.trim() ? ' found' : ' to guide you' }}</p></div>
          <div v-if="pending" class="faq-loading" role="status" aria-label="Loading FAQs"><div v-for="index in 4" :key="index" class="tw:skeleton" /></div>
          <div v-else-if="error" class="faq-empty" role="alert"><CircleHelp :size="35" aria-hidden="true" /><h3>We couldn’t load your answers</h3><p>Please try again in a moment.</p><button type="button" class="tw:btn faq-primary" @click="refresh">Try again <RefreshCw :size="15" aria-hidden="true" /></button></div>
          <div v-else-if="filteredFaqs.length" class="faq-list"><details v-for="(faq, index) in filteredFaqs" :key="faq.id" class="tw:collapse faq-item"><summary class="tw:collapse-title"><span class="question-number">{{ String(index + 1).padStart(2, '0') }}</span><h3>{{ faq.title }}</h3><span class="question-toggle"><Plus class="faq-plus" :size="17" aria-hidden="true" /><Minus class="faq-minus" :size="17" aria-hidden="true" /></span></summary><div class="tw:collapse-content faq-answer"><p>{{ faq.description }}</p></div></details></div>
          <div v-else class="faq-empty"><Search :size="35" aria-hidden="true" /><h3>{{ search.trim() ? 'No matching answers just yet' : 'Helpful answers are on the way' }}</h3><p>{{ search.trim() ? 'Try a different keyword, or reach out with your question below.' : 'We’re preparing our help guides. You can still explore the catalogue or contact our team below.' }}</p><button v-if="search" type="button" class="tw:btn faq-primary" @click="search = ''">Show all questions <ArrowRight :size="15" aria-hidden="true" /></button><NuxtLink v-else to="/products" class="tw:btn faq-primary">Explore products <ArrowRight :size="15" aria-hidden="true" /></NuxtLink></div>
        </section>
      </div>
      <section class="faq-support" aria-labelledby="support-title"><div class="support-symbol"><Headphones :size="32" aria-hidden="true" /></div><div class="support-copy"><span class="eyebrow">LET’S TAKE IT FROM HERE</span><h2 id="support-title">Still need a hand?</h2><p>Share your question or product list with FGX MART. A conversation can make things clearer.</p></div><div class="support-actions"><a v-if="whatsappLink" :href="whatsappLink" target="_blank" rel="noopener noreferrer" class="tw:btn support-whatsapp"><MessageCircle :size="18" aria-hidden="true" /> Chat on WhatsApp <ArrowUpRight :size="16" aria-hidden="true" /></a><a v-if="email" :href="'mailto:' + email" class="tw:btn support-email"><Mail :size="18" aria-hidden="true" /> Email our team</a><NuxtLink v-if="!whatsappLink && !email" to="/products" class="tw:btn support-whatsapp">Explore the catalogue <ArrowRight :size="17" aria-hidden="true" /></NuxtLink></div></section>
    </div>
  </div>
</template>

<script setup>
import { ArrowRight, ArrowUpRight, Check, ChevronRight, CircleHelp, FileDown, Headphones, House, Mail, MessageCircle, MessagesSquare, Minus, PackageCheck, Plus, RefreshCw, Search, ShoppingBag, Sparkles, X } from 'lucide-vue-next'
const config = useRuntimeConfig()
const search = ref('')
const [{ data: response, pending, error, refresh }, { data: companyResponse }] = await Promise.all([
  useFetch(config.public.apiBase + '/faqs', { key: 'storefront-faqs', default: () => ({ data: [] }) }),
  useFetch(config.public.apiBase + '/company-info', { key: 'storefront-footer-company', default: () => ({ data: {} }) }),
])
const activeFaqs = computed(() => (response.value?.data || []).filter(faq => faq.status === true).sort((a,b) => (a.sort_order || 0) - (b.sort_order || 0)))
const filteredFaqs = computed(() => {
  const query = search.value.trim().toLowerCase()
  return activeFaqs.value.filter(faq => (faq.title + ' ' + faq.description).toLowerCase().includes(query))
})
const topics = [{ label: 'PDF download', query: 'pdf' }, { label: 'WhatsApp', query: 'whatsapp' }, { label: 'My account', query: 'account' }, { label: 'Delivery', query: 'delivery' }]
const company = computed(() => companyResponse.value?.data?.company || {})
const email = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(company.value.contact_email || '') ? company.value.contact_email : '')
const whatsappLink = computed(() => {
  const digits = String(company.value.phone_number || '').replace(/\D/g,'')
  return digits.length >= 7 ? 'https://wa.me/' + digits : null
})
useHead({ title: 'FAQs & Help | FGX MART', meta: [{ name: 'description', content: 'Find answers about FGX MART products, accounts, PDF downloads, WhatsApp enquiries, delivery and customer reviews.' }] })
</script>

<style scoped>
.faq-page { color: #322142; background: linear-gradient(180deg,#fff 0%,#fcfaff 65%,#fff 100%); }
.faq-container { max-width: var(--storefront-container-width); margin-inline: auto; padding: 23px 40px 64px; }
.faq-breadcrumb { display: flex; align-items: center; gap: 10px; font-size: 11px; color: #9985aa; margin-bottom: 24px; }
.faq-breadcrumb a { display: flex; align-items: center; gap: 6px; color: #73568c; }
.faq-hero { display: grid; grid-template-columns: 1.1fr .9fr; align-items: center; gap: 45px; padding: 48px 55px; background: linear-gradient(120deg,#f6f0fc,#fcfaff 57%,#ede4f9); border: 1px solid #eae0f3; border-radius: 20px; overflow: hidden; }
.eyebrow { font-size: 9px; font-weight: 650; letter-spacing: 1.8px; color: #9476ab; }
h1 { font-size: clamp(34px,3.5vw,54px); font-weight: 750; letter-spacing: -1.8px; line-height: 1.16; margin: 13px 0 17px; }
h1 > span { color: #725096; }
.hero-copy > p { max-width: 550px; font-size: 13px; line-height: 1.85; color: #806b90; margin-bottom: 24px; }
.faq-search { display: flex; align-items: center; gap: 12px; max-width: 590px; min-height: 52px; padding: 0 16px; background: white; border: 1px solid #ddd0e9; border-radius: 10px; box-shadow: 0 5px 16px #41205d05; color: #9776b1; }
.faq-search:focus-within { border-color: #9270b0; box-shadow: 0 0 0 3px #8c62b513; }
.faq-search > svg { flex-shrink: 0; }
.faq-search input { width: 100%; min-width: 0; background: transparent; border: 0; outline: none; box-shadow: none; font-size: 12px; color: #4e365f; height: 50px; }
.faq-search input::-webkit-search-cancel-button { appearance: none; }
.faq-search input::placeholder { color: #aa98b6; }
.faq-search button { display: grid; place-items: center; padding: 6px; border-radius: 5px; }
.popular-topics { display: flex; flex-wrap: wrap; align-items: center; gap: 7px; margin-top: 13px; font-size: 10px; color: #9a83aa; }
.popular-topics button { padding: 5px 9px; height: auto; border: 1px solid #e3d7ed; border-radius: 6px; background: #ffffffa3; color: #806291; font-size: 9px; cursor: pointer; }
.popular-topics button:hover, .popular-topics button[aria-pressed="true"] { background: #755095; color: white; border-color: #755095; }
.hero-visual { position: relative; min-height: 320px; width: 100%; max-width: 410px; justify-self: center; }
.help-orbit { display: grid; place-items: center; position: absolute; width: 205px; height: 205px; top: 47px; left: calc(50% - 102px); color: #a187bc; background: radial-gradient(circle,#e7daf5,#f4eefb); border: 1px solid #e1d2ed; border-radius: 50%; box-shadow: 0 0 0 22px #e8dcf333; }
.visual-card { position: absolute; display: flex; align-items: center; gap: 12px; background: #ffffffed; border: 1px solid #ece4f4; border-radius: 12px; padding: 16px 18px; box-shadow: 0 12px 30px #44265c0b; }
.visual-card > span { display: grid; place-items: center; width: 40px; height: 40px; color: #8866a7; background: #f2ebfa; border-radius: 10px; flex-shrink: 0; }
.visual-card small { display: block; font-size: 8px; letter-spacing: 1.1px; color: #ab96bb; margin-bottom: 4px; }
.visual-card strong { display: block; font-size: 12px; font-weight: 600; color: #654976; }
.visual-browse { top: 5px; left: 0; transform: rotate(-4deg); }.visual-browse > svg { color: #87a859; margin-left: 7px; }
.visual-pdf { top: 128px; right: 0; transform: rotate(5deg); }
.visual-chat { bottom: 0; left: 15px; transform: rotate(-3deg); }.visual-chat > span { color: #789a4d; background: #f0f6e7; }
.visual-spark { position: absolute; color: #ac8ac7; font-size: 26px; font-weight: 300; }.spark-one { right: 10px; top: 30px; }.spark-two { left: 18px; top: 150px; color: #9fba75; }
.faq-layout { display: grid; grid-template-columns: 295px minmax(0,1fr); gap: 36px; margin-top: 42px; align-items: start; }
.faq-sidebar { position: sticky; top: 24px; }
.guide-card { padding: 25px; background: #fff; border: 1px solid #e9e0f1; border-radius: 14px; }
.guide-icon { display: grid; place-items: center; width: 42px; height: 42px; border-radius: 12px; background: #f0e9f8; color: #9875b2; margin-bottom: 18px; }
.guide-card h2 { font-size: 17px; font-weight: 650; letter-spacing: -.4px; margin-bottom: 7px; }.guide-card > p { color: #8a7399; font-size: 11px; line-height: 1.8; }
.guide-card ol { display: grid; gap: 21px; padding: 0; list-style: none; margin: 25px 0; }.guide-card li { display: flex; gap: 12px; align-items: start; }.guide-card li > span { display: grid; place-items: center; width: 25px; height: 25px; flex-shrink: 0; background: #f5f0fa; color: #9774b0; border-radius: 50%; font-size: 10px; font-weight: 600; }.guide-card li strong { font-size: 11px; font-weight: 600; }.guide-card li p { font-size: 10px; color: #9a85a7; line-height: 1.8; margin-top: 4px; }.guide-card > a { display: flex; align-items: center; justify-content: space-between; color: #72518f; font-size: 11px; font-weight: 600; padding-top: 17px; border-top: 1px solid #f0eaf5; }
.order-help { display: flex; gap: 11px; align-items: center; padding: 19px; background: #f2f6eb; color: #799454; border: 1px solid #e7eedb; border-radius: 12px; margin-top: 14px; }.order-help > span { flex: 1; }.order-help strong { display: block; font-size: 10px; font-weight: 600; color: #687e4e; }.order-help small { display: block; font-size: 9px; color: #8c9b79; margin-top: 4px; }.order-help svg { flex-shrink: 0; }
.answers-heading { display: flex; justify-content: space-between; align-items: end; flex-wrap: wrap; gap: 12px; margin-bottom: 23px; }.answers-heading h2 { font-size: 24px; font-weight: 700; letter-spacing: -.7px; margin-top: 6px; }.answers-heading > p { font-size: 10px; color: #a58eaf; margin: 0 0 3px; }
.faq-list { display: grid; gap: 12px; }
.faq-item { display: block; border: 1px solid #e9e1f0; border-radius: 12px; background: #fff; min-height: 0; overflow: hidden; transition: border-color .2s, box-shadow .2s; }.faq-item:hover { border-color: #cfbbdf; }.faq-item[open] { border-color: #cdb7df; box-shadow: 0 5px 20px #51326c06; }
.faq-item > summary { display: flex; align-items: center; gap: 15px; padding: 21px 22px; min-height: 0; list-style: none; cursor: pointer; background: transparent; }.faq-item > summary::-webkit-details-marker { display: none; }.faq-item > summary::after { display: none; }.faq-item > summary:focus-visible { outline: 2px solid #9b77b7; outline-offset: -4px; border-radius: 12px; }
.question-number { color: #b8a2c7; font-size: 11px; font-weight: 500; flex-shrink: 0; }.faq-item h3 { flex: 1; font-size: 13px; font-weight: 600; line-height: 1.7; margin: 0; color: #655071; }.faq-item[open] h3 { color: #735090; }.question-toggle { display: grid; place-items: center; width: 28px; height: 28px; background: #f6f1fb; color: #9c7ab5; border-radius: 8px; flex-shrink: 0; }.faq-item[open] .question-toggle { background: #79529a; color: #fff; }.faq-minus { display: none; }.faq-item[open] .faq-minus { display: block; }.faq-item[open] .faq-plus { display: none; }
.faq-item > .faq-answer { padding: 0 65px 23px 51px; visibility: visible; min-height: 0; }.faq-answer p { padding-top: 17px; border-top: 1px solid #f0eaf5; color: #84708f; font-size: 12px; line-height: 1.95; white-space: pre-line; overflow-wrap: anywhere; }.faq-item:not([open]) > .faq-answer { display: none; }
.faq-loading { display: grid; gap: 12px; }.faq-loading > div { min-height: 70px; border-radius: 12px; background: #f0eaf6; }
.faq-empty { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 13px; min-height: 280px; justify-content: center; padding: 35px 24px; border: 1px dashed #ddcde9; border-radius: 14px; background: #fff; color: #a088b2; }.faq-empty h3 { font-size: 18px; color: #735784; font-weight: 600; }.faq-empty p { max-width: 400px; font-size: 12px; line-height: 1.9; color: #947e9f; }.faq-primary { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: #72508e; color: #fff; border: 0; border-radius: 8px; min-height: 40px; height: auto; font-size: 11px; }
.faq-support { position: relative; display: flex; align-items: center; gap: 24px; margin-top: 44px; padding: 32px 36px; background: linear-gradient(110deg,#3c255e,#634286); color: white; border-radius: 16px; }.support-symbol { display: grid; place-items: center; width: 67px; height: 67px; flex-shrink: 0; background: #ffffff13; border: 1px solid #ffffff20; border-radius: 18px; color: #d4c0e7; }.support-copy { flex: 1; }.support-copy .eyebrow { color: #bf9ed9; }.support-copy h2 { margin: 7px 0 9px; font-size: 25px; font-weight: 650; letter-spacing: -.5px; }.support-copy p { font-size: 12px; color: #d2c2e0; line-height: 1.8; max-width: 540px; }.support-actions { display: flex; gap: 10px; flex-wrap: wrap; }.support-actions .tw\:btn { display: flex; align-items: center; justify-content: center; min-height: 44px; height: auto; padding: 12px 17px; border-radius: 9px; gap: 8px; font-size: 11px; font-weight: 600; }.support-whatsapp { background: #91bb55; color: #263e13; border: 1px solid #91bb55; }.support-whatsapp:hover { background: #a5cd6a; }.support-email { background: transparent; border: 1px solid #c5aad86b; color: #fff; }.support-email:hover { background: #ffffff0d; }
.faq-page a:focus-visible, .faq-page button:focus-visible { outline: 2px solid #a58abd; outline-offset: 4px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media(max-width:1100px) { .faq-container { padding-inline: 24px; }.faq-hero { padding: 35px; gap: 25px; }.hero-visual { transform: scale(.9); }.faq-layout { grid-template-columns: 250px minmax(0,1fr); gap: 24px; }.faq-support { flex-wrap: wrap; }.support-actions { margin-left: 91px; } }
@media(max-width:800px) { .faq-hero { grid-template-columns: 1fr; }.hero-visual { display: none; }.hero-copy > p { max-width: 620px; }.faq-search { max-width: none; }.faq-layout { grid-template-columns: 1fr; margin-top: 30px; }.faq-sidebar { position: static; display: none; }.faq-support { padding: 26px; gap: 18px; }.support-symbol { width: 52px; height: 52px; border-radius: 14px; }.support-actions { margin-left: 0; }.support-copy { flex-basis: calc(100% - 75px); }.answers-heading h2 { font-size: 22px; } }
@media(max-width:760px) { .faq-container { padding: 18px 16px 40px; }.faq-breadcrumb { margin-bottom: 18px; }.faq-hero { padding: 27px 23px; border-radius: 15px; }h1 { font-size: 36px; letter-spacing: -1.2px; }.hero-copy > p { font-size: 12px; }.eyebrow { font-size: 8px; letter-spacing: 1.3px; }.faq-item > summary { padding: 17px 15px; gap: 11px; }.faq-item h3 { font-size: 12px; }.faq-item > .faq-answer { padding: 0 19px 19px 39px; }.faq-answer p { font-size: 11px; }.question-toggle { width: 25px; height: 25px; }.faq-support { margin-top: 30px; padding: 24px; }.support-copy h2 { font-size: 23px; }.support-copy p { font-size: 11px; }.support-actions { width: 100%; }.support-actions > * { flex: 1; }.faq-search { padding-inline: 12px; gap: 9px; }.faq-search input { font-size: 11px; }.popular-topics { gap: 6px; } }
@media(prefers-reduced-motion:reduce) { .faq-item { transition: none; } }
</style>
