<template>
  <div class="auth-page d-flex align-center justify-center">
    <div class="auth-container" :class="{ 'active': isActive }">
      
      <!-- Sign Up Form -->
      <div class="form-container sign-up-container">
        <v-form @submit.prevent="handleSignUp">
          <h1 class="text-h4 font-weight-bold mb-2">Create Account</h1>
          
          <v-alert
            v-if="errorMessage && isActive"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4 text-caption"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <v-alert
            v-if="successMessage && isActive"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-4 text-caption"
          >
            {{ successMessage }}
          </v-alert>

          
          <v-text-field
            v-model="signUpForm.name"
            label="Full Name"
            variant="filled"
            density="comfortable"
            class="mb-2 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <v-text-field
            v-model="signUpForm.email"
            label="Email Address"
            variant="filled"
            density="comfortable"
            class="mb-2 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <v-text-field
            v-model="signUpForm.password"
            label="Password"
            type="password"
            variant="filled"
            density="comfortable"
            class="mb-2 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <v-text-field
            v-model="signUpForm.confirmPassword"
            label="Confirm Password"
            type="password"
            variant="filled"
            density="comfortable"
            class="mb-6 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <div class="auth-btn-wrapper" @mouseenter="handleHover('signup')">
            <v-btn
              type="submit"
              color="primary"
              class="auth-btn font-weight-bold text-none"
              size="large"
              rounded="pill"
              elevation="0"
              :disabled="!isSignUpValid"
              :loading="loading"
            >
              <Transition name="fade" mode="out-in">

                <span :key="signUpText" class="btn-text-content">{{ signUpText }}</span>
              </Transition>
            </v-btn>
          </div>
        </v-form>
      </div>

      <!-- Sign In Form -->
      <div class="form-container sign-in-container">
        <v-form @submit.prevent="handleSignIn">
          <h1 class="text-h4 font-weight-bold mb-2">Sign In</h1>
          
          <v-alert
            v-if="errorMessage && !isActive"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4 text-caption"
            closable
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <v-alert
            v-if="successMessage && !isActive"
            type="success"
            variant="tonal"
            density="compact"
            class="mb-4 text-caption"
          >
            {{ successMessage }}
          </v-alert>

          
          <v-text-field
            v-model="signInForm.email"
            label="Email Address"
            variant="filled"
            density="comfortable"
            class="mb-2 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <v-text-field
            v-model="signInForm.password"
            label="Password"
            type="password"
            variant="filled"
            density="comfortable"
            class="mb-2 custom-field"
            bg-color="#f2f2f2"
            hide-details
            color="primary"
            flat
          ></v-text-field>

          <div class="text-right mb-6">
            <a href="#" class="text-caption text-grey-darken-1 text-decoration-none">Forgot your password?</a>
          </div>

          <div class="auth-btn-wrapper" @mouseenter="handleHover('signin')">
            <v-btn
              type="submit"
              color="primary"
              class="auth-btn font-weight-bold text-none"
              size="large"
              rounded="pill"
              elevation="0"
              :disabled="!isSignInValid"
              :loading="loading"
            >
              <Transition name="fade" mode="out-in">

                <span :key="signInText" class="btn-text-content">{{ signInText }}</span>
              </Transition>
            </v-btn>
          </div>
        </v-form>
      </div>

      <!-- Overlay Section -->
      <div class="overlay-container">
        <div class="overlay">
          <!-- Left Panel (Visible when Signup is active) -->
          <div class="overlay-panel overlay-left">
            <h1 class="text-h3 font-weight-bold mb-4">Welcome Back!</h1>
            <p class="text-body-1 opacity-80 mb-8">To keep connected with us please login with your personal info</p>
            <v-btn
              variant="outlined"
              color="white"
              class="font-weight-bold text-none px-12"
              rounded="pill"
              size="large"
              @click="isActive = false"
            >
              SIGN IN
            </v-btn>
          </div>

          <!-- Right Panel (Visible when Signin is active) -->
          <div class="overlay-panel overlay-right">
            <h1 class="text-h3 font-weight-bold mb-4">Hey There!</h1>
            <p class="text-body-1 opacity-80 mb-8">Create an account and start your journey with FGXMART</p>
            <v-btn
              variant="outlined"
              color="white"
              class="font-weight-bold text-none px-12"
              rounded="pill"
              size="large"
              @click="isActive = true"
            >
              SIGN UP
            </v-btn>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '~/stores/auth'
import { useCartStore } from '~/stores/cart'
import { useWishlistStore } from '~/stores/wishlist'

definePageMeta({
  layout: false // Full screen auth page
})

useHead({
  title: 'Authentication - FGXMART'
})

const router = useRouter()
const config = useRuntimeConfig()
const auth = useAuthStore()
const cart = useCartStore()
const wishlist = useWishlistStore()

const isActive = ref(false)
const signInText = ref('SIGN IN')
const signUpText = ref('SIGN UP')
const loading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const signInForm = ref({
  email: '',
  password: ''
})

const signUpForm = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const isSignInValid = computed(() => {
  return signInForm.value.email && signInForm.value.password
})

const isSignUpValid = computed(() => {
  return signUpForm.value.name && 
         signUpForm.value.email && 
         signUpForm.value.password && 
         signUpForm.value.confirmPassword &&
         signUpForm.value.password === signUpForm.value.confirmPassword
})

const handleHover = (type) => {
  if (type === 'signin' && !isSignInValid.value) {
    signInText.value = 'PLEASE FILL INPUTS'
    setTimeout(() => {
      signInText.value = 'SIGN IN'
    }, 1200)
  }
  if (type === 'signup' && !isSignUpValid.value) {
    signUpText.value = 'PLEASE FILL INPUTS'
    setTimeout(() => {
      signUpText.value = 'SIGN UP'
    }, 1200)
  }
}

const handleSignIn = async () => {
  if (!isSignInValid.value) return
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const data = await $fetch(`${config.public.apiBase}/login`, {
      method: 'POST',
      body: signInForm.value
    })
    
    auth.setToken(data.access_token)
    auth.setUser(data.user)

    // Sync cart & wishlist
    await cart.syncCart()
    await wishlist.syncWishlist()

    successMessage.value = 'Login Successful! Redirecting...'
    
    // Clear fields
    signInForm.value = { email: '', password: '' }

    // Redirect after visibility
    setTimeout(() => {
      if (window.history.length > 2) {
        router.back()
      } else {
        router.push('/')
      }
    }, 1500)
  } catch (err) {
    errorMessage.value = err.data?.message || 'Login failed. Please check your credentials.'
    console.error('Login error:', err)
  } finally {
    loading.value = false
  }
}

const handleSignUp = async () => {
  if (!isSignUpValid.value) return
  
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  
  try {
    const data = await $fetch(`${config.public.apiBase}/register`, {
      method: 'POST',
      body: {
        name: signUpForm.value.name,
        email: signUpForm.value.email,
        password: signUpForm.value.password,
        password_confirmation: signUpForm.value.confirmPassword
      }
    })
    
    auth.setToken(data.access_token)
    auth.setUser(data.user)

    // Sync cart & wishlist
    await cart.syncCart()
    await wishlist.syncWishlist()

    successMessage.value = 'Registration Successful! Welcome to FGXMART.'
    
    // Clear fields
    signUpForm.value = { name: '', email: '', password: '', confirmPassword: '' }

    // Redirect to home on registration as per request
    setTimeout(() => {
      router.push('/')
    }, 1500)
  } catch (err) {
    if (err.data?.errors) {
        errorMessage.value = Object.values(err.data.errors).flat().join(' ')
    } else {
        errorMessage.value = err.data?.message || 'Registration failed.'
    }
    console.error('Registration error:', err)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background-color: #f2f4f8;
  font-family: 'Poppins', sans-serif;
}

.auth-container {
  background: #fff;
  width: 900px;
  max-width: 95vw;
  height: 520px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
  position: relative;
  overflow: hidden;
}

/* Forms */
.form-container {
  position: absolute;
  top: 0;
  height: 100%;
  width: 50%;
  transition: all 0.6s ease-in-out;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.sign-in-container {
  left: 0;
  z-index: 2;
}

.sign-up-container {
  left: 0;
  opacity: 0;
  z-index: 1;
}

.auth-container.active .sign-in-container {
  transform: translateX(100%);
  opacity: 0;
}

.auth-container.active .sign-up-container {
  transform: translateX(100%);
  opacity: 1;
  z-index: 5;
  animation: show 0.6s;
}

@keyframes show {
  0%, 49.99% {
    opacity: 0;
    z-index: 1;
  }
  50%, 100% {
    opacity: 1;
    z-index: 5;
  }
}

.v-form {
  width: 100%;
  max-width: 320px;
  text-align: center;
}

.auth-btn-wrapper {
  width: 100%;
}

.auth-btn {
  width: 100%;
  height: 48px !important;
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), #224abe) !important;
  overflow: hidden;
}

.btn-text-content {
  display: inline-block;
}

/* Text Change Animation */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Overlay */
.overlay-container {
  position: absolute;
  top: 0;
  left: 50%;
  width: 50%;
  height: 100%;
  overflow: hidden;
  transition: transform 0.6s ease-in-out;
  z-index: 100;
}

.auth-container.active .overlay-container {
  transform: translateX(-100%);
}

.overlay {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)), #224abe);
  color: #fff;
  position: relative;
  left: -100%;
  width: 200%;
  height: 100%;
  transform: translateX(0);
  transition: transform 0.6s ease-in-out;
}

.auth-container.active .overlay {
  transform: translateX(50%);
}

.overlay-panel {
  position: absolute;
  width: 50%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 60px;
  text-align: center;
  top: 0;
  transition: transform 0.6s ease-in-out;
}

.overlay-left {
  transform: translateX(-20%);
}

.auth-container.active .overlay-left {
  transform: translateX(0);
}

.overlay-right {
  right: 0;
  transform: translateX(0);
}

.auth-container.active .overlay-right {
  transform: translateX(20%);
}

.opacity-80 {
  opacity: 0.8;
}

/* Custom Field Styles */
:deep(.custom-field .v-field) {
  border-radius: 8px !important;
}

:deep(.custom-field .v-field__outline) {
  display: none !important;
}

:deep(.custom-field .v-field--variant-filled .v-field__overlay) {
  background: transparent !important; /* Keep it clean */
}

/* Remove the default Material underline for filled variant */
:deep(.custom-field .v-field__active-indicator) {
  display: none !important;
}

/* Shifting the label to the extreme left */
:deep(.custom-field .v-label.v-field-label) {
  left: 0 !important;
  margin-left: 8px; /* Closer to the edge as requested */
}

:deep(.custom-field .v-label.v-field-label--floating) {
  transform: translateY(-50%) scale(0.75) !important;
  left: 0 !important;
  margin-left: 8px;
}


@media (max-width: 768px) {
  .auth-container {
    height: auto;
    min-height: 520px;
  }
  .overlay-container {
    display: none;
  }
  .form-container {
    width: 100%;
    position: relative;
  }
  .auth-container.active .sign-in-container {
    display: none;
  }
}
</style>
