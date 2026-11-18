<template>
  <section id="customer-reviews" class="reviews-section" aria-labelledby="reviews-heading" data-theme="fgx">
    <header class="reviews-heading"><div><span class="reviews-eyebrow">YOUR EXPERIENCE MATTERS</span><h2 id="reviews-heading">Customer reviews</h2><p>Honest feedback from our registered customers.</p></div><span class="reviews-symbol"><MessagesSquare :size="26" aria-hidden="true" /></span></header>
    <p v-if="error" class="reviews-alert" role="alert">Reviews are temporarily unavailable. <button type="button" @click="refresh">Try again</button></p>
    <div v-else class="reviews-layout" :aria-busy="pending">
      <aside class="reviews-summary">
        <div class="review-score"><strong>{{ summary.count ? Number(summary.average).toFixed(1) : '—' }}</strong><div><span class="summary-stars" :class="{ unrated: !summary.count }" aria-hidden="true"><Star v-for="star in 5" :key="star" :size="17" :fill="star <= Math.round(summary.average || 0) ? 'currentColor' : 'none'" aria-hidden="true" /></span><p>{{ summary.count ? `${summary.count} customer ${summary.count === 1 ? 'review' : 'reviews'}` : 'No ratings yet' }}</p></div></div>
        <div class="rating-breakdown" aria-label="Rating breakdown"><div v-for="row in summary.distribution" :key="row.rating" class="rating-row"><span>{{ row.rating }} <Star :size="12" aria-hidden="true" /></span><progress class="tw:progress" :value="row.count" :max="summary.count || 1" :aria-label="`${row.rating} stars: ${row.count} reviews`" /><span>{{ row.count }}</span></div></div>
        <h3>Share your perspective</h3><p>Your experience helps others make confident choices and helps us improve.</p>
        <button v-if="auth.isLoggedIn" class="tw:btn tw:btn-primary review-write" type="button" :disabled="ownLoading" @click="openForm">{{ ownLoading ? 'Loading your review…' : ownReview ? 'Edit your review' : 'Write a review' }} <PencilLine :size="16" aria-hidden="true" /></button>
        <NuxtLink v-else class="tw:btn tw:btn-primary review-write" :to="loginLink">Sign in to write a review <ArrowRight :size="16" aria-hidden="true" /></NuxtLink>
        <span class="registered-note"><ShieldCheck :size="14" aria-hidden="true" /> Reviews from registered customers</span>
      </aside>
      <div class="reviews-content">
        <div v-if="!summary.count" class="reviews-empty"><span><MessageSquarePlus :size="35" aria-hidden="true" /></span><h3>Be the first to share your experience</h3><p>No reviews yet. Tell us what you think of this product. Your feedback helps fellow shoppers and gives us valuable insight into what matters to you.</p><span class="empty-caption">A few thoughtful words can make a difference.</span></div>
        <div v-else class="review-list"><article v-for="review in result.data" :key="review.id" class="customer-review"><header><span class="review-avatar" aria-hidden="true">{{ initials(review.name) }}</span><div><h3>{{ review.name }}</h3><time :datetime="review.created_at">{{ date(review.created_at) }}</time></div><span class="customer-stars" :aria-label="`${review.rating} out of 5 stars`"><Star v-for="star in 5" :key="star" :size="14" :fill="star <= Math.round(review.rating) ? 'currentColor' : 'none'" aria-hidden="true" /></span></header><p>{{ review.review }}</p></article>
          <nav v-if="result.meta.last_page > 1" class="review-pagination" aria-label="Review pages"><button class="tw:btn tw:btn-sm" type="button" :disabled="page === 1 || pending" @click="page--">Previous</button><span>Page {{ page }} of {{ result.meta.last_page }}</span><button class="tw:btn tw:btn-sm" type="button" :disabled="page >= result.meta.last_page || pending" @click="page++">Next</button></nav>
        </div>

        <p v-if="message && !formOpen" class="review-message" :class="{ 'is-error': messageError }" :role="messageError ? 'alert' : 'status'">{{ message }}</p>
      </div>
    </div>
    <dialog ref="reviewDialog" class="review-dialog" aria-labelledby="review-form-title" @cancel.prevent="closeForm" @click="onBackdrop">
        <form v-if="formOpen && auth.isLoggedIn" ref="formElement" class="review-form" @submit.prevent="submitReview">
          <div class="review-form-heading"><h3 id="review-form-title">{{ ownReview ? 'Edit your review' : 'Your experience, in your words' }}</h3><button class="tw:btn tw:btn-ghost tw:btn-sm" type="button" :disabled="saving" aria-label="Close review form" @click="closeForm"><X :size="18" /></button></div>
          <fieldset :disabled="saving"><legend>Your rating <span aria-hidden="true">*</span></legend><div class="rating-picker"><label v-for="star in 5" :key="star" :class="{ selected: star <= form.rating }"><input v-model.number="form.rating" type="radio" name="review-rating" :value="star" :aria-label="`${star} ${star === 1 ? 'star' : 'stars'}`" required /><Star :size="27" :fill="star <= form.rating ? 'currentColor' : 'none'" aria-hidden="true" /></label><span>{{ ratingLabels[form.rating] || 'Choose a rating' }}</span></div></fieldset>
          <label for="customer-review-text" class="review-label">Your review <span aria-hidden="true">*</span></label><textarea id="customer-review-text" v-model="form.review" class="tw:textarea" rows="4" minlength="10" maxlength="2000" required :disabled="saving" placeholder="What stood out? Share the details other shoppers would find helpful." /><div class="review-form-foot"><span>{{ form.review.length }}/2000 · At least 10 characters</span><button class="tw:btn tw:btn-primary" type="submit" :disabled="saving || !form.rating || form.review.trim().length < 10">{{ saving ? 'Saving…' : ownReview ? 'Update review' : 'Submit review' }}</button></div>
          <p v-if="message && messageError" class="review-message is-error" role="alert">{{ message }}</p>
        </form>
    </dialog>
  </section>
</template>

<script setup>
import { ArrowRight, MessagesSquare, MessageSquarePlus, PencilLine, ShieldCheck, Star, X } from 'lucide-vue-next'
import { useAuthStore } from '~/stores/auth'
const props = defineProps({ productId: { type: Number, required: true } })
const emit = defineEmits(['summary'])
const auth = useAuthStore(), route = useRoute(), config = useRuntimeConfig()
const page = ref(1), formOpen = ref(false), saving = ref(false), ownReview = ref(null), ownLoading = ref(false), message = ref(''), messageError = ref(false), formElement = ref(null)
const reviewDialog = ref(null)
let previousFocus
const closeForm = () => { if (!saving.value) formOpen.value = false }
const onBackdrop = event => { if (event.target === reviewDialog.value) closeForm() }
watch(formOpen, async opened => {
  if (opened) {
    previousFocus = document.activeElement
    await nextTick()
    if (!formOpen.value) return
    reviewDialog.value?.showModal()
    formElement.value?.querySelector('input')?.focus({ preventScroll: true })
  } else {
    reviewDialog.value?.close()
    if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true })
  }
})
watch(() => route.fullPath, () => { formOpen.value = false })
const form = ref({ rating: 0, review: '' })
const ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent']
const emptySummary = { count: 0, average: null, distribution: [5,4,3,2,1].map(rating => ({ rating, count: 0 })) }
const endpoint = computed(() => `${config.public.apiBase}/products/${props.productId}`)
const { data: result, pending, error, refresh } = await useAsyncData(`reviews-${props.productId}`, () => $fetch(`${endpoint.value}/reviews`, { query: { page: page.value } }), { watch: [page], default: () => ({ data: [], summary: emptySummary, meta: { last_page: 1 } }) })
const summary = computed(() => result.value?.summary || emptySummary)
watch(summary, value => emit('summary', value), { immediate: true })
const loginLink = computed(() => ({ path: '/login', query: { redirect: `${route.path}#customer-reviews` } }))
const initials = name => (name || 'Customer').trim().split(/\s+/).slice(0,2).map(word => word[0]).join('').toUpperCase()
const date = value => new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(new Date(value))
let ownRequest = 0
const loadOwnReview = async () => {
  const version = ++ownRequest
  ownReview.value = null; formOpen.value = false; ownLoading.value = false
  if (!auth.token) return
  ownLoading.value = true
  try {
    const response = await $fetch(`${endpoint.value}/review`, { headers: { Authorization: `Bearer ${auth.token}` } })
    if (version === ownRequest) ownReview.value = response.data
  } catch { /* The submission endpoint remains authoritative if this lookup fails. */ }
  finally { if (version === ownRequest) ownLoading.value = false }
}
onMounted(() => { watch(() => auth.token, loadOwnReview, { immediate: true }) })
onUnmounted(() => { ownRequest++ })
const openForm = async () => {
  form.value = { rating: Number(ownReview.value?.rating || 0), review: ownReview.value?.review || '' }
  message.value = ''; formOpen.value = true

}
const submitReview = async () => {
  if (saving.value || !auth.token) return
  saving.value = true; message.value = ''; messageError.value = false
  try {
    const response = await $fetch(`${endpoint.value}/reviews`, { method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }, body: { rating: form.value.rating, review: form.value.review.trim() } })
    ownReview.value = response.data; formOpen.value = false; message.value = response.message
    if (page.value !== 1) page.value = 1
    else await refresh()
  } catch (error) {
    messageError.value = true
    message.value = error.status === 401 ? 'Your session has expired. Please sign in again to submit your review.' : Object.values(error.data?.errors || {}).flat()[0] || 'We couldn’t save your review. Please try again.'
  } finally { saving.value = false }
}
</script>

<style scoped>
.reviews-section { border: 1px solid #e9e1f0; border-radius: 16px; background: white; overflow: hidden; color: #30203f; }
.reviews-heading { display: flex; justify-content: space-between; align-items: center; gap: 20px; padding: 27px 30px; background: linear-gradient(115deg,#faf7ff,#fff); border-bottom: 1px solid #efe8f5; }
.reviews-eyebrow { color: #947aa9; font-size: 9px; font-weight: 650; letter-spacing: 1.8px; }
.reviews-heading h2 { font-size: 23px; font-weight: 700; margin: 5px 0; letter-spacing: -.6px; }
.reviews-heading p, .reviews-summary > p { margin: 0; color: #776385; font-size: 12px; line-height: 1.8; }
.reviews-symbol { display: grid; place-items: center; width: 52px; height: 52px; flex-shrink: 0; background: #eee6f8; color: #71479c; border-radius: 15px; }
.reviews-layout { display: grid; grid-template-columns: minmax(240px,.8fr) minmax(0,1.7fr); }
.reviews-summary { padding: 28px; border-right: 1px solid #efe8f5; background: #fdfbff; }
.review-score { display: flex; align-items: center; gap: 16px; }
.review-score > strong { font-size: 48px; font-weight: 700; letter-spacing: -2px; line-height: 1.2; }
.summary-stars { display: flex; gap: 3px; color: #d9a34a; font-size: 20px; letter-spacing: 3px; }
.summary-stars.unrated { color: #dcd1e4; }
.review-score p { margin: 3px 0 0; color: #9b88a7; font-size: 10px; }
.rating-breakdown { display: grid; gap: 10px; margin: 25px 0 28px; }
.rating-row { display: flex; align-items: center; gap: 11px; font-size: 11px; color: #9b88a7; }
.rating-row > span:first-child { display: flex; gap: 4px; align-items: center; color: #7e668e; }
.rating-row > span:last-child { min-width: 18px; text-align: right; }
.rating-row progress { flex: 1; width: 0; height: 6px; color: #8d69b3; background: #ece5f3; }
.rating-row progress::-webkit-progress-value { background: #8d69b3; border-radius: 8px; }
.rating-row progress::-moz-progress-bar { background: #8d69b3; }
.reviews-summary h3 { font-size: 15px; font-weight: 650; margin: 0 0 7px; }
.review-write { display: flex; width: 100%; gap: 8px; margin: 18px 0 12px; min-height: 41px; height: auto; padding: 10px; font-size: 11px; border-radius: 8px; }
.review-write, .review-form-foot button { background: #503080; color: white; border: 1px solid #503080; }
.review-write:hover, .review-form-foot button:hover { background: #674391; }
.review-write:disabled, .review-form-foot button:disabled { opacity: .5; cursor: not-allowed; }
.registered-note { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 9px; color: #a08bad; }
.reviews-content { min-width: 0; padding: 28px; }
.reviews-empty { display: flex; flex-direction: column; align-items: center; text-align: center; justify-content: center; min-height: 310px; padding: 15px 22px; }
.reviews-empty > span:first-child { display: grid; place-items: center; width: 74px; height: 74px; border-radius: 24px; background: #f2ecfa; color: #9674b7; margin-bottom: 20px; }
.reviews-empty h3 { font-size: 18px; font-weight: 650; margin: 0 0 10px; }
.reviews-empty p { max-width: 430px; color: #776385; font-size: 12px; line-height: 1.9; margin: 0; }
.empty-caption { margin-top: 17px; font-size: 10px; color: #b09dbb; }
.customer-review { padding: 20px 0; border-bottom: 1px solid #f0eaf5; }
.customer-review:first-child { padding-top: 0; }
.customer-review header { display: flex; gap: 11px; align-items: center; flex-wrap: wrap; }
.review-avatar { width: 38px; height: 38px; display: grid; place-items: center; border-radius: 12px; background: #f0e9f7; color: #8d66ab; font-size: 12px; font-weight: 600; }
.customer-review h3 { font-size: 12px; font-weight: 650; margin: 0; }
.customer-review time { font-size: 10px; color: #b09dbb; }
.customer-stars { margin-left: auto; display: flex; gap: 2px; color: #d8a344; }
.customer-review > p { white-space: pre-wrap; overflow-wrap: anywhere; font-size: 12px; line-height: 1.9; color: #776385; margin: 14px 0 0; }
.review-pagination { display: flex; align-items: center; justify-content: space-between; gap: 8px; font-size: 10px; color: #9b86a8; margin-top: 20px; }
.review-pagination button { border: 1px solid #e3d8ed; border-radius: 7px; padding: 7px 12px; background: #faf7fd; color: #684781; }
.review-pagination button:disabled { opacity: .45; cursor: not-allowed; }
.review-dialog { position: fixed; inset: 0; width: 100vw; max-width: none; height: 100dvh; max-height: none; margin: 0; padding: 16px; border: 0; background: #24153570; backdrop-filter: blur(4px); color: #30203f; }
.review-dialog[open] { display: grid; place-items: center; }
.review-dialog::backdrop { background: transparent; }
.review-form { background: #fff; border: 1px solid #e8dff0; border-radius: 16px; margin: 0; padding: 28px; width: min(560px,100%); max-height: calc(100dvh - 32px); overflow-y: auto; box-shadow: 0 24px 80px #24153530; }
.review-form-foot button { padding: 9px 18px; }
.review-form-heading { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
.review-form h3 { font-size: 15px; font-weight: 650; margin: 0; }
.review-form fieldset { border: 0; padding: 0; margin: 0 0 17px; }
.review-form legend, .review-label { font-size: 11px; font-weight: 600; color: #84688f; }
.rating-picker { display: flex; align-items: center; flex-wrap: wrap; gap: 7px; margin-top: 8px; }
.rating-picker label { position: relative; display: flex; padding: 3px; color: #cbbdd5; cursor: pointer; }
.rating-picker label.selected { color: #d6a041; }
.rating-picker input { position: absolute; opacity: 0; inset: 0; width: 100%; cursor: pointer; }
.rating-picker label:focus-within { outline: 2px solid #8d69b3; outline-offset: 2px; border-radius: 5px; }
.rating-picker > span { font-size: 10px; color: #a18bac; margin-left: 5px; }
.review-label { display: block; margin-bottom: 8px; }
.review-form textarea { display: block; width: 100%; min-height: 115px; border: 1px solid #dfd2e9; border-radius: 8px; background: white; padding: 12px; font-size: 12px; line-height: 1.8; color: #614671; resize: vertical; }
.review-form-foot { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-top: 12px; }
.review-form-foot > span { font-size: 9px; color: #a58fb1; }
.review-form-foot button { font-size: 11px; min-height: 38px; height: auto; border-radius: 8px; }
.review-message, .reviews-alert { padding: 13px 15px; border-radius: 8px; background: #eff6e9; color: #68824b; font-size: 12px; line-height: 1.7; margin: 15px 0 0; }
.review-message.is-error, .reviews-alert { background: #fff1f2; color: #a56a7d; }
.reviews-alert { margin: 20px; }.reviews-alert button { text-decoration: underline; }
@media(max-width:800px) { .reviews-layout { grid-template-columns: 1fr; }.reviews-summary { border-right: 0; border-bottom: 1px solid #efe8f5; }.reviews-heading, .reviews-summary, .reviews-content { padding: 22px; }.reviews-empty { min-height: 250px; padding: 10px 0; }.review-form { padding: 16px; }.reviews-heading h2 { font-size: 21px; } }
</style>
