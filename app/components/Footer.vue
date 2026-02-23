<template>
  <footer class="main-footer">
    <!-- Main Footer Container (Handles the side-by-side background split) -->
    <v-sheet class="footer-content-wrapper">
      <v-container class="custom-container pa-0">
        <v-row no-gutters class="footer-top">
          <!-- Left Info Section (White Background area) -->
          <v-col cols="12" md="3" class="bg-white pa-8 pa-md-12 d-flex flex-column align-start">
            <NuxtLink to="/" class="mb-6">
              <img src="~/assets/images/brand/fgx-logo.svg" alt="FGXMART" height="55" />
            </NuxtLink>
            
            <p class="text-body-2 text-grey-darken-1 mb-8 intro-text">
              {{ companyInfo?.intro || 'FGXMART is your premier destination for world-class products. We provide a curated selection of high-quality items served with excellence.' }}
            </p>

            <div class="contact-info">
              <div class="d-flex align-center mb-4">
                <svg width="65" height="65" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mr-3"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM10 5.47l4 1.4v11.66l-4-1.4V5.47zm-5 .99l3-1.01v11.7l-3 1.16V6.46zm14 11.08l-3 1.01V6.86l3-1.16v11.84z" fill="#122b3b"></path></svg>
                <span class="text-body-2 text-grey-darken-3 c-address">
                  {{ companyInfo?.address_line_1 }}<span v-if="companyInfo?.city">, {{ companyInfo.city }}</span>
                </span>
              </div>
              <div class="d-flex align-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mr-3"><path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" fill="#122b3b"></path></svg>
                <span class="text-body-2 text-grey-darken-3 c-email">{{ companyInfo?.contact_email }}</span>
              </div>
            </div>
          </v-col>

          <!-- Right Links Section (Purple Background area) -->
          <v-col cols="12" md="9" class="bg-primary-dark pa-8 pa-md-12">
            <v-row>
              <!-- Categories Column -->
              <v-col cols="12" sm="6" md="3">
                <h3 class="footer-title mb-6">Categories</h3>
                <ul v-if="categories.length" class="footer-links">
                  <li v-for="cat in categories" :key="cat.id">
                    <NuxtLink :to="`/category/${cat.slug}`">{{ cat.name }}</NuxtLink>
                  </li>
                </ul>
                <div v-else class="text-grey-lighten-1 text-caption">Loading categories...</div>
              </v-col>

              <!-- Useful Links Column (Mirrors Header) -->
              <v-col cols="12" sm="6" md="3">
                <h3 class="footer-title mb-6">Useful Links</h3>
                <ul class="footer-links">
                  <li><NuxtLink to="/">Home</NuxtLink></li>
                  <li><NuxtLink to="/products">Products</NuxtLink></li>
                  <li><NuxtLink to="#">About Us</NuxtLink></li>
                  <li><NuxtLink to="#">Blog</NuxtLink></li>
                  <li><NuxtLink to="#">Contact Us</NuxtLink></li>
                </ul>
              </v-col>

              <!-- Help Center Column -->
              <v-col cols="12" sm="6" md="3">
                <h3 class="footer-title mb-6">Help Center</h3>
                <ul class="footer-links">
                  <li><NuxtLink to="/my-account?tab=order">Your Orders</NuxtLink></li>
                  <li><NuxtLink to="/my-account?tab=profile">Your Account</NuxtLink></li>
                  <li><NuxtLink to="/faqs">FAQs</NuxtLink></li>
                  <!-- Dynamic Footer Pages -->
                  <li v-for="page in footerPages" :key="page.id">
                    <NuxtLink :to="`/${page.slug}`">{{ page.title }}</NuxtLink>
                  </li>
                  <li><NuxtLink to="#">Track Order</NuxtLink></li>
                </ul>
              </v-col>

              <!-- Contact Us Column -->
              <v-col cols="12" sm="6" md="3">
                <h3 class="footer-title mb-6">Contact Us</h3>
                <div class="contact-details">
                  <div class="mb-4">
                    <div class="text-caption text-grey-lighten-1"><p>Hotline 24/7:</p></div>
                    <div class="text-h6 font-weight-bold text-white">{{ companyInfo?.phone_number || '+91 888 104 2340' }}</div>
                  </div>
                  <div>
                    <div class="text-caption text-grey-lighten-1"><p>Email Address:</p></div>
                    <div class="text-body-1 font-weight-medium text-white">{{ companyInfo?.contact_email }}</div>
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-col>
        </v-row>
      </v-container>
    </v-sheet>

    <!-- Bottom Copyright Section -->
    <v-sheet color="grey-darken-4" class="py-2 text-center">
      <v-container class="custom-container">
        <p class="text-caption text-grey-lighten-1 mb-0">
          ©{{ new Date().getFullYear() }} {{ companyInfo?.name || 'FGXMART' }} All rights reserved
        </p>
      </v-container>
    </v-sheet>
  </footer>
</template>

<script setup>
const config = useRuntimeConfig()
const apiBase = config.public.apiBase || 'http://localhost:8000/api/v1'

// Fetch Categories (Dynamic)
const { data: catRes } = await useFetch(`${apiBase}/categories?all=1`)
const categories = computed(() => catRes.value?.data?.slice(0, 6) || [])

// Fetch Company Details
const { data: compRes } = await useFetch(`${apiBase}/company-info`)
const companyInfo = computed(() => compRes.value?.data?.company || {})

// Fetch Dynamic Pages
const { data: pagesRes } = await useFetch(`${apiBase}/pages`)
const pages = computed(() => pagesRes.value?.data || [])
const footerPages = computed(() => pages.value.filter(p => p.position === 'footer' || p.position === 'both'))
const headerPages = computed(() => pages.value.filter(p => p.position === 'header' || p.position === 'both'))
</script>

<style scoped lang="scss">
.main-footer {
  border-top: 1px solid #eee;
}

.text-caption{
  font-family: inherit;
}

/* Linear Gradient Split for Full-Width Background Look */
.footer-content-wrapper {
  background: linear-gradient(to right, #ffffff 25%, var(--theme-blue) 25%);
}

/* On medium screens and smaller, make it all one color or stack */
@media (max-width: 959px) {
  .footer-content-wrapper {
    background: #ffffff;
  }
}

.bg-primary-dark {
  background-color: var(--theme-blue) !important;
}

.intro-text {
  line-height: 1.6;
}

.footer-title {
  color: #fff;
  font-size: 1.4rem;
  font-weight: 700;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -8px;
    left: 0;
    width: 30px;
    height: 2px;
    background-color: #fff;
    opacity: 0.3;
  }
}

.contact-details {
  p {
    margin: 0;
    font-family: inherit;
    font-size: 0.9rem;
  }
}

.footer-links {
  list-style: none;
  padding: 0;
  margin: 0;
  
  li {
    margin-bottom: 12px;
    
    a {
      color: #cbd5e1;
      text-decoration: none;
      font-size: 1.05rem;
      transition: all 0.2s;
      
      &:hover {
        color: #fff;
        padding-left: 5px;
      }
    }
  }
}

.contact-info{
  .c-address{
    font-size: 1.3rem;
    font-family: inherit;
  }
  .c-email{
    font-size: 1.2rem;
    font-family: inherit;
  }
}

.bg-white {
  background-color: #fff !important;
}

@media (max-width: 959px) {
  .footer-top {
    flex-direction: column;
  }
  .bg-primary-dark {
    padding-top: 40px !important;
  }
}
</style>
